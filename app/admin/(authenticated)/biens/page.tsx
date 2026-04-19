'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { EQUIPEMENTS, REGLES_OPTIONS } from '@/lib/equipements'

type Bien = {
  id: string
  nom: string
  ville: string | null
  adresse: string | null
  type: string | null
  capacite: number | null
  chambres: number | null
  salles_de_bain: number | null
  capacite_max: number | null
  surface: number | null
  etage: string | null
  equipements: string[] | null
  regles: string[] | null
  distance_mer: string | null
  disponible: boolean
  prix_nuit: number | null
  description: string | null
  statut: 'actif' | 'en_attente' | 'inactif'
  photos: string[] | null
  airbnb_url: string | null
  booking_url: string | null
  avito_url: string | null
  created_at: string
}

const TYPE_OPTIONS = ['Appartement', 'Villa', 'Studio', 'Autre']
const STATUT_OPTIONS = ['actif', 'en_attente', 'inactif']
const STATUT_LABELS: Record<string, string> = { actif: 'Actif', en_attente: 'En attente', inactif: 'Inactif' }
const STATUT_COLORS: Record<string, string> = {
  actif: 'bg-green-100 text-green-700',
  en_attente: 'bg-orange-100 text-orange-700',
  inactif: 'bg-gray-100 text-gray-500',
}

const EMPTY: Partial<Bien> = {
  nom: '', ville: '', adresse: '', type: 'Appartement',
  capacite: null, prix_nuit: null, description: '', statut: 'actif', photos: [],
  airbnb_url: '', booking_url: '', avito_url: '',
  chambres: 1, salles_de_bain: 1, capacite_max: 2, surface: null,
  etage: '', equipements: [], regles: [], distance_mer: '', disponible: true,
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4 pb-8 bg-brun/50 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200"
      style={{
        fontFamily: 'var(--font-dm-sans)',
        backgroundColor: checked ? '#f0fdf4' : '#f9f9f7',
        borderColor: checked ? '#86efac' : 'rgba(44,26,14,0.12)',
        color: checked ? '#15803d' : '#6B4C35',
      }}
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className="text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{
          backgroundColor: checked ? '#22c55e' : 'rgba(44,26,14,0.1)',
          color: checked ? '#fff' : '#6B4C35',
        }}
      >
        {checked ? 'Oui ✓' : 'Non'}
      </span>
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-brun/10 pt-4">
      <p className="text-xs font-medium text-brun-mid uppercase tracking-wide mb-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>{title}</p>
      {children}
    </div>
  )
}

export default function BiensPage() {
  const supabase = createClient()
  const [biens, setBiens] = useState<Bien[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Bien>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function fetchBiens() {
    const { data } = await supabase.from('biens').select('*').order('created_at', { ascending: false })
    setBiens(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchBiens() }, [])

  function openAdd() { setEditing(EMPTY); setModalOpen(true) }
  function openEdit(b: Bien) { setEditing({ ...b }); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditing(EMPTY) }

  async function handleSave() {
    setSaving(true)
    const payload = { ...editing, updated_at: new Date().toISOString() }
    if (editing.id) {
      await supabase.from('biens').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('biens').insert(editing)
    }
    setSaving(false)
    closeModal()
    fetchBiens()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce bien ?')) return
    await supabase.from('biens').delete().eq('id', id)
    fetchBiens()
  }

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setUploadError(null)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      // Sanitize filename: remove accents, special chars, keep only safe chars
      const safeName = file.name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove accents
        .replace(/[^a-zA-Z0-9._-]/g, '_')                  // replace unsafe chars
        .toLowerCase()
      const path = `${Date.now()}-${safeName}`
      const { data, error } = await supabase.storage.from('biens-photos').upload(path, file)
      if (error) {
        console.error('Upload error:', error)
        setUploadError(`Erreur : ${error.message}`)
        break
      }
      if (data) {
        const { data: urlData } = supabase.storage.from('biens-photos').getPublicUrl(data.path)
        urls.push(urlData.publicUrl)
      }
    }
    if (urls.length > 0) {
      setEditing((prev) => ({ ...prev, photos: [...(prev.photos ?? []), ...urls] }))
    }
    setUploading(false)
  }

  function removePhoto(url: string) {
    setEditing((prev) => ({ ...prev, photos: (prev.photos ?? []).filter((p) => p !== url) }))
  }

  function setMainPhoto(url: string) {
    setEditing((prev) => {
      const rest = (prev.photos ?? []).filter((p) => p !== url)
      return { ...prev, photos: [url, ...rest] }
    })
  }

  function toggleEquipement(key: string) {
    setEditing((prev) => {
      const current = prev.equipements ?? []
      const updated = current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
      return { ...prev, equipements: updated }
    })
  }

  function toggleRegle(key: string) {
    setEditing((prev) => {
      const current = prev.regles ?? []
      const updated = current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
      return { ...prev, regles: updated }
    })
  }

  const inputClass = 'w-full border border-brun/20 rounded-xl px-3 py-2.5 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors'
  const labelClass = 'block text-xs font-medium text-brun-mid mb-1.5 uppercase tracking-wide'

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>Gestion des biens</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-5 py-2.5 hover:bg-brun transition-all">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          Ajouter un bien
        </button>
      </div>

      {/* ── MOBILE : cartes ── */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading ? (
          <p className="text-center py-10 text-brun-mid/50 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>Chargement…</p>
        ) : !biens.length ? (
          <p className="text-center py-10 text-brun-mid/50 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>Aucun bien. Cliquez sur "Ajouter".</p>
        ) : biens.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl border border-brun/10 p-4 flex gap-3">
            {/* Photo */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-brun/5 flex-shrink-0">
              {(b.photos ?? []).length > 0 ? (
                <Image src={b.photos![0]} alt={b.nom} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="text-brun/20" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              )}
            </div>
            {/* Infos */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-brun truncate text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>{b.nom}</p>
              <p className="text-xs text-brun-mid/60 mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>{b.ville ?? ''}{b.type ? ` · ${b.type}` : ''}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUT_COLORS[b.statut]}`}>
                  {STATUT_LABELS[b.statut]}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.disponible !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {b.disponible !== false ? 'Disponible' : 'Indisponible'}
                </span>
                {b.prix_nuit && (
                  <span className="text-xs text-brun-mid/60" style={{ fontFamily: 'var(--font-dm-sans)' }}>{b.prix_nuit} MAD/nuit</span>
                )}
              </div>
              {/* Actions */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-brun/8">
                <button
                  onClick={() => openEdit(b)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-terra/10 text-terra text-sm font-medium rounded-xl py-2 hover:bg-terra/20 transition-all"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
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
          </div>
        ))}
      </div>

      {/* ── DESKTOP : table ── */}
      <div className="hidden lg:block bg-white rounded-2xl border border-brun/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brun/4">
              <tr>
                {['', 'Nom', 'Ville', 'Type', 'Prix/nuit', 'Statut', 'Disponible', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-brun-mid uppercase tracking-wide font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brun/5">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-brun-mid/50">Chargement…</td></tr>
              ) : !biens.length ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-brun-mid/50">Aucun bien</td></tr>
              ) : biens.map((b) => (
                <tr key={b.id} className="hover:bg-creme/40 transition-colors">
                  <td className="px-3 py-2">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-brun/5 flex-shrink-0">
                      {(b.photos ?? []).length > 0 ? (
                        <Image src={b.photos![0]} alt={b.nom} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="text-brun/20" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-brun font-medium">{b.nom}</td>
                  <td className="px-4 py-3 text-brun-mid">{b.ville ?? '—'}</td>
                  <td className="px-4 py-3 text-brun-mid">{b.type ?? '—'}</td>
                  <td className="px-4 py-3 text-brun-mid">{b.prix_nuit ? `${b.prix_nuit} MAD` : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUT_COLORS[b.statut]}`}>
                      {STATUT_LABELS[b.statut]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${b.disponible !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.disponible !== false ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(b)} className="text-terra hover:text-brun text-xs font-medium underline underline-offset-2">Modifier</button>
                      <button onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-600 text-xs font-medium underline underline-offset-2">Supprimer</button>
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
            {editing.id ? 'Modifier le bien' : 'Nouveau bien'}
          </h2>
          <button onClick={closeModal} className="text-brun-mid hover:text-brun">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">

          {/* Informations de base */}
          <div>
            <label className={labelClass}>Nom *</label>
            <input className={inputClass} value={editing.nom ?? ''} onChange={(e) => setEditing((p) => ({ ...p, nom: e.target.value }))} placeholder="Ex : Appartement Corniche" />
          </div>

          <div>
            <label className={labelClass}>Adresse complète</label>
            <input className={inputClass} value={editing.adresse ?? ''} onChange={(e) => setEditing((p) => ({ ...p, adresse: e.target.value }))} placeholder="Ex : 12 Rue des Orangers, Mansouria" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ville</label>
              <input className={inputClass} value={editing.ville ?? ''} onChange={(e) => setEditing((p) => ({ ...p, ville: e.target.value }))} placeholder="Mohammedia" />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select className={inputClass} value={editing.type ?? 'Appartement'} onChange={(e) => setEditing((p) => ({ ...p, type: e.target.value }))}>
                {TYPE_OPTIONS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Caractéristiques */}
          <Section title="Caractéristiques">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Chambres</label>
                <input type="number" min={1} className={inputClass} value={editing.chambres ?? ''} onChange={(e) => setEditing((p) => ({ ...p, chambres: Number(e.target.value) || null }))} placeholder="1" />
              </div>
              <div>
                <label className={labelClass}>Salles de bain</label>
                <input type="number" min={1} className={inputClass} value={editing.salles_de_bain ?? ''} onChange={(e) => setEditing((p) => ({ ...p, salles_de_bain: Number(e.target.value) || null }))} placeholder="1" />
              </div>
              <div>
                <label className={labelClass}>Capacité max (pers.)</label>
                <input type="number" min={1} className={inputClass} value={editing.capacite_max ?? ''} onChange={(e) => setEditing((p) => ({ ...p, capacite_max: Number(e.target.value) || null }))} placeholder="4" />
              </div>
              <div>
                <label className={labelClass}>Surface (m²)</label>
                <input type="number" min={1} className={inputClass} value={editing.surface ?? ''} onChange={(e) => setEditing((p) => ({ ...p, surface: Number(e.target.value) || null }))} placeholder="65" />
              </div>
              <div>
                <label className={labelClass}>Étage / Situation</label>
                <input className={inputClass} value={editing.etage ?? ''} onChange={(e) => setEditing((p) => ({ ...p, etage: e.target.value }))} placeholder="Ex : 2ème étage, vue mer" />
              </div>
              <div>
                <label className={labelClass}>Distance mer</label>
                <input className={inputClass} value={editing.distance_mer ?? ''} onChange={(e) => setEditing((p) => ({ ...p, distance_mer: e.target.value }))} placeholder="Ex : 50m, 5 min à pied" />
              </div>
            </div>
          </Section>

          {/* Prix + Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prix / nuit (MAD)</label>
              <input type="number" min={0} className={inputClass} value={editing.prix_nuit ?? ''} onChange={(e) => setEditing((p) => ({ ...p, prix_nuit: Number(e.target.value) || null }))} placeholder="350" />
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <select className={inputClass} value={editing.statut ?? 'actif'} onChange={(e) => setEditing((p) => ({ ...p, statut: e.target.value as any }))}>
                {STATUT_OPTIONS.map((s) => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          <Toggle
            checked={editing.disponible !== false}
            onChange={(v) => setEditing((p) => ({ ...p, disponible: v }))}
            label="Bien disponible à la location"
          />

          <div>
            <label className={labelClass}>Description</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={editing.description ?? ''} onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))} placeholder="Description du bien..." />
          </div>

          {/* Équipements */}
          <Section title="Équipements">
            <div className="grid grid-cols-2 gap-2">
              {EQUIPEMENTS.map((eq) => {
                const checked = (editing.equipements ?? []).includes(eq.key)
                return (
                  <label key={eq.key} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEquipement(eq.key)}
                      className="w-4 h-4 rounded border-brun/30 text-terra focus:ring-terra accent-terra"
                    />
                    <span className="text-sm text-brun-mid group-hover:text-brun transition-colors" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {eq.label.fr}
                    </span>
                  </label>
                )
              })}
            </div>
          </Section>

          {/* Règles */}
          <Section title="Règles de la maison">
            <div className="grid grid-cols-2 gap-2">
              {REGLES_OPTIONS.map((rule) => {
                const checked = (editing.regles ?? []).includes(rule.key)
                return (
                  <label key={rule.key} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRegle(rule.key)}
                      className="w-4 h-4 rounded border-brun/30 accent-terra"
                    />
                    <span className="text-sm text-brun-mid group-hover:text-brun transition-colors" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {rule.label.fr}
                    </span>
                  </label>
                )
              })}
            </div>
          </Section>

          {/* Platform URLs */}
          <Section title="Liens de réservation (optionnel)">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white bg-[#FF5A5F] rounded-full px-2.5 py-1 w-20 text-center flex-shrink-0" style={{ fontFamily: 'var(--font-dm-sans)' }}>Airbnb</span>
                <input className={inputClass} value={editing.airbnb_url ?? ''} onChange={(e) => setEditing((p) => ({ ...p, airbnb_url: e.target.value || null }))} placeholder="https://airbnb.com/rooms/..." />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white bg-[#003580] rounded-full px-2.5 py-1 w-20 text-center flex-shrink-0" style={{ fontFamily: 'var(--font-dm-sans)' }}>Booking</span>
                <input className={inputClass} value={editing.booking_url ?? ''} onChange={(e) => setEditing((p) => ({ ...p, booking_url: e.target.value || null }))} placeholder="https://booking.com/hotel/..." />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white bg-[#E07A2F] rounded-full px-2.5 py-1 w-20 text-center flex-shrink-0" style={{ fontFamily: 'var(--font-dm-sans)' }}>Avito</span>
                <input className={inputClass} value={editing.avito_url ?? ''} onChange={(e) => setEditing((p) => ({ ...p, avito_url: e.target.value || null }))} placeholder="https://avito.ma/annonce/..." />
              </div>
            </div>
          </Section>

          {/* Photos */}
          <div>
            <label className={labelClass}>Photos</label>
            <div
              className="border-2 border-dashed border-brun/20 rounded-xl p-6 text-center cursor-pointer hover:border-terra transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files) }}
            >
              {uploading ? (
                <p className="text-terra text-sm">Upload en cours…</p>
              ) : (
                <>
                  <svg className="mx-auto mb-2 text-brun-mid/40" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  <p className="text-sm text-brun-mid">Glissez des photos ou <span className="text-terra underline">cliquez</span></p>
                </>
              )}
              {uploadError && (
                <p className="mt-2 text-xs text-red-500 font-medium">{uploadError}</p>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
            </div>

            {(editing.photos ?? []).length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {(editing.photos ?? []).map((url, i) => (
                  <div key={url} className={`flex items-center gap-3 p-2 rounded-xl border ${i === 0 ? 'border-terra/40 bg-terra/5' : 'border-brun/10 bg-white'}`}>
                    {/* Miniature */}
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={url} alt="" fill className="object-cover" />
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      {i === 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-terra" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          ★ Photo principale (à la une)
                        </span>
                      ) : (
                        <span className="text-xs text-brun-mid/60" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          Photo {i + 1}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {i !== 0 && (
                        <button
                          onClick={() => setMainPhoto(url)}
                          className="text-xs font-medium text-terra border border-terra/30 rounded-lg px-2.5 py-1.5 hover:bg-terra hover:text-white transition-all"
                          style={{ fontFamily: 'var(--font-dm-sans)' }}
                        >
                          ★ Principale
                        </button>
                      )}
                      <button
                        onClick={() => removePhoto(url)}
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center transition-all"
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-brun/10 flex justify-end gap-3">
          <button onClick={closeModal} className="border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-6 py-2.5 hover:bg-brun/5 transition-all">Annuler</button>
          <button onClick={handleSave} disabled={saving || !editing.nom} className="bg-terra text-creme text-sm font-medium rounded-full px-6 py-2.5 hover:bg-brun transition-all disabled:opacity-50">
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
