'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase'
import AdminSelect from '@/components/admin/AdminSelect'

type Voyageur = {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  sources: string[] | null
  nb_reservations: number
  created_at: string
  updated_at: string | null
}

type Reservation = {
  id: string
  voyageur_nom: string
  voyageur_phone: string | null
  date_arrivee: string
  date_depart: string
  plateforme: string | null
  montant: number | null
  statut: string
  biens?: { nom: string } | null
}

const PLATF_COLORS: Record<string, string> = {
  Airbnb: 'bg-rose-100 text-rose-600',
  Booking: 'bg-blue-100 text-blue-600',
  Avito: 'bg-orange-100 text-orange-600',
  Facebook: 'bg-blue-100 text-blue-700',
  Direct: 'bg-green-100 text-green-700',
}

const STATUT_LABELS: Record<string, string> = { confirmee: 'Confirmée', annulee: 'Annulée', terminee: 'Terminée' }
const STATUT_COLORS: Record<string, string> = {
  confirmee: 'bg-green-100 text-green-700',
  annulee: 'bg-red-100 text-red-700',
  terminee: 'bg-gray-100 text-gray-500',
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

export default function VoyageursPage() {
  const supabase = createClient()
  const [voyageurs, setVoyageurs] = useState<Voyageur[]>([])
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<string>('updated_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  const [toast, setToast] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Voyageur> | null>(null)
  const [saving, setSaving] = useState(false)

  const [resaModal, setResaModal] = useState(false)
  const [resaVoyageur, setResaVoyageur] = useState<Voyageur | null>(null)
  const [resaList, setResaList] = useState<Reservation[]>([])
  const [resaLoading, setResaLoading] = useState(false)

  // Compteurs réels depuis la table reservations
  const [realCounts, setRealCounts] = useState<Record<string, number>>({})

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function fetchData() {
    const [{ data: vData }, { data: resData }] = await Promise.all([
      supabase.from('voyageurs').select('*').order('updated_at', { ascending: false }),
      supabase.from('reservations').select('voyageur_phone, statut').not('voyageur_phone', 'is', null),
    ])

    // Compter les réservations réelles par téléphone (hors annulées)
    const counts: Record<string, number> = {}
    for (const r of resData ?? []) {
      if (r.statut === 'annulee' || !r.voyageur_phone) continue
      const phone = r.voyageur_phone.trim()
      counts[phone] = (counts[phone] ?? 0) + 1
    }
    setRealCounts(counts)

    // Corriger nb_reservations si décalé
    for (const v of vData ?? []) {
      const real = counts[v.telephone?.trim() ?? ''] ?? 0
      if (v.nb_reservations !== real) {
        await supabase.from('voyageurs').update({ nb_reservations: real }).eq('id', v.id)
        v.nb_reservations = real
      }
    }

    setVoyageurs(vData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsSuperAdmin(user?.app_metadata?.role !== 'admin')
    })
    fetchData()
  }, [])

  // Filtrage + tri
  const filtered = voyageurs.filter((v) => {
    if (!search) return true
    const q = search.toLowerCase()
    return v.nom.toLowerCase().includes(q)
      || (v.telephone?.toLowerCase().includes(q))
      || (v.email?.toLowerCase().includes(q))
      || (v.sources ?? []).some(s => s.toLowerCase().includes(q))
  }).sort((a, b) => {
    let va: any, vb: any
    switch (sortCol) {
      case 'nom': va = a.nom.toLowerCase(); vb = b.nom.toLowerCase(); break
      case 'telephone': va = a.telephone ?? ''; vb = b.telephone ?? ''; break
      case 'email': va = a.email ?? ''; vb = b.email ?? ''; break
      case 'nb_reservations': va = a.nb_reservations; vb = b.nb_reservations; break
      case 'created_at': va = a.created_at; vb = b.created_at; break
      case 'updated_at': va = a.updated_at ?? a.created_at; vb = b.updated_at ?? b.created_at; break
      default: va = a.updated_at ?? a.created_at; vb = b.updated_at ?? b.created_at
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

  // CRUD
  function openEdit(v: Voyageur) { setEditing({ ...v }); setEditModal(true) }
  function closeEdit() { setEditModal(false); setEditing(null) }

  async function handleSave() {
    if (!editing?.nom?.trim()) { showToast('Le nom est obligatoire'); return }
    setSaving(true)
    await supabase.from('voyageurs').update({
      nom: editing.nom.trim(),
      email: editing.email?.trim() || null,
      telephone: editing.telephone?.trim() || null,
      sources: editing.sources,
      updated_at: new Date().toISOString(),
    }).eq('id', editing.id!)
    setSaving(false); closeEdit(); fetchData()
    showToast('Voyageur modifié')
  }

  async function handleDelete(id: string, nom: string) {
    if (!confirm(`Supprimer le voyageur "${nom}" ?`)) return
    await supabase.from('voyageurs').delete().eq('id', id)
    fetchData()
    showToast('Voyageur supprimé')
  }

  // Voir réservations d'un voyageur
  async function showReservations(v: Voyageur) {
    setResaVoyageur(v)
    setResaModal(true)
    setResaLoading(true)
    let query = supabase.from('reservations').select('*, biens(nom)').order('date_arrivee', { ascending: false })
    if (v.telephone) {
      query = query.eq('voyageur_phone', v.telephone)
    } else {
      query = query.eq('voyageur_nom', v.nom)
    }
    const { data } = await query
    setResaList(data ?? [])
    setResaLoading(false)
  }

  // Export CSV complet
  function exportCSV() {
    const headers = isSuperAdmin
      ? ['Nom', 'Téléphone', 'Email', 'Sources', 'Réservations', 'Premier contact']
      : ['Nom', 'Email', 'Sources', 'Réservations', 'Premier contact']
    const csvRows = filtered.map((v) => [
      v.nom,
      ...(isSuperAdmin ? [v.telephone ?? ''] : []),
      v.email ?? '',
      (v.sources ?? []).join(' / '),
      v.nb_reservations,
      format(new Date(v.created_at), 'dd/MM/yyyy'),
    ])
    const csv = [headers, ...csvRows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voyageurs-clevia-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const inputClass = 'w-full border border-brun/20 rounded-xl px-3 py-2.5 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors'
  const labelClass = 'block text-xs font-medium text-brun-mid mb-1.5 uppercase tracking-wide'

  const columns: { label: string; col: string }[] = [
    { label: 'Nom', col: 'nom' },
    { label: 'Téléphone', col: 'telephone' },
    { label: 'Email', col: 'email' },
    { label: 'Sources', col: '' },
    { label: 'Réservations', col: 'nb_reservations' },
    { label: 'Premier contact', col: 'created_at' },
    { label: '', col: '' },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
            Voyageurs
          </h1>
          <p className="text-brun-mid text-sm mt-1">{voyageurs.length} voyageur(s) enregistré(s)</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-4 py-2.5 hover:border-terra hover:text-terra transition-all"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Export CSV
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] bg-brun text-creme text-sm font-medium px-5 py-3 rounded-xl shadow-lg animate-[fadeIn_0.2s]">
          {toast}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-brun-mid/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>
          <input
            className="border border-brun/20 rounded-xl pl-8 pr-3 py-2 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors w-64"
            placeholder="Rechercher nom, téléphone, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        {search && (
          <button onClick={() => { setSearch(''); setPage(1) }} className="text-xs text-terra hover:text-brun transition-colors self-center underline underline-offset-2">
            Réinitialiser
          </button>
        )}
        <span className="self-center text-xs text-brun-mid/60">{filtered.length} résultat(s)</span>
      </div>

      {/* Mobile */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading ? (
          <p className="text-center py-10 text-brun-mid/50 text-sm">Chargement…</p>
        ) : !filtered.length ? (
          <p className="text-center py-10 text-brun-mid/50 text-sm">Aucun voyageur</p>
        ) : paginated.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl border border-brun/10 p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-medium text-brun text-sm">{v.nom}</p>
              <span className="text-xs text-brun-mid/50 bg-brun/5 rounded-full px-2 py-0.5">
                {v.nb_reservations} rés.
              </span>
            </div>
            <p className="text-xs text-brun-mid/60 mb-2">
              {isSuperAdmin ? (v.telephone ?? '—') : '•••••••••'}{v.email ? ` · ${v.email}` : ''}
            </p>
            <div className="flex flex-wrap gap-1 mb-3">
              {(v.sources ?? []).map((s) => (
                <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATF_COLORS[s] ?? 'bg-gray-100 text-gray-500'}`}>{s}</span>
              ))}
            </div>
            <div className="flex gap-2 pt-3 border-t border-brun/8">
              <button onClick={() => showReservations(v)} className="flex-1 flex items-center justify-center gap-1.5 bg-brun/5 text-brun-mid text-xs font-medium rounded-xl py-2 hover:bg-brun/10 transition-all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                Réservations
              </button>
              <button onClick={() => openEdit(v)} className="flex-1 flex items-center justify-center gap-1.5 bg-terra/10 text-terra text-xs font-medium rounded-xl py-2 hover:bg-terra/20 transition-all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Modifier
              </button>
              <button onClick={() => handleDelete(v.id, v.nom)} className="flex items-center justify-center gap-1.5 bg-red-50 text-red-400 text-xs font-medium rounded-xl py-2 px-3 hover:bg-red-100 transition-all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden lg:block bg-white rounded-2xl border border-brun/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brun/4">
              <tr>
                {columns.map(({ label, col }, i) => (
                  <th
                    key={label || `_${i}`}
                    className={`px-4 py-3 text-left text-xs text-brun-mid uppercase tracking-wide font-medium whitespace-nowrap ${col ? 'cursor-pointer hover:text-terra select-none' : ''}`}
                    onClick={() => col && toggleSort(col)}
                  >
                    {label}{col ? sortIcon(col) : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brun/5">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-brun-mid/50">Chargement…</td></tr>
              ) : !filtered.length ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-brun-mid/50">Aucun voyageur</td></tr>
              ) : paginated.map((v) => (
                <tr key={v.id} className="hover:bg-creme/40 transition-colors">
                  <td className="px-4 py-3 text-brun font-medium">{v.nom}</td>
                  <td className="px-4 py-3 text-brun-mid">{isSuperAdmin ? (v.telephone ?? '—') : '•••••••••'}</td>
                  <td className="px-4 py-3 text-brun-mid">{v.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(v.sources ?? []).map((s) => (
                        <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATF_COLORS[s] ?? 'bg-gray-100 text-gray-500'}`}>{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => showReservations(v)}
                      className="inline-block bg-terra/10 text-terra text-xs font-medium px-2.5 py-1 rounded-full hover:bg-terra/20 transition-all cursor-pointer"
                      title="Voir les réservations"
                    >
                      {v.nb_reservations}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-brun-mid whitespace-nowrap">
                    {format(new Date(v.created_at), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(v)} className="text-terra text-xs underline underline-offset-2">Modifier</button>
                      <button onClick={() => handleDelete(v.id, v.nom)} className="text-red-400 text-xs underline underline-offset-2">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
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

      {/* Modal modifier voyageur */}
      <Modal open={editModal} onClose={closeEdit}>
        <div className="p-5 border-b border-brun/10 flex items-center justify-between">
          <h2 className="text-xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
            Modifier le voyageur
          </h2>
          <button onClick={closeEdit} className="text-brun-mid hover:text-brun">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        {editing && (
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className={labelClass}>Nom *</label>
              <input className={inputClass} value={editing.nom ?? ''} onChange={(e) => setEditing(p => ({ ...p!, nom: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Téléphone</label>
                <input className={inputClass} value={editing.telephone ?? ''} onChange={(e) => setEditing(p => ({ ...p!, telephone: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={editing.email ?? ''} onChange={(e) => setEditing(p => ({ ...p!, email: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Sources</label>
              <div className="flex flex-wrap gap-1.5">
                {['Airbnb', 'Booking', 'Avito', 'Facebook', 'Direct'].map((s) => {
                  const active = (editing.sources ?? []).includes(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditing(p => ({
                        ...p!,
                        sources: active
                          ? (p!.sources ?? []).filter(x => x !== s)
                          : [...(p!.sources ?? []), s]
                      }))}
                      className={`text-xs rounded-lg px-2.5 py-1 font-medium transition-all ${active ? 'bg-terra text-creme' : 'bg-brun/8 text-brun-mid hover:bg-terra/20'}`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
        <div className="p-5 border-t border-brun/10 flex justify-end gap-3">
          <button onClick={closeEdit} className="border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-5 py-2 hover:bg-brun/5 transition-all">Annuler</button>
          <button onClick={handleSave} disabled={saving} className="bg-terra text-creme text-sm font-medium rounded-full px-5 py-2 hover:bg-brun transition-all disabled:opacity-50">
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </Modal>

      {/* Modal réservations du voyageur */}
      <Modal open={resaModal} onClose={() => setResaModal(false)}>
        <div className="p-5 border-b border-brun/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
              Réservations
            </h2>
            {resaVoyageur && <p className="text-xs text-brun-mid/60 mt-0.5">{resaVoyageur.nom}{resaVoyageur.telephone ? ` · ${resaVoyageur.telephone}` : ''}</p>}
          </div>
          <button onClick={() => setResaModal(false)} className="text-brun-mid hover:text-brun">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {resaLoading ? (
            <p className="text-center py-10 text-brun-mid/50 text-sm">Chargement…</p>
          ) : !resaList.length ? (
            <p className="text-center py-10 text-brun-mid/50 text-sm">Aucune réservation trouvée</p>
          ) : (
            <div className="divide-y divide-brun/5">
              {resaList.map((r) => (
                <div key={r.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-brun">{r.biens?.nom ?? '—'}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUT_COLORS[r.statut] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUT_LABELS[r.statut] ?? r.statut}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-brun-mid/60">
                    <span>{format(new Date(r.date_arrivee), 'dd/MM/yy')} → {format(new Date(r.date_depart), 'dd/MM/yy')}</span>
                    <span>·</span>
                    {r.plateforme && (
                      <span className={`px-1.5 py-0.5 rounded-full font-medium ${PLATF_COLORS[r.plateforme] ?? 'bg-gray-100 text-gray-500'}`}>
                        {r.plateforme}
                      </span>
                    )}
                    {isSuperAdmin && r.montant && (
                      <><span>·</span><span className="text-brun-mid">{r.montant} MAD</span></>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
