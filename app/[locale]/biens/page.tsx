import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { AnimateIn } from '@/components/ui/AnimateIn'
import BiensGrid from '@/components/BiensGrid'
import type { BienPublic } from '@/components/BienCard'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'biens' })
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: { canonical: `/${locale}/biens` },
  }
}

export default async function BiensPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'biens' })

  const supabase = await createClient()
  const { data } = await supabase
    .from('biens')
    .select('id, nom, ville, adresse, type, capacite, chambres, salles_de_bain, capacite_max, surface, equipements, prix_nuit, description, photos, distance_mer, disponible, airbnb_url, booking_url, avito_url')
    .eq('statut', 'actif')
    .order('created_at', { ascending: false })

  const biens: BienPublic[] = (data ?? []).map((b) => ({
    id: b.id,
    nom: b.nom,
    ville: b.ville ?? null,
    adresse: b.adresse ?? null,
    type: b.type ?? null,
    capacite: b.capacite ?? null,
    chambres: b.chambres ?? null,
    salles_de_bain: b.salles_de_bain ?? null,
    capacite_max: b.capacite_max ?? null,
    surface: b.surface ?? null,
    equipements: b.equipements ?? null,
    prix_nuit: b.prix_nuit ?? null,
    description: b.description ?? null,
    photos: b.photos ?? null,
    distance_mer: b.distance_mer ?? null,
    disponible: b.disponible ?? null,
    airbnb_url: b.airbnb_url ?? null,
    booking_url: b.booking_url ?? null,
    avito_url: b.avito_url ?? null,
  }))

  return (
    <>
      {/* ── Page Hero ── */}
      <section className="bg-creme py-20 px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(201,123,75,0.07) 0%, transparent 60%)' }}
        />
        <div className="max-w-7xl mx-auto relative">
          <AnimateIn>
            <span
              className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-4"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {t('tag')}
            </span>
            <h1 className="text-5xl md:text-6xl text-brun mb-4">{t('title')}</h1>
            <p className="text-brun-mid text-lg max-w-xl leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('subtitle')}
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ── Biens Grid ── */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {biens.length === 0 ? (
            <AnimateIn className="text-center py-24">
              <div className="w-20 h-20 rounded-full bg-brun/5 flex items-center justify-center mx-auto mb-6">
                <svg className="text-brun/30" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                  <path d="M9 21V12h6v9" />
                </svg>
              </div>
              <p className="text-brun-mid/50 mb-8 text-lg" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {t('empty')}
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-terra text-creme font-medium rounded-full px-8 py-3 hover:bg-brun transition-all"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {t('contactUs')}
              </Link>
            </AnimateIn>
          ) : (
            <BiensGrid
              biens={biens}
              allLabel={t('filterAll')}
              emptyLabel={t('filterEmpty')}
            />
          )}
        </div>
      </section>

      {/* ── Owner CTA ── */}
      <section className="bg-creme py-20 px-4 border-t border-brun/5">
        <AnimateIn className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl text-brun mb-3">{t('ctaTitle')}</h2>
          <p className="text-brun-mid mb-8 leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {t('ctaSubtitle')}
          </p>
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
