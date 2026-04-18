'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  photos: string[]
  nom: string
}

export default function BienGallery({ photos, nom }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [carouselIdx, setCarouselIdx] = useState(0)

  const hasPhotos = photos.length > 0
  const main = photos[0] ?? null
  const thumbs = photos.slice(1, 5)

  function openLightbox(i: number) { setLightboxIdx(i) }
  function closeLightbox() { setLightboxIdx(null) }
  function prevLightbox() { setLightboxIdx((i) => ((i ?? 0) - 1 + photos.length) % photos.length) }
  function nextLightbox() { setLightboxIdx((i) => ((i ?? 0) + 1) % photos.length) }

  function prevCarousel() { setCarouselIdx((i) => (i - 1 + photos.length) % photos.length) }
  function nextCarousel() { setCarouselIdx((i) => (i + 1) % photos.length) }

  if (!hasPhotos) {
    return (
      <div className="w-full aspect-[16/7] bg-brun/5 rounded-2xl flex items-center justify-center">
        <svg className="text-brun/15" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    )
  }

  return (
    <>
      {/* ── Desktop: Airbnb grid (hidden on mobile) ── */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden">
        {/* Main photo — spans 2 cols + 2 rows */}
        <div
          className="col-span-2 row-span-2 relative cursor-pointer group"
          onClick={() => openLightbox(0)}
        >
          <Image src={main!} alt={nom} fill className="object-cover group-hover:brightness-95 transition-all" />
          {photos.length > 5 && (
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-brun text-xs font-medium px-3 py-1.5 rounded-full shadow-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              +{photos.length - 5} photos
            </div>
          )}
        </div>

        {/* Thumbnails — fill remaining 4 slots */}
        {Array.from({ length: 4 }).map((_, i) => {
          const photo = thumbs[i]
          if (!photo) {
            return <div key={i} className="relative bg-brun/5" />
          }
          return (
            <div
              key={i}
              className="relative cursor-pointer group"
              onClick={() => openLightbox(i + 1)}
            >
              <Image src={photo} alt={`${nom} — photo ${i + 2}`} fill className="object-cover group-hover:brightness-95 transition-all" />
            </div>
          )
        })}
      </div>

      {/* ── Mobile: carousel (visible only on mobile) ── */}
      <div className="md:hidden relative aspect-[4/3] rounded-2xl overflow-hidden bg-brun/5">
        <AnimatePresence mode="wait">
          <motion.div
            key={carouselIdx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            <Image
              src={photos[carouselIdx]}
              alt={`${nom} — ${carouselIdx + 1}`}
              fill
              className="object-cover"
              onClick={() => openLightbox(carouselIdx)}
            />
          </motion.div>
        </AnimatePresence>

        {photos.length > 1 && (
          <>
            <button
              onClick={prevCarousel}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm z-10"
              aria-label="Photo précédente"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="#2C1A0E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={nextCarousel}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm z-10"
              aria-label="Photo suivante"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2l5 5-5 5" stroke="#2C1A0E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 pointer-events-none z-10">
              {photos.slice(0, 8).map((_, i) => (
                <span
                  key={i}
                  className={`rounded-full transition-all duration-300 ${i === carouselIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                />
              ))}
            </div>
            <div className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm z-10" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {carouselIdx + 1}/{photos.length}
            </div>
          </>
        )}
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <div className="relative w-full max-w-4xl aspect-[4/3]" onClick={(e) => e.stopPropagation()}>
              <Image
                src={photos[lightboxIdx]}
                alt={`${nom} — ${lightboxIdx + 1}`}
                fill
                className="object-contain"
              />

              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevLightbox}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                    aria-label="Photo précédente"
                  >
                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                      <path d="M9 2L4 7l5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    onClick={nextLightbox}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                    aria-label="Photo suivante"
                  >
                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                      <path d="M5 2l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </>
              )}

              <div className="absolute top-3 inset-x-0 flex justify-center">
                <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {lightboxIdx + 1} / {photos.length}
                </span>
              </div>
            </div>

            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
              aria-label="Fermer"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
