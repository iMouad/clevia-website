'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { applyWatermark } from '@/lib/watermark'

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
          .upload(path, watermarked, { upsert: true, contentType: watermarked.type })
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
