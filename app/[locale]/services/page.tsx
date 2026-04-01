import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
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
  return {
    title: t('hero.title'),
    description: t('hero.subtitle'),
    openGraph: { url: `/${locale}/services` },
    alternates: { canonical: `/${locale}/services` },
  }
}

const SERVICE_ICONS = [
  // Publication
  <svg key="pub" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="14" rx="2" />
    <path d="M7 21h10M12 17v4" />
  </svg>,
  // Photo
  <svg key="photo" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>,
  // Accueil
  <svg key="accueil" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>,
  // Ménage
  <svg key="menage" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 6l9-4 9 4v2H3V6zM3 8v10a2 2 0 002 2h14a2 2 0 002-2V8" />
    <path d="M12 8v12M8 11h8" />
  </svg>,
  // Reporting
  <svg key="reporting" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M18 20V10M12 20V4M6 20v-6" />
    <rect x="2" y="2" width="20" height="20" rx="2" />
  </svg>,
  // Maintenance
  <svg key="maintenance" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
  </svg>,
]

const SERVICE_KEYS = ['publication', 'photo', 'accueil', 'menage', 'reporting', 'maintenance'] as const

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ServicesPage() {
  const t = useTranslations('services')

  return (
    <>
      {/* ── HERO ────────────────────────────────── */}
      <section className="bg-creme py-24 px-4 border-b border-brun/5">
        <div className="max-w-7xl mx-auto text-center">
          <AnimateIn>
            <span className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('tag')}
            </span>
            <h1 className="text-5xl md:text-6xl text-brun mb-6">{t('hero.title')}</h1>
            <p className="text-brun-mid text-lg max-w-xl mx-auto leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('hero.subtitle')}
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ── 6 SERVICES GRID ─────────────────────── */}
      <section className="bg-creme py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICE_KEYS.map((key, i) => (
              <StaggerItem key={key}>
                <div className="bg-white border border-brun/10 rounded-2xl p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 h-full flex flex-col gap-4">
                  <div className="text-terra">{SERVICE_ICONS[i]}</div>
                  <h3 className="text-xl text-brun">{t(`items.${key}.title`)}</h3>
                  <p className="text-brun-mid text-sm leading-relaxed flex-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {t(`items.${key}.description`)}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── TARIFICATION (dark) ──────────────────── */}
      <section className="bg-brun py-24 px-4">
        <AnimateIn className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-sable text-xs font-medium tracking-[0.2em] uppercase mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {t('pricing.title')}
          </span>
          <p
            className="text-terra mb-2 leading-none"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '5rem', fontWeight: 300 }}
          >
            {t('pricing.commission')}
          </p>
          <p className="text-creme/70 text-xl mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {t('pricing.commissionLabel')}
          </p>
          <p className="text-creme/50 text-sm mb-10" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {t('pricing.included')}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-terra text-creme font-medium rounded-full px-10 py-4 hover:bg-brun-mid transition-all duration-200"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {t('pricing.cta')} <ArrowRight />
          </Link>
        </AnimateIn>
      </section>
    </>
  )
}
