'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { generateLocationSlug } from '@/lib/slugify'
import { EQUIPEMENTS, REGLES_OPTIONS } from '@/lib/equipements'

type Visite = {
  id: string
  bien_id: string
  source: string | null
  utm_source: string | null
  appareil: string | null
  created_at: string
}

type Bien = {
  id: string
  nom: string
  ville: string | null
  adresse: string | null
  latitude: number | null
  longitude: number | null
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
  video_url: string | null
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
  nom: '', ville: '', adresse: '', latitude: null, longitude: null, type: 'Appartement',
  capacite: null, prix_nuit: null, description: '', statut: 'actif', photos: [],
  airbnb_url: '', booking_url: '', avito_url: '', video_url: null,
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
  const [visites, setVisites] = useState<Visite[]>([])
  const [loading, setLoading] = useState(true)
  const [statsOpen, setStatsOpen] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Bien>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [generatingSlugs, setGeneratingSlugs] = useState(false)
  const [slugsResult, setSlugsResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function fetchBiens() {
    const [{ data: biensData }, { data: visitesData }] = await Promise.all([
      supabase.from('biens').select('*').order('created_at', { ascending: false }),
      supabase.from('biens_visites').select('*').order('created_at', { ascending: false }),
    ])
    setBiens(biensData ?? [])
    setVisites(visitesData ?? [])
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
      const slug = (editing as any).slug || generateLocationSlug(editing.nom ?? '', editing.ville ?? null, editing.id)
      await supabase.from('biens').update({ ...payload, slug }).eq('id', editing.id)
    } else {
      const { data: inserted } = await supabase.from('biens').insert(editing).select('id, nom, ville').single()
      if (inserted) {
        const slug = generateLocationSlug(inserted.nom, inserted.ville, inserted.id)
        await supabase.from('biens').update({ slug }).eq('id', inserted.id)
      }
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

  async function handleGenerateSlugs() {
    setGeneratingSlugs(true)
    setSlugsResult(null)
    const { data } = await supabase.from('biens').select('id, nom, ville').is('slug', null)
    if (!data || data.length === 0) {
      setSlugsResult('Tous les biens ont déjà un slug.')
      setGeneratingSlugs(false)
      return
    }
    let count = 0
    for (const b of data) {
      const slug = generateLocationSlug(b.nom, b.ville, b.id)
      const { error } = await supabase.from('biens').update({ slug }).eq('id', b.id)
      if (!error) count++
    }
    setSlugsResult(`${count} slug(s) générés sur ${data.length} bien(s) sans slug.`)
    setGeneratingSlugs(false)
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

  const visitesParBien = (bienId: string) => visites.filter((v) => v.bien_id === bienId)

  const totalVisites = visites.length
  const bienPlusConsulte = biens.reduce<Bien | null>((best, b) => {
    const count = visitesParBien(b.id).length
    const bestCount = best ? visitesParBien(best.id).length : -1
    return count > bestCount ? b : best
  }, null)

  function getStatsBien(bienId: string) {
    const v = visitesParBien(bienId)
    const parSource: Record<string, number> = {}
    const parAppareil: Record<string, number> = {}
    const parJour: Record<string, number> = {}
    v.forEach((vi) => {
      const src = vi.source ?? 'direct'
      parSource[src] = (parSource[src] ?? 0) + 1
      const app = vi.appareil ?? 'desktop'
      parAppareil[app] = (parAppareil[app] ?? 0) + 1
      const jour = vi.created_at.slice(0, 10)
      parJour[jour] = (parJour[jour] ?? 0) + 1
    })
    const days7: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      days7.push({ date: key, count: parJour[key] ?? 0 })
    }
    return { total: v.length, parSource, parAppareil, days7 }
  }

  const inputClass = 'w-full border border-brun/20 rounded-xl px-3 py-2.5 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors'
  const labelClass = 'block text-xs font-medium text-brun-mid mb-1.5 uppercase tracking-wide'

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>Gestion des biens</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerateSlugs}
            disabled={generatingSlugs}
            className="flex items-center gap-2 border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-4 py-2.5 hover:border-terra hover:text-terra transition-all disabled:opacity-50"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
            title="Génère les URLs SEO pour tous les biens qui n'en ont pas encore"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            {generatingSlugs ? 'Génération…' : 'Générer les slugs SEO'}
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-5 py-2.5 hover:bg-brun transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Ajouter un bien
          </button>
        </div>
      </div>
      {slugsResult && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {slugsResult}
        </div>
      )}

      {/* Stats globales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Biens actifs', value: biens.filter((b) => b.statut === 'actif').length, icon: '🏠' },
          { label: 'Total vues', value: totalVisites, icon: '👁' },
          { label: 'Plus consulté', value: bienPlusConsulte && visitesParBien(bienPlusConsulte.id).length > 0 ? `${visitesParBien(bienPlusConsulte.id).length} vues` : '—', icon: '⭐', sub: bienPlusConsulte && visitesParBien(bienPlusConsulte.id).length > 0 ? bienPlusConsulte.nom : undefined },
        ].map(({ label, value, icon, sub }) => (
          <div key={label} className="bg-white border border-brun/10 rounded-2xl p-5">
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-2xl font-semibold text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>{value}</p>
            {sub && <p className="text-xs text-brun-mid/50 truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{sub}</p>}
            <p className="text-xs text-brun-mid/40 mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
          </div>
        ))}
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
                <span className="text-xs text-terra" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {visitesParBien(b.id).length} vues
                </span>
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
                {['', 'Nom', 'Ville', 'Type', 'Prix/nuit', 'Statut', 'Vues', 'Actions'].map((h) => (
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
                <>
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
                      <button
                        onClick={() => setStatsOpen(statsOpen === b.id ? null : b.id)}
                        className="flex items-center gap-1 text-terra hover:underline"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        {visitesParBien(b.id).length}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(b)} className="text-terra hover:text-brun text-xs font-medium underline underline-offset-2">Modifier</button>
                        <button onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-600 text-xs font-medium underline underline-offset-2">Supprimer</button>
                      </div>
                    </td>
                  </tr>
                  {statsOpen === b.id && (() => {
                    const stats = getStatsBien(b.id)
                    return (
                      <tr key={`stats-${b.id}`}>
                        <td colSpan={8} className="px-6 pb-4 pt-2 bg-creme/60">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs font-medium text-brun-mid/50 uppercase tracking-wide mb-2">7 derniers jours</p>
                              <div className="flex items-end gap-1 h-12">
                                {stats.days7.map(({ date, count }) => {
                                  const max = Math.max(...stats.days7.map((d) => d.count), 1)
                                  return (
                                    <div key={date} className="flex-1 flex flex-col items-center gap-0.5" title={`${date}: ${count}`}>
                                      <div className="w-full rounded-t" style={{ height: `${(count / max) * 40}px`, minHeight: count > 0 ? '4px' : '2px', backgroundColor: count > 0 ? '#C97B4B' : '#E8DDD4' }} />
                                      <span className="text-[9px] text-brun-mid/30">{date.slice(8)}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-brun-mid/50 uppercase tracking-wide mb-2">Sources</p>
                              <div className="flex flex-col gap-1">
                                {Object.entries(stats.parSource).slice(0, 4).map(([src, count]) => (
                                  <div key={src} className="flex items-center justify-between">
                                    <span className="text-xs text-brun-mid/70 truncate max-w-[120px]">{src}</span>
                                    <span className="text-xs font-medium text-brun">{count}</span>
                                  </div>
                                ))}
                                {Object.keys(stats.parSource).length === 0 && <p className="text-xs text-brun-mid/30">Aucune donnée</p>}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-brun-mid/50 uppercase tracking-wide mb-2">Appareils</p>
                              <div className="flex flex-col gap-1">
                                {(['mobile', 'desktop', 'tablet'] as const).map((app) => {
                                  const count = stats.parAppareil[app] ?? 0
                                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                                  return (
                                    <div key={app} className="flex items-center gap-2">
                                      <span className="text-xs text-brun-mid/50 w-14 capitalize">{app}</span>
                                      <div className="flex-1 h-1.5 bg-brun/10 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#C97B4B' }} />
                                      </div>
                                      <span className="text-xs text-brun w-7 text-right">{pct}%</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })()}
                </>
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
            <input className={inputClass} value={editing.adresse ?? ''} onChange={(e) => setEditing((p) => ({ ...p, adresse: e.target.value }))} placeholder="Ex : 12 Rue des Orangers, Mohammedia" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Latitude (GPS)</label>
              <input type="number" step="any" className={inputClass} value={editing.latitude ?? ''} onChange={(e) => setEditing((p) => ({ ...p, latitude: e.target.value ? Number(e.target.value) : null }))} placeholder="33.68…" />
            </div>
            <div>
              <label className={labelClass}>Longitude (GPS)</label>
              <input type="number" step="any" className={inputClass} value={editing.longitude ?? ''} onChange={(e) => setEditing((p) => ({ ...p, longitude: e.target.value ? Number(e.target.value) : null }))} placeholder="-7.38…" />
            </div>
          </div>
          <p className="text-xs text-brun-mid/40" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            💡 Clic droit sur Google Maps → &quot;C&apos;est ici&quot; pour obtenir les coordonnées
          </p>

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

          {/* Vidéo */}
          <Section title="Vidéo (optionnel)">
            <div>
              <label className={labelClass}>Lien Google Drive</label>
              <input
                className={inputClass}
                value={editing.video_url ?? ''}
                onChange={(e) => setEditing((p) => ({ ...p, video_url: e.target.value || null }))}
                placeholder="https://drive.google.com/file/d/..."
              />
              <p className="text-xs text-brun-mid/40 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Collez le lien de partage Google Drive de la vidéo du bien
              </p>
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
