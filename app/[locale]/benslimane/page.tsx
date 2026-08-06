import type { Metadata } from 'next'
import CityLandingPage, { CITY_CONFIGS } from '@/components/CityLandingPage'
import { getPageSeo } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    ...getPageSeo(locale, '/benslimane', 'Conciergerie Airbnb à Benslimane — Clévia', 'Clévia gère votre location courte durée à Benslimane. +15 nuits louées/mois, gestion 100% clé en main.'),
    keywords: ['conciergerie Benslimane', 'gestion location Benslimane', 'Airbnb Benslimane', 'location courte durée Benslimane'],
  }
}

export default async function BenslimancPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CityLandingPage locale={locale} city={CITY_CONFIGS.benslimane} />
}
