import type { Metadata } from 'next'
import CityLandingPage, { CITY_CONFIGS } from '@/components/CityLandingPage'
import { getPageSeo } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    ...getPageSeo(locale, '/mohammedia', 'Immobilier à Mohammedia — Clévia Immobilier', 'Clévia, votre partenaire immobilier à Mohammedia : location, vente, gestion locative, conciergerie. Votre bien, notre exigence.'),
    keywords: ['immobilier Mohammedia', 'gestion locative Mohammedia', 'conciergerie Mohammedia', 'location Mohammedia', 'vente immobilier Mohammedia'],
  }
}

export default async function MohammediaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CityLandingPage locale={locale} city={CITY_CONFIGS.mohammedia} />
}
