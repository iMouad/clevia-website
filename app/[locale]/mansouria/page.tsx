import type { Metadata } from 'next'
import CityLandingPage, { CITY_CONFIGS } from '@/components/CityLandingPage'
import { getPageSeo } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    ...getPageSeo(locale, '/mansouria', 'Immobilier à Mansouria — Clévia Immobilier', 'Clévia, votre partenaire immobilier à Mansouria : location, vente, gestion locative, conciergerie. Votre bien, notre exigence.'),
    keywords: ['immobilier Mansouria', 'gestion locative Mansouria', 'conciergerie Mansouria', 'location Mansouria', 'El Mansouria', 'vente immobilier Mansouria'],
  }
}

export default async function MansouriaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <CityLandingPage locale={locale} city={CITY_CONFIGS.mansouria} />
}
