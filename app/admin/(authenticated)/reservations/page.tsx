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
  statut: string
  notes: string | null
  created_at: string
  biens?: { nom: string } | null
}

type Bien = { id: string; nom: string }

const EMPTY_RES: Partial<Reservation> = {
  voyageur_nom: '', voyageur_email: '', voyageur_phone: '', date_arrivee: '', date_depart: '',
  plateforme: 'Airbnb', montant: null, taux_commission: 20, statut: 'confirmee', notes: '',
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

function nuits(d1: string, d2: string) {
  if (!d1 || !d2) return 0
  return Math.max(0, Math.round((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000))
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
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
  const [saving, setSaving] = useState(false)
  const [filterStatut, setFilterStatut] = useState('')
  const [filterPlatf, setFilterPlatf] = useState('')

  async function fetchData() {
    const [{ data: resData }, { data: bienData }] = await Promise.all([
      supabase.from('reservations').select('*, biens(nom)').order('date_arrivee', { ascending: false }),
      supabase.from('biens').select('id, nom').eq('statut', 'actif'),
    ])
    setRows(resData ?? [])
    setBiens(bienData ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const filtered = rows.filter((r) => {
    if (filterStatut && r.statut !== filterStatut) return false
    if (filterPlatf && r.plateforme !== filterPlatf) return false
    return true
  })

  function openAdd() { setEditing({ ...EMPTY_RES, bien_id: biens[0]?.id ?? null }); setModalOpen(true) }
  function openEdit(r: Reservation) { setEditing({ ...r }); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditing(EMPTY_RES) }

  async function handleSave() {
    setSaving(true)
    const { id, created_at, biens, ...fields } = editing as any
    if (editing.id) {
      await supabase.from('reservations').update(fields).eq('id', editing.id)
    } else {
      await supabase.from('reservations').insert(fields)
    }
    setSaving(false); closeModal(); fetchData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette réservation ?')) return
    await supabase.from('reservations').delete().eq('id', id)
    fetchData()
  }

  const commission = editing.montant && editing.taux_commission
    ? (editing.montant * editing.taux_commission / 100).toFixed(2)
    : '—'

  const inputClass = 'w-full border border-brun/20 rounded-xl px-3 py-2.5 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors'
  const labelClass = 'block text-xs font-medium text-brun-mid mb-1.5 uppercase tracking-wide'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>Réservations</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-5 py-2.5 hover:bg-brun transition-all">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          Ajouter
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <AdminSelect className="!py-2 !px-3" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
          <option value="">Tous statuts</option>
          {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </AdminSelect>
        <AdminSelect className="!py-2 !px-3" value={filterPlatf} onChange={(e) => setFilterPlatf(e.target.value)}>
          <option value="">Toutes plateformes</option>
          {PLATF.map((p) => <option key={p}>{p}</option>)}
        </AdminSelect>
        <span className="self-center text-xs text-brun-mid/60">{filtered.length} réservation(s)</span>
      </div>

      {/* ── MOBILE : cartes ── */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading ? (
          <p className="text-center py-10 text-brun-mid/50 text-sm">Chargement…</p>
        ) : !filtered.length ? (
          <p className="text-center py-10 text-brun-mid/50 text-sm">Aucune réservation</p>
        ) : filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-brun/10 p-4">
            {/* Ligne 1 : nom + statut */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-medium text-brun text-sm truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{r.voyageur_nom}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUT_COLORS[r.statut]}`}>
                {STATUT_LABELS[r.statut] ?? r.statut}
              </span>
            </div>
            {/* Bien */}
            <p className="text-xs text-brun-mid/60 mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {(r as any).biens?.nom ?? '—'}
            </p>
            {/* Dates + nuits + plateforme */}
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
            {/* Montant + commission */}
            <div className="flex items-center gap-3 mb-3">
              {r.montant ? (
                <>
                  <span className="text-sm font-medium text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>{r.montant} MAD</span>
                  <span className="text-xs text-terra" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Commission : {(r.montant * r.taux_commission / 100).toFixed(0)} MAD
                  </span>
                </>
              ) : (
                <span className="text-sm text-brun-mid/40">Montant —</span>
              )}
            </div>
            {/* Actions */}
            <div className="flex gap-3 pt-3 border-t border-brun/8">
              <button
                onClick={() => openEdit(r)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-terra/10 text-terra text-sm font-medium rounded-xl py-2 hover:bg-terra/20 transition-all"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Modifier
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-500 text-sm font-medium rounded-xl py-2 hover:bg-red-100 transition-all"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
                Supprimer
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
                {['Voyageur', 'Bien', 'Arrivée', 'Départ', 'Nuits', 'Plateforme', 'Montant', 'Commission', 'Statut', ''].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs text-brun-mid uppercase tracking-wide font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brun/5">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-brun-mid/50">Chargement…</td></tr>
              ) : !filtered.length ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-brun-mid/50">Aucune réservation</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="hover:bg-creme/40 transition-colors">
                  <td className="px-3 py-3 text-brun font-medium whitespace-nowrap">{r.voyageur_nom}</td>
                  <td className="px-3 py-3 text-brun-mid">{(r as any).biens?.nom ?? '—'}</td>
                  <td className="px-3 py-3 text-brun-mid whitespace-nowrap">{format(new Date(r.date_arrivee), 'dd/MM/yy')}</td>
                  <td className="px-3 py-3 text-brun-mid whitespace-nowrap">{format(new Date(r.date_depart), 'dd/MM/yy')}</td>
                  <td className="px-3 py-3 text-center text-brun-mid">{nuits(r.date_arrivee, r.date_depart)}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATF_COLORS[r.plateforme ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                      {r.plateforme ?? '—'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-brun-mid whitespace-nowrap">{r.montant ? `${r.montant} MAD` : '—'}</td>
                  <td className="px-3 py-3 font-medium text-terra whitespace-nowrap">
                    {r.montant ? `${(r.montant * r.taux_commission / 100).toFixed(0)} MAD` : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUT_COLORS[r.statut]}`}>{STATUT_LABELS[r.statut] ?? r.statut}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(r)} className="text-terra text-xs underline underline-offset-2">Modifier</button>
                      <button onClick={() => handleDelete(r.id)} className="text-red-400 text-xs underline underline-offset-2">Suppr.</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={closeModal}>
        <div className="p-5 border-b border-brun/10 flex items-center justify-between">
          <h2 className="text-xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
            {editing.id ? 'Modifier' : 'Nouvelle réservation'}
          </h2>
          <button onClick={closeModal} className="text-brun-mid hover:text-brun">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Montant (MAD)</label>
              <input type="number" min={0} className={inputClass} value={editing.montant ?? ''} onChange={(e) => setEditing((p) => ({ ...p, montant: Number(e.target.value) || null }))} placeholder="1500" />
            </div>
            <div>
              <label className={labelClass}>Commission (%)</label>
              <div className="flex gap-1.5 mb-1.5">
                {[0, 20, 25].map((v) => (
                  <button key={v} type="button"
                    onClick={() => setEditing((p) => ({ ...p, taux_commission: v }))}
                    className={`text-xs rounded-lg px-2.5 py-1 font-medium transition-all ${editing.taux_commission === v ? 'bg-terra text-creme' : 'bg-brun/8 text-brun-mid hover:bg-terra/20'}`}
                  >
                    {v === 0 ? 'Sans' : `${v}%`}
                  </button>
                ))}
              </div>
              <input
                type="number" min={0} max={100} step={0.5}
                className={inputClass}
                value={editing.taux_commission ?? ''}
                onChange={(e) => setEditing((p) => ({ ...p, taux_commission: Number(e.target.value) }))}
                placeholder="Taux %"
              />
            </div>
          </div>
          {editing.montant != null && editing.montant > 0 && (
            <div className="bg-terra/10 rounded-xl px-4 py-3 text-sm">
              {editing.taux_commission === 0
                ? <span className="text-brun-mid">Sans commission</span>
                : <><span className="text-brun-mid">Commission ({editing.taux_commission}%) : </span><span className="text-terra font-medium">{commission} MAD</span></>
              }
            </div>
          )}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea className={`${inputClass} resize-none`} rows={2} value={editing.notes ?? ''} onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))} placeholder="Remarques éventuelles..." />
          </div>
        </div>
        <div className="p-5 border-t border-brun/10 flex justify-end gap-3">
          <button onClick={closeModal} className="border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-5 py-2 hover:bg-brun/5 transition-all">Annuler</button>
          <button onClick={handleSave} disabled={saving || !editing.voyageur_nom} className="bg-terra text-creme text-sm font-medium rounded-full px-5 py-2 hover:bg-brun transition-all disabled:opacity-50">
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
