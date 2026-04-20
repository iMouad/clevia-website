import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { AnimateIn } from '@/components/ui/AnimateIn'
import BienCard from '@/components/BienCard'
import BienVenteCard from '@/components/BienVenteCard'
import type { BienPublic } from '@/components/BienCard'
import type { BienVente } from '@/components/BienVenteCard'

type CityConfig = {
  name: string
  tagline: string
  description: string
  color: string
}

type Props = {
  locale: string
  city: CityConfig
}

export const CITY_CONFIGS: Record<string, CityConfig> = {
  mohammedia: {
    name: 'Mohammedia',
    tagline: 'La perle du littoral atlantique',
    description: 'Mohammedia, ville balnéaire à 25 km de Casablanca, attire chaque été des milliers de vacanciers. Avec ses plages, son port et sa corniche animée, c\'est l\'une des zones les plus rentables pour la location courte durée dans la région.',
    color: '#0369a1',
  },
  mansouria: {
    name: 'Mansouria',
    tagline: 'Village balnéaire prisé de la côte atlantique',
    description: 'El Mansouria est une destination estivale incontournable au nord de Mohammedia. Ses plages calmes et ses résidences familiales en font un marché de location courte durée très demandé, notamment en juillet-août.',
    color: '#0f766e',
  },
  bouznika: {
    name: 'Bouznika',
    tagline: 'Entre Casablanca et Rabat, face à l\'océan',
    description: 'Bouznika bénéficie d\'une position stratégique entre Casablanca et Rabat. Ses plages sauvages et son cadre résidentiel calme séduisent une clientèle aisée. Un marché en pleine expansion pour les investisseurs immobiliers.',
    color: '#7c3aed',
  },
  benslimane: {
    name: 'Benslimane',
    tagline: 'Calme, verdure et golf',
    description: 'Benslimane est réputée pour son golf international et son environnement verdoyant. À une heure de Casablanca, elle attire retraités et familles en quête de tranquillité. La demande locative y est stable tout au long de l\'année.',
    color: '#15803d',
  },
}

export default async function CityLandingPage({ locale, city }: Props) {
  const t = await getTranslations({ locale, namespace: 'biens' })
  const tVente = await getTranslations({ locale, namespace: 'vente' })
  const supabase = await createClient()

  // Biens à louer dans cette ville
  const { data: biensData } = await supabase
    .from('biens')
    .select('id, nom, ville, adresse, type, capacite, chambres, salles_de_bain, capacite_max, surface, equipements, prix_nuit, description, photos, distance_mer, disponible, airbnb_url, booking_url, avito_url, slug')
    .eq('statut', 'actif')
    .ilike('ville', `%${city.name}%`)
    .limit(6)

  const biens: BienPublic[] = (biensData ?? []).map((b) => ({
    id: b.id, nom: b.nom, ville: b.ville ?? null, adresse: b.adresse ?? null,
    type: b.type ?? null, capacite: b.capacite ?? null, chambres: b.chambres ?? null,
    salles_de_bain: b.salles_de_bain ?? null, capacite_max: b.capacite_max ?? null,
    surface: b.surface ?? null, equipements: b.equipements ?? null,
    prix_nuit: b.prix_nuit ?? null, description: b.description ?? null,
    photos: b.photos ?? null, distance_mer: b.distance_mer ?? null,
    disponible: b.disponible ?? null, airbnb_url: b.airbnb_url ?? null,
    booking_url: b.booking_url ?? null, avito_url: b.avito_url ?? null,
    slug: (b.slug as string | null) ?? null,
  }))

  // Biens à vendre dans cette ville
  const { data: venteData } = await supabase
    .from('biens_vente')
    .select('id, titre, categorie, statut, prix, surface, chambres, ville, photos, reference, slug')
    .eq('statut', 'a_vendre')
    .ilike('ville', `%${city.name}%`)
    .limit(3)

  const biensVente: BienVente[] = (venteData ?? []).map((b) => ({
    id: b.id, titre: b.titre, categorie: b.categorie, statut: b.statut,
    prix: b.prix ?? null, surface: b.surface ?? null, chambres: b.chambres ?? null,
    ville: b.ville, photos: b.photos ?? null, reference: b.reference ?? null,
    slug: (b.slug as string | null) ?? null,
  }))

  const WHATSAPP = '212614268283'
  const waMsg = encodeURIComponent(`Bonjour, je souhaite en savoir plus sur la gestion de mon bien à ${city.name} avec Clévia Conciergerie.`)

  return (
    <>
      {/* Hero */}
      <section className="bg-creme py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 70% 50%, ${city.color}12 0%, transparent 60%)` }} />
        <div className="max-w-7xl mx-auto relative">
          <AnimateIn>
            <span className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Clévia · {city.name}
            </span>
            <h1 className="text-5xl md:text-6xl text-brun mb-3" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
              Conciergerie à {city.name}
            </h1>
            <p className="text-terra text-lg italic mb-4" style={{ fontFamily: 'var(--font-cormorant)' }}>
              {city.tagline}
            </p>
            <p className="text-brun-mid max-w-2xl leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {city.description}
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-terra text-creme font-medium rounded-full px-7 py-3 text-sm hover:bg-brun transition-all"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                Confier mon bien à {city.name}
              </Link>
              <a
                href={`https://wa.me/${WHATSAPP}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-brun/20 text-brun font-medium rounded-full px-7 py-3 text-sm hover:border-terra hover:text-terra transition-all"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.05 2C6.495 2 2.01 6.485 2 12.044c-.004 1.99.521 3.931 1.516 5.637L2 22l4.49-1.494A10.063 10.063 0 0012.05 22C17.604 22.144 22 17.659 22 12.1 22 9.407 20.956 6.87 19.064 4.976A9.958 9.958 0 0012.05 2zm.001 18.385a8.397 8.397 0 01-4.267-1.161l-.306-.181-3.174 1.053.855-3.227-.198-.33A8.39 8.39 0 013.662 12c.008-4.634 3.779-8.402 8.42-8.402a8.364 8.364 0 015.945 2.473A8.345 8.345 0 0120.44 12.1c0 4.635-3.773 8.285-8.39 8.285z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-brun/8 py-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: '+15', label: 'nuits louées / mois' },
            { value: '48h', label: 'mise en ligne garantie' },
            { value: '7/7', label: 'équipe disponible' },
            { value: '100%', label: 'gestion clé en main' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl text-terra" style={{ fontFamily: 'var(--font-cormorant)' }}>{s.value}</p>
              <p className="text-xs text-brun-mid/60 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Biens à louer */}
      {biens.length > 0 && (
        <section className="bg-creme py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <AnimateIn className="mb-12">
              <span className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                {t('tag')}
              </span>
              <h2 className="text-4xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                Nos biens à louer à {city.name}
              </h2>
            </AnimateIn>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {biens.map((b) => <BienCard key={b.id} bien={b} />)}
            </div>
            <AnimateIn className="text-center">
              <Link
                href="/biens"
                className="inline-flex items-center gap-2 border border-terra text-terra font-medium rounded-full px-6 py-2.5 text-sm hover:bg-terra hover:text-creme transition-all"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {t('viewAll')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
            </AnimateIn>
          </div>
        </section>
      )}

      {/* Biens à vendre */}
      {biensVente.length > 0 && (
        <section className="bg-white py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <AnimateIn className="mb-12">
              <span className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Immobilier
              </span>
              <h2 className="text-4xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                Biens à vendre à {city.name}
              </h2>
            </AnimateIn>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {biensVente.map((b) => <BienVenteCard key={b.id} bien={b} />)}
            </div>
            <AnimateIn className="text-center">
              <Link
                href="/vente"
                className="inline-flex items-center gap-2 border border-terra text-terra font-medium rounded-full px-6 py-2.5 text-sm hover:bg-terra hover:text-creme transition-all"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {tVente('viewAll')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
            </AnimateIn>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-brun py-20 px-4">
        <AnimateIn className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl text-creme mb-3" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
            Vous avez un bien à {city.name} ?
          </h2>
          <p className="text-creme/60 mb-8 leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Visite gratuite, sans engagement. Clévia prend en charge tout — de la mise en ligne jusqu'au virement mensuel.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-terra text-creme font-medium rounded-full px-10 py-3.5 hover:bg-sable transition-all"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            Confier mon bien à Clévia
          </Link>
        </AnimateIn>
      </section>
    </>
  )
}
