import type { Metadata } from 'next'
import CityLandingPage, { CITY_CONFIGS } from '@/components/CityLandingPage'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Conciergerie Airbnb à Mohammedia — Clévia',
    description: 'Clévia Conciergerie gère votre bien à Mohammedia : mise en ligne Airbnb & Booking, accueil voyageurs, ménage, clé en main. Estimation gratuite.',
    keywords: ['conciergerie Mohammedia', 'gestion location Mohammedia', 'Airbnb Mohammedia', 'location courte durée Mohammedia'],
    alternates: {
      canonical: 'https://www.cleviamaroc.com/fr/mohammedia',
    },
    openGraph: {
      title: 'Conciergerie Airbnb à Mohammedia — Clévia',
      description: 'Clévia gère votre location courte durée à Mohammedia. +15 nuits louées/mois, gestion 100% clé en main.',
      url: 'https://www.cleviamaroc.com/fr/mohammedia',
    },
  }
}

export default async function MohammediaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CityLandingPage locale={locale} city={CITY_CONFIGS.mohammedia} />
}
