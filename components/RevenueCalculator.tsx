'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

// ─── Données marché El Mansouria / Mohammedia ─────────────────────────────────
// Prix de base par type (avec le nombre de chambres par défaut)
// La piscine est très courante dans la région → déjà intégrée dans le prix de base
const BASE_PRICES: Record<string, number> = {
  Studio:       300,   // 1 chambre — basse saison
  Appartement:  450,   // 2 chambres standard — basse saison (400–500 MAD marché)
  Villa:        700,   // 3 chambres — basse saison
  Autre:        380,
}

// Delta prix selon nombre de chambres (par rapport au défaut du type)
// Le nombre de chambres est le critère le plus impactant
const CHAMBRE_DELTA: Record<string, Record<string, number>> = {
  Studio:       { '1': 0 },
  Appartement:  { '1': -100, '2': 0, '3': 130 },
  Villa:        { '2': -130, '3': 0, '4+': 160 },
  Autre:        { '1': -80,  '2': 0, '3': 100, '4+': 180 },
}

// Bonus options — impact volontairement modéré (piscine = norme dans la région)
const BONUS_PISCINE = 30
const BONUS_MER     = 50
const BONUS_CLIM    = 20

const DEFAULT_CHAMBRES: Record<string, string> = {
  Studio:       '1',
  Appartement:  '2',
  Villa:        '3',
  Autre:        '2',
}

const CHAMBRES_OPTIONS: Record<string, string[]> = {
  Studio:       ['1'],
  Appartement:  ['1', '2', '3'],
  Villa:        ['2', '3', '4+'],
  Autre:        ['1', '2', '3', '4+'],
}

const TYPES = ['Studio', 'Appartement', 'Villa', 'Autre'] as const

const PRESETS = [
  { labelKey: 'presetLow',  nuits: 12 },
  { labelKey: 'presetMid',  nuits: 18 },
  { labelKey: 'presetHigh', nuits: 25 },
] as const

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
}

function calcSuggestedPrice(
  type: string,
  chambres: string,
  piscine: boolean,
  mer: boolean,
  clim: boolean
): number {
  const base  = BASE_PRICES[type] ?? 380
  const delta = CHAMBRE_DELTA[type]?.[chambres] ?? 0
  return base + delta + (piscine ? BONUS_PISCINE : 0) + (mer ? BONUS_MER : 0) + (clim ? BONUS_CLIM : 0)
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
      checked ? 'bg-terra border-terra' : 'border-creme/30 bg-transparent'
    }`}>
      {checked && (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  )
}

export default function RevenueCalculator() {
  const t = useTranslations('calculator')

  const [type,     setType]     = useState<string>('Appartement')
  const [chambres, setChambres] = useState<string>('2')
  const [piscine,  setPiscine]  = useState(false)
  const [mer,      setMer]      = useState(false)
  const [clim,     setClim]     = useState(false)
  const [prixNuit, setPrixNuit] = useState(450)
  const [nuits,    setNuits]    = useState(18)

  useEffect(() => {
    const ch = DEFAULT_CHAMBRES[type] ?? '2'
    setChambres(ch)
    setPrixNuit(calcSuggestedPrice(type, ch, piscine, mer, clim))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  useEffect(() => {
    setPrixNuit(calcSuggestedPrice(type, chambres, piscine, mer, clim))
  }, [chambres, piscine, mer, clim, type])

  const bruts = prixNuit * nuits
  const chambresOpts = CHAMBRES_OPTIONS[type] ?? ['1', '2', '3', '4+']

  const CH_KEYS: Record<string, 'ch1' | 'ch2' | 'ch3' | 'ch4'> = {
    '1': 'ch1', '2': 'ch2', '3': 'ch3', '4+': 'ch4',
  }

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

            {/* Caractéristiques */}
            <div>
              <p className="text-xs font-medium text-creme/50 uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {t('optionsLabel')}
              </p>

              {/* Chambres */}
              <div className="mb-4">
                <p className="text-xs text-creme/40 mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {t('chambresLabel')}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {chambresOpts.map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setChambres(ch)}
                      disabled={chambresOpts.length === 1}
                      className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all duration-150 ${
                        chambres === ch
                          ? 'bg-terra text-creme border-terra'
                          : chambresOpts.length === 1
                          ? 'border-creme/10 text-creme/30 cursor-default'
                          : 'border-creme/20 text-creme/60 hover:border-terra/50 hover:text-creme hover:bg-creme/5'
                      }`}
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      {t(CH_KEYS[ch] ?? 'ch1')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options booléennes — sans affichage du bonus */}
              <div className="flex flex-col gap-2.5">
                {([
                  { key: 'optionPiscine' as const, value: piscine, set: setPiscine },
                  { key: 'optionMer'     as const, value: mer,     set: setMer     },
                  { key: 'optionClim'    as const, value: clim,    set: setClim    },
                ] as const).map(({ key, value, set }) => (
                  <button
                    key={key}
                    onClick={() => set(!value)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                      value
                        ? 'border-terra/60 bg-terra/10'
                        : 'border-creme/15 hover:border-creme/30 hover:bg-creme/5'
                    }`}
                  >
                    <CheckBox checked={value} />
                    <span className="text-sm text-creme/80" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {t(key)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prix / nuit */}
            <div>
              <div className="flex justify-between items-center mb-2">
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
              <p className="text-xs text-creme/30 mb-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {t('priceAdjusted')}
              </p>
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
              {(piscine || mer || clim) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {piscine && (
                    <span className="text-xs bg-terra/20 text-terra px-2 py-0.5 rounded-full" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {t('optionPiscine')}
                    </span>
                  )}
                  {mer && (
                    <span className="text-xs bg-terra/20 text-terra px-2 py-0.5 rounded-full" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {t('optionMer')}
                    </span>
                  )}
                  {clim && (
                    <span className="text-xs bg-terra/20 text-terra px-2 py-0.5 rounded-full" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {t('optionClim')}
                    </span>
                  )}
                </div>
              )}
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
