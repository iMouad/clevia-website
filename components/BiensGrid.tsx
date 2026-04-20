'use client'

import { useState, useMemo } from 'react'
import BienCard from './BienCard'
import type { BienPublic } from './BienCard'

const TYPES = ['Appartement', 'Villa', 'Studio', 'Autre']
const CITIES_LOCATION = ['Mohammedia', 'Mansouria', 'Bouznika', 'Benslimane']

type SortOption = 'default' | 'prix_asc' | 'prix_desc'

type Props = {
  biens: BienPublic[]
  allLabel: string
  emptyLabel: string
}

export default function BiensGrid({ biens, allLabel, emptyLabel }: Props) {
  const [filter, setFilter] = useState<string | null>(null)
  const [villeFilter, setVilleFilter] = useState<string | null>(null)
  const [disponibleOnly, setDisponibleOnly] = useState(false)
  const [sort, setSort] = useState<SortOption>('default')

  const availableTypes = useMemo(() => {
    const types = new Set(biens.map((b) => b.type).filter(Boolean))
    return TYPES.filter((t) => types.has(t))
  }, [biens])

  // Only show cities that exist in the data
  const availableCities = useMemo(() => {
    const villes = new Set(biens.map((b) => b.ville?.trim()).filter(Boolean) as string[])
    return CITIES_LOCATION.filter((c) => [...villes].some((v) => v.toLowerCase().includes(c.toLowerCase())))
  }, [biens])

  const filtered = useMemo(() => {
    let result = filter ? biens.filter((b) => b.type === filter) : biens
    if (villeFilter) result = result.filter((b) => b.ville?.toLowerCase().includes(villeFilter.toLowerCase()))
    if (disponibleOnly) result = result.filter((b) => b.disponible !== false)
    if (sort === 'prix_asc') result = [...result].sort((a, b) => (a.prix_nuit ?? 0) - (b.prix_nuit ?? 0))
    if (sort === 'prix_desc') result = [...result].sort((a, b) => (b.prix_nuit ?? 0) - (a.prix_nuit ?? 0))
    return result
  }, [biens, filter, villeFilter, disponibleOnly, sort])

  const btnBase = 'px-4 py-2 rounded-full text-sm font-medium transition-all duration-150'
  const btnActive = 'bg-terra text-creme'
  const btnInactive = 'border border-brun/20 text-brun-mid hover:border-terra hover:text-terra'

  return (
    <>
      {/* ── Barre de filtres ── */}
      <div className="flex flex-col gap-3 mb-10">
        <div className="flex flex-wrap items-center gap-2">

          {/* Filtre type */}
          {availableTypes.length > 1 && (
            <>
              <button
                onClick={() => setFilter(null)}
                className={`${btnBase} ${!filter ? btnActive : btnInactive}`}
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {allLabel}
              </button>
              {availableTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`${btnBase} ${filter === type ? btnActive : btnInactive}`}
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  {type}
                </button>
              ))}
              <div className="w-px h-6 bg-brun/15 mx-1" />
            </>
          )}

          {/* Toggle disponible */}
          <button
            onClick={() => setDisponibleOnly((v) => !v)}
            className={`${btnBase} flex items-center gap-2 ${disponibleOnly ? btnActive : btnInactive}`}
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: disponibleOnly ? '#FAF6F1' : '#22c55e' }}
            />
            Disponible
          </button>

          {/* Tri prix */}
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs text-brun-mid/50 mr-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>Trier :</span>
            {([
              ['default', 'Par défaut'],
              ['prix_asc', 'Prix ↑'],
              ['prix_desc', 'Prix ↓'],
            ] as [SortOption, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setSort(val)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${sort === val ? 'bg-brun text-creme' : 'border border-brun/20 text-brun-mid hover:border-brun hover:text-brun'}`}
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtre ville — uniquement si plusieurs villes présentes */}
        {availableCities.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-brun-mid/50 uppercase tracking-wide mr-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Ville
            </span>
            <button
              onClick={() => setVilleFilter(null)}
              className={`${btnBase} text-xs py-1.5 ${!villeFilter ? 'bg-brun text-creme' : 'border border-brun/20 text-brun-mid hover:border-brun hover:text-brun'}`}
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              Toutes
            </button>
            {availableCities.map((city) => (
              <button
                key={city}
                onClick={() => setVilleFilter(city)}
                className={`${btnBase} text-xs py-1.5 ${villeFilter === city ? 'bg-brun text-creme' : 'border border-brun/20 text-brun-mid hover:border-brun hover:text-brun'}`}
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Grille ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-brun-mid/40" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {emptyLabel}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((b) => (
            <BienCard key={b.id} bien={b} />
          ))}
        </div>
      )}
    </>
  )
}
