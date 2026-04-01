'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Temoignage = {
  id: string
  nom: string
  ville: string | null
  type_bien: string | null
  note: number
  message: string
  photo_url: string | null
  actif: boolean
  ordre: number
  created_at: string
}

const EMPTY: Partial<Temoignage> = {
  nom: '', ville: '', type_bien: '', note: 5, message: '', photo_url: '', actif: true, ordre: 0,
}

const TYPE_OPTIONS = ['Appartement', 'Villa', 'Studio', 'Autre']

function Stars({ note, interactive, onChange }: { note: number; interactive?: boolean; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          disabled={!interactive}
        >
          <svg width="18" height="18" viewBox="0 0 14 14" fill={i < note ? '#C97B4B' : 'none'} stroke="#C97B4B" strokeWidth="1.2">
            <path d="M7 1l1.55 3.14L12 4.72l-2.5 2.43.59 3.44L7 8.9l-3.09 1.69.59-3.44L2 4.72l3.45-.58L7 1z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-8 bg-brun/50 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export default function TemoignagesAdminPage() {
  const supabase = createClient()
  const [temoignages, setTemoignages] = useState<Temoignage[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Temoignage>>(EMPTY)
  const [saving, setSaving] = useState(false)

  async function fetchTemoignages() {
    const { data } = await supabase
      .from('temoignages')
      .select('*')
      .order('ordre', { ascending: true })
      .order('created_at', { ascending: false })
    setTemoignages(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTemoignages() }, [])

  function openAdd() { setEditing(EMPTY); setModalOpen(true) }
  function openEdit(t: Temoignage) { setEditing({ ...t }); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditing(EMPTY) }

  async function handleSave() {
    if (!editing.nom || !editing.message) return
    setSaving(true)
    if (editing.id) {
      await supabase.from('temoignages').update(editing).eq('id', editing.id)
    } else {
      await supabase.from('temoignages').insert(editing)
    }
    setSaving(false)
    closeModal()
    fetchTemoignages()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce témoignage ?')) return
    await supabase.from('temoignages').delete().eq('id', id)
    fetchTemoignages()
  }

  async function toggleActif(id: string, actif: boolean) {
    await supabase.from('temoignages').update({ actif: !actif }).eq('id', id)
    fetchTemoignages()
  }

  const inputClass = 'w-full border border-brun/20 rounded-xl px-3 py-2.5 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors'
  const labelClass = 'block text-xs font-medium text-brun-mid mb-1.5 uppercase tracking-wide'

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
          Témoignages
        </h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-5 py-2.5 hover:bg-brun transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Ajouter un témoignage
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-brun/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brun/4">
              <tr>
                {['Nom', 'Ville', 'Type bien', 'Note', 'Message', 'Affiché', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-brun-mid uppercase tracking-wide font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brun/5">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-brun-mid/50">Chargement…</td></tr>
              ) : !temoignages.length ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-brun-mid/50">Aucun témoignage</td></tr>
              ) : temoignages.map((t) => (
                <tr key={t.id} className="hover:bg-creme/40 transition-colors">
                  <td className="px-4 py-3 text-brun font-medium">{t.nom}</td>
                  <td className="px-4 py-3 text-brun-mid">{t.ville ?? '—'}</td>
                  <td className="px-4 py-3 text-brun-mid">{t.type_bien ?? '—'}</td>
                  <td className="px-4 py-3"><Stars note={t.note} /></td>
                  <td className="px-4 py-3 text-brun-mid max-w-xs">
                    <p className="truncate">{t.message}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActif(t.id, t.actif)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${t.actif ? 'bg-green-400' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${t.actif ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(t)} className="text-terra hover:text-brun text-xs font-medium underline underline-offset-2">Modifier</button>
                      <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600 text-xs font-medium underline underline-offset-2">Supprimer</button>
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
        <div className="p-6 border-b border-brun/10 flex items-center justify-between">
          <h2 className="text-xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
            {editing.id ? 'Modifier le témoignage' : 'Nouveau témoignage'}
          </h2>
          <button onClick={closeModal} className="text-brun-mid hover:text-brun">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nom *</label>
              <input
                className={inputClass}
                value={editing.nom ?? ''}
                onChange={(e) => setEditing((p) => ({ ...p, nom: e.target.value }))}
                placeholder="Prénom Nom"
              />
            </div>
            <div>
              <label className={labelClass}>Ville</label>
              <input
                className={inputClass}
                value={editing.ville ?? ''}
                onChange={(e) => setEditing((p) => ({ ...p, ville: e.target.value || null }))}
                placeholder="Mohammedia"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Type de bien</label>
              <select
                className={inputClass}
                value={editing.type_bien ?? ''}
                onChange={(e) => setEditing((p) => ({ ...p, type_bien: e.target.value || null }))}
              >
                <option value="">—</option>
                {TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Ordre d&apos;affichage</label>
              <input
                type="number" min={0}
                className={inputClass}
                value={editing.ordre ?? 0}
                onChange={(e) => setEditing((p) => ({ ...p, ordre: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Note</label>
            <Stars
              note={editing.note ?? 5}
              interactive
              onChange={(n) => setEditing((p) => ({ ...p, note: n }))}
            />
          </div>

          <div>
            <label className={labelClass}>Témoignage *</label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={4}
              value={editing.message ?? ''}
              onChange={(e) => setEditing((p) => ({ ...p, message: e.target.value }))}
              placeholder="Votre expérience avec Clévia..."
            />
          </div>

          <div>
            <label className={labelClass}>URL photo (optionnel)</label>
            <input
              className={inputClass}
              value={editing.photo_url ?? ''}
              onChange={(e) => setEditing((p) => ({ ...p, photo_url: e.target.value || null }))}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing((p) => ({ ...p, actif: !p.actif }))}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${editing.actif ? 'bg-green-400' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${editing.actif ? 'left-5' : 'left-0.5'}`} />
            </button>
            <span className="text-sm text-brun-mid" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Afficher sur le site
            </span>
          </div>
        </div>

        <div className="p-6 border-t border-brun/10 flex justify-end gap-3">
          <button onClick={closeModal} className="border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-6 py-2.5 hover:bg-brun/5 transition-all">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !editing.nom || !editing.message}
            className="bg-terra text-creme text-sm font-medium rounded-full px-6 py-2.5 hover:bg-brun transition-all disabled:opacity-50"
          >
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
