'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase'
import AdminSelect from '@/components/admin/AdminSelect'
import { PREFIXES, getFlag, getPrefix, getNumber } from '@/lib/phone'

type Prospect = {
  id: string
  nom: string
  telephone: string | null
  email: string | null
  ville: string | null
  adresse: string | null
  type_bien: string | null
  capacite: number | null
  statut: string
  source: string | null
  commission_proposee: number | null
  date_premier_contact: string | null
  date_relance: string | null
  notes: string | null
  created_at: string
}

type Commentaire = {
  id: string
  contenu: string
  auteur_email: string | null
  created_at: string
}

const EMPTY_PROSPECT: Partial<Prospect> = {
  nom: '', telephone: '', email: '', ville: '', adresse: '', type_bien: 'appartement',
  capacite: null, statut: 'premier_contact', source: null, commission_proposee: 20,
  date_premier_contact: new Date().toISOString().split('T')[0], date_relance: null, notes: '',
}

const STATUT_STEPS = [
  { key: 'premier_contact', label: 'Premier contact', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { key: 'visite_planifiee', label: 'Visite planifiée', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  { key: 'visite_faite', label: 'Visite faite', color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  { key: 'negociation', label: 'Négociation', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { key: 'signe', label: 'Signé', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  { key: 'perdu', label: 'Perdu', color: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
]

const STATUT_MAP = Object.fromEntries(STATUT_STEPS.map(s => [s.key, s]))

const SOURCES = ['Bouche à oreille', 'Facebook', 'Instagram', 'Avito', 'Terrain', 'Site web', 'Autre']
const VILLES = ['Mansouria', 'Mohammedia', 'Benslimane', 'Bouznika', 'Autre']
const TYPES_BIEN = ['Appartement', 'Villa', 'Maison', 'Riad', 'Studio', 'Duplex', 'Autre']

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
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

export default function ProspectsPage() {
  const supabase = createClient()
  const [rows, setRows] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Prospect>>(EMPTY_PROSPECT)
  const [initialEditing, setInitialEditing] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterStatut, setFilterStatut] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [convertingProspect, setConvertingProspect] = useState<Prospect | null>(null)
  const [avancerMenu, setAvancerMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [commentaires, setCommentaires] = useState<Commentaire[]>([])
  const [newComment, setNewComment] = useState('')
  const [savingComment, setSavingComment] = useState(false)

  async function fetchData() {
    const { data } = await supabase.from('prospects').select('*').order('created_at', { ascending: false })
    setRows(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? '')
    })
    fetchData()
  }, [])

  const today = new Date().toISOString().split('T')[0]

  function isRelancePassee(p: Prospect) {
    return p.date_relance && p.date_relance <= today && p.statut !== 'signe' && p.statut !== 'perdu'
  }
  function isRelanceAujourdhui(p: Prospect) {
    return p.date_relance === today && p.statut !== 'signe' && p.statut !== 'perdu'
  }

  function sortByRelance(a: Prospect, b: Prospect): number {
    const aActive = a.statut !== 'signe' && a.statut !== 'perdu'
    const bActive = b.statut !== 'signe' && b.statut !== 'perdu'
    if (aActive && bActive) {
      const aRelance = a.date_relance ?? '9999'
      const bRelance = b.date_relance ?? '9999'
      const aOverdue = a.date_relance && a.date_relance < today ? 0 : a.date_relance === today ? 1 : 2
      const bOverdue = b.date_relance && b.date_relance < today ? 0 : b.date_relance === today ? 1 : 2
      if (aOverdue !== bOverdue) return aOverdue - bOverdue
      if (aRelance !== bRelance) return aRelance < bRelance ? -1 : 1
    }
    if (aActive && !bActive) return -1
    if (!aActive && bActive) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  }

  const filtered = rows.filter((p) => {
    if (filterStatut && p.statut !== filterStatut) return false
    if (filterSource && p.source !== filterSource) return false
    if (search) {
      const q = search.toLowerCase()
      const match = p.nom.toLowerCase().includes(q)
        || p.telephone?.toLowerCase().includes(q)
        || p.ville?.toLowerCase().includes(q)
        || p.adresse?.toLowerCase().includes(q)
      if (!match) return false
    }
    return true
  }).sort(sortByRelance)

  const relancesAujourdhui = rows.filter(isRelanceAujourdhui).length
  const relancesEnRetard = rows.filter(p => p.date_relance && p.date_relance < today && p.statut !== 'signe' && p.statut !== 'perdu').length

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function fetchCommentaires(prospectId: string) {
    const { data } = await supabase.from('commentaires_prospects').select('*').eq('prospect_id', prospectId).order('created_at', { ascending: true })
    setCommentaires(data ?? [])
  }

  async function addComment() {
    if (!newComment.trim() || !editing.id) return
    setSavingComment(true)
    await supabase.from('commentaires_prospects').insert({ prospect_id: editing.id, contenu: newComment.trim(), auteur_email: userEmail })
    setNewComment('')
    await fetchCommentaires(editing.id)
    setSavingComment(false)
  }

  async function deleteComment(commentId: string) {
    if (!editing.id) return
    await supabase.from('commentaires_prospects').delete().eq('id', commentId)
    await fetchCommentaires(editing.id)
  }

  function openModal(data: Partial<Prospect>) {
    setEditing(data)
    setInitialEditing(JSON.stringify(data))
    setCommentaires([])
    setNewComment('')
    setModalOpen(true)
  }
  function openAdd() { openModal({ ...EMPTY_PROSPECT }) }
  function openEdit(p: Prospect) { openModal({ ...p }); fetchCommentaires(p.id) }
  function closeModal(force = false) {
    if (!force && JSON.stringify(editing) !== initialEditing) {
      if (!confirm('Des modifications non sauvegardées seront perdues. Fermer quand même ?')) return
    }
    setModalOpen(false); setEditing(EMPTY_PROSPECT); setCommentaires([]); setNewComment('')
  }

  async function handleSave() {
    if (!editing.nom?.trim()) { showToast('Le nom est obligatoire'); return }
    setSaving(true)
    const { id, created_at, ...fields } = editing as any
    if (editing.id) {
      await supabase.from('prospects').update(fields).eq('id', editing.id)
    } else {
      await supabase.from('prospects').insert(fields)
    }
    setSaving(false); closeModal(true); fetchData()
    showToast(editing.id ? 'Prospect modifié' : 'Prospect ajouté')
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce prospect ?')) return
    await supabase.from('prospects').delete().eq('id', id)
    fetchData()
    showToast('Prospect supprimé')
  }

  async function quickStatut(id: string, statut: string) {
    await supabase.from('prospects').update({ statut }).eq('id', id)
    fetchData()
    showToast(`Statut → ${STATUT_MAP[statut]?.label}`)
  }

  async function convertirEnBien(prospect: Prospect) {
    const { error } = await supabase.from('biens').insert({
      nom: `${prospect.type_bien ?? 'Bien'} — ${prospect.ville ?? ''}`.trim(),
      ville: prospect.ville ?? '',
      type: prospect.type_bien ?? '',
      capacite: prospect.capacite ?? 4,
      statut: 'en_attente',
      description: `Propriétaire : ${prospect.nom}${prospect.telephone ? ` — ${prospect.telephone}` : ''}`,
    })
    if (error) { showToast('Erreur lors de la création du bien'); return }
    await supabase.from('prospects').update({ statut: 'signe' }).eq('id', prospect.id)
    setConvertModalOpen(false)
    setConvertingProspect(null)
    fetchData()
    showToast('Bien créé et prospect marqué comme signé')
  }

  const pipelineCounts = STATUT_STEPS.filter(s => s.key !== 'perdu').reduce<Record<string, number>>((acc, s) => {
    acc[s.key] = rows.filter(r => r.statut === s.key).length
    return acc
  }, {})

  const sourcesActives = [...new Set(rows.map(r => r.source).filter(Boolean))] as string[]

  const inputClass = 'w-full border border-brun/20 rounded-xl px-3 py-2.5 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors'
  const labelClass = 'block text-xs font-medium text-brun-mid mb-1.5 uppercase tracking-wide'

  function DaysInStatus({ p }: { p: Prospect }) {
    if (p.statut === 'signe' || p.statut === 'perdu') return null
    const ref = p.date_premier_contact ?? p.created_at
    const days = daysSince(ref)
    const color = days > 30 ? 'text-red-500' : days > 14 ? 'text-orange-500' : 'text-brun-mid/40'
    return <span className={`text-[10px] ${color}`} title="Jours depuis le premier contact">{days}j</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>Prospects</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-brun-mid/60">{rows.filter(r => r.statut !== 'signe' && r.statut !== 'perdu').length} en cours</span>
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

      {/* Alertes relances */}
      {(relancesEnRetard > 0 || relancesAujourdhui > 0) && (
        <div className="flex gap-3 mb-5 flex-wrap">
          {relancesEnRetard > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" /></svg>
              <span><strong>{relancesEnRetard}</strong> relance(s) en retard</span>
            </div>
          )}
          {relancesAujourdhui > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 text-sm text-orange-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" /></svg>
              <span><strong>{relancesAujourdhui}</strong> relance(s) aujourd'hui</span>
            </div>
          )}
        </div>
      )}

      {/* Pipeline visuel */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-6">
        {STATUT_STEPS.filter(s => s.key !== 'perdu').map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterStatut(f => f === s.key ? '' : s.key)}
            className={`rounded-xl p-3 text-center transition-all border ${filterStatut === s.key ? 'border-terra ring-1 ring-terra' : 'border-brun/10 hover:border-terra/40'}`}
          >
            <p className="text-xl font-semibold text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>{pipelineCounts[s.key] ?? 0}</p>
            <p className="text-[10px] text-brun-mid/50 uppercase tracking-wide mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-brun-mid/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>
          <input
            className="border border-brun/20 rounded-xl pl-8 pr-3 py-2 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors w-48"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {STATUT_STEPS.map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterStatut(f => f === s.key ? '' : s.key)}
            className={`text-sm font-medium rounded-xl px-3 py-2 transition-all ${filterStatut === s.key ? s.color : 'border border-brun/20 text-brun-mid hover:border-terra hover:text-terra'}`}
          >
            {s.label}
          </button>
        ))}
        {sourcesActives.length > 0 && (
          <AdminSelect className="!py-2 !px-3 !w-auto !min-w-[130px]" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
            <option value="">Toutes sources</option>
            {sourcesActives.map(s => <option key={s}>{s}</option>)}
          </AdminSelect>
        )}
        {(filterStatut || filterSource || search) && (
          <button
            onClick={() => { setFilterStatut(''); setFilterSource(''); setSearch('') }}
            className="text-xs text-terra hover:text-brun transition-colors self-center underline underline-offset-2"
          >
            Réinitialiser
          </button>
        )}
        <span className="self-center text-xs text-brun-mid/60 ml-auto">{filtered.length} prospect(s)</span>
      </div>

      {/* ── MOBILE : cartes ── */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading ? (
          <p className="text-center py-10 text-brun-mid/50 text-sm">Chargement…</p>
        ) : !filtered.length ? (
          <p className="text-center py-10 text-brun-mid/50 text-sm">Aucun prospect</p>
        ) : filtered.map((p) => (
          <div key={p.id} className={`rounded-2xl border p-4 ${isRelancePassee(p) ? 'bg-red-50/60 border-red-300' : isRelanceAujourdhui(p) ? 'bg-orange-50/60 border-orange-300' : 'bg-white border-brun/10'}`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-brun text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>{p.nom}</p>
                  <DaysInStatus p={p} />
                </div>
                {p.ville && <p className="text-xs text-brun-mid/60 mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>{p.ville}{p.adresse ? ` — ${p.adresse}` : ''}</p>}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUT_MAP[p.statut]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUT_MAP[p.statut]?.label ?? p.statut}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-xs text-brun-mid/60 mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {p.telephone && <span>{getFlag(p.telephone)} {p.telephone}</span>}
              {p.type_bien && <span>{p.type_bien}</span>}
              {p.source && <span className="text-brun-mid/40">{p.source}</span>}
            </div>
            {p.date_relance && p.statut !== 'signe' && p.statut !== 'perdu' && (
              <div className={`flex items-center gap-1.5 text-xs mb-2 ${p.date_relance < today ? 'text-red-600 font-medium' : p.date_relance === today ? 'text-orange-600 font-medium' : 'text-brun-mid/50'}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" /></svg>
                Relance : {format(new Date(p.date_relance), 'dd/MM/yy')}
                {p.date_relance < today && ' (en retard)'}
                {p.date_relance === today && ' (aujourd\'hui)'}
              </div>
            )}
            {p.statut !== 'signe' && p.statut !== 'perdu' && (
              <div className="flex gap-1.5 flex-wrap pt-3 border-t border-brun/8 mb-2">
                {STATUT_STEPS.filter(s => s.key !== p.statut && s.key !== 'perdu').map(s => (
                  <button key={s.key} onClick={() => quickStatut(p.id, s.key)} className={`text-[11px] font-medium rounded-lg px-2.5 py-1.5 transition-all flex items-center gap-1 ${s.color}`} style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </button>
                ))}
                <button onClick={() => quickStatut(p.id, 'perdu')} className="text-[11px] font-medium rounded-lg px-2.5 py-1.5 transition-all bg-red-50 text-red-400" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  Perdu
                </button>
              </div>
            )}
            <div className={`flex gap-2 ${p.statut === 'signe' || p.statut === 'perdu' ? 'pt-3 border-t border-brun/8' : ''}`}>
              <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 bg-terra/10 text-terra text-sm font-medium rounded-xl py-2 hover:bg-terra/20 transition-all" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Modifier
              </button>
              {p.statut === 'signe' && (
                <button onClick={() => { setConvertingProspect(p); setConvertModalOpen(true) }} className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-xl py-2 hover:bg-green-100 transition-all" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  Créer le bien
                </button>
              )}
              <button onClick={() => handleDelete(p.id)} className="flex items-center justify-center gap-1.5 bg-red-50 text-red-500 text-sm font-medium rounded-xl py-2 px-3 hover:bg-red-100 transition-all" style={{ fontFamily: 'var(--font-dm-sans)' }}>
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
                {['Prospect', 'Téléphone', 'Bien', 'Source', 'Comm.', 'Statut', 'Relance', ''].map((h) => (
                  <th key={h || '_actions'} className="px-3 py-3 text-left text-xs text-brun-mid uppercase tracking-wide font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brun/5">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-brun-mid/50">Chargement…</td></tr>
              ) : !filtered.length ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-brun-mid/50">Aucun prospect</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className={`transition-colors ${isRelancePassee(p) ? 'bg-red-50/40' : isRelanceAujourdhui(p) ? 'bg-orange-50/40' : 'hover:bg-creme/40'}`}>
                  {/* Prospect : nom + ancienneté */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-brun font-medium">{p.nom}</span>
                      <DaysInStatus p={p} />
                    </div>
                    <span className="block text-[10px] text-brun-mid/40">
                      {p.date_premier_contact
                        ? format(new Date(p.date_premier_contact), 'dd/MM/yy')
                        : format(new Date(p.created_at), 'dd/MM/yy')}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-brun-mid text-xs whitespace-nowrap">{p.telephone ? <>{getFlag(p.telephone)} {p.telephone}</> : '—'}</td>
                  {/* Bien : ville/adresse + type */}
                  <td className="px-3 py-3 text-brun-mid">
                    <span>{p.ville ?? '—'}</span>
                    {p.type_bien && <span className="text-brun-mid/40"> · {p.type_bien}</span>}
                    {p.adresse && <span className="block text-[10px] text-brun-mid/40">{p.adresse}</span>}
                  </td>
                  <td className="px-3 py-3 text-brun-mid/60 text-xs">{p.source ?? '—'}</td>
                  <td className="px-3 py-3 text-brun-mid text-xs">{p.commission_proposee != null ? `${p.commission_proposee}%` : '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUT_MAP[p.statut]?.color ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUT_MAP[p.statut]?.label ?? p.statut}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {p.date_relance && p.statut !== 'signe' && p.statut !== 'perdu' ? (
                      <span className={`text-xs ${p.date_relance < today ? 'text-red-600 font-medium' : p.date_relance === today ? 'text-orange-600 font-medium' : 'text-brun-mid/60'}`}>
                        {format(new Date(p.date_relance), 'dd/MM/yy')}
                        {p.date_relance < today && ' ⚠'}
                      </span>
                    ) : (
                      <span className="text-brun-mid/30">—</span>
                    )}
                  </td>
                  {/* Actions icônes */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {/* Modifier */}
                      <button onClick={() => openEdit(p)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-terra/10 text-terra transition-colors" title="Modifier">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      {/* Avancer */}
                      {p.statut !== 'signe' && p.statut !== 'perdu' && (
                        <button
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-brun-mid/60 transition-colors"
                          title="Avancer"
                          onClick={(e) => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                            setAvancerMenu(prev => prev?.id === p.id ? null : { id: p.id, x: rect.right, y: rect.bottom + 4 })
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M7 18l5-6-5-6" /><path d="M13 18l5-6-5-6" /></svg>
                        </button>
                      )}
                      {/* Créer bien */}
                      {p.statut === 'signe' && (
                        <button onClick={() => { setConvertingProspect(p); setConvertModalOpen(true) }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-600 transition-colors" title="Créer le bien">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        </button>
                      )}
                      {/* Supprimer */}
                      <button onClick={() => handleDelete(p.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Supprimer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Menu Avancer (desktop) */}
      {avancerMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setAvancerMenu(null)}>
          <div
            className="fixed bg-white border border-brun/15 rounded-xl shadow-lg py-1 min-w-[150px]"
            style={{ top: avancerMenu.y, left: avancerMenu.x, transform: 'translateX(-100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {STATUT_STEPS.filter(s => s.key !== rows.find(r => r.id === avancerMenu.id)?.statut).map(s => (
              <button key={s.key} onClick={() => { quickStatut(avancerMenu.id, s.key); setAvancerMenu(null) }} className="w-full text-left px-3 py-2 text-xs hover:bg-creme transition-colors flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal ajout/édition */}
      <Modal open={modalOpen} onClose={() => closeModal()}>
        <div className="p-5 border-b border-brun/10 flex items-center justify-between">
          <h2 className="text-xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
            {editing.id ? 'Modifier le prospect' : 'Nouveau prospect'}
          </h2>
          <button onClick={() => closeModal()} className="text-brun-mid hover:text-brun">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="p-5 flex flex-col gap-0 max-h-[70vh] overflow-y-auto">
          {/* Propriétaire */}
          <div className="pb-4">
            <p className="text-[10px] uppercase tracking-widest text-brun-mid/40 font-medium mb-3">Propriétaire</p>
            <div>
              <label className={labelClass}>Nom *</label>
              <input className={inputClass} value={editing.nom ?? ''} onChange={(e) => setEditing(p => ({ ...p, nom: e.target.value }))} placeholder="Nom du propriétaire" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelClass}>Téléphone</label>
                <div className="flex gap-1.5">
                  <select
                    className="border border-brun/20 rounded-xl px-2 py-2.5 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors w-[110px] shrink-0"
                    value={getPrefix(editing.telephone)}
                    onChange={(e) => {
                      const num = getNumber(editing.telephone)
                      setEditing(p => ({ ...p, telephone: e.target.value + ' ' + num }))
                    }}
                  >
                    {PREFIXES.map(p => <option key={p.code} value={p.code}>{p.flag} {p.code}</option>)}
                  </select>
                  <input
                    className={inputClass}
                    value={getNumber(editing.telephone)}
                    onChange={(e) => {
                      const prefix = getPrefix(editing.telephone)
                      setEditing(p => ({ ...p, telephone: prefix + ' ' + e.target.value }))
                    }}
                    placeholder="6 12 34 56 78"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={editing.email ?? ''} onChange={(e) => setEditing(p => ({ ...p, email: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Bien */}
          <div className="border-t border-brun/8 pt-4 pb-4">
            <p className="text-[10px] uppercase tracking-widest text-brun-mid/40 font-medium mb-3">Bien</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Ville</label>
                <AdminSelect value={editing.ville ?? ''} onChange={(e) => setEditing(p => ({ ...p, ville: e.target.value || null }))}>
                  <option value="">— Sélectionner —</option>
                  {VILLES.map(v => <option key={v}>{v}</option>)}
                </AdminSelect>
              </div>
              <div>
                <label className={labelClass}>Adresse</label>
                <input className={inputClass} value={editing.adresse ?? ''} onChange={(e) => setEditing(p => ({ ...p, adresse: e.target.value }))} placeholder="Rue, résidence..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelClass}>Type de bien</label>
                <AdminSelect value={editing.type_bien ?? ''} onChange={(e) => setEditing(p => ({ ...p, type_bien: e.target.value }))}>
                  {TYPES_BIEN.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                </AdminSelect>
              </div>
              <div>
                <label className={labelClass}>Capacité (pers.)</label>
                <input type="number" min={1} className={inputClass} value={editing.capacite ?? ''} onChange={(e) => setEditing(p => ({ ...p, capacite: e.target.value === '' ? null : Number(e.target.value) }))} placeholder="6" />
              </div>
            </div>
          </div>

          {/* Pipeline */}
          <div className="border-t border-brun/8 pt-4 pb-4">
            <p className="text-[10px] uppercase tracking-widest text-brun-mid/40 font-medium mb-3">Pipeline</p>
            <div>
              <label className={labelClass}>Statut</label>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {STATUT_STEPS.map(s => (
                  <button key={s.key} type="button"
                    onClick={() => setEditing(p => ({ ...p, statut: s.key }))}
                    className={`text-xs rounded-lg px-2.5 py-1.5 font-medium transition-all flex items-center gap-1.5 ${editing.statut === s.key ? s.color : 'bg-brun/5 text-brun-mid/60 hover:bg-brun/10'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${editing.statut === s.key ? s.dot : 'bg-brun-mid/30'}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Source</label>
                <AdminSelect value={editing.source ?? ''} onChange={(e) => setEditing(p => ({ ...p, source: e.target.value || null }))}>
                  <option value="">— Sélectionner —</option>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </AdminSelect>
              </div>
              <div>
                <label className={labelClass}>Commission proposée</label>
                <div className="flex gap-1.5 mb-1.5">
                  {[20, 25].map(v => (
                    <button key={v} type="button"
                      onClick={() => setEditing(p => ({ ...p, commission_proposee: v }))}
                      className={`text-xs rounded-lg px-2.5 py-1 font-medium transition-all ${editing.commission_proposee === v ? 'bg-terra text-creme' : 'bg-brun/8 text-brun-mid hover:bg-terra/20'}`}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
                <input type="number" min={0} max={100} step={0.5} className={inputClass} value={editing.commission_proposee ?? ''} onChange={(e) => setEditing(p => ({ ...p, commission_proposee: e.target.value === '' ? null : Number(e.target.value) }))} placeholder="%" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className={labelClass}>Premier contact</label>
                <input type="date" className={inputClass} value={editing.date_premier_contact ?? ''} onChange={(e) => setEditing(p => ({ ...p, date_premier_contact: e.target.value || null }))} />
              </div>
              <div>
                <label className={labelClass}>Date de relance</label>
                <input type="date" className={inputClass} value={editing.date_relance ?? ''} onChange={(e) => setEditing(p => ({ ...p, date_relance: e.target.value || null }))} />
              </div>
            </div>
          </div>

          {/* Notes rapides */}
          <div className="border-t border-brun/8 pt-4">
            <label className={labelClass}>Notes</label>
            <textarea className={`${inputClass} resize-none`} rows={2} value={editing.notes ?? ''} onChange={(e) => setEditing(p => ({ ...p, notes: e.target.value }))} placeholder="Info générale sur le prospect..." />
          </div>

          {/* Commentaires horodatés */}
          {editing.id && (
            <div className="border-t border-brun/10 pt-4 mt-4">
              <label className={labelClass}>Historique des échanges</label>
              {commentaires.length > 0 && (
                <div className="flex flex-col gap-2 mb-3 max-h-48 overflow-y-auto">
                  {commentaires.map((c) => (
                    <div key={c.id} className="bg-creme/60 rounded-xl px-3 py-2 group relative">
                      <p className="text-xs text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>{c.contenu}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] text-brun-mid/40">
                          {c.auteur_email?.split('@')[0] ?? '—'} · {format(new Date(c.created_at), 'dd/MM/yy HH:mm')}
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
                  placeholder="Appelé le..., il hésite sur..., visite prévue..."
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment() } }}
                />
                <button
                  onClick={addComment}
                  disabled={savingComment || !newComment.trim()}
                  className="bg-terra text-creme text-xs font-medium rounded-xl px-3 py-2 hover:bg-brun transition-all disabled:opacity-40"
                >
                  {savingComment ? '…' : 'Ajouter'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-brun/10 flex items-center justify-end gap-3">
          <button onClick={() => closeModal()} className="border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-5 py-2 hover:bg-brun/5 transition-all">Annuler</button>
          <button onClick={handleSave} disabled={saving || !editing.nom} className="bg-terra text-creme text-sm font-medium rounded-full px-5 py-2 hover:bg-brun transition-all disabled:opacity-50">
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </Modal>

      {/* Modal conversion en bien */}
      <Modal open={convertModalOpen} onClose={() => { setConvertModalOpen(false); setConvertingProspect(null) }}>
        {convertingProspect && (
          <>
            <div className="p-5 border-b border-brun/10">
              <h2 className="text-xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>Convertir en bien</h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-brun-mid mb-4">
                Créer un nouveau bien à partir du prospect <strong>{convertingProspect.nom}</strong> ?
              </p>
              <div className="bg-creme/80 border border-brun/8 rounded-xl px-4 py-3 mb-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-brun-mid/60">Type</span> <span className="text-brun font-medium ml-2">{convertingProspect.type_bien ?? '—'}</span></div>
                  <div><span className="text-brun-mid/60">Ville</span> <span className="text-brun font-medium ml-2">{convertingProspect.ville ?? '—'}</span></div>
                  <div><span className="text-brun-mid/60">Capacité</span> <span className="text-brun font-medium ml-2">{convertingProspect.capacite ?? '—'} pers.</span></div>
                  <div><span className="text-brun-mid/60">Commission</span> <span className="text-brun font-medium ml-2">{convertingProspect.commission_proposee ?? '—'}%</span></div>
                </div>
              </div>
              <p className="text-xs text-brun-mid/50 mb-4">Le bien sera créé en statut « en attente ». Vous pourrez compléter les détails dans la section Biens.</p>
            </div>
            <div className="p-5 border-t border-brun/10 flex items-center justify-end gap-3">
              <button onClick={() => { setConvertModalOpen(false); setConvertingProspect(null) }} className="border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-5 py-2 hover:bg-brun/5 transition-all">Annuler</button>
              <button onClick={() => convertirEnBien(convertingProspect)} className="bg-green-600 text-white text-sm font-medium rounded-full px-5 py-2 hover:bg-green-700 transition-all">
                Créer le bien
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
