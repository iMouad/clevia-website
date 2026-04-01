'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-brun-mid/50">Chargement…</p>
      </div>
    )
  }

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
          ) : (
            'Sauvegarder'
          )}
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

      {/* Lang header */}
      <div className="bg-white rounded-2xl border border-brun/10 overflow-hidden">
        {/* Column headers */}
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

        {/* Rows */}
        <div className="divide-y divide-brun/5">
          {settings.map((s) => (
            <div key={s.key} className="grid grid-cols-[200px_1fr_1fr_1fr] gap-4 px-6 py-4 items-start hover:bg-creme/30 transition-colors">
              <div className="pt-2">
                <p className="text-sm font-medium text-brun">{KEY_LABELS[s.key] ?? s.key}</p>
                <p className="text-xs text-brun-mid/50 font-mono mt-0.5">{s.key}</p>
              </div>

              <textarea
                rows={2}
                value={s.value_fr ?? ''}
                onChange={(e) => update(s.key, 'value_fr', e.target.value)}
                className="w-full border border-brun/20 rounded-xl px-3 py-2 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors resize-none"
              />

              <textarea
                rows={2}
                dir="rtl"
                value={s.value_ar ?? ''}
                onChange={(e) => update(s.key, 'value_ar', e.target.value)}
                className="w-full border border-brun/20 rounded-xl px-3 py-2 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors resize-none text-right"
              />

              <textarea
                rows={2}
                value={s.value_en ?? ''}
                onChange={(e) => update(s.key, 'value_en', e.target.value)}
                className="w-full border border-brun/20 rounded-xl px-3 py-2 text-sm text-brun focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors resize-none"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
