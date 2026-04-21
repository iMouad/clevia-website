'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import AdminSelect from '@/components/admin/AdminSelect'
import { getEquipementsForCategorie } from '@/lib/equipements-vente'
import { generateVenteSlug } from '@/lib/slugify'

type Categorie = 'Appartement' | 'Studio' | 'Villa' | 'Terrain' | 'Ferme' | 'Commercial'
type Statut = 'a_vendre' | 'sous_compromis' | 'vendu'

type BienVente = {
  id: string
  titre: string
  categorie: Categorie
  statut: Statut
  prix: number | null
  surface: number | null
  chambres: number | null
  salles_de_bain: number | null
  etage: number | null
  ville: string
  adresse: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
  equipements: string[]
  photos: string[]
  telephone: string
  reference: string | null
  video_url: string | null
  sous_type: string | null
  created_at: string
}

type Visite = {
  id: string
  bien_id: string
  source: string | null
  utm_source: string | null
  appareil: string | null
  created_at: string
}

const CATEGORIES: Categorie[] = ['Appartement', 'Studio', 'Villa', 'Terrain', 'Ferme', 'Commercial']
const STATUTS: { value: Statut; label: string; color: string; bg: string }[] = [
  { value: 'a_vendre',       label: 'À vendre',        color: '#15803D', bg: '#DCFCE7' },
  { value: 'sous_compromis', label: 'Sous compromis',  color: '#D97706', bg: '#FEF3C7' },
  { value: 'vendu',          label: 'Vendu',           color: '#6B7280', bg: '#F3F4F6' },
]

const EMPTY: Omit<BienVente, 'id' | 'created_at'> = {
  titre: '', categorie: 'Appartement', statut: 'a_vendre', prix: null,
  surface: null, chambres: null, salles_de_bain: null, etage: null,
  ville: '', adresse: null, latitude: null, longitude: null,
  description: null, equipements: [], photos: [], telephone: '', reference: null, video_url: null, sous_type: null,
}

const SITE_URL = 'https://www.cleviamaroc.com'

export default function AdminVentePage() {
  const supabase = createClient()

  const [biens, setBiens] = useState<BienVente[]>([])
  const [visites, setVisites] = useState<Visite[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<BienVente | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [prixSurDemande, setPrixSurDemande] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [statsOpen, setStatsOpen] = useState<string | null>(null)
  const [periode, setPeriode] = useState<'7j' | '30j' | 'tout'>('tout')
  const [generatingSlugs, setGeneratingSlugs] = useState(false)
  const [slugsResult, setSlugsResult] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: biensData }, { data: visitesData }] = await Promise.all([
      supabase.from('biens_vente').select('*').order('created_at', { ascending: false }),
      supabase.from('vente_visites').select('*').order('created_at', { ascending: false }),
    ])
    setBiens(biensData ?? [])
    setVisites(visitesData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function openNew() {
    setEditing(null)
    setForm({ ...EMPTY })
    setPrixSurDemande(false)
    setUploadError(null)
    setShowModal(true)
  }

  function openEdit(b: BienVente) {
    setEditing(b)
    setForm({
      titre: b.titre, categorie: b.categorie, statut: b.statut,
      prix: b.prix, surface: b.surface, chambres: b.chambres,
      salles_de_bain: b.salles_de_bain, etage: b.etage, ville: b.ville,
      adresse: b.adresse, latitude: b.latitude, longitude: b.longitude,
      description: b.description, equipements: b.equipements ?? [],
      photos: b.photos ?? [], telephone: b.telephone, reference: b.reference,
      video_url: b.video_url, sous_type: b.sous_type ?? null,
    })
    setPrixSurDemande(b.prix === null)
    setUploadError(null)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.titre || !form.ville || !form.telephone) return
    setSaving(true)

    const payload = {
      ...form,
      prix: prixSurDemande ? null : form.prix,
      updated_at: new Date().toISOString(),
    }

    if (editing) {
      // Generate slug if missing
      const slug = (editing as any).slug || generateVenteSlug(form.titre, form.ville, form.reference, editing.id)
      await supabase.from('biens_vente').update({ ...payload, slug }).eq('id', editing.id)
    } else {
      // Insert first, then update with slug using returned ID
      const { data: inserted } = await supabase.from('biens_vente').insert(payload).select('id').single()
      if (inserted) {
        const slug = generateVenteSlug(form.titre, form.ville, form.reference, inserted.id)
        await supabase.from('biens_vente').update({ slug }).eq('id', inserted.id)
      }
    }

    setSaving(false)
    setShowModal(false)
    fetchData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce bien ? Cette action est irréversible.')) return
    await supabase.from('biens_vente').delete().eq('id', id)
    fetchData()
  }

  async function handleGenerateSlugs() {
    setGeneratingSlugs(true)
    setSlugsResult(null)
    const { data } = await supabase.from('biens_vente').select('id, titre, ville, reference').is('slug', null)
    if (!data || data.length === 0) {
      setSlugsResult('Tous les biens à vendre ont déjà un slug.')
      setGeneratingSlugs(false)
      return
    }
    let count = 0
    for (const b of data) {
      const slug = generateVenteSlug(b.titre, b.ville, b.reference, b.id)
      const { error } = await supabase.from('biens_vente').update({ slug }).eq('id', b.id)
      if (!error) count++
    }
    setSlugsResult(`${count} slug(s) générés sur ${data.length} bien(s) sans slug.`)
    setGeneratingSlugs(false)
    fetchData()
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    setUploadError(null)

    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      const safeName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
      const path = `${Date.now()}-${safeName}`
      const { data, error } = await supabase.storage.from('vente-photos').upload(path, file)
      if (error || !data) { setUploadError(`Erreur upload : ${error?.message}`); break }
      const { data: { publicUrl } } = supabase.storage.from('vente-photos').getPublicUrl(data.path)
      uploaded.push(publicUrl)
    }

    if (uploaded.length) setForm((f) => ({ ...f, photos: [...f.photos, ...uploaded] }))
    setUploading(false)
    e.target.value = ''
  }

  function removePhoto(url: string) {
    setForm((f) => ({ ...f, photos: f.photos.filter((p) => p !== url) }))
  }

  function setMainPhoto(url: string) {
    setForm((f) => ({ ...f, photos: [url, ...f.photos.filter((p) => p !== url)] }))
  }

  function toggleEquipement(key: string) {
    setForm((f) => ({
      ...f,
      equipements: f.equipements.includes(key)
        ? f.equipements.filter((k) => k !== key)
        : [...f.equipements, key],
    }))
  }

  const visitesFiltered = (() => {
    if (periode === 'tout') return visites
    const days = periode === '7j' ? 7 : 30
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days)
    return visites.filter((v) => new Date(v.created_at) >= cutoff)
  })()

  const visitesParBien = (bienId: string) => visitesFiltered.filter((v) => v.bien_id === bienId)

  // Stats globales
  const totalVisites = visitesFiltered.length
  const biensActifs = biens.filter((b) => b.statut === 'a_vendre').length
  const biensVendus = biens.filter((b) => b.statut === 'vendu').length
  const bienPlusConsulte = biens.reduce<BienVente | null>((best, b) => {
    const count = visitesParBien(b.id).length
    const bestCount = best ? visitesParBien(best.id).length : -1
    return count > bestCount ? b : best
  }, null)

  // Stats détail par bien
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

    // 7 derniers jours
    const days7: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      days7.push({ date: key, count: parJour[key] ?? 0 })
    }

    return { total: v.length, parSource, parAppareil, days7 }
  }

  const inputClass = 'w-full border border-brun/20 rounded-xl px-4 py-2.5 text-sm text-brun focus:outline-none focus:border-terra bg-white'
  const labelClass = 'block text-xs font-medium text-brun-mid uppercase tracking-wide mb-1.5'
  const equipements = getEquipementsForCategorie(form.categorie)

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
          Biens à vendre
        </h1>
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
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-5 py-2.5 hover:bg-brun transition-all"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
            Ajouter un bien
          </button>
        </div>
      </div>
      {slugsResult && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {slugsResult}
        </div>
      )}

      {/* Filtre période */}
      <div className="flex gap-2 mb-4">
        {(['7j', '30j', 'tout'] as const).map((p) => (
          <button key={p} onClick={() => setPeriode(p)}
            className={`text-sm font-medium rounded-full px-4 py-1.5 transition-all ${periode === p ? 'bg-terra text-creme' : 'border border-brun/20 text-brun-mid hover:border-terra hover:text-terra'}`}
            style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {p === 'tout' ? 'Tout' : p === '7j' ? '7 jours' : '30 jours'}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Biens actifs', value: biensActifs, icon: '🏠' },
          { label: 'Total visites', value: totalVisites, icon: '👁' },
          { label: 'Plus consulté', value: bienPlusConsulte ? `${visitesParBien(bienPlusConsulte.id).length} vues` : '—', icon: '⭐', sub: bienPlusConsulte?.titre },
          { label: 'Biens vendus', value: biensVendus, icon: '✅' },
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
        ) : biens.length === 0 ? (
          <p className="text-center py-10 text-brun-mid/50 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>Aucun bien. Cliquez sur "Ajouter".</p>
        ) : biens.map((b) => {
          const statutDef = STATUTS.find((s) => s.value === b.statut)
          const nbVisites = visitesParBien(b.id).length
          return (
            <div key={b.id} className="bg-white rounded-2xl border border-brun/10 p-4 flex gap-3">
              {/* Photo */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-brun/5 flex-shrink-0">
                {b.photos[0] ? (
                  <Image src={b.photos[0]} alt={b.titre} fill className="object-cover" />
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
                <p className="font-medium text-brun truncate text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>{b.titre}</p>
                <p className="text-xs text-brun-mid/60 mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>{b.ville}{b.categorie ? ` · ${b.categorie}` : ''}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ backgroundColor: statutDef?.bg, color: statutDef?.color }}>
                    {statutDef?.label}
                  </span>
                  <span className="text-xs text-brun-mid/60" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {b.prix ? `${Number(b.prix).toLocaleString('fr-MA')} MAD` : 'Prix sur demande'}
                  </span>
                  <span className="text-xs text-terra" style={{ fontFamily: 'var(--font-dm-sans)' }}>{nbVisites} vues</span>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-brun/8">
                  <a
                    href={`${SITE_URL}/fr/vente/${b.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-brun/5 text-brun-mid text-sm font-medium rounded-xl py-2 hover:bg-brun/10 transition-all"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                    Voir
                  </a>
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
          )
        })}
      </div>

      {/* ── DESKTOP : table ── */}
      {loading ? (
        <div className="hidden lg:block text-center py-16 text-brun-mid/40" style={{ fontFamily: 'var(--font-dm-sans)' }}>Chargement…</div>
      ) : biens.length === 0 ? (
        <div className="hidden lg:block text-center py-16 text-brun-mid/40" style={{ fontFamily: 'var(--font-dm-sans)' }}>Aucun bien. Cliquez sur "Ajouter".</div>
      ) : (
        <div className="hidden lg:block bg-white border border-brun/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            <thead>
              <tr className="border-b border-brun/8">
                {['Photo', 'Titre / Réf.', 'Catégorie', 'Statut', 'Prix', 'Ville', 'Visites', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-brun-mid/50 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {biens.map((b) => {
                const statutDef = STATUTS.find((s) => s.value === b.statut)
                const nbVisites = visitesParBien(b.id).length
                return (
                  <>
                    <tr key={b.id} className="border-b border-brun/5 hover:bg-creme/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-12 h-10 rounded-lg overflow-hidden bg-brun/5 flex-shrink-0">
                          {b.photos[0] ? (
                            <Image src={b.photos[0]} alt={b.titre} width={48} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="text-brun/20" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-brun truncate max-w-[160px]">{b.titre}</p>
                        {b.reference && <p className="text-xs text-brun-mid/40">Réf. {b.reference}</p>}
                      </td>
                      <td className="px-4 py-3 text-brun-mid/70">{b.categorie}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium rounded-full px-2.5 py-1" style={{ backgroundColor: statutDef?.bg, color: statutDef?.color }}>
                          {statutDef?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-brun-mid/70">
                        {b.prix ? `${Number(b.prix).toLocaleString('fr-MA')} MAD` : <span className="italic text-brun-mid/40">Sur demande</span>}
                      </td>
                      <td className="px-4 py-3 text-brun-mid/70">{b.ville}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setStatsOpen(statsOpen === b.id ? null : b.id)}
                          className="flex items-center gap-1 text-terra hover:underline"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                          {nbVisites}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={`${SITE_URL}/fr/vente/${b.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brun-mid/50 hover:text-terra transition-colors"
                            title="Voir la page"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                            </svg>
                          </a>
                          <button onClick={() => openEdit(b)} className="text-brun-mid/50 hover:text-terra transition-colors" title="Modifier">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(b.id)} className="text-brun-mid/50 hover:text-red-500 transition-colors" title="Supprimer">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Panel stats inline */}
                    {statsOpen === b.id && (() => {
                      const stats = getStatsBien(b.id)
                      return (
                        <tr key={`stats-${b.id}`}>
                          <td colSpan={8} className="px-6 pb-4 pt-2 bg-creme/60">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {/* Visites 7 jours */}
                              <div>
                                <p className="text-xs font-medium text-brun-mid/50 uppercase tracking-wide mb-2">7 derniers jours</p>
                                <div className="flex items-end gap-1 h-12">
                                  {stats.days7.map(({ date, count }) => {
                                    const max = Math.max(...stats.days7.map((d) => d.count), 1)
                                    return (
                                      <div key={date} className="flex-1 flex flex-col items-center gap-0.5" title={`${date}: ${count}`}>
                                        <div
                                          className="w-full rounded-t"
                                          style={{ height: `${(count / max) * 40}px`, minHeight: count > 0 ? '4px' : '2px', backgroundColor: count > 0 ? '#C97B4B' : '#E8DDD4' }}
                                        />
                                        <span className="text-[9px] text-brun-mid/30">{date.slice(8)}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* Par source */}
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

                              {/* Par appareil */}
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
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-brun/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brun/8">
              <h2 className="text-xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                {editing ? 'Modifier le bien' : 'Ajouter un bien'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-brun-mid/40 hover:text-brun transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-6 py-6 overflow-y-auto max-h-[80vh] flex flex-col gap-6">

              {/* 1. Informations générales */}
              <section>
                <h3 className="text-sm font-semibold text-brun-mid uppercase tracking-wide mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  Informations générales
                </h3>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Titre *</label>
                    <input className={inputClass} style={{ fontFamily: 'var(--font-dm-sans)' }} value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))} placeholder="Ex: Appartement moderne vue mer" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Référence</label>
                      <input className={inputClass} style={{ fontFamily: 'var(--font-dm-sans)' }} value={form.reference ?? ''} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value || null }))} placeholder="CLV-V-001" />
                    </div>
                    <div>
                      <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Catégorie *</label>
                      <AdminSelect value={form.categorie} onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value as Categorie, equipements: [], sous_type: null }))}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </AdminSelect>
                    </div>
                  </div>
                  {form.categorie === 'Terrain' && (
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Type de terrain</label>
                        <AdminSelect
                          value={['Lot villa', 'Lot ferme', 'Lot habitation'].includes(form.sous_type ?? '') ? 'Lotissement' : (form.sous_type ?? '')}
                          onChange={(e) => {
                            const val = e.target.value
                            setForm((f) => ({ ...f, sous_type: val === 'Lotissement' ? 'Lot villa' : val === '' ? null : val }))
                          }}
                        >
                          <option value="">-- Sélectionner --</option>
                          <option value="Terrain agricole">Terrain agricole</option>
                          <option value="Lotissement">Lotissement</option>
                        </AdminSelect>
                      </div>
                      {['Lot villa', 'Lot ferme', 'Lot habitation'].includes(form.sous_type ?? '') && (
                        <div>
                          <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Type de lot</label>
                          <AdminSelect
                            value={form.sous_type ?? ''}
                            onChange={(e) => setForm((f) => ({ ...f, sous_type: e.target.value }))}
                          >
                            <option value="Lot villa">Lot villa</option>
                            <option value="Lot ferme">Lot ferme</option>
                            <option value="Lot habitation">Lot habitation</option>
                          </AdminSelect>
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Statut *</label>
                    <div className="flex gap-2">
                      {STATUTS.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, statut: s.value }))}
                          className="flex-1 text-sm rounded-xl px-3 py-2 font-medium transition-all"
                          style={{
                            backgroundColor: form.statut === s.value ? s.bg : '#F9F6F2',
                            color: form.statut === s.value ? s.color : '#6B4C35',
                            border: `1.5px solid ${form.statut === s.value ? s.color + '40' : 'transparent'}`,
                            fontFamily: 'var(--font-dm-sans)',
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. Prix */}
              <section>
                <h3 className="text-sm font-semibold text-brun-mid uppercase tracking-wide mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>Prix</h3>
                <div className="flex items-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setPrixSurDemande((v) => !v)}
                    className="flex items-center gap-2 text-sm rounded-xl px-4 py-2 transition-all"
                    style={{
                      backgroundColor: prixSurDemande ? '#FEF3C7' : '#F9F6F2',
                      color: prixSurDemande ? '#D97706' : '#6B4C35',
                      border: `1.5px solid ${prixSurDemande ? '#D97706' + '40' : 'transparent'}`,
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  >
                    <span>{prixSurDemande ? '✓' : '○'}</span> Prix sur demande
                  </button>
                </div>
                {!prixSurDemande && (
                  <div>
                    <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Prix (MAD)</label>
                    <input type="number" className={inputClass} style={{ fontFamily: 'var(--font-dm-sans)' }} value={form.prix ?? ''} onChange={(e) => setForm((f) => ({ ...f, prix: e.target.value ? Number(e.target.value) : null }))} placeholder="Ex: 1250000" />
                  </div>
                )}
              </section>

              {/* 3. Caractéristiques */}
              <section>
                <h3 className="text-sm font-semibold text-brun-mid uppercase tracking-wide mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>Caractéristiques</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Surface ({form.categorie === 'Terrain' ? 'ha' : 'm²'})</label>
                    <input type="number" className={inputClass} style={{ fontFamily: 'var(--font-dm-sans)' }} value={form.surface ?? ''} onChange={(e) => setForm((f) => ({ ...f, surface: e.target.value ? Number(e.target.value) : null }))} placeholder={form.categorie === 'Terrain' ? 'Ex: 2.5' : 'Ex: 120'} />
                  </div>
                  {!['Terrain', 'Commercial'].includes(form.categorie) && (
                    <>
                      <div>
                        <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Chambres</label>
                        <input type="number" className={inputClass} style={{ fontFamily: 'var(--font-dm-sans)' }} value={form.chambres ?? ''} onChange={(e) => setForm((f) => ({ ...f, chambres: e.target.value ? Number(e.target.value) : null }))} />
                      </div>
                      <div>
                        <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Salles de bain</label>
                        <input type="number" className={inputClass} style={{ fontFamily: 'var(--font-dm-sans)' }} value={form.salles_de_bain ?? ''} onChange={(e) => setForm((f) => ({ ...f, salles_de_bain: e.target.value ? Number(e.target.value) : null }))} />
                      </div>
                    </>
                  )}
                  {!['Terrain', 'Ferme'].includes(form.categorie) && (
                    <div>
                      <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Étage</label>
                      <input type="number" className={inputClass} style={{ fontFamily: 'var(--font-dm-sans)' }} value={form.etage ?? ''} onChange={(e) => setForm((f) => ({ ...f, etage: e.target.value ? Number(e.target.value) : null }))} />
                    </div>
                  )}
                </div>
              </section>

              {/* 4. Localisation */}
              <section>
                <h3 className="text-sm font-semibold text-brun-mid uppercase tracking-wide mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>Localisation</h3>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Ville *</label>
                      <input className={inputClass} style={{ fontFamily: 'var(--font-dm-sans)' }} value={form.ville} onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))} placeholder="Mohammedia" />
                    </div>
                    <div>
                      <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Adresse</label>
                      <input className={inputClass} style={{ fontFamily: 'var(--font-dm-sans)' }} value={form.adresse ?? ''} onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value || null }))} placeholder="Rue, quartier…" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Latitude (GPS)</label>
                      <input type="number" step="any" className={inputClass} style={{ fontFamily: 'var(--font-dm-sans)' }} value={form.latitude ?? ''} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value ? Number(e.target.value) : null }))} placeholder="33.68…" />
                    </div>
                    <div>
                      <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Longitude (GPS)</label>
                      <input type="number" step="any" className={inputClass} style={{ fontFamily: 'var(--font-dm-sans)' }} value={form.longitude ?? ''} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value ? Number(e.target.value) : null }))} placeholder="-7.38…" />
                    </div>
                  </div>
                  <p className="text-xs text-brun-mid/40" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    💡 Pour trouver les coordonnées GPS : clic droit sur Google Maps → &quot;C&apos;est ici&quot;
                  </p>
                </div>
              </section>

              {/* 5. Contact */}
              <section>
                <h3 className="text-sm font-semibold text-brun-mid uppercase tracking-wide mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>Contact</h3>
                <div>
                  <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Numéro de téléphone *</label>
                  <input className={inputClass} style={{ fontFamily: 'var(--font-dm-sans)' }} value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} placeholder="+212 6XX XXX XXX" />
                </div>
              </section>

              {/* 6. Description */}
              <section>
                <h3 className="text-sm font-semibold text-brun-mid uppercase tracking-wide mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>Description</h3>
                <textarea
                  className={`${inputClass} resize-none`}
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                  rows={4}
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))}
                  placeholder="Décrivez le bien, son environnement, ses atouts…"
                />
              </section>

              {/* 7. Équipements / Caractéristiques */}
              <section>
                <h3 className="text-sm font-semibold text-brun-mid uppercase tracking-wide mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  Caractéristiques — {form.categorie}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {equipements.map((eq) => (
                    <label
                      key={eq.key}
                      className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2 transition-colors"
                      style={{ backgroundColor: form.equipements.includes(eq.key) ? '#FEF3E8' : 'transparent' }}
                    >
                      <input
                        type="checkbox"
                        checked={form.equipements.includes(eq.key)}
                        onChange={() => toggleEquipement(eq.key)}
                        className="w-4 h-4 accent-terra"
                      />
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={form.equipements.includes(eq.key) ? '#C97B4B' : '#9CA3AF'} strokeWidth="1.5">
                        <path d={eq.path} />
                      </svg>
                      <span className="text-sm text-brun-mid" style={{ fontFamily: 'var(--font-dm-sans)' }}>{eq.label.fr}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* 8. Vidéo */}
              <section>
                <h3 className="text-sm font-semibold text-brun-mid uppercase tracking-wide mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>Vidéo (optionnel)</h3>
                <div>
                  <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>Lien Google Drive</label>
                  <input
                    className={inputClass}
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                    value={form.video_url ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value || null }))}
                    placeholder="https://drive.google.com/file/d/..."
                  />
                  <p className="text-xs text-brun-mid/40 mt-1.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Lien de partage Google Drive — visible uniquement sur la fiche détail
                  </p>
                </div>
              </section>

              {/* 9. Photos */}
              <section>
                <h3 className="text-sm font-semibold text-brun-mid uppercase tracking-wide mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>Photos</h3>
                <label className="flex items-center gap-2 cursor-pointer bg-creme border border-dashed border-brun/20 rounded-xl px-4 py-3 hover:border-terra transition-colors mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-terra">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  <span className="text-sm text-brun-mid" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {uploading ? 'Upload en cours…' : 'Ajouter des photos'}
                  </span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>

                {uploadError && <p className="text-xs text-red-500 mb-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>{uploadError}</p>}

                {form.photos.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {form.photos.map((url, i) => (
                      <div key={url} className="flex items-center gap-3 bg-creme rounded-xl px-3 py-2">
                        <Image src={url} alt="" width={48} height={36} className="rounded-lg object-cover flex-shrink-0" style={{ height: '36px', width: '48px' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-brun-mid/50 truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            {i === 0 ? '★ Photo principale (à la une)' : `Photo ${i + 1}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {i !== 0 && (
                            <button
                              type="button"
                              onClick={() => setMainPhoto(url)}
                              className="text-xs text-terra hover:underline"
                              style={{ fontFamily: 'var(--font-dm-sans)' }}
                            >
                              ★ Principale
                            </button>
                          )}
                          <button type="button" onClick={() => removePhoto(url)} className="text-brun-mid/30 hover:text-red-500">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Footer modal */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-brun/8">
              <button onClick={() => setShowModal(false)} className="text-sm text-brun-mid hover:text-brun px-4 py-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.titre || !form.ville || !form.telephone}
                className="flex items-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-6 py-2.5 hover:bg-brun transition-all disabled:opacity-50"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {saving ? 'Sauvegarde…' : editing ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
