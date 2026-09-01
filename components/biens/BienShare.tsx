'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function BienShare({ nom, url }: { nom: string; url: string }) {
  const t = useTranslations('biens')
  const [copied, setCopied] = useState(false)

  const waText = encodeURIComponent(`${nom} — ${url}`)
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="border-t border-brun/8 pt-4 flex flex-col gap-2">
      <p className="text-xs text-brun-mid/50 text-center mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
        {t('partager')}
      </p>
      <div className="flex gap-2">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full text-white hover:opacity-85 transition-opacity"
          style={{ backgroundColor: '#25D366', fontFamily: 'var(--font-dm-sans)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12.05 2C6.495 2 2.01 6.485 2 12.044c-.004 1.99.521 3.931 1.516 5.637L2 22l4.49-1.494a10.063 10.063 0 005.557 1.638h.005C17.604 22.144 22 17.659 22 12.1 22 9.407 20.956 6.87 19.064 4.976A9.958 9.958 0 0012.05 2z" />
          </svg>
          WhatsApp
        </a>

        {/* Facebook */}
        <a
          href={fbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full text-white hover:opacity-85 transition-opacity"
          style={{ backgroundColor: '#1877F2', fontFamily: 'var(--font-dm-sans)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </a>

        {/* Copier le lien */}
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-brun/20 text-brun-mid hover:border-terra hover:text-terra transition-all"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          {copied ? t('lienCopie') : t('copierLien')}
        </button>
      </div>
    </div>
  )
}
