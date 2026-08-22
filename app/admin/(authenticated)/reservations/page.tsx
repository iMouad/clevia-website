'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase'
import AdminSelect from '@/components/admin/AdminSelect'
import type { Plateforme } from '@/lib/plateformes'
import { platBg } from '@/lib/plateformes'

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
  created_by: string | null
  created_at: string
  biens?: { nom: string } | null
}

type Bien = { id: string; nom: string; disponible?: boolean }
type VoyageurOption = { id: string; nom: string; email: string | null; telephone: string | null }

const EMPTY_RES: Partial<Reservation> = {
  voyageur_nom: '', voyageur_email: '', voyageur_phone: '', date_arrivee: '', date_depart: '',
  plateforme: 'Airbnb', montant: null, taux_commission: 20, commission_fixe: null, intermediaire: null, statut: 'confirmee', notes: '',
}
const STATUT_LABELS: Record<string, string> = { confirmee: 'Confirmée', annulee: 'Annulée', terminee: 'Terminée' }
const STATUT_COLORS: Record<string, string> = {
  confirmee: 'bg-green-100 text-green-700',
  annulee: 'bg-red-100 text-red-700',
  terminee: 'bg-gray-100 text-gray-500',
}
const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

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
  const [filterEnCours, setFilterEnCours] = useState(false)
  const [filterAVenir, setFilterAVenir] = useState(false)
  const [filterBien, setFilterBien] = useState('')
  const [filterMois, setFilterMois] = useState('')
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<string>('date_arrivee')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const PER_PAGE = 20
  const [rapportOpen, setRapportOpen] = useState(false)
  const [rapportBienId, setRapportBienId] = useState('')
  const [rapportMois, setRapportMois] = useState(new Date().getMonth() + 1)
  const [rapportAnnee, setRapportAnnee] = useState(new Date().getFullYear())
  const [rapportGenere, setRapportGenere] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [plateformes, setPlateformes] = useState<Plateforme[]>([])
  const [userEmail, setUserEmail] = useState('')
  const [commentaires, setCommentaires] = useState<{ id: string; contenu: string; auteur_email: string | null; created_at: string }[]>([])
  const [newComment, setNewComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [historiqueOpen, setHistoriqueOpen] = useState(false)
  const [historique, setHistorique] = useState<{ id: string; action: string; changes: any; user_email: string | null; created_at: string }[]>([])
  const [historiqueLoading, setHistoriqueLoading] = useState(false)
  const [voyageurs, setVoyageurs] = useState<VoyageurOption[]>([])
  const [voyageurQuery, setVoyageurQuery] = useState('')
  const [voyageurDropdownOpen, setVoyageurDropdownOpen] = useState(false)
  const [selectedVoyageur, setSelectedVoyageur] = useState<VoyageurOption | null>(null)
  const [prixNuit, setPrixNuit] = useState<number | null>(null)
  const voyageurRef = useRef<HTMLDivElement>(null)

  const platNames = plateformes.filter((p) => p.actif).map((p) => p.nom)
  const platColorMap: Record<string, string> = {}
  plateformes.forEach((p) => { platColorMap[p.nom] = p.couleur })

  async function fetchData() {
    const [{ data: resData }, { data: bienData }, { data: voyData }] = await Promise.all([
      supabase.from('reservations').select('*, biens(nom)').order('date_arrivee', { ascending: false }),
      supabase.from('biens').select('id, nom, disponible').eq('statut', 'actif'),
      supabase.from('voyageurs').select('id, nom, email, telephone').order('nom'),
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
    setVoyageurs(voyData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsSuperAdmin(user?.app_metadata?.role !== 'admin')
      setUserEmail(user?.email ?? '')
    })
    supabase.from('plateformes').select('*').eq('actif', true).order('ordre').then(({ data }) => {
      setPlateformes(data ?? [])
    })
    fetchData()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (voyageurRef.current && !voyageurRef.current.contains(e.target as Node)) {
        setVoyageurDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredVoyageurs = voyageurQuery.trim().length > 0
    ? voyageurs.filter(v => v.nom.toLowerCase().includes(voyageurQuery.toLowerCase()) || v.telephone?.includes(voyageurQuery))
    : voyageurs

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  function canFacture(r: Reservation) { return isSuperAdmin || r.created_by === userEmail }
  function isEnCours(r: Reservation) { return r.statut === 'confirmee' && r.date_arrivee <= today && r.date_depart > today }
  function isCheckinDemain(r: Reservation) { return r.statut === 'confirmee' && r.date_arrivee === tomorrow }
  function isCheckoutDemain(r: Reservation) { return r.statut === 'confirmee' && r.date_depart === tomorrow }

  const filtered = rows.filter((r) => {
    if (filterEnCours && !isEnCours(r)) return false
    if (filterAVenir && !(r.statut === 'confirmee' && r.date_arrivee > today)) return false
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
    setVoyageurQuery(data.voyageur_nom ?? '')
    setVoyageurDropdownOpen(false)
    const match = data.voyageur_phone
      ? voyageurs.find(v => v.telephone === data.voyageur_phone) ?? null
      : voyageurs.find(v => v.nom === data.voyageur_nom) ?? null
    setSelectedVoyageur(match)
    const n = nuits(data.date_arrivee ?? '', data.date_depart ?? '')
    setPrixNuit(data.montant != null && n > 0 ? Math.round((data.montant / n) * 100) / 100 : null)
    setModalOpen(true)
  }
  function openAdd() { openModal({ ...EMPTY_RES, bien_id: biens.find((b) => b.disponible !== false)?.id ?? null }) }
  function openEdit(r: Reservation) { openModal({ ...r }); fetchCommentaires(r.id) }
  function openDuplicate(r: Reservation) {
    const { id, created_at, statut, ...rest } = r as any
    openModal({ ...rest, id: undefined, created_at: undefined, statut: 'confirmee', date_arrivee: '', date_depart: '', notes: '' })
  }
  function closeModal(force = false) {
    if (!force && JSON.stringify(editing) !== initialEditing) {
      if (!confirm('Des modifications non sauvegardées seront perdues. Fermer quand même ?')) return
    }
    setModalOpen(false); setEditing(EMPTY_RES); setCommentaires([]); setNewComment('')
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

  async function fetchCommentaires(resId: string) {
    const { data } = await supabase.from('commentaires_reservations').select('*').eq('reservation_id', resId).order('created_at', { ascending: true })
    setCommentaires(data ?? [])
  }

  async function addComment() {
    if (!newComment.trim() || !editing.id) return
    setSavingComment(true)
    await supabase.from('commentaires_reservations').insert({ reservation_id: editing.id, contenu: newComment.trim(), auteur_email: userEmail })
    setNewComment('')
    await fetchCommentaires(editing.id)
    setSavingComment(false)
  }

  async function deleteComment(commentId: string) {
    if (!editing.id) return
    await supabase.from('commentaires_reservations').delete().eq('id', commentId)
    await fetchCommentaires(editing.id)
  }

  async function fetchHistorique(resId: string) {
    setHistoriqueLoading(true)
    const { data } = await supabase.from('historique').select('*').eq('table_name', 'reservations').eq('record_id', resId).order('created_at', { ascending: false })
    setHistorique(data ?? [])
    setHistoriqueLoading(false)
  }

  async function logHistorique(resId: string, action: string, changes: any) {
    await supabase.from('historique').insert({ table_name: 'reservations', record_id: resId, action, changes, user_email: userEmail })
  }

  function generateFacture(r: Reservation) {
    const bien = biens.find((b) => b.id === r.bien_id)
    const n = nuits(r.date_arrivee, r.date_depart)
    const comm = calcCommission(r)
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Facture — ${esc(r.voyageur_nom)}</title><style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Helvetica Neue',Arial,sans-serif;color:#2C1A0E;padding:40px;font-size:13px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #C97B4B;padding-bottom:16px;margin-bottom:28px}
      .logo{font-size:20px;font-weight:700;color:#C97B4B;letter-spacing:0.1em}
      .logo-sub{font-size:10px;color:#6B4C35;letter-spacing:0.15em;text-transform:uppercase}
      .facture-id{text-align:right;font-size:11px;color:#6B4C35}
      .facture-id strong{display:block;font-size:14px;color:#2C1A0E}
      .section{margin-bottom:20px}
      .section-title{font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#C97B4B;font-weight:600;margin-bottom:8px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
      .info-box{background:#FAF6F1;border-radius:8px;padding:12px 16px}
      .info-label{font-size:10px;color:#6B4C35;text-transform:uppercase;letter-spacing:0.05em}
      .info-value{font-size:14px;font-weight:500;margin-top:2px}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#6B4C35;border-bottom:2px solid #E8DDD4;padding:8px 12px}
      td{padding:10px 12px;border-bottom:1px solid #F0EBE5;font-size:13px}
      .total-row td{font-weight:700;background:#FAF6F1;color:#C97B4B;border-top:2px solid #C97B4B;font-size:14px}
      .comm-row td{font-weight:600;color:#C97B4B;font-size:12px;border-bottom:none}
      .footer{margin-top:40px;padding-top:12px;border-top:1px solid #E8DDD4;font-size:10px;color:#A07850;text-align:center}
      @media print{@page{margin:1.5cm}body{padding:0}}
    </style></head><body>
      <div class="header">
        <div>
          <div class="logo">CLÉVIA</div>
          <div class="logo-sub">Conciergerie · Mansouria-Mohammedia</div>
        </div>
        <div class="facture-id">
          <strong>Facture</strong>
          ${format(new Date(r.created_at), 'dd/MM/yyyy')}
        </div>
      </div>
      <div class="info-grid section">
        <div class="info-box">
          <div class="info-label">Voyageur</div>
          <div class="info-value">${esc(r.voyageur_nom)}</div>
          ${r.voyageur_email ? `<div style="font-size:11px;color:#6B4C35;margin-top:2px">${esc(r.voyageur_email)}</div>` : ''}
          ${r.voyageur_phone ? `<div style="font-size:11px;color:#6B4C35">${esc(r.voyageur_phone)}</div>` : ''}
        </div>
        <div class="info-box">
          <div class="info-label">Bien</div>
          <div class="info-value">${esc(bien?.nom ?? '—')}</div>
          <div style="font-size:11px;color:#6B4C35;margin-top:2px">via ${esc(r.plateforme ?? '—')}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Détails du séjour</div>
        <table>
          <thead><tr><th>Description</th><th>Arrivée</th><th>Départ</th><th style="text-align:center">Nuits</th><th style="text-align:right">Montant</th></tr></thead>
          <tbody>
            <tr>
              <td>${esc(bien?.nom ?? 'Hébergement')}</td>
              <td>${format(new Date(r.date_arrivee), 'dd/MM/yyyy')}</td>
              <td>${format(new Date(r.date_depart), 'dd/MM/yyyy')}</td>
              <td style="text-align:center">${n}</td>
              <td style="text-align:right">${r.montant ? r.montant.toLocaleString('fr-MA') + ' MAD' : '—'}</td>
            </tr>
            <tr class="total-row">
              <td colspan="4">Total</td>
              <td style="text-align:right">${r.montant ? r.montant.toLocaleString('fr-MA') + ' MAD' : '—'}</td>
            </tr>
            ${isSuperAdmin && comm > 0 ? `<tr class="comm-row"><td colspan="4">Commission Clévia (${r.commission_fixe != null ? 'fixe' : r.taux_commission + '%'})</td><td style="text-align:right">${Math.round(comm).toLocaleString('fr-MA')} MAD</td></tr>` : ''}
          </tbody>
        </table>
      </div>
      ${r.notes ? `<div class="section"><div class="section-title">Notes</div><p style="font-size:12px;color:#6B4C35">${esc(r.notes)}</p></div>` : ''}
      <div class="footer">Clévia Conciergerie · Mansouria-Mohammedia, Maroc · cleviamaroc.com</div>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`
    const w = window.open('', '_blank', 'width=900,height=700')
    if (w) { w.document.write(html); w.document.close() }
  }

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
    const { id, created_at, created_by, biens: _b, ...fields } = editing as any
    const isNew = !editing.id
    if (editing.id) {
      const original = rows.find((r) => r.id === editing.id)
      await supabase.from('reservations').update(fields).eq('id', editing.id)
      const changes: Record<string, { avant: any; apres: any }> = {}
      if (original) {
        for (const key of Object.keys(fields)) {
          if ((original as any)[key] !== (fields as any)[key]) changes[key] = { avant: (original as any)[key], apres: (fields as any)[key] }
        }
      }
      if (Object.keys(changes).length > 0) await logHistorique(editing.id, 'modification', changes)
    } else {
      const { data: inserted } = await supabase.from('reservations').insert({ ...fields, created_by: userEmail }).select('id').single()
      if (inserted) await logHistorique(inserted.id, 'création', fields)
    }
    await syncVoyageur(editing, isNew)
    setSaving(false); closeModal(true); fetchData()
    showToast(isNew ? 'Réservation ajoutée' : 'Réservation modifiée')
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette réservation ?')) return
    const original = rows.find((r) => r.id === id)
    await logHistorique(id, 'suppression', original ? { voyageur_nom: original.voyageur_nom, date_arrivee: original.date_arrivee, date_depart: original.date_depart } : null)
    await supabase.from('reservations').delete().eq('id', id)
    fetchData()
    showToast('Réservation supprimée')
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === paginated.length) setSelected(new Set())
    else setSelected(new Set(paginated.map((r) => r.id)))
  }

  async function bulkUpdateStatut(statut: string) {
    const ids = Array.from(selected)
    if (!ids.length) return
    if (!confirm(`Changer le statut de ${ids.length} réservation(s) en "${STATUT_LABELS[statut]}" ?`)) return
    await supabase.from('reservations').update({ statut }).in('id', ids)
    for (const id of ids) await logHistorique(id, 'modification', { statut: { avant: rows.find((r) => r.id === id)?.statut, apres: statut } })
    setSelected(new Set())
    fetchData()
    showToast(`${ids.length} réservation(s) → ${STATUT_LABELS[statut]}`)
  }

  async function bulkDelete() {
    const ids = Array.from(selected)
    if (!ids.length) return
    if (!confirm(`Supprimer ${ids.length} réservation(s) ? Cette action est irréversible.`)) return
    for (const id of ids) {
      const original = rows.find((r) => r.id === id)
      await logHistorique(id, 'suppression', original ? { voyageur_nom: original.voyageur_nom, date_arrivee: original.date_arrivee, date_depart: original.date_depart } : null)
    }
    await supabase.from('reservations').delete().in('id', ids)
    setSelected(new Set())
    fetchData()
    showToast(`${ids.length} réservation(s) supprimée(s)`)
  }

  function exportCSV() {
    const headers = ['Voyageur', 'Intermédiaire', 'Email', 'Téléphone', 'Bien', 'Arrivée', 'Départ', 'Nuits', 'Plateforme', 'Montant MAD', 'Commission MAD', 'Statut', 'Créé par', 'Notes']
    const csvRows = filtered.map((r) => {
      const row: (string | number | null)[] = [
        r.voyageur_nom,
        r.intermediaire ?? '',
        r.voyageur_email ?? '',
        r.voyageur_phone ?? '',
        (r as any).biens?.nom ?? '',
        r.date_arrivee,
        r.date_depart,
        nuits(r.date_arrivee, r.date_depart),
        r.plateforme ?? '',
        r.montant ?? '',
        r.montant ? calcCommission(r).toFixed(2) : '',
        STATUT_LABELS[r.statut] ?? r.statut,
        r.created_by?.split('@')[0] ?? '',
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
    const titre = `Rapport — ${esc(bien.nom)} — ${MOIS_FR[rapportMois - 1]} ${rapportAnnee}`
    const tableRows = resRapport.map((r) => `
      <tr>
        <td>${format(new Date(r.date_arrivee), 'dd/MM/yyyy')}</td>
        <td>${format(new Date(r.date_depart), 'dd/MM/yyyy')}</td>
        <td style="text-align:center">${nuits(r.date_arrivee, r.date_depart)}</td>
        <td>${esc(r.voyageur_nom)}${r.intermediaire ? `<br><span style="font-size:10px;color:#A07850">via ${esc(r.intermediaire)}</span>` : ''}</td>
        <td>${esc(r.plateforme ?? '—')}</td>
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

  const chevauchement = useMemo(() => {
    if (!editing.bien_id || !editing.date_arrivee || !editing.date_depart) return null
    return rows.find(r =>
      r.id !== editing.id
      && r.bien_id === editing.bien_id
      && r.statut !== 'annulee'
      && r.date_arrivee < editing.date_depart!
      && r.date_depart > editing.date_arrivee!
    ) ?? null
  }, [editing.bien_id, editing.date_arrivee, editing.date_depart, editing.id, rows])

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
          <button
            onClick={() => { setRapportOpen(true); setRapportGenere(false) }}
            className="flex items-center gap-2 border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-4 py-2.5 hover:border-terra hover:text-terra transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" strokeLinecap="round" /></svg>
            Rapport
          </button>
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

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-terra/10 border border-terra/20 rounded-xl px-4 py-3 flex-wrap">
          <span className="text-sm font-medium text-brun">{selected.size} sélectionnée(s)</span>
          <div className="h-4 w-px bg-brun/20" />
          {Object.entries(STATUT_LABELS).map(([v, l]) => (
            <button key={v} onClick={() => bulkUpdateStatut(v)} className={`text-xs font-medium rounded-full px-3 py-1.5 transition-all ${STATUT_COLORS[v]}`}>
              → {l}
            </button>
          ))}
          <div className="h-4 w-px bg-brun/20" />
          <button onClick={bulkDelete} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
            Supprimer
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-brun-mid/50 underline underline-offset-2 hover:text-brun transition-colors ml-auto">
            Désélectionner
          </button>
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
        <button
          onClick={() => {
            const mois = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
            setFilterMois((v) => v === mois ? '' : mois); setPage(1)
          }}
          className={`text-sm font-medium rounded-xl px-3 py-2 transition-all ${filterMois === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` ? 'bg-terra text-white' : 'border border-brun/20 text-brun-mid hover:border-terra hover:text-terra'}`}
        >
          Ce mois
        </button>
        <button
          onClick={() => { setFilterEnCours((v) => !v); setFilterAVenir(false); setPage(1) }}
          className={`text-sm font-medium rounded-xl px-3 py-2 transition-all ${filterEnCours ? 'bg-green-500 text-white' : 'border border-brun/20 text-brun-mid hover:border-terra hover:text-terra'}`}
        >
          En cours
        </button>
        <button
          onClick={() => { setFilterAVenir((v) => !v); setFilterEnCours(false); setPage(1); if (!filterAVenir) { setSortCol('date_arrivee'); setSortDir('asc') } }}
          className={`text-sm font-medium rounded-xl px-3 py-2 transition-all ${filterAVenir ? 'bg-blue-500 text-white' : 'border border-brun/20 text-brun-mid hover:border-terra hover:text-terra'}`}
        >
          À venir
        </button>
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
          {platNames.map((p) => <option key={p}>{p}</option>)}
        </AdminSelect>

        {/* Mini répartition par plateforme */}
        <div className="hidden lg:flex items-center gap-1.5 ml-auto">
          {(() => {
            const totalMontant = filtered.reduce((s, r) => s + (r.montant ?? 0), 0)
            if (!totalMontant) return null
            return plateformes.filter((p) => p.actif).map((p) => {
              const montant = filtered.filter((r) => r.plateforme === p.nom).reduce((s, r) => s + (r.montant ?? 0), 0)
              const pct = Math.round((montant / totalMontant) * 100)
              if (!pct) return null
              return (
                <div key={p.nom} className="flex items-center gap-1" title={`${p.nom}: ${pct}% du revenu`}>
                  <div className="h-5 rounded-full min-w-[4px]" style={{ width: `${Math.max(pct * 0.6, 4)}px`, backgroundColor: p.couleur }} />
                  <span className="text-[10px] text-brun-mid/50" style={{ fontFamily: 'var(--font-dm-sans)' }}>{pct}%</span>
                </div>
              )
            })
          })()}
        </div>
        <input
          type="month"
          className="border border-brun/20 rounded-xl px-3 py-2 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors"
          value={filterMois}
          onChange={(e) => { setFilterMois(e.target.value); setPage(1) }}
        />
        {(filterBien || filterStatut || filterPlatf || filterMois || filterEnCours || filterAVenir || search) && (
          <button
            onClick={() => { setFilterBien(''); setFilterStatut(''); setFilterPlatf(''); setFilterMois(''); setFilterEnCours(false); setFilterAVenir(false); setSearch(''); setPage(1) }}
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
          <div key={r.id} className={`rounded-2xl border p-4 ${isCheckinDemain(r) ? 'bg-blue-50/60 border-blue-300' : isCheckoutDemain(r) ? 'bg-orange-50/60 border-orange-300' : isEnCours(r) ? 'bg-green-50/60 border-green-300' : 'bg-white border-brun/10'}`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-brun text-sm truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{r.voyageur_nom}</p>
                  {isCheckinDemain(r) && <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium shrink-0">Check-in demain</span>}
                  {isCheckoutDemain(r) && <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-medium shrink-0">Check-out demain</span>}
                  {!isCheckinDemain(r) && !isCheckoutDemain(r) && isEnCours(r) && <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium shrink-0">En cours</span>}
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
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: platBg(platColorMap[r.plateforme ?? ''] ?? '#6B4C35'), color: platColorMap[r.plateforme ?? ''] ?? '#6B4C35' }}>
                {r.plateforme ?? '—'}
              </span>
            </div>
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
              {r.created_by && <span className="text-[10px] text-brun-mid/40 ml-auto" style={{ fontFamily: 'var(--font-dm-sans)' }}>{r.created_by.split('@')[0]}</span>}
            </div>
            <div className="flex gap-2 pt-3 border-t border-brun/8">
              <button onClick={() => openEdit(r)} className="flex-1 flex items-center justify-center gap-1.5 bg-terra/10 text-terra text-sm font-medium rounded-xl py-2 hover:bg-terra/20 transition-all" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Modifier
              </button>
              {canFacture(r) && (
                <button onClick={() => generateFacture(r as Reservation)} className="flex-1 flex items-center justify-center gap-1.5 bg-brun/5 text-brun-mid text-sm font-medium rounded-xl py-2 hover:bg-brun/10 transition-all" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" strokeLinecap="round" /></svg>
                  Facture
                </button>
              )}
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
                <th className="px-3 py-3 w-10">
                  <input type="checkbox" checked={paginated.length > 0 && selected.size === paginated.length} onChange={toggleSelectAll} className="rounded border-brun/30 text-terra focus:ring-terra cursor-pointer" />
                </th>
                {[
                  { label: 'Voyageur', col: 'voyageur_nom' },
                  { label: 'Bien', col: 'bien' },
                  { label: 'Arrivée', col: 'date_arrivee' },
                  { label: 'Départ', col: 'date_depart' },
                  { label: 'Nuits', col: 'nuits' },
                  { label: 'Plateforme', col: 'plateforme' },
                  { label: 'Montant', col: 'montant' },
                  { label: 'Commission', col: 'commission' },
                  { label: 'Statut', col: 'statut' },
                  { label: 'Par', col: '' },
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
                <tr><td colSpan={12} className="px-4 py-10 text-center text-brun-mid/50">Chargement…</td></tr>
              ) : !filtered.length ? (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-brun-mid/50">Aucune réservation</td></tr>
              ) : paginated.map((r) => (
                <tr key={r.id} className={`transition-colors ${isCheckinDemain(r) ? 'bg-blue-50/60 border-l-2 border-l-blue-400' : isCheckoutDemain(r) ? 'bg-orange-50/60 border-l-2 border-l-orange-400' : isEnCours(r) ? 'bg-green-50/60 border-l-2 border-l-green-400' : 'hover:bg-creme/40'} ${selected.has(r.id) ? 'bg-terra/5' : ''}`}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="rounded border-brun/30 text-terra focus:ring-terra cursor-pointer" />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-brun font-medium">{r.voyageur_nom}</span>
                      {isCheckinDemain(r) && <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">Check-in demain</span>}
                      {isCheckoutDemain(r) && <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-medium">Check-out demain</span>}
                      {!isCheckinDemain(r) && !isCheckoutDemain(r) && isEnCours(r) && <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium">En cours</span>}
                    </div>
                    {r.intermediaire && <span className="block text-[10px] text-brun-mid/50">via {r.intermediaire}</span>}
                  </td>
                  <td className="px-3 py-3 text-brun-mid">{(r as any).biens?.nom ?? '—'}</td>
                  <td className="px-3 py-3 text-brun-mid whitespace-nowrap">{format(new Date(r.date_arrivee), 'dd/MM/yy')}</td>
                  <td className="px-3 py-3 text-brun-mid whitespace-nowrap">{format(new Date(r.date_depart), 'dd/MM/yy')}</td>
                  <td className="px-3 py-3 text-center text-brun-mid">{nuits(r.date_arrivee, r.date_depart)}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: platBg(platColorMap[r.plateforme ?? ''] ?? '#6B4C35'), color: platColorMap[r.plateforme ?? ''] ?? '#6B4C35' }}>
                      {r.plateforme ?? '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-brun-mid whitespace-nowrap">{r.montant ? `${r.montant} MAD` : '—'}</td>
                  <td className="px-3 py-3 font-medium text-terra whitespace-nowrap">
                    {r.montant
                      ? calcCommission(r) === 0
                        ? <span className="text-brun-mid/40 font-normal text-xs">Sans</span>
                        : `${calcCommission(r).toFixed(0)} MAD`
                      : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUT_COLORS[r.statut]}`}>{STATUT_LABELS[r.statut] ?? r.statut}</span>
                  </td>
                  <td className="px-3 py-3 text-[10px] text-brun-mid/50 whitespace-nowrap">{r.created_by?.split('@')[0] ?? '—'}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(r)} className="text-terra text-xs underline underline-offset-2">Modifier</button>
                      {canFacture(r) && <button onClick={() => generateFacture(r)} className="text-brun-mid text-xs underline underline-offset-2">Facture</button>}
                      <button onClick={() => { setHistoriqueOpen(true); fetchHistorique(r.id) }} className="text-brun-mid/60 text-xs underline underline-offset-2">Histo.</button>
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
                  <td className="px-3 py-3 text-brun font-semibold text-sm" colSpan={5}>Total ({filtered.length} résa{filtered.length > 1 ? 's' : ''})</td>
                  <td className="px-3 py-3 text-center text-brun font-semibold text-sm">{totNuits}</td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3 text-brun font-semibold text-sm whitespace-nowrap">{totMontant.toLocaleString('fr-MA')} MAD</td>
                  <td className="px-3 py-3 font-semibold text-terra text-sm whitespace-nowrap">{Math.round(totCommission).toLocaleString('fr-MA')} MAD</td>
                  <td className="px-3 py-3" colSpan={3}></td>
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
        <div className="p-5 flex flex-col gap-0 max-h-[70vh] overflow-y-auto">
          {/* ── Section : Bien ── */}
          <div className="pb-4">
            <div>
              <label className={labelClass}>Bien</label>
              <AdminSelect value={editing.bien_id ?? ''} onChange={(e) => setEditing((p) => ({ ...p, bien_id: e.target.value || null }))}>
                <option value="">— Sélectionner —</option>
                {biens.filter((b) => b.disponible !== false || b.id === editing.bien_id).map((b) => (
                  <option key={b.id} value={b.id}>{b.nom}{b.disponible === false ? ' (indisponible)' : ''}</option>
                ))}
              </AdminSelect>
            </div>
          </div>

          {/* ── Section : Voyageur ── */}
          <div className="border-t border-brun/8 pt-4 pb-4">
            <p className="text-[10px] uppercase tracking-widest text-brun-mid/40 font-medium mb-3">Voyageur</p>
            <div ref={voyageurRef} className="relative">
              <label className={labelClass}>Nom *</label>
              <input
                className={inputClass}
                value={voyageurQuery}
                onChange={(e) => {
                  setVoyageurQuery(e.target.value)
                  setEditing((p) => ({ ...p, voyageur_nom: e.target.value }))
                  setSelectedVoyageur(null)
                  setVoyageurDropdownOpen(true)
                }}
                onFocus={() => setVoyageurDropdownOpen(true)}
                placeholder="Rechercher ou saisir un nom…"
                autoComplete="off"
              />
              {voyageurDropdownOpen && filteredVoyageurs.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-brun/15 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredVoyageurs.slice(0, 20).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-creme transition-colors flex items-center justify-between gap-2 text-sm"
                      onClick={() => {
                        setVoyageurQuery(v.nom)
                        setSelectedVoyageur(v)
                        setEditing((p) => ({
                          ...p,
                          voyageur_nom: v.nom,
                          voyageur_email: v.email ?? p.voyageur_email ?? '',
                          voyageur_phone: v.telephone ?? p.voyageur_phone ?? '',
                        }))
                        setVoyageurDropdownOpen(false)
                      }}
                    >
                      <span className="text-brun font-medium truncate">{v.nom}</span>
                      {v.telephone && <span className="text-brun-mid/60 text-xs shrink-0">{v.telephone}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedVoyageur && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-terra bg-terra/8 rounded-lg px-2.5 py-1.5 w-fit">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                Voyageur connu
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={editing.voyageur_email ?? ''} onChange={(e) => setEditing((p) => ({ ...p, voyageur_email: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Téléphone</label>
                <div className="flex gap-1.5">
                  <select
                    className="border border-brun/20 rounded-xl px-2 py-2.5 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors w-[90px] shrink-0"
                    value={(editing.voyageur_phone ?? '').match(/^(\+\d{1,4})/)?.[1] ?? '+212'}
                    onChange={(e) => {
                      const num = (editing.voyageur_phone ?? '').replace(/^\+\d{1,4}\s?/, '')
                      setEditing((p) => ({ ...p, voyageur_phone: e.target.value + ' ' + num }))
                    }}
                  >
                    <option value="+212">+212</option>
                    <option value="+33">+33</option>
                    <option value="+34">+34</option>
                    <option value="+44">+44</option>
                    <option value="+49">+49</option>
                    <option value="+1">+1</option>
                    <option value="+39">+39</option>
                    <option value="+32">+32</option>
                    <option value="+31">+31</option>
                    <option value="+216">+216</option>
                    <option value="+213">+213</option>
                    <option value="+966">+966</option>
                    <option value="+971">+971</option>
                  </select>
                  <input
                    className={inputClass}
                    value={(editing.voyageur_phone ?? '').replace(/^\+\d{1,4}\s?/, '')}
                    onChange={(e) => {
                      const prefix = (editing.voyageur_phone ?? '').match(/^(\+\d{1,4})/)?.[1] ?? '+212'
                      setEditing((p) => ({ ...p, voyageur_phone: prefix + ' ' + e.target.value }))
                    }}
                    placeholder="6 12 34 56 78"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section : Dates ── */}
          <div className="border-t border-brun/8 pt-4 pb-4">
            <p className="text-[10px] uppercase tracking-widest text-brun-mid/40 font-medium mb-3">Séjour</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Arrivée *</label>
                <input type="date" className={inputClass} value={editing.date_arrivee ?? ''} onChange={(e) => {
                  const newDate = e.target.value
                  setEditing((p) => {
                    const n = nuits(newDate, p.date_depart ?? '')
                    return { ...p, date_arrivee: newDate, montant: prixNuit != null && n > 0 ? prixNuit * n : p.montant }
                  })
                }} />
              </div>
              <div>
                <label className={labelClass}>Départ *</label>
                <input type="date" className={inputClass} value={editing.date_depart ?? ''} onChange={(e) => {
                  const newDate = e.target.value
                  setEditing((p) => {
                    const n = nuits(p.date_arrivee ?? '', newDate)
                    return { ...p, date_depart: newDate, montant: prixNuit != null && n > 0 ? prixNuit * n : p.montant }
                  })
                }} />
              </div>
            </div>
            {editing.date_arrivee && editing.date_depart && (
              <p className="text-xs text-terra mt-2">{nuits(editing.date_arrivee, editing.date_depart)} nuit(s)</p>
            )}
            {chevauchement && (
              <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 mt-0.5"><path d="M12 9v4M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                <span>Conflit : <strong>{chevauchement.voyageur_nom}</strong> a déjà une réservation du {format(new Date(chevauchement.date_arrivee), 'dd/MM')} au {format(new Date(chevauchement.date_depart), 'dd/MM')} sur ce bien</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelClass}>Plateforme</label>
                <AdminSelect value={editing.plateforme ?? 'Airbnb'} onChange={(e) => setEditing((p) => ({ ...p, plateforme: e.target.value }))}>
                  {platNames.map((p) => <option key={p}>{p}</option>)}
                </AdminSelect>
              </div>
              <div>
                <label className={labelClass}>Statut</label>
                <AdminSelect value={editing.statut ?? 'confirmee'} onChange={(e) => setEditing((p) => ({ ...p, statut: e.target.value }))}>
                  {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </AdminSelect>
              </div>
            </div>
          </div>

          {/* ── Section : Financier ── */}
          <div className="border-t border-brun/8 pt-4 pb-4">
            <p className="text-[10px] uppercase tracking-widest text-brun-mid/40 font-medium mb-3">Financier</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Prix / nuit (MAD)</label>
                  <input type="number" min={0} className={inputClass} value={prixNuit ?? ''} onChange={(e) => {
                    const val = e.target.value === '' ? null : Number(e.target.value)
                    setPrixNuit(val)
                    const n = nuits(editing.date_arrivee ?? '', editing.date_depart ?? '')
                    setEditing((p) => ({ ...p, montant: val != null && n > 0 ? val * n : null }))
                  }} placeholder="500" />
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
                      value={editing.commission_fixe || ''}
                      onChange={(e) => setEditing((p) => ({ ...p, commission_fixe: e.target.value === '' ? 0 : Number(e.target.value) }))}
                      placeholder="Montant fixe en MAD"
                    />
                  ) : (
                    <input
                      type="number" min={0} max={100} step={0.5}
                      className={inputClass}
                      value={editing.taux_commission ?? ''}
                      onChange={(e) => setEditing((p) => ({ ...p, taux_commission: e.target.value === '' ? 0 : Number(e.target.value) }))}
                      placeholder="Taux %"
                    />
                  )}
                </div>
              </div>
              {prixNuit != null && prixNuit > 0 && editing.date_arrivee && editing.date_depart && (
                <div className="bg-terra/10 rounded-xl px-4 py-3 text-sm mt-3 flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-brun-mid">{prixNuit} MAD × {nuits(editing.date_arrivee, editing.date_depart)} nuit(s)</span>
                    <span className="text-brun font-medium">{editing.montant} MAD</span>
                  </div>
                  {commissionVal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-brun-mid/70 text-xs">
                        Commission {editing.commission_fixe != null ? 'fixe' : `(${editing.taux_commission}%)`}
                      </span>
                      <span className="text-terra font-medium text-xs">{commission} MAD</span>
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* ── Section : Détails ── */}
          <div className="border-t border-brun/8 pt-4">
            <p className="text-[10px] uppercase tracking-widest text-brun-mid/40 font-medium mb-3">Détails</p>
            <div>
              <label className={labelClass}>Intermédiaire</label>
              <input className={inputClass} value={editing.intermediaire ?? ''} onChange={(e) => setEditing((p) => ({ ...p, intermediaire: e.target.value || null }))} placeholder="Nom de l'intermédiaire (optionnel)" />
            </div>
            <div className="mt-3">
              <label className={labelClass}>Notes</label>
              <textarea className={`${inputClass} resize-none`} rows={2} value={editing.notes ?? ''} onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))} placeholder="Remarques éventuelles..." />
            </div>
          </div>

          {editing.id && (
            <div className="border-t border-brun/10 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className={labelClass + ' mb-0'}>Commentaires internes</label>
                <button onClick={() => { setHistoriqueOpen(true); fetchHistorique(editing.id!) }} className="text-[10px] text-brun-mid/50 underline underline-offset-2 hover:text-terra transition-colors">
                  Voir l'historique
                </button>
              </div>
              {commentaires.length > 0 && (
                <div className="flex flex-col gap-2 mb-3 max-h-40 overflow-y-auto">
                  {commentaires.map((c) => (
                    <div key={c.id} className="bg-creme/60 rounded-xl px-3 py-2 group relative">
                      <p className="text-xs text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>{c.contenu}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] text-brun-mid/40">
                          {c.auteur_email?.split('@')[0] ?? '—'} · {format(new Date(c.created_at), 'dd/MM HH:mm')}
                        </p>
                        <button onClick={() => deleteComment(c.id)} className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  className={inputClass + ' flex-1'}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment() } }}
                />
                <button
                  onClick={addComment}
                  disabled={savingComment || !newComment.trim()}
                  className="bg-terra text-creme text-xs font-medium rounded-xl px-3 py-2 hover:bg-brun transition-all disabled:opacity-40"
                >
                  {savingComment ? '…' : 'Envoyer'}
                </button>
              </div>
            </div>
          )}
        </div>
        {/* ── Résumé récapitulatif ── */}
        {editing.voyageur_nom && editing.date_arrivee && editing.date_depart && editing.bien_id && (
          <div className="px-5 pb-4">
            <div className="bg-creme/80 border border-brun/8 rounded-xl px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-brun-mid/40 font-medium mb-2">Récapitulatif</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-brun-mid/60">Bien</span>
                  <span className="text-brun font-medium">{biens.find(b => b.id === editing.bien_id)?.nom ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brun-mid/60">Voyageur</span>
                  <span className="text-brun font-medium">{editing.voyageur_nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brun-mid/60">Séjour</span>
                  <span className="text-brun font-medium">{format(new Date(editing.date_arrivee), 'dd/MM')} → {format(new Date(editing.date_depart), 'dd/MM')} ({nuits(editing.date_arrivee, editing.date_depart)}n)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brun-mid/60">Plateforme</span>
                  <span className="text-brun font-medium">{editing.plateforme ?? '—'}</span>
                </div>
                {prixNuit != null && prixNuit > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-brun-mid/60">Prix / nuit</span>
                      <span className="text-brun font-medium">{prixNuit} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brun-mid/60">Total</span>
                      <span className="text-brun font-medium">{editing.montant} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brun-mid/60">Commission</span>
                      <span className="text-terra font-medium">{commission} MAD</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-5 border-t border-brun/10 flex items-center justify-between">
          <div className="flex gap-2">
            {editing.id && canFacture(editing as Reservation) && (
              <button onClick={() => generateFacture(editing as Reservation)} className="flex items-center gap-1.5 border border-brun/20 text-brun-mid text-xs font-medium rounded-full px-3 py-2 hover:border-terra hover:text-terra transition-all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" strokeLinecap="round" /></svg>
                Facture PDF
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => closeModal()} className="border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-5 py-2 hover:bg-brun/5 transition-all">Annuler</button>
            <button onClick={handleSave} disabled={saving || !editing.voyageur_nom} className="bg-terra text-creme text-sm font-medium rounded-full px-5 py-2 hover:bg-brun transition-all disabled:opacity-50">
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal historique */}
      {historiqueOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-12 px-4 pb-8 bg-brun/50 backdrop-blur-sm overflow-y-auto" onClick={() => setHistoriqueOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-brun/10 flex items-center justify-between">
              <h2 className="text-xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>Historique</h2>
              <button onClick={() => setHistoriqueOpen(false)} className="text-brun-mid hover:text-brun">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {historiqueLoading ? (
                <p className="text-sm text-brun-mid/40 text-center py-8">Chargement…</p>
              ) : historique.length === 0 ? (
                <p className="text-sm text-brun-mid/40 text-center py-8">Aucun historique</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-brun/10" />
                  <div className="flex flex-col gap-4">
                    {historique.map((h) => (
                      <div key={h.id} className="pl-8 relative">
                        <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${h.action === 'création' ? 'bg-green-400 border-green-200' : h.action === 'suppression' ? 'bg-red-400 border-red-200' : 'bg-terra border-sable'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-brun capitalize">{h.action}</span>
                            <span className="text-[10px] text-brun-mid/40">{format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                          {h.user_email && <p className="text-[10px] text-brun-mid/50 mt-0.5">par {h.user_email.split('@')[0]}</p>}
                          {h.changes && h.action === 'modification' && (
                            <div className="mt-1.5 flex flex-col gap-1">
                              {Object.entries(h.changes as Record<string, { avant: any; apres: any }>).map(([key, val]) => (
                                <div key={key} className="text-[11px] bg-creme/60 rounded-lg px-2.5 py-1.5">
                                  <span className="text-brun-mid/60">{key}:</span>{' '}
                                  <span className="text-red-400 line-through">{String(val.avant ?? '—')}</span>{' → '}
                                  <span className="text-green-600 font-medium">{String(val.apres ?? '—')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                                  <span className="px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: platBg(platColorMap[r.plateforme ?? ''] ?? '#6B4C35'), color: platColorMap[r.plateforme ?? ''] ?? '#6B4C35' }}>
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
