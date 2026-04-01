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
    <section className="bg-brun py-24 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block text-sable text-xs font-medium tracking-[0.2em] uppercase mb-4"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {t('tag')}
          </span>
          <h2 className="text-4xl md:text-5xl text-creme mb-4">{t('title')}</h2>
          <p className="text-creme/60 max-w-md mx-auto leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {t('subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">

          {/* ── Left: Inputs ── */}
          <div className="bg-white/8 border border-creme/15 rounded-2xl p-8 flex flex-col gap-7">

            {/* Type de bien */}
            <div>
              <p className="text-xs font-medium text-creme/50 uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {t('typeLabel')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((tp) => (
                  <button
                    key={tp}
                    onClick={() => setType(tp)}
                    className={`py-3 rounded-xl text-sm font-medium border transition-all duration-150 ${
                      type === tp
                        ? 'bg-terra text-creme border-terra shadow-md'
                        : 'border-creme/20 text-creme/70 hover:border-terra/60 hover:text-creme hover:bg-creme/5'
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
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-medium text-creme/50 uppercase tracking-widest" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {t('priceLabel')}
                </p>
                <span
                  className="text-terra font-medium text-lg tabular-nums"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {prixNuit} MAD
                </span>
              </div>
              <input
                type="range" min={100} max={1500} step={25} value={prixNuit}
                onChange={(e) => setPrixNuit(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#C97B4B' }}
              />
              <div className="flex justify-between text-xs text-creme/30 mt-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <span>100 MAD</span><span>1 500 MAD</span>
              </div>
            </div>

            {/* Nuits / mois */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-medium text-creme/50 uppercase tracking-widest" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {t('nightsLabel')}
                </p>
                <span
                  className="text-terra font-medium text-lg tabular-nums"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {nuits} {t('nights')}
                </span>
              </div>

              {/* Preset buttons */}
              <div className="flex gap-2 mb-4">
                {PRESETS.map(({ labelKey, nuits: n }) => (
                  <button
                    key={labelKey}
                    onClick={() => setNuits(n)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                      nuits === n
                        ? 'bg-terra/20 border-terra text-terra'
                        : 'border-creme/20 text-creme/50 hover:border-creme/40 hover:text-creme/80'
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
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#C97B4B' }}
              />
              <div className="flex justify-between text-xs text-creme/30 mt-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <span>5 {t('nights')}</span><span>28 {t('nights')}</span>
              </div>
            </div>
          </div>

          {/* ── Right: Results ── */}
          <div className="flex flex-col gap-4">

            {/* Main result card */}
            <div className="bg-terra rounded-2xl p-10 text-center">
              <p className="text-white/70 text-xs uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {t('brutsLabel')}
              </p>
              <p
                className="text-8xl text-white leading-none"
                style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}
              >
                {fmt(bruts)}
              </p>
              <p className="text-white/60 text-sm mt-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                MAD / {t('month')}
              </p>
            </div>

            {/* Breakdown */}
            <div className="bg-white/8 border border-creme/15 rounded-2xl p-6 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-creme/50" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('priceLabel')}</span>
                <span className="text-creme/80 tabular-nums" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {prixNuit} MAD × {nuits} {t('nights')}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-creme/10">
                <span className="text-creme font-medium text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('brutsLabel')}</span>
                <span className="text-terra font-medium tabular-nums" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.25rem' }}>
                  {fmt(bruts)} MAD
                </span>
              </div>
            </div>

            {/* Commission note */}
            <div className="flex items-start gap-3 bg-sable/10 border border-sable/25 rounded-xl px-4 py-3.5">
              <svg className="flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#E8A87C" strokeWidth="1.2" />
                <path d="M8 7v4M8 5.5v.5" stroke="#E8A87C" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <p className="text-sable text-xs leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {t('commissionNote')}
              </p>
            </div>

            <p className="text-xs text-creme/25 text-center leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('disclaimer')}
            </p>

            <Link
              href="/contact"
              className="bg-creme text-brun font-medium rounded-full px-8 py-3.5 text-center hover:bg-white transition-all duration-200"
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
