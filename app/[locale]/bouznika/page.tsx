import type { Metadata } from 'next'
import CityLandingPage, { CITY_CONFIGS } from '@/components/CityLandingPage'
import { getPageSeo } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    ...getPageSeo(locale, '/bouznika', 'Immobilier à Bouznika — Clévia Immobilier', 'Clévia, votre partenaire immobilier à Bouznika : location, vente, gestion locative, conciergerie. Votre bien, notre exigence.'),
    keywords: ['immobilier Bouznika', 'gestion locative Bouznika', 'conciergerie Bouznika', 'location Bouznika', 'vente immobilier Bouznika'],
  }
}

export default async function BouznikaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CityLandingPage locale={locale} city={CITY_CONFIGS.bouznika} />
}
