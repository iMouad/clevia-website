import { getTranslations } from 'next-intl/server'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import RevenueCalculator from '@/components/RevenueCalculator'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'simulateur.meta' })
  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `/${locale}/simulateur`,
      siteName: 'Clévia Conciergerie',
      locale: locale === 'ar' ? 'ar_MA' : locale === 'en' ? 'en_US' : 'fr_MA',
      type: 'website',
    },
    alternates: {
      canonical: `/${locale}/simulateur`,
      languages: {
        fr: '/fr/simulateur',
        ar: '/ar/simulateur',
        en: '/en/simulateur',
      },
    },
  }
}

function SimulateurHero() {
  const t = useTranslations('simulateur.hero')
  return (
    <section className="bg-creme py-20 px-4 text-center">
      <div className="max-w-2xl mx-auto">
        <span
          className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-5"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          {t('tag')}
        </span>
        <h1
          className="text-4xl md:text-5xl text-brun mb-5 leading-tight"
          style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}
        >
          {t('title')}
        </h1>
        <p
          className="text-brun-mid leading-relaxed max-w-lg mx-auto"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          {t('subtitle')}
        </p>
      </div>
    </section>
  )
}

function SimulateurCta() {
  const t = useTranslations('simulateur.cta')
  return (
    <section className="bg-creme py-16 px-4 text-center">
      <div className="max-w-xl mx-auto flex flex-col items-center gap-5">
        <p
          className="text-brun text-xl leading-snug"
          style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}
        >
          {t('title')}
        </p>
        <p
          className="text-brun-mid text-sm leading-relaxed max-w-sm"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          {t('subtitle')}
        </p>
        <Link
          href="/contact"
          className="bg-terra text-creme font-medium rounded-full px-8 py-3 text-sm hover:bg-brun transition-all duration-200"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          {t('button')}
        </Link>
      </div>
    </section>
  )
}

export default function SimulateurPage() {
  return (
    <main>
      <SimulateurHero />
      <RevenueCalculator showLeadCapture />
      <SimulateurCta />
    </main>
  )
}
