import type { Metadata } from 'next'
import CityLandingPage, { CITY_CONFIGS } from '@/components/CityLandingPage'
import { getPageSeo } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    ...getPageSeo(locale, '/benslimane', 'Immobilier à Benslimane — Clévia Immobilier', 'Clévia, votre partenaire immobilier à Benslimane : location, vente, gestion locative, conciergerie. Votre bien, notre exigence.'),
    keywords: ['immobilier Benslimane', 'gestion locative Benslimane', 'conciergerie Benslimane', 'location Benslimane', 'vente immobilier Benslimane'],
  }
}

export default async function BenslimancPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CityLandingPage locale={locale} city={CITY_CONFIGS.benslimane} />
}
