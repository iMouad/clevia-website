'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { applyWatermark } from '@/lib/watermark'
import type { Plateforme } from '@/lib/plateformes'

type Setting = {
  key: string
  value_fr: string | null
  value_ar: string | null
  value_en: string | null
}

const KEY_LABELS: Record<string, string> = {
  slogan: 'Slogan',
  sous_titre: 'Sous-titre',
  zone: 'Zone couverte',
  email: 'Email de contact',
  telephone: 'Téléphone',
  horaires: 'Horaires',
  instagram: 'Instagram',
  facebook: 'Facebook',
}

export default function SettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(false)

  // Plateformes
  const [plateformes, setPlateformes] = useState<Plateforme[]>([])
  const [newPlat, setNewPlat] = useState({ nom: '', couleur: '#6B4C35' })
  const [editingPlat, setEditingPlat] = useState<Plateforme | null>(null)
  const [platToast, setPlatToast] = useState('')

  function showPlatToast(msg: string) { setPlatToast(msg); setTimeout(() => setPlatToast(''), 3000) }

  async function fetchPlateformes() {
    const { data } = await supabase.from('plateformes').select('*').order('ordre', { ascending: true })
    setPlateformes(data ?? [])
  }

  async function addPlateforme() {
    const nom = newPlat.nom.trim()
    if (!nom) return
    if (plateformes.some((p) => p.nom.toLowerCase() === nom.toLowerCase())) {
      showPlatToast('Cette plateforme existe déjà'); return
    }
    const ordre = plateformes.length + 1
    const { error } = await supabase.from('plateformes').insert({ nom, couleur: newPlat.couleur, ordre })
    if (error) { showPlatToast(`Erreur : ${error.message}`); return }
    setNewPlat({ nom: '', couleur: '#6B4C35' })
    showPlatToast(`${nom} ajoutée`)
    fetchPlateformes()
  }

  async function updatePlateforme() {
    if (!editingPlat) return
    const { error } = await supabase.from('plateformes').update({ nom: editingPlat.nom, couleur: editingPlat.couleur, actif: editingPlat.actif }).eq('id', editingPlat.id)
    if (error) { showPlatToast(`Erreur : ${error.message}`); return }
    setEditingPlat(null)
    showPlatToast('Plateforme modifiée')
    fetchPlateformes()
  }

  async function deletePlateforme(p: Plateforme) {
    if (!confirm(`Supprimer "${p.nom}" ? Les réservations existantes garderont le nom mais sans couleur.`)) return
    await supabase.from('plateformes').delete().eq('id', p.id)
    showPlatToast(`${p.nom} supprimée`)
    fetchPlateformes()
  }

  async function movePlateforme(id: string, direction: 'up' | 'down') {
    const idx = plateformes.findIndex((p) => p.id === id)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= plateformes.length) return
    const a = plateformes[idx], b = plateformes[swapIdx]
    await Promise.all([
      supabase.from('plateformes').update({ ordre: b.ordre }).eq('id', a.id),
      supabase.from('plateformes').update({ ordre: a.ordre }).eq('id', b.id),
    ])
    fetchPlateformes()
  }

  // Watermark état
  const [watermarking, setWatermarking] = useState(false)
  const [wmDone, setWmDone] = useState(0)
  const [wmTotal, setWmTotal] = useState(0)
  const [wmResult, setWmResult] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => {
      setSettings(data ?? [])
      setLoading(false)
    })
    fetchPlateformes()
  }, [])

  function update(key: string, field: 'value_fr' | 'value_ar' | 'value_en', value: string) {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, [field]: value } : s))
    )
  }

  async function handleSave() {
    setSaving(true)
    for (const s of settings) {
      await supabase
        .from('settings')
        .update({ value_fr: s.value_fr, value_ar: s.value_ar, value_en: s.value_en, updated_at: new Date().toISOString() })
        .eq('key', s.key)
    }
    setSaving(false)
    setToast(true)
    setTimeout(() => setToast(false), 3000)
  }

  async function handleWatermarkAll() {
    if (!confirm('Appliquer le watermark Clévia sur toutes les photos existantes ? Cette opération est irréversible.')) return

    setWatermarking(true)
    setWmResult(null)
    setWmDone(0)
    setWmTotal(0)

    const [{ data: biensData }, { data: venteData }] = await Promise.all([
      supabase.from('biens').select('photos'),
      supabase.from('biens_vente').select('photos'),
    ])

    type Job = { bucket: string; url: string }
    const jobs: Job[] = []
    for (const b of biensData ?? []) {
      for (const url of b.photos ?? []) { if (url) jobs.push({ bucket: 'biens-photos', url }) }
    }
    for (const b of venteData ?? []) {
      for (const url of b.photos ?? []) { if (url) jobs.push({ bucket: 'vente-photos', url }) }
    }

    const UNSUPPORTED_EXT = ['heic', 'heif', 'tiff', 'tif', 'bmp']

    setWmTotal(jobs.length)
    let done = 0, errors = 0, skipped = 0

    for (const { bucket, url } of jobs) {
      const ext = url.split('.').pop()?.toLowerCase() ?? ''
      if (UNSUPPORTED_EXT.includes(ext)) {
        skipped++
        done++
        setWmDone(done)
        continue
      }

      try {
        const path = url.split(`/${bucket}/`)[1]
        if (!path) throw new Error('path introuvable')

        const { data: dlBlob, error: dlError } = await supabase.storage.from(bucket).download(path)
        if (dlError || !dlBlob) throw dlError ?? new Error('Download failed')
        const file = new File([dlBlob], path, { type: dlBlob.type || 'image/jpeg' })

        const watermarked = await applyWatermark(file)

        const { error } = await supabase.storage
          .from(bucket)
          .upload(path, watermarked, { upsert: true, contentType: watermarked.type, cacheControl: '60' })
        if (error) throw error
      } catch (e) {
        console.warn('Watermark échoué :', url, e)
        errors++
      }
      done++
      setWmDone(done)
    }

    const ok = done - errors - skipped
    const parts = [`✓ ${ok} photo(s) watermarkée(s)`]
    if (skipped > 0) parts.push(`${skipped} ignorée(s) (HEIC/format non supporté)`)
    if (errors > 0) parts.push(`${errors} erreur(s)`)
    setWmResult(parts.join(' · '))
    setWatermarking(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-brun-mid/50">Chargement…</p>
      </div>
    )
  }

  const pct = wmTotal > 0 ? Math.round((wmDone / wmTotal) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>Paramètres</h1>
          <p className="text-brun-mid text-sm mt-1">Éditez les textes du site en 3 langues</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-6 py-2.5 hover:bg-brun transition-all disabled:opacity-60"
        >
          {saving ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
              </svg>
              Sauvegarde…
            </>
          ) : 'Sauvegarder'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="8" fill="white" fillOpacity="0.2" />
            <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Modifications sauvegardées !
        </div>
      )}

      {/* Textes du site */}
      <div className="bg-white rounded-2xl border border-brun/10 overflow-hidden">
        <div className="grid grid-cols-[200px_1fr_1fr_1fr] gap-4 px-6 py-3 bg-brun/4 border-b border-brun/10">
          <div className="text-xs text-brun-mid uppercase tracking-wide font-medium">Clé</div>
          <div className="flex items-center gap-2 text-xs text-brun-mid uppercase tracking-wide font-medium">
            <span className="w-5 h-5 rounded bg-blue-100 text-blue-600 text-[10px] flex items-center justify-center font-bold">FR</span>
            Français
          </div>
          <div className="flex items-center gap-2 text-xs text-brun-mid uppercase tracking-wide font-medium">
            <span className="w-5 h-5 rounded bg-green-100 text-green-700 text-[10px] flex items-center justify-center font-bold">ع</span>
            Arabe
          </div>
          <div className="flex items-center gap-2 text-xs text-brun-mid uppercase tracking-wide font-medium">
            <span className="w-5 h-5 rounded bg-orange-100 text-orange-600 text-[10px] flex items-center justify-center font-bold">EN</span>
            Anglais
          </div>
        </div>
        <div className="divide-y divide-brun/5">
          {settings.map((s) => (
            <div key={s.key} className="grid grid-cols-[200px_1fr_1fr_1fr] gap-4 px-6 py-4 items-start hover:bg-creme/30 transition-colors">
              <div className="pt-2">
                <p className="text-sm font-medium text-brun">{KEY_LABELS[s.key] ?? s.key}</p>
                <p className="text-xs text-brun-mid/50 font-mono mt-0.5">{s.key}</p>
              </div>
              <textarea rows={2} value={s.value_fr ?? ''} onChange={(e) => update(s.key, 'value_fr', e.target.value)}
                className="w-full border border-brun/20 rounded-xl px-3 py-2 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors resize-none" />
              <textarea rows={2} dir="rtl" value={s.value_ar ?? ''} onChange={(e) => update(s.key, 'value_ar', e.target.value)}
                className="w-full border border-brun/20 rounded-xl px-3 py-2 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors resize-none text-right" />
              <textarea rows={2} value={s.value_en ?? ''} onChange={(e) => update(s.key, 'value_en', e.target.value)}
                className="w-full border border-brun/20 rounded-xl px-3 py-2 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors resize-none" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Plateformes de réservation ── */}
      <div className="mt-10">
        <h2 className="text-xl text-brun mb-1" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>Plateformes de réservation</h2>
        <p className="text-sm text-brun-mid/60 mb-5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Gérez les plateformes disponibles pour les réservations. L&apos;ordre et les couleurs sont utilisés partout dans l&apos;admin.
        </p>

        {platToast && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {platToast}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-brun/10 overflow-hidden">
          {/* Liste */}
          <div className="divide-y divide-brun/5">
            {plateformes.map((p, i) => (
              <div key={p.id} className="px-6 py-3.5 flex items-center gap-4">
                {/* Ordre */}
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => movePlateforme(p.id, 'up')} disabled={i === 0}
                    className="text-brun-mid/30 hover:text-terra disabled:opacity-20 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
                  </button>
                  <button onClick={() => movePlateforme(p.id, 'down')} disabled={i === plateformes.length - 1}
                    className="text-brun-mid/30 hover:text-terra disabled:opacity-20 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                </div>

                {/* Couleur preview */}
                <span className="w-8 h-8 rounded-lg flex-shrink-0 border border-brun/10" style={{ backgroundColor: p.couleur }} />

                {/* Nom + badge */}
                {editingPlat?.id === p.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      value={editingPlat.nom}
                      onChange={(e) => setEditingPlat({ ...editingPlat, nom: e.target.value })}
                      className="border border-brun/20 rounded-lg px-3 py-1.5 text-sm text-brun focus:outline-none focus:border-terra w-36"
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    />
                    <input
                      type="color"
                      value={editingPlat.couleur}
                      onChange={(e) => setEditingPlat({ ...editingPlat, couleur: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <button
                      onClick={() => setEditingPlat({ ...editingPlat, actif: !editingPlat.actif })}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${editingPlat.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      {editingPlat.actif ? 'Actif' : 'Inactif'}
                    </button>
                    <button onClick={updatePlateforme} className="text-xs font-medium text-terra hover:underline" style={{ fontFamily: 'var(--font-dm-sans)' }}>Sauver</button>
                    <button onClick={() => setEditingPlat(null)} className="text-xs text-brun-mid/50 hover:underline" style={{ fontFamily: 'var(--font-dm-sans)' }}>Annuler</button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-white px-3 py-1 rounded-full" style={{ backgroundColor: p.couleur, fontFamily: 'var(--font-dm-sans)' }}>
                      {p.nom}
                    </span>
                    {!p.actif && (
                      <span className="text-xs text-gray-400 italic" style={{ fontFamily: 'var(--font-dm-sans)' }}>inactif</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                {editingPlat?.id !== p.id && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingPlat({ ...p })} className="text-xs text-terra hover:underline" style={{ fontFamily: 'var(--font-dm-sans)' }}>Modifier</button>
                    <button onClick={() => deletePlateforme(p)} className="text-xs text-red-400 hover:underline" style={{ fontFamily: 'var(--font-dm-sans)' }}>Supprimer</button>
                  </div>
                )}
              </div>
            ))}
            {!plateformes.length && (
              <p className="px-6 py-8 text-center text-brun-mid/40 text-sm">Aucune plateforme configurée</p>
            )}
          </div>

          {/* Ajouter */}
          <div className="px-6 py-4 bg-brun/3 border-t border-brun/10 flex items-center gap-3">
            <input
              value={newPlat.nom}
              onChange={(e) => setNewPlat({ ...newPlat, nom: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addPlateforme()}
              placeholder="Nouvelle plateforme…"
              className="border border-brun/20 rounded-xl px-3 py-2 text-sm text-brun focus:outline-none focus:border-terra flex-1"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            />
            <input
              type="color"
              value={newPlat.couleur}
              onChange={(e) => setNewPlat({ ...newPlat, couleur: e.target.value })}
              className="w-9 h-9 rounded-lg cursor-pointer border border-brun/20"
            />
            <button
              onClick={addPlateforme}
              disabled={!newPlat.nom.trim()}
              className="flex items-center gap-1.5 bg-terra text-creme text-sm font-medium rounded-full px-5 py-2 hover:bg-brun transition-all disabled:opacity-40"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* ── Maintenance ── */}
      <div className="mt-10">
        <h2 className="text-xl text-brun mb-1" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>Maintenance</h2>
        <p className="text-sm text-brun-mid/60 mb-5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Opérations ponctuelles sur les données existantes.
        </p>

        <div className="bg-white border border-brun/10 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-terra/10 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97B4B" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-brun mb-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Watermark photos existantes
              </p>
              <p className="text-xs text-brun-mid/50 mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Applique le logo Clévia sur toutes les photos déjà uploadées (location + vente).
                Les fichiers dans Supabase Storage sont écrasés — les URLs restent identiques.
                À n'utiliser qu'une seule fois.
              </p>

              {/* Barre de progression */}
              {(watermarking || wmTotal > 0) && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-brun-mid/60" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {watermarking ? `Photo ${wmDone} / ${wmTotal}…` : `${wmDone} / ${wmTotal} traitées`}
                    </span>
                    <span className="text-xs font-medium text-terra" style={{ fontFamily: 'var(--font-dm-sans)' }}>{pct}%</span>
                  </div>
                  <div className="h-2 bg-brun/8 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-terra rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Résultat */}
              {wmResult && (
                <div className={`text-xs px-3 py-2 rounded-xl mb-4 ${wmResult.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`} style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {wmResult}
                </div>
              )}

              <button
                onClick={handleWatermarkAll}
                disabled={watermarking}
                className="flex items-center gap-2 border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-5 py-2.5 hover:border-terra hover:text-terra transition-all disabled:opacity-40"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {watermarking ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                    </svg>
                    Traitement en cours…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Appliquer le watermark
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
