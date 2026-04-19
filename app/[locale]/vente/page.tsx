import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { AnimateIn } from '@/components/ui/AnimateIn'
import { Link } from '@/i18n/navigation'
import VenteGrid from '@/components/vente/VenteGrid'
import type { BienVente } from '@/components/BienVenteCard'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'vente' })
  return {
    title: `${t('title')} · Clévia`,
    description: t('subtitle'),
    alternates: { canonical: `/${locale}/vente` },
    openGraph: { url: `/${locale}/vente` },
  }
}

export default async function VentePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'vente' })

  const supabase = await createClient()
  const { data } = await supabase
    .from('biens_vente')
    .select('id, titre, categorie, statut, prix, surface, chambres, ville, photos, reference, equipements')
    .order('created_at', { ascending: false })

  const biens: BienVente[] = (data ?? []).map((b) => ({
    id: b.id,
    titre: b.titre,
    categorie: b.categorie,
    statut: b.statut,
    prix: b.prix ?? null,
    surface: b.surface ?? null,
    chambres: b.chambres ?? null,
    ville: b.ville,
    photos: b.photos ?? null,
    reference: b.reference ?? null,
    equipements: (b.equipements as string[] | null) ?? null,
  }))

  return (
    <>
      {/* Hero */}
      <section className="bg-creme py-20 px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(201,123,75,0.07) 0%, transparent 60%)' }}
        />
        <div className="max-w-7xl mx-auto relative">
          <AnimateIn>
            <span className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('tag')}
            </span>
            <h1 className="text-5xl md:text-6xl text-brun mb-4">{t('title')}</h1>
            <p className="text-brun-mid text-lg max-w-xl leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('subtitle')}
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Grille */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {biens.length === 0 ? (
            <AnimateIn className="text-center py-24">
              <div className="w-20 h-20 rounded-full bg-brun/5 flex items-center justify-center mx-auto mb-6">
                <svg className="text-brun/30" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /><path d="M9 21V12h6v9" />
                </svg>
              </div>
              <p className="text-brun-mid/50 text-lg" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('empty')}</p>
            </AnimateIn>
          ) : (
            <VenteGrid
              biens={biens}
              filterAllLabel={t('filterAll')}
              filterVendusLabel={t('filterVendus')}
              categories={{
                Appartement: t('categories.Appartement'),
                Studio: t('categories.Studio'),
                Villa: t('categories.Villa'),
                Terrain: t('categories.Terrain'),
                Ferme: t('categories.Ferme'),
                Commercial: t('categories.Commercial'),
              }}
            />
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-creme py-20 px-4 border-t border-brun/5">
        <AnimateIn className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl text-brun mb-3">{t('ctaTitle')}</h2>
          <p className="text-brun-mid mb-8 leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('ctaSubtitle')}</p>
          <Link
            href="/contact"
            className="inline-block bg-terra text-creme font-medium rounded-full px-10 py-3.5 hover:bg-brun transition-all duration-200"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {t('ctaButton')}
          </Link>
        </AnimateIn>
      </section>
    </>
  )
}
