import type { Metadata } from 'next'
import CityLandingPage, { CITY_CONFIGS } from '@/components/CityLandingPage'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Conciergerie Airbnb à Benslimane — Clévia',
    description: 'Clévia Immobilier - Conciergerie gère votre bien à Benslimane : mise en ligne Airbnb & Booking, accueil voyageurs, ménage, clé en main. Estimation gratuite.',
    keywords: ['conciergerie Benslimane', 'gestion location Benslimane', 'Airbnb Benslimane', 'location courte durée Benslimane'],
    alternates: {
      canonical: 'https://www.cleviamaroc.com/fr/benslimane',
    },
    openGraph: {
      title: 'Conciergerie Airbnb à Benslimane — Clévia',
      description: 'Clévia gère votre location courte durée à Benslimane. +15 nuits louées/mois, gestion 100% clé en main.',
      url: 'https://www.cleviamaroc.com/fr/benslimane',
    },
  }
}

export default async function BenslimancPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CityLandingPage locale={locale} city={CITY_CONFIGS.benslimane} />
}
