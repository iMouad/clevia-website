import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/navigation'
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/ui/AnimateIn'
import BienCard from '@/components/BienCard'
import type { BienPublic } from '@/components/BienCard'

export default async function HomeBiensSection() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'biens' })

  const supabase = await createClient()
  const { data } = await supabase
    .from('biens')
    .select('id, nom, ville, adresse, type, capacite, prix_nuit, description, photos, airbnb_url, booking_url, avito_url')
    .eq('statut', 'actif')
    .limit(3)
    .order('created_at', { ascending: false })

  const biens: BienPublic[] = (data ?? []).map((b) => ({
    id: b.id,
    nom: b.nom,
    ville: b.ville ?? null,
    adresse: b.adresse ?? null,
    type: b.type ?? null,
    capacite: b.capacite ?? null,
    prix_nuit: b.prix_nuit ?? null,
    description: b.description ?? null,
    photos: b.photos ?? null,
    airbnb_url: b.airbnb_url ?? null,
    booking_url: b.booking_url ?? null,
    avito_url: b.avito_url ?? null,
  }))

  if (!biens.length) return null

  return (
    <section className="bg-white py-24 px-4">
      <div className="max-w-7xl mx-auto">

        <AnimateIn className="text-center mb-16">
          <span
            className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-4"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {t('tag')}
          </span>
          <h2 className="text-4xl md:text-5xl text-brun mb-4">{t('homeTitle')}</h2>
          <p className="text-brun-mid max-w-xl mx-auto leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {t('homeSubtitle')}
          </p>
        </AnimateIn>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {biens.map((b) => (
            <StaggerItem key={b.id}>
              <BienCard bien={b} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        <AnimateIn className="text-center">
          <Link
            href="/biens"
            className="inline-flex items-center gap-2 border border-terra text-terra font-medium rounded-full px-6 py-2.5 hover:bg-terra hover:text-white transition-all duration-200"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {t('viewAll')}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </AnimateIn>

      </div>
    </section>
  )
}
