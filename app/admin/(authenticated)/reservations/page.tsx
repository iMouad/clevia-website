'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase'
import AdminSelect from '@/components/admin/AdminSelect'

type Reservation = {
  id: string
  bien_id: string | null
  voyageur_nom: string
  voyageur_email: string | null
  voyageur_phone: string | null
  date_arrivee: string
  date_depart: string
  plateforme: string | null
  montant: number | null
  taux_commission: number
  commission_fixe: number | null
  intermediaire: string | null
  statut: string
  notes: string | null
  created_at: string
  biens?: { nom: string } | null
}

type Bien = { id: string; nom: string }

const EMPTY_RES: Partial<Reservation> = {
  voyageur_nom: '', voyageur_email: '', voyageur_phone: '', date_arrivee: '', date_depart: '',
  plateforme: 'Airbnb', montant: null, taux_commission: 20, commission_fixe: null, intermediaire: null, statut: 'confirmee', notes: '',
}
const PLATF = ['Airbnb', 'Booking', 'Avito', 'Facebook', 'Direct']
const STATUT_LABELS: Record<string, string> = { confirmee: 'Confirmée', annulee: 'Annulée', terminee: 'Terminée' }
const STATUT_COLORS: Record<string, string> = {
  confirmee: 'bg-green-100 text-green-700',
  annulee: 'bg-red-100 text-red-700',
  terminee: 'bg-gray-100 text-gray-500',
}
const PLATF_COLORS: Record<string, string> = {
  Airbnb: 'bg-rose-100 text-rose-600',
  Booking: 'bg-blue-100 text-blue-600',
  Avito: 'bg-orange-100 text-orange-600',
  Facebook: 'bg-blue-100 text-blue-700',
  Direct: 'bg-green-100 text-green-700',
}
const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function nuits(d1: string, d2: string) {
  if (!d1 || !d2) return 0
  return Math.max(0, Math.round((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000))
}

function calcCommission(r: { montant?: number | null; taux_commission?: number; commission_fixe?: number | null }) {
  if (r.commission_fixe != null && r.commission_fixe > 0) return r.commission_fixe
  if (r.montant && r.taux_commission) return r.montant * r.taux_commission / 100
  return 0
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-8 bg-brun/50 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  )
}

export default function ReservationsPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<Reservation[]>([])
  const [biens, setBiens] = useState<Bien[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Reservation>>(EMPTY_RES)
  const [initialEditing, setInitialEditing] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [filterStatut, setFilterStatut] = useState('')
  const [filterPlatf, setFilterPlatf] = useState('')
  const [filterBien, setFilterBien] = useState('')
  const [filterMois, setFilterMois] = useState('')
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<string>('date_arrivee')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState('')
  const PER_PAGE = 20
  const [rapportOpen, setRapportOpen] = useState(false)
  const [rapportBienId, setRapportBienId] = useState('')
  const [rapportMois, setRapportMois] = useState(new Date().getMonth() + 1)
  const [rapportAnnee, setRapportAnnee] = useState(new Date().getFullYear())
  const [rapportGenere, setRapportGenere] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  async function fetchData() {
    const [{ data: resData }, { data: bienData }] = await Promise.all([
      supabase.from('reservations').select('*, biens(nom)').order('date_arrivee', { ascending: false }),
      supabase.from('biens').select('id, nom').eq('statut', 'actif'),
    ])
    const today = new Date().toISOString().split('T')[0]
    const aTerminer = (resData ?? []).filter(r => r.statut === 'confirmee' && r.date_depart <= today)
    if (aTerminer.length > 0) {
      await supabase
        .from('reservations')
        .update({ statut: 'terminee' })
        .in('id', aTerminer.map(r => r.id))
      for (const r of aTerminer) r.statut = 'terminee'
    }
    setRows(resData ?? [])
    setBiens(bienData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsSuperAdmin(user?.app_metadata?.role !== 'admin')
    })
    fetchData()
  }, [])

  const filtered = rows.filter((r) => {
    if (filterStatut && r.statut !== filterStatut) return false
    if (filterPlatf && r.plateforme !== filterPlatf) return false
    if (filterBien && r.bien_id !== filterBien) return false
    if (search) {
      const q = search.toLowerCase()
      const match = r.voyageur_nom.toLowerCase().includes(q)
        || (r.intermediaire?.toLowerCase().includes(q))
        || (r.voyageur_phone?.toLowerCase().includes(q))
      if (!match) return false
    }
    if (filterMois) {
      const [y, m] = filterMois.split('-').map(Number)
      const mStart = new Date(y, m - 1, 1)
      const mEnd = new Date(y, m, 0)
      const d1 = new Date(r.date_arrivee)
      const d2 = new Date(r.date_depart)
      if (d2 <= mStart || d1 > mEnd) return false
    }
    return true
  }).sort((a, b) => {
    let va: any, vb: any
    switch (sortCol) {
      case 'voyageur_nom': va = a.voyageur_nom.toLowerCase(); vb = b.voyageur_nom.toLowerCase(); break
      case 'bien': va = (a as any).biens?.nom?.toLowerCase() ?? ''; vb = (b as any).biens?.nom?.toLowerCase() ?? ''; break
      case 'date_arrivee': va = a.date_arrivee; vb = b.date_arrivee; break
      case 'date_depart': va = a.date_depart; vb = b.date_depart; break
      case 'nuits': va = nuits(a.date_arrivee, a.date_depart); vb = nuits(b.date_arrivee, b.date_depart); break
      case 'plateforme': va = a.plateforme ?? ''; vb = b.plateforme ?? ''; break
      case 'montant': va = a.montant ?? 0; vb = b.montant ?? 0; break
      case 'commission': va = calcCommission(a); vb = calcCommission(b); break
      case 'statut': va = a.statut; vb = b.statut; break
      default: va = a.date_arrivee; vb = b.date_arrivee
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
    setPage(1)
  }

  const sortIcon = (col: string) => sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  function openModal(data: Partial<Reservation>) {
    setEditing(data)
    setInitialEditing(JSON.stringify(data))
    setModalOpen(true)
  }
  function openAdd() { openModal({ ...EMPTY_RES, bien_id: biens[0]?.id ?? null }) }
  function openEdit(r: Reservation) { openModal({ ...r }) }
  function openDuplicate(r: Reservation) {
    const { id, created_at, statut, ...rest } = r as any
    openModal({ ...rest, id: undefined, created_at: undefined, statut: 'confirmee', date_arrivee: '', date_depart: '', notes: '' })
  }
  function closeModal(force = false) {
    if (!force && JSON.stringify(editing) !== initialEditing) {
      if (!confirm('Des modifications non sauvegardées seront perdues. Fermer quand même ?')) return
    }
    setModalOpen(false); setEditing(EMPTY_RES)
  }

  async function syncVoyageur(res: Partial<Reservation>, isNew: boolean) {
    if (!res.voyageur_nom) return
    const phone = res.voyageur_phone?.trim() || null
    const email = res.voyageur_email?.trim() || null
    const source = res.plateforme || null

    if (phone) {
      const { data: existing } = await supabase
        .from('voyageurs')
        .select('id, sources, nb_reservations')
        .eq('telephone', phone)
        .maybeSingle()

      if (existing) {
        const sources: string[] = existing.sources ?? []
        if (source && !sources.includes(source)) sources.push(source)
        await supabase.from('voyageurs').update({
          nom: res.voyageur_nom,
          ...(email && { email }),
          sources,
          ...(isNew && { nb_reservations: (existing.nb_reservations ?? 1) + 1 }),
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id)
        return
      }
    }

    if (isNew) {
      await supabase.from('voyageurs').insert({
        nom: res.voyageur_nom,
        email,
        telephone: phone,
        sources: source ? [source] : [],
        nb_reservations: 1,
      })
    }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function handleSave() {
    if (!editing.voyageur_nom?.trim()) { showToast('Le nom du voyageur est obligatoire'); return }
    if (!editing.bien_id) { showToast('Veuillez sélectionner un bien'); return }
    if (!editing.date_arrivee || !editing.date_depart) { showToast('Les dates sont obligatoires'); return }
    if (editing.date_depart <= editing.date_arrivee) { showToast('La date de départ doit être après l\'arrivée'); return }
    const chevauchement = rows.find((r) =>
      r.id !== editing.id
      && r.bien_id === editing.bien_id
      && r.statut !== 'annulee'
      && r.date_arrivee < editing.date_depart!
      && r.date_depart > editing.date_arrivee!
    )
    if (chevauchement) {
      const ok = confirm(`Attention : cette réservation chevauche celle de ${chevauchement.voyageur_nom} (${format(new Date(chevauchement.date_arrivee), 'dd/MM')} → ${format(new Date(chevauchement.date_depart), 'dd/MM')}). Continuer quand même ?`)
      if (!ok) return
    }
    setSaving(true)
    const { id, created_at, biens: _b, ...fields } = editing as any
    const isNew = !editing.id
    if (editing.id) {
      await supabase.from('reservations').update(fields).eq('id', editing.id)
    } else {
      await supabase.from('reservations').insert(fields)
    }
    await syncVoyageur(editing, isNew)
    setSaving(false); closeModal(true); fetchData()
    showToast(isNew ? 'Réservation ajoutée' : 'Réservation modifiée')
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette réservation ?')) return
    await supabase.from('reservations').delete().eq('id', id)
    fetchData()
    showToast('Réservation supprimée')
  }

  function exportCSV() {
    const headers = isSuperAdmin
      ? ['Voyageur', 'Intermédiaire', 'Email', 'Téléphone', 'Bien', 'Arrivée', 'Départ', 'Nuits', 'Plateforme', 'Montant MAD', 'Commission MAD', 'Statut', 'Notes']
      : ['Voyageur', 'Intermédiaire', 'Email', 'Bien', 'Arrivée', 'Départ', 'Nuits', 'Plateforme', 'Statut', 'Notes']
    const csvRows = filtered.map((r) => {
      const row: (string | number | null)[] = [
        r.voyageur_nom,
        r.intermediaire ?? '',
        r.voyageur_email ?? '',
        ...(isSuperAdmin ? [r.voyageur_phone ?? ''] : []),
        (r as any).biens?.nom ?? '',
        r.date_arrivee,
        r.date_depart,
        nuits(r.date_arrivee, r.date_depart),
        r.plateforme ?? '',
        ...(isSuperAdmin ? [
          r.montant ?? '',
          r.montant ? calcCommission(r).toFixed(2) : '',
        ] : []),
        STATUT_LABELS[r.statut] ?? r.statut,
        r.notes ?? '',
      ]
      return row
    })
    const csv = [headers, ...csvRows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reservations-${format(new Date(), 'yyyy-MM')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function computeRapport() {
    const bien = biens.find((b) => b.id === rapportBienId)
    if (!bien) return null
    const daysInMonth = new Date(rapportAnnee, rapportMois, 0).getDate()
    const mStart = new Date(rapportAnnee, rapportMois - 1, 1)
    const mEnd = new Date(rapportAnnee, rapportMois, 0)
    const resRapport = rows.filter((r) => {
      if (r.bien_id !== rapportBienId) return false
      const d1 = new Date(r.date_arrivee)
      const d2 = new Date(r.date_depart)
      return d2 > mStart && d1 <= mEnd
    })
    let totalNuits = 0
    for (const r of resRapport) {
      const d1 = new Date(r.date_arrivee)
      const d2 = new Date(r.date_depart)
      const cs = d1 < mStart ? mStart : d1
      const ce = d2 > mEnd ? mEnd : d2
      totalNuits += Math.max(0, Math.round((ce.getTime() - cs.getTime()) / 86400000))
    }
    const totalMontant = resRapport.reduce((s, r) => s + (r.montant ?? 0), 0)
    const totalCommission = resRapport.reduce((s, r) => s + calcCommission(r), 0)
    const tauxOccupation = daysInMonth > 0 ? Math.round((totalNuits / daysInMonth) * 100) : 0
    return { bien, resRapport, totalNuits, totalMontant, totalCommission, tauxOccupation, daysInMonth }
  }

  function imprimerRapport() {
    const data = computeRapport()
    if (!data) return
    const { bien, resRapport, totalNuits, totalMontant, totalCommission, tauxOccupation, daysInMonth } = data
    const titre = `Rapport — ${bien.nom} — ${MOIS_FR[rapportMois - 1]} ${rapportAnnee}`
    const tableRows = resRapport.map((r) => `
      <tr>
        <td>${format(new Date(r.date_arrivee), 'dd/MM/yyyy')}</td>
        <td>${format(new Date(r.date_depart), 'dd/MM/yyyy')}</td>
        <td style="text-align:center">${nuits(r.date_arrivee, r.date_depart)}</td>
        <td>${r.voyageur_nom}${r.intermediaire ? `<br><span style="font-size:10px;color:#A07850">via ${r.intermediaire}</span>` : ''}</td>
        <td>${r.plateforme ?? '—'}</td>
        <td>${r.montant ? r.montant.toLocaleString('fr-MA') + ' MAD' : '—'}</td>
        <td>${r.montant ? Math.round(calcCommission(r)).toLocaleString('fr-MA') + ' MAD' : '—'}</td>
        <td>${STATUT_LABELS[r.statut] ?? r.statut}</td>
      </tr>`).join('')
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${titre}</title><style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Helvetica Neue',Arial,sans-serif;color:#2C1A0E;padding:40px;font-size:13px}
      .header{border-bottom:2px solid #C97B4B;padding-bottom:16px;margin-bottom:24px}
      .logo{font-size:18px;font-weight:700;color:#C97B4B;letter-spacing:0.1em}
      h1{font-size:17px;font-weight:600;margin-top:8px}
      .subtitle{color:#6B4C35;font-size:11px;margin-top:4px}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
      .stat{background:#FAF6F1;border-radius:8px;padding:12px 16px}
      .stat-val{font-size:22px;font-weight:700;color:#C97B4B}
      .stat-lbl{font-size:10px;color:#6B4C35;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px}
      .occ{font-size:12px;color:#6B4C35;margin-bottom:16px}
      .occ strong{color:#C97B4B}
      table{width:100%;border-collapse:collapse;margin-bottom:24px}
      th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#6B4C35;border-bottom:2px solid #E8DDD4;padding:8px 10px}
      td{padding:8px 10px;border-bottom:1px solid #F0EBE5;font-size:12px}
      .total-row td{font-weight:700;background:#FAF6F1;color:#C97B4B;border-top:2px solid #C97B4B}
      .footer{margin-top:32px;padding-top:12px;border-top:1px solid #E8DDD4;font-size:10px;color:#A07850;text-align:center}
      @media print{@page{margin:1.5cm}body{padding:0}}
    </style></head><body>
      <div class="header">
        <div class="logo">CLÉVIA IMMOBILIER - CONCIERGERIE</div>
        <h1>${titre}</h1>
        <div class="subtitle">Généré le ${format(new Date(), 'dd/MM/yyyy')} · ${daysInMonth} jours dans le mois</div>
      </div>
      <div class="stats">
        <div class="stat"><div class="stat-val">${resRapport.length}</div><div class="stat-lbl">Réservations</div></div>
        <div class="stat"><div class="stat-val">${totalNuits}</div><div class="stat-lbl">Nuits louées</div></div>
        <div class="stat"><div class="stat-val">${totalMontant.toLocaleString('fr-MA')} MAD</div><div class="stat-lbl">Revenus bruts</div></div>
        <div class="stat"><div class="stat-val">${Math.round(totalCommission).toLocaleString('fr-MA')} MAD</div><div class="stat-lbl">Commission Clévia</div></div>
      </div>
      <p class="occ">Taux d'occupation : <strong>${tauxOccupation}%</strong> (${totalNuits} nuits sur ${daysInMonth})</p>
      <table>
        <thead><tr><th>Arrivée</th><th>Départ</th><th>Nuits</th><th>Voyageur</th><th>Plateforme</th><th>Montant</th><th>Commission</th><th>Statut</th></tr></thead>
        <tbody>${tableRows}
          <tr class="total-row">
            <td colspan="2">TOTAL</td>
            <td style="text-align:center">${totalNuits}</td>
            <td colspan="2">Occupation : ${tauxOccupation}%</td>
            <td>${totalMontant.toLocaleString('fr-MA')} MAD</td>
            <td>${Math.round(totalCommission).toLocaleString('fr-MA')} MAD</td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <div class="footer">Clévia Immobilier - Conciergerie · Mansouria-Mohammedia, Maroc · cleviamaroc.com</div>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`
    const w = window.open('', '_blank', 'width=900,height=700')
    if (w) { w.document.write(html); w.document.close() }
  }

  const commissionVal = calcCommission(editing)
  const commission = commissionVal > 0 ? commissionVal.toFixed(2) : '—'

  const today = new Date().toISOString().split('T')[0]
  function isEnCours(r: Reservation) { return r.statut === 'confirmee' && r.date_arrivee <= today && r.date_depart > today }

  const totNuits = filtered.reduce((s, r) => s + nuits(r.date_arrivee, r.date_depart), 0)
  const totMontant = filtered.reduce((s, r) => s + (r.montant ?? 0), 0)
  const totCommission = filtered.reduce((s, r) => s + calcCommission(r), 0)

  const inputClass = 'w-full border border-brun/20 rounded-xl px-3 py-2.5 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors'
  const labelClass = 'block text-xs font-medium text-brun-mid mb-1.5 uppercase tracking-wide'

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>Réservations</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-4 py-2.5 hover:border-terra hover:text-terra transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Export CSV
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => { setRapportOpen(true); setRapportGenere(false) }}
              className="flex items-center gap-2 border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-4 py-2.5 hover:border-terra hover:text-terra transition-all"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" strokeLinecap="round" /></svg>
              Rapport
            </button>
          )}
          <button onClick={openAdd} className="flex items-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-5 py-2.5 hover:bg-brun transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Ajouter
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] bg-brun text-creme text-sm font-medium px-5 py-3 rounded-xl shadow-lg animate-[fadeIn_0.2s]">
          {toast}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-brun-mid/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>
          <input
            className="border border-brun/20 rounded-xl pl-8 pr-3 py-2 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors w-48"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <AdminSelect className="!py-2 !px-3" value={filterBien} onChange={(e) => { setFilterBien(e.target.value); setPage(1) }}>
          <option value="">Tous les biens</option>
          {biens.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </AdminSelect>
        <AdminSelect className="!py-2 !px-3" value={filterStatut} onChange={(e) => { setFilterStatut(e.target.value); setPage(1) }}>
          <option value="">Tous statuts</option>
          {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </AdminSelect>
        <AdminSelect className="!py-2 !px-3" value={filterPlatf} onChange={(e) => { setFilterPlatf(e.target.value); setPage(1) }}>
          <option value="">Toutes plateformes</option>
          {PLATF.map((p) => <option key={p}>{p}</option>)}
        </AdminSelect>
        <input
          type="month"
          className="border border-brun/20 rounded-xl px-3 py-2 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors"
          value={filterMois}
          onChange={(e) => { setFilterMois(e.target.value); setPage(1) }}
        />
        {(filterBien || filterStatut || filterPlatf || filterMois || search) && (
          <button
            onClick={() => { setFilterBien(''); setFilterStatut(''); setFilterPlatf(''); setFilterMois(''); setSearch(''); setPage(1) }}
            className="text-xs text-terra hover:text-brun transition-colors self-center underline underline-offset-2"
          >
            Réinitialiser
          </button>
        )}
        <span className="self-center text-xs text-brun-mid/60">{filtered.length} réservation(s)</span>
      </div>

      {/* ── MOBILE : cartes ── */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading ? (
          <p className="text-center py-10 text-brun-mid/50 text-sm">Chargement…</p>
        ) : !filtered.length ? (
          <p className="text-center py-10 text-brun-mid/50 text-sm">Aucune réservation</p>
        ) : paginated.map((r) => (
          <div key={r.id} className={`rounded-2xl border p-4 ${isEnCours(r) ? 'bg-green-50/60 border-green-300' : 'bg-white border-brun/10'}`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-brun text-sm truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{r.voyageur_nom}</p>
                  {isEnCours(r) && <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium shrink-0">En cours</span>}
                </div>
                {r.intermediaire && <p className="text-[10px] text-brun-mid/50" style={{ fontFamily: 'var(--font-dm-sans)' }}>via {r.intermediaire}</p>}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUT_COLORS[r.statut]}`}>
                {STATUT_LABELS[r.statut] ?? r.statut}
              </span>
            </div>
            <p className="text-xs text-brun-mid/60 mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {(r as any).biens?.nom ?? '—'}
            </p>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs text-brun-mid" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {format(new Date(r.date_arrivee), 'dd/MM/yy')} → {format(new Date(r.date_depart), 'dd/MM/yy')}
              </span>
              <span className="text-xs text-brun-mid/50">·</span>
              <span className="text-xs text-brun-mid" style={{ fontFamily: 'var(--font-dm-sans)' }}>{nuits(r.date_arrivee, r.date_depart)} nuit(s)</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATF_COLORS[r.plateforme ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                {r.plateforme ?? '—'}
              </span>
            </div>
            {isSuperAdmin && (
              <div className="flex items-center gap-3 mb-3">
                {r.montant ? (
                  <>
                    <span className="text-sm font-medium text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>{r.montant} MAD</span>
                    <span className="text-xs text-terra" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {calcCommission(r) === 0 ? 'Sans commission' : `Commission : ${calcCommission(r).toFixed(0)} MAD`}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-brun-mid/40">Montant —</span>
                )}
              </div>
            )}
            <div className="flex gap-2 pt-3 border-t border-brun/8">
              <button onClick={() => openEdit(r)} className="flex-1 flex items-center justify-center gap-1.5 bg-terra/10 text-terra text-sm font-medium rounded-xl py-2 hover:bg-terra/20 transition-all" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Modifier
              </button>
              <button onClick={() => openDuplicate(r)} className="flex-1 flex items-center justify-center gap-1.5 bg-brun/5 text-brun-mid text-sm font-medium rounded-xl py-2 hover:bg-brun/10 transition-all" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                Dupliquer
              </button>
              <button onClick={() => handleDelete(r.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-500 text-sm font-medium rounded-xl py-2 hover:bg-red-100 transition-all" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
                Suppr.
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── DESKTOP : table ── */}
      <div className="hidden lg:block bg-white rounded-2xl border border-brun/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brun/4">
              <tr>
                {[
                  { label: 'Voyageur', col: 'voyageur_nom' },
                  { label: 'Bien', col: 'bien' },
                  { label: 'Arrivée', col: 'date_arrivee' },
                  { label: 'Départ', col: 'date_depart' },
                  { label: 'Nuits', col: 'nuits' },
                  { label: 'Plateforme', col: 'plateforme' },
                  ...(isSuperAdmin ? [
                    { label: 'Montant', col: 'montant' },
                    { label: 'Commission', col: 'commission' },
                  ] : []),
                  { label: 'Statut', col: 'statut' },
                  { label: '', col: '' },
                ].map(({ label, col }) => (
                  <th
                    key={label || '_actions'}
                    className={`px-3 py-3 text-left text-xs text-brun-mid uppercase tracking-wide font-medium whitespace-nowrap ${col ? 'cursor-pointer hover:text-terra select-none' : ''}`}
                    onClick={() => col && toggleSort(col)}
                  >
                    {label}{sortIcon(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brun/5">
              {loading ? (
                <tr><td colSpan={isSuperAdmin ? 10 : 8} className="px-4 py-10 text-center text-brun-mid/50">Chargement…</td></tr>
              ) : !filtered.length ? (
                <tr><td colSpan={isSuperAdmin ? 10 : 8} className="px-4 py-10 text-center text-brun-mid/50">Aucune réservation</td></tr>
              ) : paginated.map((r) => (
                <tr key={r.id} className={`transition-colors ${isEnCours(r) ? 'bg-green-50/60 border-l-2 border-l-green-400' : 'hover:bg-creme/40'}`}>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-brun font-medium">{r.voyageur_nom}</span>
                      {isEnCours(r) && <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium">En cours</span>}
                    </div>
                    {r.intermediaire && <span className="block text-[10px] text-brun-mid/50">via {r.intermediaire}</span>}
                  </td>
                  <td className="px-3 py-3 text-brun-mid">{(r as any).biens?.nom ?? '—'}</td>
                  <td className="px-3 py-3 text-brun-mid whitespace-nowrap">{format(new Date(r.date_arrivee), 'dd/MM/yy')}</td>
                  <td className="px-3 py-3 text-brun-mid whitespace-nowrap">{format(new Date(r.date_depart), 'dd/MM/yy')}</td>
                  <td className="px-3 py-3 text-center text-brun-mid">{nuits(r.date_arrivee, r.date_depart)}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATF_COLORS[r.plateforme ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                      {r.plateforme ?? '—'}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <>
                      <td className="px-3 py-3 text-brun-mid whitespace-nowrap">{r.montant ? `${r.montant} MAD` : '—'}</td>
                      <td className="px-3 py-3 font-medium text-terra whitespace-nowrap">
                        {r.montant
                          ? calcCommission(r) === 0
                            ? <span className="text-brun-mid/40 font-normal text-xs">Sans</span>
                            : `${calcCommission(r).toFixed(0)} MAD`
                          : '—'}
                      </td>
                    </>
                  )}
                  <td className="px-3 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUT_COLORS[r.statut]}`}>{STATUT_LABELS[r.statut] ?? r.statut}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(r)} className="text-terra text-xs underline underline-offset-2">Modifier</button>
                      <button onClick={() => openDuplicate(r)} className="text-brun-mid text-xs underline underline-offset-2">Dupliquer</button>
                      <button onClick={() => handleDelete(r.id)} className="text-red-400 text-xs underline underline-offset-2">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-brun/4 border-t-2 border-brun/15">
                <tr>
                  <td className="px-3 py-3 text-brun font-semibold text-sm" colSpan={4}>Total ({filtered.length} résa{filtered.length > 1 ? 's' : ''})</td>
                  <td className="px-3 py-3 text-center text-brun font-semibold text-sm">{totNuits}</td>
                  <td className="px-3 py-3"></td>
                  {isSuperAdmin && (
                    <>
                      <td className="px-3 py-3 text-brun font-semibold text-sm whitespace-nowrap">{totMontant.toLocaleString('fr-MA')} MAD</td>
                      <td className="px-3 py-3 font-semibold text-terra text-sm whitespace-nowrap">{Math.round(totCommission).toLocaleString('fr-MA')} MAD</td>
                    </>
                  )}
                  <td className="px-3 py-3" colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-xs text-brun-mid/60">
            {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filtered.length)} sur {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-brun/15 text-brun-mid hover:bg-creme disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Précédent
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-1 text-xs text-brun-mid/40">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-8 h-8 text-xs rounded-lg transition-all ${safePage === p ? 'bg-terra text-creme' : 'border border-brun/15 text-brun-mid hover:bg-creme'}`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border border-brun/15 text-brun-mid hover:bg-creme disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* Modal réservation */}
      <Modal open={modalOpen} onClose={() => closeModal()}>
        <div className="p-5 border-b border-brun/10 flex items-center justify-between">
          <h2 className="text-xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
            {editing.id ? 'Modifier' : 'Nouvelle réservation'}
          </h2>
          <button onClick={() => closeModal()} className="text-brun-mid hover:text-brun">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className={labelClass}>Bien</label>
            <AdminSelect value={editing.bien_id ?? ''} onChange={(e) => setEditing((p) => ({ ...p, bien_id: e.target.value || null }))}>
              <option value="">— Sélectionner —</option>
              {biens.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
            </AdminSelect>
          </div>
          <div>
            <label className={labelClass}>Nom voyageur *</label>
            <input className={inputClass} value={editing.voyageur_nom ?? ''} onChange={(e) => setEditing((p) => ({ ...p, voyageur_nom: e.target.value }))} placeholder="Prénom Nom" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} value={editing.voyageur_email ?? ''} onChange={(e) => setEditing((p) => ({ ...p, voyageur_email: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input className={inputClass} value={editing.voyageur_phone ?? ''} onChange={(e) => setEditing((p) => ({ ...p, voyageur_phone: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Arrivée *</label>
              <input type="date" className={inputClass} value={editing.date_arrivee ?? ''} onChange={(e) => setEditing((p) => ({ ...p, date_arrivee: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Départ *</label>
              <input type="date" className={inputClass} value={editing.date_depart ?? ''} onChange={(e) => setEditing((p) => ({ ...p, date_depart: e.target.value }))} />
            </div>
          </div>
          {editing.date_arrivee && editing.date_depart && (
            <p className="text-xs text-terra">{nuits(editing.date_arrivee, editing.date_depart)} nuit(s)</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Plateforme</label>
              <AdminSelect value={editing.plateforme ?? 'Airbnb'} onChange={(e) => setEditing((p) => ({ ...p, plateforme: e.target.value }))}>
                {PLATF.map((p) => <option key={p}>{p}</option>)}
              </AdminSelect>
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <AdminSelect value={editing.statut ?? 'confirmee'} onChange={(e) => setEditing((p) => ({ ...p, statut: e.target.value }))}>
                {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </AdminSelect>
            </div>
          </div>
          {isSuperAdmin && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Montant (MAD)</label>
                  <input type="number" min={0} className={inputClass} value={editing.montant ?? ''} onChange={(e) => setEditing((p) => ({ ...p, montant: Number(e.target.value) || null }))} placeholder="1500" />
                </div>
                <div>
                  <label className={labelClass}>Commission</label>
                  <div className="flex gap-1.5 mb-1.5">
                    {[0, 20, 25].map((v) => (
                      <button key={v} type="button"
                        onClick={() => setEditing((p) => ({ ...p, taux_commission: v, commission_fixe: null }))}
                        className={`text-xs rounded-lg px-2.5 py-1 font-medium transition-all ${editing.commission_fixe == null && editing.taux_commission === v ? 'bg-terra text-creme' : 'bg-brun/8 text-brun-mid hover:bg-terra/20'}`}
                      >
                        {v === 0 ? 'Sans' : `${v}%`}
                      </button>
                    ))}
                    <button type="button"
                      onClick={() => setEditing((p) => ({ ...p, commission_fixe: p.commission_fixe ?? 0, taux_commission: 0 }))}
                      className={`text-xs rounded-lg px-2.5 py-1 font-medium transition-all ${editing.commission_fixe != null ? 'bg-terra text-creme' : 'bg-brun/8 text-brun-mid hover:bg-terra/20'}`}
                    >
                      Fixe
                    </button>
                  </div>
                  {editing.commission_fixe != null ? (
                    <input
                      type="number" min={0}
                      className={inputClass}
                      value={editing.commission_fixe ?? ''}
                      onChange={(e) => setEditing((p) => ({ ...p, commission_fixe: Number(e.target.value) || null }))}
                      placeholder="Montant fixe en MAD"
                    />
                  ) : (
                    <input
                      type="number" min={0} max={100} step={0.5}
                      className={inputClass}
                      value={editing.taux_commission ?? ''}
                      onChange={(e) => setEditing((p) => ({ ...p, taux_commission: Number(e.target.value) }))}
                      placeholder="Taux %"
                    />
                  )}
                </div>
              </div>
              {editing.montant != null && editing.montant > 0 && (
                <div className="bg-terra/10 rounded-xl px-4 py-3 text-sm">
                  {commissionVal === 0
                    ? <span className="text-brun-mid">Sans commission</span>
                    : editing.commission_fixe != null
                      ? <><span className="text-brun-mid">Commission fixe : </span><span className="text-terra font-medium">{commission} MAD</span></>
                      : <><span className="text-brun-mid">Commission ({editing.taux_commission}%) : </span><span className="text-terra font-medium">{commission} MAD</span></>
                  }
                </div>
              )}
            </>
          )}
          <div>
            <label className={labelClass}>Intermédiaire</label>
            <input className={inputClass} value={editing.intermediaire ?? ''} onChange={(e) => setEditing((p) => ({ ...p, intermediaire: e.target.value || null }))} placeholder="Nom de l'intermédiaire (optionnel)" />
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea className={`${inputClass} resize-none`} rows={2} value={editing.notes ?? ''} onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))} placeholder="Remarques éventuelles..." />
          </div>
        </div>
        <div className="p-5 border-t border-brun/10 flex justify-end gap-3">
          <button onClick={() => closeModal()} className="border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-5 py-2 hover:bg-brun/5 transition-all">Annuler</button>
          <button onClick={handleSave} disabled={saving || !editing.voyageur_nom} className="bg-terra text-creme text-sm font-medium rounded-full px-5 py-2 hover:bg-brun transition-all disabled:opacity-50">
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </Modal>

      {/* Modal rapport mensuel */}
      {rapportOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-8 bg-brun/50 backdrop-blur-sm overflow-y-auto" onClick={() => setRapportOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-brun/10 flex items-center justify-between">
              <h2 className="text-xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>Rapport mensuel</h2>
              <button onClick={() => setRapportOpen(false)} className="text-brun-mid hover:text-brun">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {/* Sélecteurs */}
              <div>
                <label className={labelClass}>Bien</label>
                <AdminSelect value={rapportBienId} onChange={(e) => { setRapportBienId(e.target.value); setRapportGenere(false) }}>
                  <option value="">— Sélectionner un bien —</option>
                  {biens.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
                </AdminSelect>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Mois</label>
                  <AdminSelect value={rapportMois} onChange={(e) => { setRapportMois(Number(e.target.value)); setRapportGenere(false) }}>
                    {MOIS_FR.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </AdminSelect>
                </div>
                <div>
                  <label className={labelClass}>Année</label>
                  <AdminSelect value={rapportAnnee} onChange={(e) => { setRapportAnnee(Number(e.target.value)); setRapportGenere(false) }}>
                    {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                  </AdminSelect>
                </div>
              </div>
              <button
                onClick={() => setRapportGenere(true)}
                disabled={!rapportBienId}
                className="bg-terra text-creme text-sm font-medium rounded-full px-5 py-2.5 hover:bg-brun transition-all disabled:opacity-40 self-start"
              >
                Générer le rapport
              </button>

              {/* Aperçu du rapport */}
              {rapportGenere && (() => {
                const data = computeRapport()
                if (!data) return null
                const { resRapport, totalNuits, totalMontant, totalCommission, tauxOccupation, daysInMonth } = data
                return (
                  <div className="border border-brun/10 rounded-xl overflow-hidden">
                    {/* Stats */}
                    <div className="grid grid-cols-4 border-b border-brun/10">
                      {[
                        { label: 'Réservations', value: resRapport.length },
                        { label: 'Nuits louées', value: totalNuits },
                        { label: 'Revenus', value: `${totalMontant.toLocaleString('fr-MA')} MAD` },
                        { label: 'Commission', value: `${Math.round(totalCommission).toLocaleString('fr-MA')} MAD` },
                      ].map(({ label, value }) => (
                        <div key={label} className="p-3 text-center border-r border-brun/10 last:border-r-0">
                          <p className="text-base font-semibold text-terra" style={{ fontFamily: 'var(--font-dm-sans)' }}>{value}</p>
                          <p className="text-[10px] text-brun-mid/50 mt-0.5 uppercase tracking-wide" style={{ fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 bg-creme/50 border-b border-brun/10">
                      <p className="text-xs text-brun-mid/60" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        Taux d'occupation : <span className="font-semibold text-terra">{tauxOccupation}%</span> ({totalNuits} / {daysInMonth} nuits)
                      </p>
                    </div>
                    {resRapport.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          <thead>
                            <tr className="border-b border-brun/10">
                              {['Arrivée', 'Départ', 'Nts', 'Voyageur', 'Platf.', 'Montant', 'Comm.'].map((h) => (
                                <th key={h} className="text-left px-3 py-2 text-brun-mid/50 font-medium uppercase tracking-wide">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brun/5">
                            {resRapport.map((r) => (
                              <tr key={r.id}>
                                <td className="px-3 py-2 text-brun-mid">{format(new Date(r.date_arrivee), 'dd/MM')}</td>
                                <td className="px-3 py-2 text-brun-mid">{format(new Date(r.date_depart), 'dd/MM')}</td>
                                <td className="px-3 py-2 text-center text-brun-mid">{nuits(r.date_arrivee, r.date_depart)}</td>
                                <td className="px-3 py-2 text-brun font-medium truncate max-w-[90px]">{r.voyageur_nom}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-1.5 py-0.5 rounded-full font-medium ${PLATF_COLORS[r.plateforme ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                                    {r.plateforme ?? '—'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-brun-mid whitespace-nowrap">{r.montant ? `${r.montant} MAD` : '—'}</td>
                                <td className="px-3 py-2 font-medium text-terra whitespace-nowrap">
                                  {r.montant ? `${Math.round(calcCommission(r))} MAD` : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-brun-mid/40 text-center py-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        Aucune réservation ce mois-ci
                      </p>
                    )}
                  </div>
                )
              })()}

              {rapportGenere && (
                <div className="flex justify-end">
                  <button
                    onClick={imprimerRapport}
                    className="flex items-center gap-2 bg-brun text-creme text-sm font-medium rounded-full px-5 py-2.5 hover:bg-brun/80 transition-all"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                    Imprimer / PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
