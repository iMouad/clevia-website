'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

const TYPE_DEFAULTS: Record<string, number> = {
  Studio: 280,
  Appartement: 450,
  Villa: 900,
  Autre: 400,
}

const TYPES = ['Studio', 'Appartement', 'Villa', 'Autre'] as const

const PRESETS = [
  { labelKey: 'presetLow', nuits: 12 },
  { labelKey: 'presetMid', nuits: 18 },
  { labelKey: 'presetHigh', nuits: 25 },
] as const

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
}

export default function RevenueCalculator() {
  const t = useTranslations('calculator')
  const [type, setType] = useState<string>('Appartement')
  const [prixNuit, setPrixNuit] = useState(450)
  const [nuits, setNuits] = useState(18)

  useEffect(() => {
    setPrixNuit(TYPE_DEFAULTS[type])
  }, [type])

  const bruts = prixNuit * nuits

  return (
    <section className="bg-creme py-24 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-4"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {t('tag')}
          </span>
          <h2 className="text-4xl md:text-5xl text-brun mb-4">{t('title')}</h2>
          <p className="text-brun-mid max-w-md mx-auto leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {t('subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">

          {/* ── Left: Inputs ── */}
          <div className="bg-white rounded-2xl p-8 border border-brun/10 shadow-sm flex flex-col gap-7">

            {/* Type de bien */}
            <div>
              <p className="text-xs font-medium text-brun-mid uppercase tracking-wide mb-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {t('typeLabel')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((tp) => (
                  <button
                    key={tp}
                    onClick={() => setType(tp)}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 ${
                      type === tp
                        ? 'bg-terra text-creme border-terra'
                        : 'border-brun/20 text-brun-mid hover:border-terra hover:text-terra'
                    }`}
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {tp}
                  </button>
                ))}
              </div>
            </div>

            {/* Prix / nuit */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs font-medium text-brun-mid uppercase tracking-wide" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {t('priceLabel')}
                </p>
                <span className="text-terra font-medium text-sm tabular-nums" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {prixNuit} MAD
                </span>
              </div>
              <input
                type="range" min={100} max={1500} step={25} value={prixNuit}
                onChange={(e) => setPrixNuit(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#C97B4B' }}
              />
              <div className="flex justify-between text-xs text-brun-mid/40 mt-1.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <span>100</span><span>1 500 MAD</span>
              </div>
            </div>

            {/* Nuits / mois */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs font-medium text-brun-mid uppercase tracking-wide" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {t('nightsLabel')}
                </p>
                <span className="text-terra font-medium text-sm tabular-nums" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {nuits} {t('nights')}
                </span>
              </div>

              {/* Preset buttons */}
              <div className="flex gap-2 mb-3">
                {PRESETS.map(({ labelKey, nuits: n }) => (
                  <button
                    key={labelKey}
                    onClick={() => setNuits(n)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      nuits === n
                        ? 'bg-terra/10 border-terra text-terra'
                        : 'border-brun/15 text-brun-mid/60 hover:border-brun/30'
                    }`}
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>

              <input
                type="range" min={5} max={28} step={1} value={nuits}
                onChange={(e) => setNuits(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#C97B4B' }}
              />
              <div className="flex justify-between text-xs text-brun-mid/40 mt-1.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <span>5</span><span>28 {t('nights')}</span>
              </div>
            </div>
          </div>

          {/* ── Right: Results ── */}
          <div className="flex flex-col gap-4">

            {/* Main result card */}
            <div className="bg-brun rounded-2xl p-8 text-center">
              <p className="text-creme/50 text-xs uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {t('brutsLabel')}
              </p>
              <p
                className="text-7xl text-terra leading-none"
                style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}
              >
                {fmt(bruts)}
              </p>
              <p className="text-creme/50 text-sm mt-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                MAD / {t('month')}
              </p>
            </div>

            {/* Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-brun/10 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-brun-mid" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('priceLabel')}</span>
                <span className="text-brun tabular-nums" style={{ fontFamily: 'var(--font-dm-sans)' }}>{prixNuit} MAD × {nuits} {t('nights')}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-brun/8">
                <span className="text-brun font-medium text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('brutsLabel')}</span>
                <span className="text-terra font-medium tabular-nums" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.2rem' }}>{fmt(bruts)} MAD</span>
              </div>
            </div>

            {/* Commission note */}
            <div className="flex items-start gap-3 bg-terra/8 border border-terra/20 rounded-xl px-4 py-3">
              <svg className="text-terra flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#C97B4B" strokeWidth="1.2" />
                <path d="M8 7v4M8 5.5v.5" stroke="#C97B4B" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <p className="text-terra/80 text-xs leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {t('commissionNote')}
              </p>
            </div>

            <p className="text-xs text-brun-mid/40 text-center leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('disclaimer')}
            </p>

            <Link
              href="/contact"
              className="bg-terra text-creme font-medium rounded-full px-8 py-3.5 text-center hover:bg-brun transition-all duration-200"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {t('cta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
