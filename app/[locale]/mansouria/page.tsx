import type { Metadata } from 'next'
import CityLandingPage, { CITY_CONFIGS } from '@/components/CityLandingPage'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Conciergerie Airbnb à Mansouria — Clévia',
    description: 'Clévia Conciergerie gère votre bien à Mansouria (El Mansouria) : mise en ligne Airbnb & Booking, accueil voyageurs, ménage, clé en main. Estimation gratuite.',
    keywords: ['conciergerie Mansouria', 'gestion location Mansouria', 'Airbnb Mansouria', 'location courte durée Mansouria', 'El Mansouria'],
    alternates: {
      canonical: 'https://www.cleviamaroc.com/fr/mansouria',
    },
    openGraph: {
      title: 'Conciergerie Airbnb à Mansouria — Clévia',
      description: 'Clévia gère votre location courte durée à Mansouria. +15 nuits louées/mois, gestion 100% clé en main.',
      url: 'https://www.cleviamaroc.com/fr/mansouria',
    },
  }
}

export default async function MansouriaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CityLandingPage locale={locale} city={CITY_CONFIGS.mansouria} />
}
