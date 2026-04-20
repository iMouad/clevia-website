'use client'

import { useState, useMemo } from 'react'
import BienCard from './BienCard'
import type { BienPublic } from './BienCard'

const TYPES = ['Appartement', 'Villa', 'Studio', 'Autre']
const CITIES_LOCATION = ['Mohammedia', 'Mansouria', 'Bouznika', 'Benslimane']

const CAPACITE_OPTIONS = [
  { label: '1–2', min: 1, max: 2 },
  { label: '3–4', min: 3, max: 4 },
  { label: '5–6', min: 5, max: 6 },
  { label: '7+',  min: 7, max: 99 },
]

const PRIX_OPTIONS = [
  { label: '< 300 MAD',    min: 0,   max: 299  },
  { label: '300–500 MAD',  min: 300, max: 500  },
  { label: '500–800 MAD',  min: 501, max: 800  },
  { label: '800+ MAD',     min: 801, max: 99999 },
]

type SortOption = 'default' | 'prix_asc' | 'prix_desc'

type Props = {
  biens: BienPublic[]
  allLabel: string
  emptyLabel: string
}

export default function BiensGrid({ biens, allLabel, emptyLabel }: Props) {
  const [typeFilter,      setTypeFilter]      = useState<string | null>(null)
  const [villeFilter,     setVilleFilter]     = useState<string | null>(null)
  const [disponibleOnly,  setDisponibleOnly]  = useState(false)
  const [capaciteFilter,  setCapaciteFilter]  = useState<number | null>(null) // index into CAPACITE_OPTIONS
  const [prixFilter,      setPrixFilter]      = useState<number | null>(null) // index into PRIX_OPTIONS
  const [sort,            setSort]            = useState<SortOption>('default')
  const [filtersOpen,     setFiltersOpen]     = useState(false)

  const availableTypes = useMemo(() => {
    const types = new Set(biens.map((b) => b.type).filter(Boolean))
    return TYPES.filter((t) => types.has(t))
  }, [biens])

  const availableCities = useMemo(() => {
    const villes = new Set(biens.map((b) => b.ville?.trim()).filter(Boolean) as string[])
    return CITIES_LOCATION.filter((c) => [...villes].some((v) => v.toLowerCase().includes(c.toLowerCase())))
  }, [biens])

  const hasPrixData = useMemo(() => biens.some((b) => b.prix_nuit != null), [biens])
  const hasCapaciteData = useMemo(() => biens.some((b) => b.capacite_max != null || b.capacite != null), [biens])

  const filtered = useMemo(() => {
    let result = biens
    if (typeFilter) result = result.filter((b) => b.type === typeFilter)
    if (villeFilter) result = result.filter((b) => b.ville?.toLowerCase().includes(villeFilter.toLowerCase()))
    if (disponibleOnly) result = result.filter((b) => b.disponible !== false)
    if (capaciteFilter !== null) {
      const { min, max } = CAPACITE_OPTIONS[capaciteFilter]
      result = result.filter((b) => {
        const cap = b.capacite_max ?? b.capacite ?? 0
        return cap >= min && cap <= max
      })
    }
    if (prixFilter !== null) {
      const { min, max } = PRIX_OPTIONS[prixFilter]
      result = result.filter((b) => {
        const prix = b.prix_nuit ?? 0
        return prix >= min && prix <= max
      })
    }
    if (sort === 'prix_asc')  result = [...result].sort((a, b) => (a.prix_nuit ?? 0) - (b.prix_nuit ?? 0))
    if (sort === 'prix_desc') result = [...result].sort((a, b) => (b.prix_nuit ?? 0) - (a.prix_nuit ?? 0))
    return result
  }, [biens, typeFilter, villeFilter, disponibleOnly, capaciteFilter, prixFilter, sort])

  const activeCount = [typeFilter, villeFilter, disponibleOnly || null, capaciteFilter !== null ? 1 : null, prixFilter !== null ? 1 : null]
    .filter(Boolean).length

  function resetAll() {
    setTypeFilter(null)
    setVilleFilter(null)
    setDisponibleOnly(false)
    setCapaciteFilter(null)
    setPrixFilter(null)
    setSort('default')
  }

  const chip = (active: boolean) =>
    `px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap ${
      active
        ? 'bg-terra text-creme shadow-sm'
        : 'border border-brun/20 text-brun-mid hover:border-terra hover:text-terra bg-white'
    }`

  return (
    <>
      {/* ── Barre de filtres ── */}
      <div
        className="mb-8 rounded-2xl border border-brun/10 bg-creme/60 backdrop-blur-sm overflow-hidden"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        {/* Header de la barre */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-terra flex-shrink-0">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span className="text-sm font-medium text-brun">Filtres</span>
            {activeCount > 0 && (
              <span className="bg-terra text-creme text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Compteur résultats */}
            <span className="text-xs text-brun-mid/50 hidden sm:block">
              {filtered.length} bien{filtered.length !== 1 ? 's' : ''}
            </span>
            {activeCount > 0 && (
              <button
                onClick={resetAll}
                className="text-xs text-brun-mid/60 hover:text-terra underline underline-offset-2 transition-colors"
              >
                Réinitialiser
              </button>
            )}
            {/* Toggle mobile */}
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="sm:hidden flex items-center gap-1.5 text-sm text-brun-mid border border-brun/20 rounded-full px-3 py-1.5 hover:border-terra hover:text-terra transition-all"
            >
              {filtersOpen ? 'Fermer' : 'Afficher'}
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className={`transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filtres — toujours visibles sur desktop, toggle sur mobile */}
        <div className={`border-t border-brun/8 px-5 pb-5 pt-4 flex flex-col gap-4 sm:flex ${filtersOpen ? 'flex' : 'hidden'}`}>

          {/* Ligne 1 : Type */}
          {availableTypes.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setTypeFilter(null)} className={chip(!typeFilter)}>
                {allLabel}
              </button>
              {availableTypes.map((type) => (
                <button key={type} onClick={() => setTypeFilter(type)} className={chip(typeFilter === type)}>
                  {type}
                </button>
              ))}
            </div>
          )}

          {/* Ligne 2 : Ville */}
          {availableCities.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-brun-mid/40 uppercase tracking-wider mr-1 w-full sm:w-auto">
                Ville
              </span>
              <button onClick={() => setVilleFilter(null)} className={chip(!villeFilter)}>
                Toutes
              </button>
              {availableCities.map((city) => (
                <button key={city} onClick={() => setVilleFilter(city)} className={chip(villeFilter === city)}>
                  {city}
                </button>
              ))}
            </div>
          )}

          {/* Ligne 3 : Capacité */}
          {hasCapaciteData && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-brun-mid/40 uppercase tracking-wider mr-1 w-full sm:w-auto">
                Voyageurs
              </span>
              <button onClick={() => setCapaciteFilter(null)} className={chip(capaciteFilter === null)}>
                Tous
              </button>
              {CAPACITE_OPTIONS.map((opt, i) => (
                <button key={opt.label} onClick={() => setCapaciteFilter(i === capaciteFilter ? null : i)} className={chip(capaciteFilter === i)}>
                  {opt.label} pers.
                </button>
              ))}
            </div>
          )}

          {/* Ligne 4 : Prix */}
          {hasPrixData && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-brun-mid/40 uppercase tracking-wider mr-1 w-full sm:w-auto">
                Budget / nuit
              </span>
              <button onClick={() => setPrixFilter(null)} className={chip(prixFilter === null)}>
                Tous
              </button>
              {PRIX_OPTIONS.map((opt, i) => (
                <button key={opt.label} onClick={() => setPrixFilter(i === prixFilter ? null : i)} className={chip(prixFilter === i)}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Ligne 5 : Dispo + Tri */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-brun/8">
            <button
              onClick={() => setDisponibleOnly((v) => !v)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                disponibleOnly
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'border border-brun/20 text-brun-mid hover:border-green-600 hover:text-green-600 bg-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${disponibleOnly ? 'bg-white' : 'bg-green-500'}`} />
              Disponible uniquement
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-brun-mid/40 mr-1">Trier :</span>
              {([
                ['default', 'Par défaut'],
                ['prix_asc',  'Prix ↑'],
                ['prix_desc', 'Prix ↓'],
              ] as [SortOption, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setSort(val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    sort === val
                      ? 'bg-brun text-creme'
                      : 'border border-brun/20 text-brun-mid hover:border-brun hover:text-brun bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Compteur mobile */}
      <p className="sm:hidden text-xs text-brun-mid/50 mb-4 -mt-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
        {filtered.length} bien{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* ── Grille ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brun/5 flex items-center justify-center">
            <svg className="text-brun/30" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="text-brun-mid/50 text-base" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {emptyLabel}
          </p>
          {activeCount > 0 && (
            <button
              onClick={resetAll}
              className="text-sm text-terra underline underline-offset-2"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              Supprimer les filtres
            </button>
          )}
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
