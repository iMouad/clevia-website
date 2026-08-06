import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/ui/AnimateIn'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import HomeBiensSection from '@/components/HomeBiensSection'
import HomeBiensVenteSection from '@/components/HomeBiensVenteSection'
import RevenueCalculator from '@/components/RevenueCalculator'
import TemoignagesSection from '@/components/TemoignagesSection'
import CounterAnimation from '@/components/ui/CounterAnimation'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'hero' })
  const siteUrl = 'https://www.cleviamaroc.com'
  return {
    title: 'Clévia Immobilier - Conciergerie · Maroc',
    description: t('subtitle'),
    openGraph: {
      url: `${siteUrl}/${locale}`,
      title: 'Clévia Immobilier - Conciergerie · Maroc',
      description: t('subtitle'),
    },
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        'fr': `${siteUrl}/fr`,
        'ar': `${siteUrl}/ar`,
        'en': `${siteUrl}/en`,
        'x-default': `${siteUrl}/fr`,
      },
    },
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
  photo: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  maintenance: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
}

// ── Simulateur Banner ─────────────────────────────────
function SimulateurBanner() {
  const t = useTranslations('simulateur.hero')
  return (
    <section className="bg-terra py-16 px-4 overflow-hidden relative">
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{ background: 'radial-gradient(ellipse at 80% 50%, #FAF6F1 0%, transparent 60%)' }}
      />
      <div className="max-w-7xl mx-auto relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <span
              className="inline-block text-white/70 text-xs font-medium tracking-[0.2em] uppercase mb-3"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {t('tag')}
            </span>
            <h2
              className="text-3xl md:text-4xl text-white mb-3"
              style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}
            >
              {t('title')}
            </h2>
            <p className="text-white/80 max-w-md" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('subtitle')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <a
              href="#simulateur"
              className="inline-flex items-center justify-center gap-2 bg-white text-terra font-medium rounded-full px-8 py-3.5 hover:bg-creme transition-all duration-200"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 7h6M9 11h6M9 15h4M5 3h14a2 2 0 012 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 012-2z" />
              </svg>
              {t('cta')}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Page Component ────────────────────────────────────
export default function HomePage() {
  const t = useTranslations()

  const services = [
    { key: 'publication', icon: serviceIcons.publication },
    { key: 'photo', icon: serviceIcons.photo },
    { key: 'accueil', icon: serviceIcons.accueil },
    { key: 'menage', icon: serviceIcons.menage },
    { key: 'reporting', icon: serviceIcons.reporting },
    { key: 'maintenance', icon: serviceIcons.maintenance },
  ]

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Clévia Immobilier - Conciergerie',
    description: 'Conciergerie de location courte durée à Mansouria-Mohammedia, Maroc. Gestion complète de votre bien sur Airbnb, Booking et Avito.',
    url: 'https://www.cleviamaroc.com',
    logo: 'https://www.cleviamaroc.com/logo.svg',
    image: 'https://www.cleviamaroc.com/logo.svg',
    telephone: '+212614268283',
    email: 'contact@cleviamaroc.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Mohammedia',
      addressRegion: 'Casablanca-Settat',
      addressCountry: 'MA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 33.7300,
      longitude: -7.3900,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    priceRange: '$$',
    areaServed: [
      { '@type': 'City', name: 'Mohammedia' },
      { '@type': 'City', name: 'Mansouria' },
      { '@type': 'City', name: 'Bouznika' },
      { '@type': 'City', name: 'Benslimane' },
    ],
    sameAs: [
      'https://www.instagram.com/cleviamaroc',
      'https://www.facebook.com/cleviamaroc',
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      {/* ── HERO ────────────────────────────────── */}
      <section className="bg-creme py-28 md:py-36 lg:py-44 px-4 overflow-hidden relative">
        {/* Decorative gradients */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 20% 80%, rgba(201,123,75,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(201,123,75,0.08) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] pointer-events-none opacity-[0.03]"
          style={{
            background: 'radial-gradient(circle, #2C1A0E, transparent 70%)',
          }}
        />

        <div className="max-w-4xl mx-auto relative text-center">
          <AnimateIn>
            <span
              className="inline-block text-terra text-xs font-medium tracking-[0.25em] uppercase mb-8 border border-terra/20 rounded-full px-5 py-2 bg-terra/5"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {t('hero.tag')}
            </span>
          </AnimateIn>

          <AnimateIn delay={0.1}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.15] text-brun mb-8">
              {t('hero.title')}
              <span className="text-brun/30 mx-2 font-light" aria-hidden="true">—</span>
              <span
                className="text-terra relative inline-block"
                style={{ fontStyle: 'italic', fontFamily: 'var(--font-cormorant)' }}
              >
                {t('hero.titleEmphasis')}
                <span
                  className="absolute -bottom-1 left-0 w-full h-[3px] rounded-full bg-terra/30"
                  aria-hidden="true"
                />
              </span>
            </h1>
          </AnimateIn>

          <AnimateIn delay={0.2}>
            <p className="text-brun-mid text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('hero.subtitle')}
            </p>
          </AnimateIn>

          <AnimateIn delay={0.3}>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-terra text-creme font-medium rounded-full px-10 py-4 hover:bg-brun transition-all duration-200 text-base shadow-lg shadow-terra/20"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {t('hero.cta1')}
                <ArrowRight />
              </Link>
              <Link
                href="/comment"
                className="inline-flex items-center gap-2 border-2 border-brun text-brun font-medium rounded-full px-10 py-4 hover:bg-brun hover:text-creme transition-all duration-200 text-base"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {t('hero.cta2')}
              </Link>
              <a
                href={`https://wa.me/212614268283?text=${encodeURIComponent(t('whatsapp.message'))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#25D366] font-medium rounded-full px-5 py-4 hover:bg-[#25D366]/10 transition-all duration-200 text-base"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t('hero.ctaWhatsapp')}
              </a>
            </div>
          </AnimateIn>

          {/* Stats row */}
          <AnimateIn delay={0.4}>
            <div className="flex items-center justify-center gap-8 md:gap-16">
              {[
                { value: '+15', sub: t('stats.daysLabel') },
                { value: '48h', sub: t('stats.commissionLabel') },
                { value: '7j/7', sub: t('stats.stressLabel') },
              ].map(({ value, sub }, i) => (
                <div key={value} className="flex items-center gap-8 md:gap-16">
                  {i > 0 && <div className="hidden md:block w-px h-12 bg-brun/15" />}
                  <div className="text-center">
                    <span
                      className="text-3xl md:text-4xl text-terra block mb-1"
                      style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}
                    >
                      {value}
                    </span>
                    <p className="text-brun-mid/60 text-xs md:text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── BANDE PLATEFORMES ────────────────────── */}
      <section className="bg-white border-y border-brun/8 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-6 md:gap-12 flex-wrap">
            <span className="text-brun-mid/50 text-xs font-medium tracking-[0.15em] uppercase" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('stats.platforms')}
            </span>
            <div className="hidden sm:block w-px h-8 bg-brun/10" />
            {/* Airbnb */}
            <div className="flex items-center gap-2.5 opacity-70 hover:opacity-100 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="#FF5A5F">
                <path d="M16 1C10.477 1 6 5.477 6 11c0 3.518 1.946 6.614 4.857 8.32L16 31l5.143-11.68C24.054 17.614 26 14.518 26 11c0-5.523-4.477-10-10-10zm0 13.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/>
              </svg>
              <span className="text-sm font-medium text-[#FF5A5F]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Airbnb</span>
            </div>
            {/* Booking.com */}
            <div className="flex items-center gap-2.5 opacity-70 hover:opacity-100 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="6" fill="#003580"/>
                <text x="5" y="23" fontSize="20" fontWeight="bold" fill="white" fontFamily="Arial">B</text>
              </svg>
              <span className="text-sm font-medium text-[#003580]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Booking.com</span>
            </div>
            {/* Avito */}
            <div className="flex items-center gap-2.5 opacity-70 hover:opacity-100 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="6" fill="#E07A2F"/>
                <text x="6" y="23" fontSize="20" fontWeight="bold" fill="white" fontFamily="Arial">A</text>
              </svg>
              <span className="text-sm font-medium text-[#E07A2F]" style={{ fontFamily: 'var(--font-dm-sans)' }}>Avito.ma</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPTEURS ───────────────────────────── */}
      <section className="bg-brun py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { end: 6, suffix: '+', key: 'biens' },
              { end: 150, suffix: '+', key: 'voyageurs' },
              { end: 50, suffix: '+', key: 'avis' },
              { end: 4, suffix: '', key: 'villes' },
            ].map(({ end, suffix, key }) => (
              <div key={key} className="text-center">
                <p className="text-4xl md:text-5xl text-terra mb-2" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                  <CounterAnimation end={end} suffix={suffix} />
                </p>
                <p className="text-creme/70 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {t(`counters.${key}`)}
                </p>
              </div>
            ))}
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

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
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

      {/* ── BIENS À VENDRE ──────────────────────── */}
      <HomeBiensVenteSection />

      {/* ── SIMULATEUR INTRO BANNER ─────────────── */}
      <SimulateurBanner />

      {/* ── CALCULATEUR DE REVENUS ──────────────── */}
      <div id="simulateur">
        <RevenueCalculator showLeadCapture />
      </div>

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

      {/* ── TÉMOIGNAGES ─────────────────────────── */}
      <TemoignagesSection />

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
                  <p className="text-brun-mid text-sm leading-relaxed max-w-xs" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {t(`process.${step}.description`)}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── ZONE D'INTERVENTION ─────────────────── */}
      <section className="bg-white py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <AnimateIn className="text-center mb-16">
            <span className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('zone.tag')}
            </span>
            <h2 className="text-4xl md:text-5xl text-brun mb-4">{t('zone.title')}</h2>
            <p className="text-brun-mid max-w-xl mx-auto leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('zone.subtitle')}
            </p>
          </AnimateIn>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(['mohammedia', 'mansouria', 'bouznika', 'benslimane'] as const).map((city) => (
              <StaggerItem key={city}>
                <div className="bg-creme border border-brun/10 rounded-2xl p-6 text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
                  <div className="w-12 h-12 rounded-full bg-terra/10 flex items-center justify-center mx-auto mb-4">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C97B4B" strokeWidth="1.5">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                  </div>
                  <h3 className="text-lg text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                    {t(`zone.${city}`)}
                  </h3>
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-terra font-medium rounded-full px-10 py-4 hover:bg-creme transition-all duration-200 text-base"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {t('cta.button')}
            </Link>
            <a
              href={`https://wa.me/212614268283?text=${encodeURIComponent(t('whatsapp.message'))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-medium rounded-full px-8 py-4 hover:bg-[#20bd5a] transition-all duration-200 text-base"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('cta.whatsapp')}
            </a>
          </div>
          <a
            href="tel:+212614268283"
            className="inline-flex items-center gap-2 text-white/70 mt-6 hover:text-white transition-colors text-sm"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
            </svg>
            {t('cta.phone')}
          </a>
        </AnimateIn>
      </section>
    </>
  )
}
