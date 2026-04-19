'use client'

import { useState, useMemo } from 'react'
import { useLocale } from 'next-intl'
import BienVenteCard, { type BienVente } from '@/components/BienVenteCard'
import { AnimateIn } from '@/components/ui/AnimateIn'
import { EQUIPEMENTS_PAR_CATEGORIE } from '@/lib/equipements-vente'

type Props = {
  biens: BienVente[]
  filterAllLabel: string
  filterVendusLabel: string
  categories: Record<string, string>
}

const PRICE_RANGES = [
  { label: 'Tous les budgets', min: null, max: null },
  { label: '< 500 000',        min: null, max: 500_000 },
  { label: '500k – 1M',        min: 500_000, max: 1_000_000 },
  { label: '1M – 3M',          min: 1_000_000, max: 3_000_000 },
  { label: '+ 3M',             min: 3_000_000, max: null },
]

// Flatten all equipement definitions into a single lookup map
const ALL_EQ_DEFS = Object.values(EQUIPEMENTS_PAR_CATEGORIE).flat().reduce<
  Record<string, { fr: string; ar: string; en: string }>
>((acc, eq) => {
  if (!acc[eq.key]) acc[eq.key] = eq.label
  return acc
}, {})

export default function VenteGrid({ biens, filterAllLabel, filterVendusLabel, categories }: Props) {
  const locale = useLocale() as 'fr' | 'ar' | 'en'
  const [categorie, setCategorie] = useState<string>('all')
  const [showVendus, setShowVendus] = useState(false)
  const [priceRange, setPriceRange] = useState(0)
  const [selectedEqs, setSelectedEqs] = useState<Set<string>>(new Set())
  const [showEqPanel, setShowEqPanel] = useState(false)

  const categoriesPresentes = useMemo(() => {
    const s = new Set(biens.map((b) => b.categorie))
    return Array.from(s)
  }, [biens])

  // All equipement keys that appear in at least one bien
  const availableEqs = useMemo(() => {
    const s = new Set<string>()
    biens.forEach((b) => (b.equipements ?? []).forEach((k) => s.add(k)))
    return Array.from(s).filter((k) => k in ALL_EQ_DEFS)
  }, [biens])

  const filtered = useMemo(() => {
    const range = PRICE_RANGES[priceRange]
    return biens.filter((b) => {
      if (!showVendus && b.statut === 'vendu') return false
      if (categorie !== 'all' && b.categorie !== categorie) return false
      if (range.min !== null && (b.prix === null || b.prix < range.min)) return false
      if (range.max !== null && b.prix !== null && b.prix > range.max) return false
      if (selectedEqs.size > 0) {
        const bEqs = new Set(b.equipements ?? [])
        for (const eq of selectedEqs) {
          if (!bEqs.has(eq)) return false
        }
      }
      return true
    })
  }, [biens, categorie, showVendus, priceRange, selectedEqs])

  function toggleEq(key: string) {
    setSelectedEqs((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const activeFiltersCount =
    (categorie !== 'all' ? 1 : 0) +
    (priceRange !== 0 ? 1 : 0) +
    selectedEqs.size

  return (
    <div>
      {/* ── Barre de filtres ── */}
      <div className="bg-white border border-brun/10 rounded-2xl p-4 mb-8 flex flex-col gap-4">

        {/* Ligne 1: Catégories + toggle vendus */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategorie('all')}
            className="text-sm rounded-full px-4 py-2 font-medium transition-all"
            style={{
              backgroundColor: categorie === 'all' ? '#C97B4B' : '#F5EFE9',
              color: categorie === 'all' ? '#FAF6F1' : '#6B4C35',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            {filterAllLabel}
          </button>

          {categoriesPresentes.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategorie(cat)}
              className="text-sm rounded-full px-4 py-2 font-medium transition-all"
              style={{
                backgroundColor: categorie === cat ? '#C97B4B' : '#F5EFE9',
                color: categorie === cat ? '#FAF6F1' : '#6B4C35',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              {categories[cat] ?? cat}
            </button>
          ))}

          <div className="ml-auto">
            <button
              onClick={() => setShowVendus((v) => !v)}
              className="flex items-center gap-2 text-sm rounded-full px-4 py-2 border transition-all"
              style={{
                borderColor: showVendus ? '#C97B4B' : 'rgba(44,26,14,0.15)',
                color: showVendus ? '#C97B4B' : '#6B4C35',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: showVendus ? '#C97B4B' : '#9CA3AF' }}
              />
              {filterVendusLabel}
            </button>
          </div>
        </div>

        {/* Ligne 2: Budget */}
        <div className="flex flex-wrap items-center gap-2 border-t border-brun/8 pt-3">
          <span className="text-xs font-medium text-brun-mid/60 uppercase tracking-wide mr-1 flex-shrink-0" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Budget
          </span>
          {PRICE_RANGES.map((r, i) => (
            <button
              key={i}
              onClick={() => setPriceRange(i)}
              className="text-sm rounded-full px-3 py-1.5 font-medium transition-all border"
              style={{
                backgroundColor: priceRange === i ? '#2C1A0E' : 'transparent',
                color: priceRange === i ? '#FAF6F1' : '#6B4C35',
                borderColor: priceRange === i ? '#2C1A0E' : 'rgba(44,26,14,0.15)',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Ligne 3: Équipements */}
        {availableEqs.length > 0 && (
          <div className="border-t border-brun/8 pt-3">
            <button
              onClick={() => setShowEqPanel((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium text-brun-mid transition-colors hover:text-brun"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="8" y1="12" x2="20" y2="12" />
                <line x1="12" y1="18" x2="20" y2="18" />
              </svg>
              Équipements
              {selectedEqs.size > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold text-creme" style={{ backgroundColor: '#C97B4B' }}>
                  {selectedEqs.size}
                </span>
              )}
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className="ml-auto transition-transform"
                style={{ transform: showEqPanel ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {showEqPanel && (
              <div className="flex flex-wrap gap-2 mt-3">
                {availableEqs.map((key) => {
                  const label = ALL_EQ_DEFS[key]?.[locale] ?? ALL_EQ_DEFS[key]?.fr ?? key
                  const active = selectedEqs.has(key)
                  return (
                    <button
                      key={key}
                      onClick={() => toggleEq(key)}
                      className="text-sm rounded-full px-3 py-1.5 font-medium transition-all border"
                      style={{
                        backgroundColor: active ? '#FEF3E8' : 'transparent',
                        color: active ? '#C97B4B' : '#6B4C35',
                        borderColor: active ? '#C97B4B' : 'rgba(44,26,14,0.15)',
                        fontFamily: 'var(--font-dm-sans)',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Résumé filtres actifs */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between border-t border-brun/8 pt-3">
            <span className="text-xs text-brun-mid/60" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {filtered.length} bien{filtered.length > 1 ? 's' : ''} correspondant{filtered.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => { setCategorie('all'); setPriceRange(0); setSelectedEqs(new Set()) }}
              className="text-xs text-terra hover:text-brun underline underline-offset-2 transition-colors"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* ── Grille ── */}
      {filtered.length === 0 ? (
        <AnimateIn className="text-center py-16">
          <p className="text-brun-mid/50" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Aucun bien ne correspond à ces critères.
          </p>
        </AnimateIn>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((bien) => (
            <AnimateIn key={bien.id}>
              <BienVenteCard bien={bien} />
            </AnimateIn>
          ))}
        </div>
      )}
    </div>
  )
}
