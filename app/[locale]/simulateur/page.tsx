import { getTranslations } from 'next-intl/server'
import { useTranslations } from 'next-intl'
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

export default function SimulateurPage() {
  return (
    <main>
      <SimulateurHero />
      <RevenueCalculator />
    </main>
  )
}
