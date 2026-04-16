import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/ui/AnimateIn'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import HomeBiensSection from '@/components/HomeBiensSection'
import RevenueCalculator from '@/components/RevenueCalculator'
import TemoignagesSection from '@/components/TemoignagesSection'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'hero' })
  return {
    title: 'Clévia Conciergerie · Maroc',
    description: t('subtitle'),
    openGraph: { url: `/${locale}` },
    alternates: { canonical: `/${locale}` },
  }
}

// ── Icons ────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="9" fill="#C97B4B" fillOpacity="0.15" />
      <path d="M5 9l3 3 5-5" stroke="#C97B4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Service icons ─────────────────────────────────────
const serviceIcons: Record<string, React.ReactNode> = {
  publication: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="14" rx="2" />
      <path d="M7 21h10M12 17v4" />
    </svg>
  ),
  accueil: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  reporting: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ),
  menage: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l3.5 6.5L22 9.5l-5 4.9 1.2 6.9L12 18l-6.2 3.3L7 14.4 2 9.5l6.5-1L12 2z" />
    </svg>
  ),
}

// ── Page Component ────────────────────────────────────
export default function HomePage() {
  const t = useTranslations()

  const services = [
    { key: 'publication', icon: serviceIcons.publication },
    { key: 'accueil', icon: serviceIcons.accueil },
    { key: 'reporting', icon: serviceIcons.reporting },
    { key: 'menage', icon: serviceIcons.menage },
  ]

  return (
    <>
      {/* ── HERO ────────────────────────────────── */}
      <section className="bg-creme py-20 md:py-28 px-4 overflow-hidden relative">
        {/* Decorative gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 75% 50%, rgba(201,123,75,0.08) 0%, transparent 65%)',
          }}
        />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left content */}
            <div className="flex flex-col gap-6">
              <AnimateIn>
                <span className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase">
                  {t('hero.tag')}
                </span>
              </AnimateIn>

              <AnimateIn delay={0.1}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl leading-tight text-brun">
                  {t('hero.title')}
                  <br />
                  <em className="text-terra not-italic" style={{ fontStyle: 'italic', fontFamily: 'var(--font-cormorant)' }}>
                    {t('hero.titleEmphasis')}
                  </em>
                </h1>
              </AnimateIn>

              <AnimateIn delay={0.2}>
                <p className="text-brun-mid text-lg leading-relaxed max-w-lg" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {t('hero.subtitle')}
                </p>
              </AnimateIn>

              <AnimateIn delay={0.3}>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 bg-terra text-creme font-medium rounded-full px-8 py-3 hover:bg-brun transition-all duration-200"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {t('hero.cta1')}
                    <ArrowRight />
                  </Link>
                  <Link
                    href="/comment"
                    className="inline-flex items-center gap-2 border-2 border-brun text-brun font-medium rounded-full px-8 py-3 hover:bg-brun hover:text-creme transition-all duration-200"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {t('hero.cta2')}
                  </Link>
                </div>
              </AnimateIn>

              {/* Platform badges */}
              <AnimateIn delay={0.4}>
                <div className="flex items-center gap-3 flex-wrap pt-2">
                  <span className="text-brun-mid text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {t('stats.platforms')} :
                  </span>
                  {/* Airbnb */}
                  <div className="flex items-center gap-1.5 border border-brun/15 rounded-full px-3 py-1.5 bg-white shadow-xs">
                    <svg width="14" height="14" viewBox="0 0 32 32" fill="#FF5A5F">
                      <path d="M16 1C10.477 1 6 5.477 6 11c0 3.518 1.946 6.614 4.857 8.32L16 31l5.143-11.68C24.054 17.614 26 14.518 26 11c0-5.523-4.477-10-10-10zm0 13.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/>
                    </svg>
                    <span className="text-xs font-medium text-[#FF5A5F]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Airbnb</span>
                  </div>
                  {/* Booking */}
                  <div className="flex items-center gap-1.5 border border-brun/15 rounded-full px-3 py-1.5 bg-white shadow-xs">
                    <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                      <rect width="32" height="32" rx="6" fill="#003580"/>
                      <text x="5" y="23" fontSize="20" fontWeight="bold" fill="white" fontFamily="Arial">B</text>
                    </svg>
                    <span className="text-xs font-medium text-[#003580]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Booking</span>
                  </div>
                  {/* Avito */}
                  <div className="flex items-center gap-1.5 border border-brun/15 rounded-full px-3 py-1.5 bg-white shadow-xs">
                    <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
                      <rect width="32" height="32" rx="6" fill="#E07A2F"/>
                      <text x="6" y="23" fontSize="20" fontWeight="bold" fill="white" fontFamily="Arial">A</text>
                    </svg>
                    <span className="text-xs font-medium text-[#E07A2F]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Avito</span>
                  </div>
                </div>
              </AnimateIn>
            </div>

            {/* Right: Stats card */}
            <AnimateIn delay={0.2} className="lg:flex lg:justify-end">
              <div className="bg-white rounded-2xl p-8 shadow-md border border-brun/10 w-full max-w-sm">
                <div className="flex flex-col divide-y divide-brun/8">
                  {[
                    { value: '+15', label: t('stats.days'), sub: t('stats.daysLabel') },
                    { value: '48h', label: t('stats.commission'), sub: t('stats.commissionLabel') },
                    { value: '7j/7', label: t('stats.stress'), sub: t('stats.stressLabel') },
                  ].map(({ value, label, sub }) => (
                    <div key={value} className="py-5 first:pt-0 last:pb-0">
                      <div className="flex items-baseline gap-3">
                        <span
                          className="text-4xl text-terra"
                          style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}
                        >
                          {value}
                        </span>
                        <span className="text-brun text-sm font-medium leading-tight" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          {label}
                        </span>
                      </div>
                      <p className="text-brun-mid/60 text-xs mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {sub}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── SERVICES PREVIEW ────────────────────── */}
      <section className="bg-creme py-24 px-4 border-t border-brun/5">
        <div className="max-w-7xl mx-auto">
          <AnimateIn className="text-center mb-16">
            <span className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('services.tag')}
            </span>
            <h2 className="text-4xl md:text-5xl text-brun mb-4">{t('services.title')}</h2>
            <p className="text-brun-mid max-w-xl mx-auto leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('services.subtitle')}
            </p>
          </AnimateIn>

          <StaggerContainer className="grid sm:grid-cols-2 gap-6 mb-10">
            {services.map(({ key, icon }) => (
              <StaggerItem key={key}>
                <div className="bg-white border border-brun/10 rounded-2xl p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 h-full">
                  <div className="text-terra mb-4">{icon}</div>
                  <h3 className="text-xl text-brun mb-2">{t(`services.items.${key}.title` as any)}</h3>
                  <p className="text-brun-mid text-sm leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {t(`services.items.${key}.description` as any)}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <AnimateIn className="text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 border border-terra text-terra font-medium rounded-full px-6 py-2 hover:bg-terra hover:text-white transition-all duration-200"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {t('services.cta')} <ArrowRight />
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* ── NOS BIENS ───────────────────────────── */}
      <HomeBiensSection />

      {/* ── CALCULATEUR DE REVENUS ──────────────── */}
      <RevenueCalculator showLeadCapture />

      {/* ── TÉMOIGNAGES ─────────────────────────── */}
      <TemoignagesSection />

      {/* ── POURQUOI (dark) ──────────────────────── */}
      <section className="bg-brun py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <div>
              <AnimateIn>
                <span className="inline-block text-sable text-xs font-medium tracking-[0.2em] uppercase mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {t('why.tag')}
                </span>
                <h2 className="text-4xl md:text-5xl text-creme mb-8">{t('why.title')}</h2>
              </AnimateIn>

              <AnimateIn delay={0.1}>
                <ul className="flex flex-col gap-4">
                  {(['contract', 'report', 'commission', 'noFees'] as const).map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <CheckIcon />
                      <span className="text-creme/80 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {t(`why.list.${item}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </AnimateIn>
            </div>

            {/* Right: stat cards */}
            <div className="flex flex-col gap-4">
              <AnimateIn delay={0.1}>
                <div className="bg-creme/10 border border-creme/20 rounded-2xl p-8">
                  <p className="text-5xl text-terra mb-2" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                    {t('why.bigStats.biens')}
                  </p>
                  <p className="text-creme/70 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {t('why.bigStats.biensLabel')}
                  </p>
                </div>
              </AnimateIn>
              <AnimateIn delay={0.2}>
                <div className="bg-terra/20 border border-terra/30 rounded-2xl p-8">
                  <p className="text-5xl text-sable mb-2" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                    {t('why.bigStats.nuits')}
                  </p>
                  <p className="text-creme/70 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {t('why.bigStats.nuitsLabel')}
                  </p>
                </div>
              </AnimateIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ─────────────────────────────── */}
      <section className="bg-creme py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <AnimateIn className="text-center mb-16">
            <span className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('process.tag')}
            </span>
            <h2 className="text-4xl md:text-5xl text-brun">{t('process.title')}</h2>
          </AnimateIn>

          <StaggerContainer className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-terra/20" />

            {(['step1', 'step2', 'step3'] as const).map((step, i) => (
              <StaggerItem key={step}>
                <div className="flex flex-col items-center text-center gap-4 relative">
                  <div className="w-20 h-20 rounded-full bg-terra/10 border border-terra/20 flex items-center justify-center relative z-10">
                    <span
                      className="text-terra text-2xl"
                      style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300 }}
                    >
                      {t(`process.${step}.number`)}
                    </span>
                  </div>
                  <h3 className="text-xl text-brun">{t(`process.${step}.title`)}</h3>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────── */}
      <section className="bg-terra py-20 px-4">
        <AnimateIn className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl text-white mb-4">{t('cta.title')}</h2>
          <p className="text-white/80 mb-8 text-lg" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {t('cta.subtitle')}
          </p>
          <Link
            href="/contact"
            className="inline-block bg-white text-terra font-medium rounded-full px-10 py-4 hover:bg-creme transition-all duration-200 text-base"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {t('cta.button')}
          </Link>
        </AnimateIn>
      </section>
    </>
  )
}
