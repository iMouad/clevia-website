'use client'

import { useState } from 'react'
import Image from 'next/image'

export type BienPublic = {
  id: string
  nom: string
  ville: string | null
  adresse: string | null
  type: string | null
  capacite: number | null
  prix_nuit: number | null
  description: string | null
  photos: string[] | null
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

const PLATFORMS = [
  { key: 'airbnb',   label: 'Airbnb',       color: '#FF5A5F' },
  { key: 'booking',  label: 'Booking.com',  color: '#003580' },
  { key: 'avito',    label: 'Avito',        color: '#E07A2F' },
] as const

export default function BienCard({ bien }: { bien: BienPublic }) {
  const photos = (bien.photos ?? []).filter(Boolean)
  const [idx, setIdx] = useState(0)

  const platforms = PLATFORMS.map((p) => ({
    ...p,
    url: bien[`${p.key}_url` as keyof BienPublic] as string | null,
  })).filter((p) => p.url)

  function prev(e: React.MouseEvent) {
    e.stopPropagation()
    setIdx((i) => (i - 1 + photos.length) % photos.length)
  }
  function next(e: React.MouseEvent) {
    e.stopPropagation()
    setIdx((i) => (i + 1) % photos.length)
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-brun/8 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group">

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
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-white"
                  aria-label="Photo précédente"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9 2L4 7l5 5" stroke="#2C1A0E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-white"
                  aria-label="Photo suivante"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 2l5 5-5 5" stroke="#2C1A0E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Dots */}
                <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
                  {photos.map((_, i) => (
                    <span
                      key={i}
                      className={`rounded-full transition-all duration-300 ${
                        i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                      }`}
                    />
                  ))}
                </div>

                {/* Counter badge */}
                <div className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
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
          <div className="absolute top-3 left-3">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[bien.type] ?? 'bg-white/80 text-brun'}`}
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {bien.type}
            </span>
          </div>
        )}
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

        {/* Stats row */}
        <div className="flex items-center gap-3 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {bien.capacite && (
            <span className="flex items-center gap-1.5 text-brun-mid">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="4" r="2" stroke="#6B4C35" strokeWidth="1.2" />
                <path d="M1.5 13c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5" stroke="#6B4C35" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {bien.capacite} pers.
            </span>
          )}
          {bien.prix_nuit && (
            <span className="ml-auto">
              <span className="text-terra font-medium text-base" style={{ fontFamily: 'var(--font-cormorant)' }}>
                {bien.prix_nuit}
              </span>
              <span className="text-brun-mid text-xs"> MAD/nuit</span>
            </span>
          )}
        </div>

        {/* Description */}
        {bien.description && (
          <p className="text-brun-mid/70 text-sm leading-relaxed line-clamp-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {bien.description}
          </p>
        )}

        {/* Platform booking buttons */}
        {platforms.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-auto border-t border-brun/8">
            <span className="text-xs text-brun-mid/40 mr-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Réserver :
            </span>
            {platforms.map(({ key, url, label, color }) => (
              <a
                key={key}
                href={url!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium px-3 py-1.5 rounded-full text-white hover:opacity-85 transition-opacity"
                style={{ backgroundColor: color, fontFamily: 'var(--font-dm-sans)' }}
              >
                {label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
