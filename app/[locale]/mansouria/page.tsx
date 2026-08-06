import type { Metadata } from 'next'
import CityLandingPage, { CITY_CONFIGS } from '@/components/CityLandingPage'
import { getPageSeo } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    ...getPageSeo(locale, '/mansouria', 'Conciergerie Airbnb à Mansouria — Clévia', 'Clévia gère votre location courte durée à Mansouria. +15 nuits louées/mois, gestion 100% clé en main.'),
    keywords: ['conciergerie Mansouria', 'gestion location Mansouria', 'Airbnb Mansouria', 'location courte durée Mansouria', 'El Mansouria'],
  }
}

export default async function MansouriaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CityLandingPage locale={locale} city={CITY_CONFIGS.mansouria} />
}
