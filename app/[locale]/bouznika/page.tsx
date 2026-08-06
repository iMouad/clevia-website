import type { Metadata } from 'next'
import CityLandingPage, { CITY_CONFIGS } from '@/components/CityLandingPage'
import { getPageSeo } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    ...getPageSeo(locale, '/bouznika', 'Conciergerie Airbnb à Bouznika — Clévia', 'Clévia gère votre location courte durée à Bouznika. +15 nuits louées/mois, gestion 100% clé en main.'),
    keywords: ['conciergerie Bouznika', 'gestion location Bouznika', 'Airbnb Bouznika', 'location courte durée Bouznika'],
  }
}

export default async function BouznikaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CityLandingPage locale={locale} city={CITY_CONFIGS.bouznika} />
}
