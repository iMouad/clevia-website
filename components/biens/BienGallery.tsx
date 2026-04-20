'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

function gdriveEmbed(url: string): string {
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (m1) return `https://drive.google.com/file/d/${m1[1]}/preview`
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (m2) return `https://drive.google.com/file/d/${m2[1]}/preview`
  return url
}

type Props = {
  photos: string[]
  nom: string
  videoUrl?: string | null
}

function LightboxOverlay({ photos, nom, idx, onClose, onPrev, onNext, onGoTo }: {
  photos: string[]; nom: string; idx: number
  onClose: () => void; onPrev: () => void; onNext: () => void; onGoTo: (i: number) => void
}) {
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) { diff > 0 ? onNext() : onPrev() }
    touchStartX.current = null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-white/60 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {nom}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {idx + 1} / {photos.length}
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            aria-label="Fermer"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image principale */}
      <div className="flex-1 relative flex items-center justify-center px-14 min-h-0" onClick={onClose}>
        <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0"
            >
              <Image
                src={photos[idx]}
                alt={`${nom} — ${idx + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPrev() }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all"
              aria-label="Photo précédente"
            >
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNext() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all"
              aria-label="Photo suivante"
            >
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M5 2l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails strip */}
      {photos.length > 1 && (
        <div className="flex-shrink-0 px-4 pb-4 pt-2">
          <div className="flex gap-2 overflow-x-auto justify-center">
            {photos.map((p, i) => (
              <button
                key={i}
                onClick={() => onGoTo(i)}
                className={`relative flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden transition-all ${i === idx ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-80'}`}
              >
                <Image src={p} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function BienGallery({ photos, nom, videoUrl }: Props) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [videoActive, setVideoActive] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const videoEmbed = videoUrl ? gdriveEmbed(videoUrl) : null
  const totalSlides = photos.length + (videoEmbed ? 1 : 0)
  const isVideoSlide = !!videoEmbed && carouselIdx === photos.length

  useEffect(() => {
    if (!isVideoSlide) setVideoActive(false)
  }, [carouselIdx, isVideoSlide])

  const hasPhotos = photos.length > 0
  const main = photos[0] ?? null
  const thumbs = photos.slice(1, 5)

  function prevCarousel() { setCarouselIdx((i) => (i - 1 + totalSlides) % totalSlides) }
  function nextCarousel() { setCarouselIdx((i) => (i + 1) % totalSlides) }
  function prevLightbox() { setLightboxIdx((i) => ((i ?? 0) - 1 + photos.length) % photos.length) }
  function nextLightbox() { setLightboxIdx((i) => ((i ?? 0) + 1) % photos.length) }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) { diff > 0 ? nextCarousel() : prevCarousel() }
    touchStartX.current = null
  }

  if (!hasPhotos && !videoEmbed) {
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
      {/* ── Desktop: grille Airbnb ── */}
      {hasPhotos && (
        <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden">
          <div
            className="col-span-2 row-span-2 relative cursor-pointer group"
            onClick={() => setLightboxIdx(0)}
          >
            <Image src={main!} alt={nom} fill className="object-cover group-hover:brightness-95 transition-all" />
            {photos.length > 5 && (
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-brun text-xs font-medium px-3 py-1.5 rounded-full shadow-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                +{photos.length - 5} photos
              </div>
            )}
          </div>
          {Array.from({ length: 4 }).map((_, i) => {
            const photo = thumbs[i]
            if (!photo) return <div key={i} className="relative bg-brun/5" />
            return (
              <div key={i} className="relative cursor-pointer group" onClick={() => setLightboxIdx(i + 1)}>
                <Image src={photo} alt={`${nom} — photo ${i + 2}`} fill className="object-cover group-hover:brightness-95 transition-all" />
              </div>
            )
          })}
        </div>
      )}

      {/* ── Desktop: Vidéo ── */}
      {videoEmbed && (
        <div
          className="hidden md:block mt-4 rounded-2xl overflow-hidden bg-brun"
          style={{ aspectRatio: '16/9', maxHeight: '480px' }}
        >
          <iframe
            src={videoEmbed}
            className="w-full h-full"
            allow="autoplay"
            allowFullScreen
            title={`Vidéo — ${nom}`}
          />
        </div>
      )}

      {/* ── Mobile: carousel ── */}
      <div
        className="md:hidden relative aspect-[4/3] rounded-2xl overflow-hidden bg-brun/5"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          {isVideoSlide ? (
            <motion.div
              key="video"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-brun"
            >
              {videoActive ? (
                <iframe
                  src={videoEmbed!}
                  className="w-full h-full"
                  allow="autoplay"
                  allowFullScreen
                  title={`Vidéo — ${nom}`}
                />
              ) : (
                <button
                  onClick={() => setVideoActive(true)}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="text-white/80 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Regarder la vidéo
                  </span>
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={carouselIdx}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              {photos[carouselIdx] && (
                <Image
                  src={photos[carouselIdx]}
                  alt={`${nom} — ${carouselIdx + 1}`}
                  fill
                  className="object-cover"
                  onClick={() => setLightboxIdx(carouselIdx)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {totalSlides > 1 && (
          <>
            <button
              onClick={prevCarousel}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm z-10"
              aria-label="Précédent"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="#2C1A0E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={nextCarousel}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm z-10"
              aria-label="Suivant"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2l5 5-5 5" stroke="#2C1A0E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 pointer-events-none z-10">
              {Array.from({ length: Math.min(totalSlides, 9) }).map((_, i) => (
                <span
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === carouselIdx
                      ? (videoEmbed && i === photos.length ? 'w-4 h-1.5 bg-terra' : 'w-4 h-1.5 bg-white')
                      : 'w-1.5 h-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>

            <div className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm z-10" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {isVideoSlide ? '▶ vidéo' : `${carouselIdx + 1}/${photos.length}`}
            </div>
          </>
        )}
      </div>

      {/* ── Lightbox full-screen ── */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <LightboxOverlay
            photos={photos}
            nom={nom}
            idx={lightboxIdx}
            onClose={() => setLightboxIdx(null)}
            onPrev={prevLightbox}
            onNext={nextLightbox}
            onGoTo={setLightboxIdx}
          />
        )}
      </AnimatePresence>
    </>
  )
}
