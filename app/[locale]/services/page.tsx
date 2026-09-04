import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { getPageSeo } from '@/lib/seo'
import { getFaqJsonLd, getBreadcrumbJsonLd } from '@/lib/schemas'
import { Link } from '@/i18n/navigation'
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/ui/AnimateIn'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'services' })
  return getPageSeo(locale, '/services', t('hero.title'), t('hero.subtitle'))
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  conciergerie: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  ),
  gestionLocative: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  vente: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  transversal: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
    </svg>
  ),
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  publication: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="14" rx="2" /><path d="M7 21h10M12 17v4" /></svg>,
  accueil: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  menage: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6l9-4 9 4v2H3V6zM3 8v10a2 2 0 002 2h14a2 2 0 002-2V8" /><path d="M12 8v12M8 11h8" /></svg>,
  gestionLocataire: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /><path d="M11 8v6M8 11h6" /></svg>,
  bailSuivi: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>,
  relationLocataire: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
  estimationVente: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10M12 20V4M6 20v-6" /><rect x="2" y="2" width="20" height="20" rx="2" /></svg>,
  commercialisation: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
  accompagnementVente: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>,
  photo: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>,
  reporting: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>,
  maintenance: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>,
}

const CATEGORIES = ['conciergerie', 'gestionLocative', 'vente', 'transversal'] as const
const CATEGORY_SERVICES: Record<string, string[]> = {
  conciergerie: ['publication', 'accueil', 'menage'],
  gestionLocative: ['gestionLocataire', 'bailSuivi', 'relationLocataire'],
  vente: ['estimationVente', 'commercialisation', 'accompagnementVente'],
  transversal: ['photo', 'reporting', 'maintenance'],
}

const CATEGORY_COLORS: Record<string, string> = {
  conciergerie: 'from-terra/10 to-sable/5 border-terra/15',
  gestionLocative: 'from-brun/8 to-brun/3 border-brun/12',
  vente: 'from-corail/10 to-sable/5 border-corail/15',
  transversal: 'from-creme to-white border-brun/8',
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="#C97B4B" fillOpacity="0.15" />
      <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="#C97B4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ServicesPage() {
  const t = useTranslations('services')
  const tGlobal = useTranslations()

  const faqItems = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
  ]

  const breadcrumbJsonLd = getBreadcrumbJsonLd('fr', [
    { name: t('hero.title'), path: '/services' },
  ])

  const allServiceKeys = Object.values(CATEGORY_SERVICES).flat()
  const servicesJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Real Estate Services',
    provider: {
      '@type': 'LocalBusiness',
      name: 'Clévia Immobilier',
      url: 'https://www.cleviamaroc.com',
    },
    areaServed: [
      { '@type': 'City', name: 'Mohammedia' },
      { '@type': 'City', name: 'Mansouria' },
      { '@type': 'City', name: 'Bouznika' },
      { '@type': 'City', name: 'Benslimane' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: t('hero.title'),
      itemListElement: allServiceKeys.map((key) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: t(`items.${key}.title`),
          description: t(`items.${key}.description`),
        },
      })),
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getFaqJsonLd(faqItems)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* HERO */}
      <section className="bg-creme py-16 md:py-20 px-4 overflow-hidden relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 20% 80%, rgba(201,123,75,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(201,123,75,0.08) 0%, transparent 50%)',
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative">
          <AnimateIn>
            <span
              className="inline-block text-terra text-xs font-medium tracking-[0.25em] uppercase mb-8 border border-terra/20 rounded-full px-5 py-2 bg-terra/5"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {t('tag')}
            </span>
          </AnimateIn>
          <AnimateIn delay={0.1}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl leading-[1.15] text-brun mb-6">
              {t('hero.title')}
            </h1>
          </AnimateIn>
          <AnimateIn delay={0.2}>
            <p className="text-brun-mid text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('hero.subtitle')}
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* SERVICES BY CATEGORY */}
      {CATEGORIES.map((cat, catIdx) => (
        <section
          key={cat}
          className={`${catIdx % 2 === 0 ? 'bg-white' : 'bg-creme'} py-16 md:py-20 px-4`}
        >
          <div className="max-w-7xl mx-auto">
            <AnimateIn className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-terra/10 flex items-center justify-center text-terra">
                {CATEGORY_ICONS[cat]}
              </div>
              <h2 className="text-2xl md:text-3xl text-brun">
                {t(`categories.${cat}`)}
              </h2>
            </AnimateIn>

            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {CATEGORY_SERVICES[cat].map((key, i) => (
                <StaggerItem key={key}>
                  <div className={`bg-gradient-to-br ${CATEGORY_COLORS[cat]} border rounded-2xl p-7 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 h-full flex flex-col gap-4 group`}>
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-xl bg-white/80 flex items-center justify-center text-terra shadow-sm">
                        {SERVICE_ICONS[key]}
                      </div>
                      <span
                        className="text-2xl text-brun/10 group-hover:text-terra/20 transition-colors"
                        style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="text-lg text-brun">{t(`items.${key}.title`)}</h3>
                    <p className="text-brun-mid text-sm leading-relaxed flex-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {t(`items.${key}.description`)}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      ))}

      {/* MINI PROCESS */}
      <section className="bg-creme py-20 px-4 border-y border-brun/5">
        <div className="max-w-5xl mx-auto">
          <AnimateIn className="text-center mb-14">
            <span className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('miniProcess.tag')}
            </span>
            <h2 className="text-3xl md:text-4xl text-brun">{t('miniProcess.title')}</h2>
          </AnimateIn>

          <StaggerContainer className="grid md:grid-cols-3 gap-8 relative mb-10">
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-terra/20" />

            {([
              { num: '01', title: t('miniProcess.step1'), sub: t('miniProcess.step1Sub') },
              { num: '02', title: t('miniProcess.step2'), sub: t('miniProcess.step2Sub') },
              { num: '03', title: t('miniProcess.step3'), sub: t('miniProcess.step3Sub') },
            ]).map(({ num, title, sub }) => (
              <StaggerItem key={num}>
                <div className="flex flex-col items-center text-center gap-3 relative">
                  <div className="w-16 h-16 rounded-full bg-terra/10 border border-terra/20 flex items-center justify-center relative z-10">
                    <span
                      className="text-terra text-xl"
                      style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}
                    >
                      {num}
                    </span>
                  </div>
                  <h3 className="text-lg text-brun">{title}</h3>
                  <p className="text-brun-mid/60 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {sub}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <AnimateIn className="text-center">
            <Link
              href="/comment"
              className="inline-flex items-center gap-2 border border-terra text-terra font-medium rounded-full px-6 py-2.5 hover:bg-terra hover:text-white transition-all duration-200 text-sm"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {t('miniProcess.cta')} <ArrowRight />
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* TARIFICATION */}
      <section className="bg-brun py-24 px-4 border-b border-creme/10">
        <div className="max-w-4xl mx-auto">
          <AnimateIn className="text-center mb-14">
            <span className="inline-block text-sable text-xs font-medium tracking-[0.2em] uppercase mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('pricing.title')}
            </span>
            <p
              className="text-terra mb-3 leading-none"
              style={{ fontFamily: 'var(--font-cormorant)', fontSize: '4.5rem', fontWeight: 300 }}
            >
              {t('pricing.commission')}
            </p>
            <p className="text-creme/70 text-xl mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('pricing.commissionLabel')}
            </p>
          </AnimateIn>

          <AnimateIn delay={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
              {(['photos', 'annonces', 'accueil', 'menage', 'reporting', 'virement'] as const).map((feat) => (
                <div key={feat} className="flex items-center gap-2.5">
                  <CheckIcon />
                  <span className="text-creme/80 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {t(`pricing.features.${feat}`)}
                  </span>
                </div>
              ))}
            </div>
          </AnimateIn>

          <AnimateIn delay={0.2} className="text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-terra text-creme font-medium rounded-full px-10 py-4 hover:bg-sable transition-all duration-200 text-base"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {t('pricing.cta')} <ArrowRight />
              </Link>
              <a
                href={`https://wa.me/212614268283?text=${encodeURIComponent(tGlobal('whatsapp.message'))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white font-medium rounded-full px-8 py-4 hover:bg-[#20bd5a] transition-all duration-200 text-base"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {t('pricing.whatsapp')}
              </a>
            </div>
            <a
              href="tel:+212614268283"
              className="inline-flex items-center gap-2 text-creme/50 hover:text-creme transition-colors text-sm"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
              {t('pricing.phone')}
            </a>
          </AnimateIn>
        </div>
      </section>
    </>
  )
}
