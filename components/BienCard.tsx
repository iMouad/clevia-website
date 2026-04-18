'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { EQUIPEMENTS_MAP } from '@/lib/equipements'

export type BienPublic = {
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
  equipements: string[] | null
  prix_nuit: number | null
  description: string | null
  photos: string[] | null
  distance_mer: string | null
  disponible: boolean | null
  airbnb_url: string | null
  booking_url: string | null
  avito_url: string | null
}

const TYPE_COLORS: Record<string, string> = {
  Appartement: 'bg-sky-50 text-sky-700',
  Villa: 'bg-emerald-50 text-emerald-700',
  Studio: 'bg-violet-50 text-violet-700',
  Autre: 'bg-stone-50 text-stone-600',
}

export default function BienCard({ bien }: { bien: BienPublic }) {
  const photos = (bien.photos ?? []).filter(Boolean)
  const [idx, setIdx] = useState(0)

  const equips = (bien.equipements ?? []).filter((k) => k in EQUIPEMENTS_MAP)
  const visibleEquips = equips.slice(0, 4)
  const extraCount = equips.length - visibleEquips.length

  function prev(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIdx((i) => (i - 1 + photos.length) % photos.length)
  }
  function next(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIdx((i) => (i + 1) % photos.length)
  }

  const isDisponible = bien.disponible !== false

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-brun/8 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col group">

      {/* ── Photo Carousel ── */}
      <div className="relative aspect-[4/3] bg-brun/5 overflow-hidden">
        {photos.length > 0 ? (
          <>
            <Image
              src={photos[idx]}
              alt={bien.nom}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {photos.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-white z-10"
                  aria-label="Photo précédente"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9 2L4 7l5 5" stroke="#2C1A0E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-white z-10"
                  aria-label="Photo suivante"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 2l5 5-5 5" stroke="#2C1A0E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Dots */}
                <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 pointer-events-none z-10">
                  {photos.slice(0, 8).map((_, i) => (
                    <span
                      key={i}
                      className={`rounded-full transition-all duration-300 ${
                        i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>

                {/* Counter */}
                <div className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm z-10" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {idx + 1}/{photos.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="text-brun/15" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* Type badge */}
        {bien.type && (
          <div className="absolute top-3 left-3 z-10">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[bien.type] ?? 'bg-white/80 text-brun'}`}
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {bien.type}
            </span>
          </div>
        )}

        {/* Disponible badge */}
        <div className="absolute bottom-3 left-3 z-10">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm ${
              isDisponible
                ? 'bg-green-500/90 text-white'
                : 'bg-gray-700/80 text-white'
            }`}
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {isDisponible ? 'Disponible' : 'Non disponible'}
          </span>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="p-5 flex flex-col gap-3 flex-1">

        {/* Name + Location */}
        <div>
          <h3 className="text-xl text-brun leading-snug" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
            {bien.nom}
          </h3>
          {(bien.adresse ?? bien.ville) && (
            <p className="flex items-center gap-1.5 text-brun-mid/70 text-sm mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              <svg width="10" height="13" viewBox="0 0 10 13" fill="none">
                <path d="M5 0.5C2.52 0.5 0.5 2.52 0.5 5c0 3.75 4.5 7.5 4.5 7.5S9.5 8.75 9.5 5C9.5 2.52 7.48 0.5 5 0.5z" fill="#C97B4B" fillOpacity=".25" stroke="#C97B4B" strokeWidth="1" />
                <circle cx="5" cy="5" r="1.75" fill="#C97B4B" />
              </svg>
              {bien.adresse ?? bien.ville}
            </p>
          )}
        </div>

        {/* Stats row — chambres / sdb / capacite / surface */}
        <div className="flex items-center flex-wrap gap-3 text-sm text-brun-mid" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {bien.chambres && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 22V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v15M1 22h22M3 11h18M9 11v11" />
              </svg>
              {bien.chambres} ch.
            </span>
          )}
          {bien.salles_de_bain && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 12h20v2a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6v-2zM6 12V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2v1" />
              </svg>
              {bien.salles_de_bain} sdb
            </span>
          )}
          {(bien.capacite_max ?? bien.capacite) && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="4" r="2" stroke="#6B4C35" strokeWidth="1.2" />
                <path d="M1.5 13c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="#6B4C35" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {bien.capacite_max ?? bien.capacite} pers.
            </span>
          )}
          {bien.surface && (
            <span className="flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="1" />
                <path d="M9 3v18M3 9h18" />
              </svg>
              {bien.surface} m²
            </span>
          )}
          {bien.prix_nuit && (
            <span className="ml-auto flex-shrink-0">
              <span className="text-terra font-medium text-base" style={{ fontFamily: 'var(--font-cormorant)' }}>
                {bien.prix_nuit}
              </span>
              <span className="text-brun-mid text-xs"> MAD/nuit</span>
            </span>
          )}
        </div>

        {/* Distance mer */}
        {bien.distance_mer && (
          <p className="flex items-center gap-1.5 text-xs text-brun-mid/70" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 16c.5-1 1.5-1.5 3-1.5s2.5.5 3 1.5 1.5 1.5 3 1.5 2.5-.5 3-1.5 1.5-1.5 3-1.5M3 20h18M12 4l3 5H9l3-5zm0 0V9" />
            </svg>
            {bien.distance_mer} de la mer
          </p>
        )}

        {/* Équipements badges */}
        {visibleEquips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleEquips.map((key) => {
              const def = EQUIPEMENTS_MAP[key]
              return (
                <span
                  key={key}
                  className="text-xs px-2.5 py-1 rounded-full bg-creme border border-brun/10 text-brun-mid"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  {def.label.fr}
                </span>
              )
            })}
            {extraCount > 0 && (
              <span
                className="text-xs px-2.5 py-1 rounded-full bg-brun/5 text-brun-mid/70"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                +{extraCount} autres
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="pt-3 mt-auto border-t border-brun/8">
          <Link
            href={`/biens/${bien.id}`}
            className="w-full flex items-center justify-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-6 py-2.5 hover:bg-brun transition-all duration-200"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            Voir les détails
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
