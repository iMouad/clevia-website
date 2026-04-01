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
  const t = await getTranslations({ locale, namespace: 'how' })
  return {
    title: t('hero.title'),
    description: t('hero.subtitle'),
    openGraph: { url: `/${locale}/comment` },
    alternates: { canonical: `/${locale}/comment` },
  }
}

const STEP_KEYS = ['contact', 'visit', 'contract', 'publish', 'manage', 'payment'] as const

const STEP_ICONS = [
  // Contact
  <svg key="contact" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>,
  // Visit
  <svg key="visit" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>,
  // Contract
  <svg key="contract" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>,
  // Publish
  <svg key="publish" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="14" rx="2" />
    <path d="M7 21h10M12 17v4" />
  </svg>,
  // Manage
  <svg key="manage" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
  </svg>,
  // Payment
  <svg key="payment" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <path d="M1 10h22" />
  </svg>,
]

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function CommentPage() {
  const t = useTranslations('how')
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

      {/* ── TIMELINE ────────────────────────────── */}
      <section className="bg-creme py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-8 bottom-8 w-px bg-terra/20 hidden md:block" />

            <StaggerContainer className="flex flex-col gap-8">
              {STEP_KEYS.map((key, i) => (
                <StaggerItem key={key}>
                  <div className="flex gap-6 md:gap-10 items-start">
                    {/* Step circle */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-white border-2 border-terra/20 flex flex-col items-center justify-center relative z-10 shadow-sm">
                      <div className="text-terra">{STEP_ICONS[i]}</div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-white border border-brun/10 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start gap-4">
                        <span
                          className="text-3xl text-terra/40 leading-none"
                          style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300 }}
                        >
                          {t(`steps.${key}.number`)}
                        </span>
                        <div>
                          <h3 className="text-xl text-brun mb-2">{t(`steps.${key}.title`)}</h3>
                          <p className="text-brun-mid text-sm leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            {t(`steps.${key}.description`)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
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
