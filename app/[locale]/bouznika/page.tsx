import type { Metadata } from 'next'
import CityLandingPage, { CITY_CONFIGS } from '@/components/CityLandingPage'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Conciergerie Airbnb à Bouznika — Clévia',
    description: 'Clévia Conciergerie gère votre bien à Bouznika : mise en ligne Airbnb & Booking, accueil voyageurs, ménage, clé en main. Estimation gratuite.',
    keywords: ['conciergerie Bouznika', 'gestion location Bouznika', 'Airbnb Bouznika', 'location courte durée Bouznika'],
    alternates: {
      canonical: 'https://www.cleviamaroc.com/fr/bouznika',
    },
    openGraph: {
      title: 'Conciergerie Airbnb à Bouznika — Clévia',
      description: 'Clévia gère votre location courte durée à Bouznika. +15 nuits louées/mois, gestion 100% clé en main.',
      url: 'https://www.cleviamaroc.com/fr/bouznika',
    },
  }
}

export default async function BouznikaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CityLandingPage locale={locale} city={CITY_CONFIGS.bouznika} />
}
