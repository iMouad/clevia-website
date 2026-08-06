import type { Metadata } from 'next'
import CityLandingPage, { CITY_CONFIGS } from '@/components/CityLandingPage'
import { getPageSeo } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    ...getPageSeo(locale, '/mohammedia', 'Conciergerie Airbnb à Mohammedia — Clévia', 'Clévia gère votre location courte durée à Mohammedia. +15 nuits louées/mois, gestion 100% clé en main.'),
    keywords: ['conciergerie Mohammedia', 'gestion location Mohammedia', 'Airbnb Mohammedia', 'location courte durée Mohammedia'],
  }
}

export default async function MohammediaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CityLandingPage locale={locale} city={CITY_CONFIGS.mohammedia} />
}
