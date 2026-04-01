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
  const t = await getTranslations({ locale, namespace: 'why' })
  return {
    title: t('hero.title'),
    description: t('hero.subtitle'),
    openGraph: { url: `/${locale}/pourquoi` },
    alternates: { canonical: `/${locale}/pourquoi` },
  }
}

const ARG_KEYS = ['reliability', 'local', 'legal', 'performance'] as const

const ARG_ICONS = [
  // Gestion complète
  <svg key="gestion" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="14" rx="2" />
    <path d="M7 21h10M12 17v4M8 8h8M8 11h5" />
  </svg>,
  // Optimisation prix
  <svg key="prix" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M18 20V10M12 20V4M6 20v-6" />
    <path d="M3 3l4 4M21 3l-4 4" />
  </svg>,
  // Ménage & maintenance
  <svg key="menage" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2l3.5 6.5L22 9.5l-5 4.9 1.2 6.9L12 18l-6.2 3.3L7 14.4 2 9.5l6.5-1L12 2z" />
  </svg>,
  // Transparence & rapports
  <svg key="rapport" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>,
]

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PourquoiPage() {
  const t = useTranslations('why')
  const tCta = useTranslations('cta')

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

      {/* ── 4 ARGUMENTS ─────────────────────────── */}
      <section className="bg-creme py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <StaggerContainer className="grid sm:grid-cols-2 gap-6">
            {ARG_KEYS.map((key, i) => (
              <StaggerItem key={key}>
                <div className="bg-white border border-brun/10 rounded-2xl p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 h-full flex flex-col gap-4">
                  <div className="text-terra">{ARG_ICONS[i]}</div>
                  <h3 className="text-xl text-brun">{t(`arguments.${key}.title`)}</h3>
                  <p className="text-brun-mid text-sm leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {t(`arguments.${key}.description`)}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── STATS (dark) ─────────────────────────── */}
      <section className="bg-brun py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <StaggerContainer className="grid md:grid-cols-3 gap-8 text-center">
            {(
              [
                { val: 'biens', label: 'biensLabel' },
                { val: 'nuits', label: 'nuitsLabel' },
                { val: 'commission', label: 'commissionLabel' },
              ] as const
            ).map(({ val, label }) => (
              <StaggerItem key={val}>
                <div className="py-8">
                  <p
                    className="text-6xl md:text-7xl text-terra mb-3"
                    style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300 }}
                  >
                    {t(`bigStats.${val}`)}
                  </p>
                  <p className="text-creme/60 text-sm tracking-wide" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {t(`bigStats.${label}`)}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────── */}
      <section className="bg-terra py-20 px-4">
        <AnimateIn className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl text-white mb-4">{tCta('title')}</h2>
          <p className="text-white/80 mb-8 text-lg" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {tCta('subtitle')}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-terra font-medium rounded-full px-10 py-4 hover:bg-creme transition-all duration-200"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {tCta('button')} <ArrowRight />
          </Link>
        </AnimateIn>
      </section>
    </>
  )
}
