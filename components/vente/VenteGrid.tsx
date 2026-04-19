'use client'

import { useState, useMemo } from 'react'
import BienVenteCard, { type BienVente } from '@/components/BienVenteCard'
import { AnimateIn } from '@/components/ui/AnimateIn'

type Props = {
  biens: BienVente[]
  filterAllLabel: string
  filterVendusLabel: string
  categories: Record<string, string>
}

export default function VenteGrid({ biens, filterAllLabel, filterVendusLabel, categories }: Props) {
  const [categorie, setCategorie] = useState<string>('all')
  const [showVendus, setShowVendus] = useState(false)

  const categoriesPresentes = useMemo(() => {
    const s = new Set(biens.map((b) => b.categorie))
    return Array.from(s)
  }, [biens])

  const filtered = useMemo(() => {
    return biens.filter((b) => {
      if (!showVendus && b.statut === 'vendu') return false
      if (categorie !== 'all' && b.categorie !== categorie) return false
      return true
    })
  }, [biens, categorie, showVendus])

  return (
    <div>
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
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

        {/* Séparateur + toggle vendus */}
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

      {/* Grille */}
      {filtered.length === 0 ? (
        <AnimateIn className="text-center py-16">
          <p className="text-brun-mid/50" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Aucun bien dans cette catégorie.
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
