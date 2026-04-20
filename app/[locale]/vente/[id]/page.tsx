import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { AnimateIn } from '@/components/ui/AnimateIn'
import BienGallery from '@/components/biens/BienGallery'
import BienVenteCard, { type BienVente } from '@/components/BienVenteCard'
import VenteTracker from '@/components/vente/VenteTracker'
import { getEquipementsForCategorie } from '@/lib/equipements-vente'
import DemandeVisiteForm from '@/components/vente/DemandeVisiteForm'

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params
  const supabase = await createClient()
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const { data } = await supabase.from('biens_vente').select('titre, description, photos, ville, categorie').eq(isUUID ? 'id' : 'slug', id).single()
  if (!data) return { title: 'Bien introuvable · Clévia' }

  const t = await getTranslations({ locale, namespace: 'vente' })
  const desc = data.description?.slice(0, 160) ?? `${t(`categories.${data.categorie}`)} à ${data.ville} — Clévia Immobilier`
  const image = data.photos?.[0] ?? null

  return {
    title: `${data.titre.slice(0, 50)} · Clévia`,
    description: desc,
    openGraph: {
      title: `${data.titre} · Clévia`,
      description: desc,
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
      url: `/${locale}/vente/${id}`,
    },
    twitter: { card: 'summary_large_image', title: data.titre, description: desc, ...(image ? { images: [image] } : {}) },
    alternates: { canonical: `/${locale}/vente/${id}` },
  }
}

const STATUT_STYLE: Record<string, { bg: string; color: string }> = {
  a_vendre:       { bg: '#DCFCE7', color: '#15803D' },
  sous_compromis: { bg: '#FEF3C7', color: '#D97706' },
  vendu:          { bg: '#F3F4F6', color: '#6B7280' },
}

export default async function VenteDetailPage({ params }: Props) {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'vente' })
  const supabase = await createClient()

  // Accept both UUID and slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const { data, error } = await supabase
    .from('biens_vente')
    .select('*')
    .eq(isUUID ? 'id' : 'slug', id)
    .single()

  if (error || !data) notFound()

  const equipementsDefs = getEquipementsForCategorie(data.categorie)
  const equipementsActifs = equipementsDefs.filter((e) =>
    (data.equipements ?? []).includes(e.key)
  )

  const prixFormate = data.prix
    ? Number(data.prix).toLocaleString('fr-MA') + ' MAD'
    : null

  const statut = STATUT_STYLE[data.statut] ?? STATUT_STYLE.a_vendre

  // Autres biens (même catégorie, sans le courant)
  const { data: autresBiensData } = await supabase
    .from('biens_vente')
    .select('id, titre, categorie, statut, prix, surface, chambres, ville, photos, reference, slug')
    .eq('categorie', data.categorie)
    .neq('id', data.id)
    .neq('statut', 'vendu')
    .limit(3)

  const autresBiens: BienVente[] = (autresBiensData ?? []).map((b) => ({
    id: b.id, titre: b.titre, categorie: b.categorie, statut: b.statut,
    prix: b.prix ?? null, surface: b.surface ?? null, chambres: b.chambres ?? null,
    ville: b.ville, photos: b.photos ?? null, reference: b.reference ?? null,
    slug: (b.slug as string | null) ?? null,
  }))

  // Maps embed URL
  const mapsUrl = data.latitude && data.longitude
    ? `https://maps.google.com/maps?q=${data.latitude},${data.longitude}&output=embed&z=15`
    : data.adresse
    ? `https://maps.google.com/maps?q=${encodeURIComponent(`${data.adresse} ${data.ville}`)}&output=embed&z=15`
    : `https://maps.google.com/maps?q=${encodeURIComponent(data.ville)}&output=embed&z=13`

  // WhatsApp message
  const whatsappMsg = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par le bien "${data.titre}"${data.reference ? ` (Réf: ${data.reference})` : ''}. Pouvez-vous me contacter pour plus d'informations ?`
  )
  const whatsappNum = data.telephone.replace(/\D/g, '')

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: data.titre,
    description: data.description ?? undefined,
    url: `https://www.cleviamaroc.com/${locale}/vente/${id}`,
    ...(data.photos?.[0] ? { image: data.photos[0] } : {}),
    ...(data.prix ? { price: data.prix, priceCurrency: 'MAD' } : {}),
    ...(data.surface ? { floorSize: { '@type': 'QuantitativeValue', value: data.surface, unitCode: 'MTK' } } : {}),
    address: { '@type': 'PostalAddress', addressLocality: data.ville, addressCountry: 'MA' },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <VenteTracker bienId={data.id} />

      <div className="bg-creme min-h-screen">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
          <div className="flex items-center gap-2 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            <Link href="/vente" className="text-brun-mid/60 hover:text-terra transition-colors flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              {t('retour')}
            </Link>
            {data.reference && (
              <>
                <span className="text-brun/20">/</span>
                <span className="text-brun-mid/40">{t('reference')} {data.reference}</span>
              </>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-24">
          {/* Galerie */}
          <AnimateIn className="mb-8">
            <BienGallery photos={data.photos ?? []} nom={data.titre} videoUrl={data.video_url ?? null} />
          </AnimateIn>

          {/* Corps */}
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Gauche — infos */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* Titre + badges */}
              <AnimateIn>
                <div className="flex flex-wrap items-start gap-3 mb-2">
                  <span
                    className="text-xs font-medium rounded-full px-3 py-1"
                    style={{ backgroundColor: statut.bg, color: statut.color, fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {t(`statuts.${data.statut}`)}
                  </span>
                  <span
                    className="text-xs font-medium rounded-full px-3 py-1"
                    style={{ backgroundColor: '#F5EFE9', color: '#6B4C35', fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {t(`categories.${data.categorie}`)}
                  </span>
                  {data.sous_type && (
                    <span
                      className="text-xs font-medium rounded-full px-3 py-1"
                      style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontFamily: 'var(--font-dm-sans)' }}
                    >
                      {data.sous_type}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl text-brun mb-3" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                  {data.titre}
                </h1>
                <p className="text-brun-mid/70 flex items-center gap-1.5 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" />
                  </svg>
                  {data.adresse ? `${data.adresse}, ` : ''}{data.ville}
                </p>
              </AnimateIn>

              {/* Stats */}
              <AnimateIn>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {data.surface && (
                    <div className="bg-white border border-brun/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-semibold text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>{data.surface}</p>
                      <p className="text-xs text-brun-mid/50 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('surface_label')} ({data.categorie === 'Terrain' ? 'ha' : 'm²'})</p>
                    </div>
                  )}
                  {data.chambres && (
                    <div className="bg-white border border-brun/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-semibold text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>{data.chambres}</p>
                      <p className="text-xs text-brun-mid/50 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('chambres_label')}</p>
                    </div>
                  )}
                  {data.salles_de_bain && (
                    <div className="bg-white border border-brun/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-semibold text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>{data.salles_de_bain}</p>
                      <p className="text-xs text-brun-mid/50 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('sdb_label')}</p>
                    </div>
                  )}
                  {data.etage !== null && data.etage !== undefined && (
                    <div className="bg-white border border-brun/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-semibold text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>{data.etage}</p>
                      <p className="text-xs text-brun-mid/50 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('etage_label')}</p>
                    </div>
                  )}
                </div>
              </AnimateIn>

              {/* Description */}
              {data.description && (
                <AnimateIn>
                  <div className="bg-white border border-brun/10 rounded-2xl p-6">
                    <h2 className="text-2xl text-brun mb-4" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                      Description
                    </h2>
                    <p className="text-brun-mid/80 leading-relaxed whitespace-pre-wrap text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {data.description}
                    </p>
                  </div>
                </AnimateIn>
              )}

              {/* Équipements / Caractéristiques */}
              {equipementsActifs.length > 0 && (
                <AnimateIn>
                  <div className="bg-white border border-brun/10 rounded-2xl p-6">
                    <h2 className="text-2xl text-brun mb-5" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                      {t('equipements')}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {equipementsActifs.map((eq) => (
                        <div key={eq.key} className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-terra/10 flex items-center justify-center flex-shrink-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C97B4B" strokeWidth="1.5">
                              <path d={eq.path} />
                            </svg>
                          </div>
                          <span className="text-sm text-brun-mid" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            {eq.label[locale as 'fr' | 'ar' | 'en'] ?? eq.label.fr}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimateIn>
              )}

              {/* Localisation + Carte */}
              <AnimateIn>
                <div className="bg-white border border-brun/10 rounded-2xl overflow-hidden">
                  <div className="p-6 pb-4">
                    <h2 className="text-2xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                      {t('localisation')}
                    </h2>
                    {data.adresse && (
                      <p className="text-sm text-brun-mid/70 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {data.adresse}, {data.ville}
                      </p>
                    )}
                  </div>
                  <iframe
                    src={mapsUrl}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Localisation — ${data.titre}`}
                  />
                </div>
              </AnimateIn>
            </div>

            {/* Droite — CTA sticky */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <AnimateIn delay={0.1}>
                  <div className="bg-white border border-brun/10 rounded-2xl p-6 shadow-sm">
                    {/* Prix */}
                    <div className="mb-6 pb-5 border-b border-brun/8">
                      {prixFormate ? (
                        <>
                          <p className="text-xs text-brun-mid/40 uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            Prix de vente
                          </p>
                          <p className="text-3xl font-bold text-terra" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            {prixFormate}
                          </p>
                          {data.surface && (
                            <p className="text-xs text-brun-mid/40 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                              {Math.round(data.prix / data.surface).toLocaleString('fr-MA')} MAD/m²
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xl text-brun-mid/60 italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
                          {t('surDemande')}
                        </p>
                      )}
                    </div>

                    {/* Numéro du bien */}
                    <div className="flex items-center gap-2 mb-5 text-sm text-brun-mid" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 0112 18.85a19.5 19.5 0 01-5-5 19.79 19.79 0 01-2.92-8.72A2 2 0 016.07 3h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L10.09 10.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 17.92v-.9l-.08.9z" />
                      </svg>
                      <span className="font-medium text-brun">{data.telephone}</span>
                    </div>

                    {/* Boutons contact */}
                    <div className="flex flex-col gap-3">
                      <a
                        href={`https://wa.me/${whatsappNum}?text=${whatsappMsg}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 text-white text-sm font-medium rounded-full px-5 py-3 transition-all"
                        style={{ backgroundColor: '#25D366', fontFamily: 'var(--font-dm-sans)' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.828L.057 23.143l5.462-1.432A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.66-.518-5.172-1.418l-.371-.218-3.843 1.008 1.027-3.736-.241-.386A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                        </svg>
                        {t('whatsapp')}
                      </a>

                      <a
                        href={`tel:${data.telephone}`}
                        className="flex items-center justify-center gap-2 border border-brun/20 text-brun text-sm font-medium rounded-full px-5 py-3 hover:border-terra hover:text-terra transition-all"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 0112 18.85a19.5 19.5 0 01-5-5 19.79 19.79 0 01-2.92-8.72A2 2 0 016.07 3h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L10.09 10.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 17.92v-.9l-.08.9z" />
                        </svg>
                        {t('appeler')}
                      </a>

                      <Link
                        href={`/contact?bien=${encodeURIComponent(data.titre)}`}
                        className="flex items-center justify-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-5 py-3 hover:bg-brun transition-all"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        {t('contacter')}
                      </Link>
                    </div>

                    <DemandeVisiteForm
                      bienTitre={data.titre}
                      bienReference={data.reference ?? null}
                      bienVille={data.ville}
                      bienCategorie={data.categorie}
                    />
                  </div>
                </AnimateIn>
              </div>
            </div>
          </div>

          {/* Autres biens */}
          {autresBiens.length > 0 && (
            <AnimateIn className="mt-16">
              <h2 className="text-3xl text-brun mb-8" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                {t('autresBiens')}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {autresBiens.map((b) => <BienVenteCard key={b.id} bien={b} />)}
              </div>
            </AnimateIn>
          )}
        </div>
      </div>
    </>
  )
}
