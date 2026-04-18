import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import BienGallery from '@/components/biens/BienGallery'
import { EQUIPEMENTS_MAP, REGLES_OPTIONS } from '@/lib/equipements'

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('biens').select('nom, description, photos, ville').eq('id', id).single()
  if (!data) return { title: 'Bien introuvable' }

  const mainPhoto = (data.photos as string[] | null)?.[0] ?? null
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.cleviamaroc.com'

  // Title max ~55 chars : "Nom du bien · Clévia"
  const nomTruncated = data.nom.length > 35 ? data.nom.slice(0, 33) + '…' : data.nom
  const ogTitle = `${nomTruncated} · Clévia`

  // Description toujours définie
  const ville = (data.ville as string | null) ?? 'Mansouria · Mohammedia'
  const fallbackDesc = `Location courte durée à ${ville}, géré par Clévia Conciergerie. Réservez sur Airbnb, Booking ou contactez-nous directement.`
  const ogDescription = (data.description as string | null)?.slice(0, 160) ?? fallbackDesc

  return {
    title: `${data.nom} — Clévia Conciergerie`,
    description: ogDescription,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: `${siteUrl}/${locale}/biens/${id}`,
      siteName: 'Clévia Conciergerie',
      locale: locale === 'ar' ? 'ar_MA' : locale === 'en' ? 'en_US' : 'fr_MA',
      type: 'website',
      images: mainPhoto
        ? [{ url: mainPhoto, width: 1200, height: 800, alt: data.nom }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: mainPhoto ? [mainPhoto] : [],
    },
  }
}

const TYPE_COLORS: Record<string, string> = {
  Appartement: 'bg-sky-50 text-sky-700 border-sky-100',
  Villa: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Studio: 'bg-violet-50 text-violet-700 border-violet-100',
  Autre: 'bg-stone-50 text-stone-600 border-stone-100',
}

const WHATSAPP_NUMBER = '212614268283'

export default async function BienDetailPage({ params }: Props) {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'biens' })

  const supabase = await createClient()
  const { data: bien } = await supabase
    .from('biens')
    .select('*')
    .eq('id', id)
    .eq('statut', 'actif')
    .single()

  if (!bien) notFound()

  const photos = (bien.photos ?? []).filter(Boolean) as string[]
  const equips = ((bien.equipements ?? []) as string[]).filter((k) => k in EQUIPEMENTS_MAP)
  const regles = (bien.regles ?? []) as string[]
  const isDisponible = bien.disponible !== false

  const whatsappMsg = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par le bien "${bien.nom}" sur Clévia Conciergerie. Pouvez-vous me donner plus d'informations ?`
  )

  return (
    <>
      {/* ── Back link ── */}
      <div className="bg-creme border-b border-brun/5 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/biens"
            className="inline-flex items-center gap-2 text-sm text-brun-mid hover:text-terra transition-colors"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('retour')}
          </Link>
        </div>
      </div>

      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">

          {/* ── Gallery ── */}
          <BienGallery photos={photos} nom={bien.nom} />

          {/* ── Content grid ── */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* ── Left: details ── */}
            <div className="lg:col-span-2 flex flex-col gap-8">

              {/* Header */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {bien.type && (
                    <span
                      className={`text-sm font-medium px-3 py-1 rounded-full border ${TYPE_COLORS[bien.type] ?? 'bg-creme text-brun border-brun/10'}`}
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      {bien.type}
                    </span>
                  )}
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${isDisponible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {isDisponible ? t('disponible') : t('nonDisponible')}
                  </span>
                </div>

                <h1
                  className="text-4xl md:text-5xl text-brun leading-tight"
                  style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}
                >
                  {bien.nom}
                </h1>

                {(bien.adresse ?? bien.ville) && (
                  <p className="flex items-center gap-2 text-brun-mid mt-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    <svg width="12" height="15" viewBox="0 0 10 13" fill="none">
                      <path d="M5 0.5C2.52 0.5 0.5 2.52 0.5 5c0 3.75 4.5 7.5 4.5 7.5S9.5 8.75 9.5 5C9.5 2.52 7.48 0.5 5 0.5z" fill="#C97B4B" fillOpacity=".25" stroke="#C97B4B" strokeWidth="1" />
                      <circle cx="5" cy="5" r="1.75" fill="#C97B4B" />
                    </svg>
                    {bien.adresse ?? bien.ville}
                  </p>
                )}
              </div>

              {/* Caractéristiques */}
              <div className="border-y border-brun/8 py-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {bien.chambres && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-creme flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97B4B" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M3 22V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v15M1 22h22M3 11h18M9 11v11" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg text-brun font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>{bien.chambres}</p>
                        <p className="text-xs text-brun-mid/70" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('chambres')}</p>
                      </div>
                    </div>
                  )}
                  {bien.salles_de_bain && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-creme flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97B4B" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M2 12h20v2a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6v-2zM6 12V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2v1" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg text-brun font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>{bien.salles_de_bain}</p>
                        <p className="text-xs text-brun-mid/70" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('sdb')}</p>
                      </div>
                    </div>
                  )}
                  {(bien.capacite_max ?? bien.capacite) && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-creme flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97B4B" strokeWidth="1.5" strokeLinecap="round">
                          <circle cx="12" cy="8" r="3" />
                          <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg text-brun font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>{bien.capacite_max ?? bien.capacite}</p>
                        <p className="text-xs text-brun-mid/70" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('capaciteMax')}</p>
                      </div>
                    </div>
                  )}
                  {bien.surface && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-creme flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97B4B" strokeWidth="1.5" strokeLinecap="round">
                          <rect x="3" y="3" width="18" height="18" rx="1" />
                          <path d="M9 3v18M3 9h18" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg text-brun font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>{bien.surface}</p>
                        <p className="text-xs text-brun-mid/70" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('surface')}</p>
                      </div>
                    </div>
                  )}
                  {bien.etage && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-creme flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97B4B" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M2 20h20M4 20V10l8-7 8 7v10M10 20v-6h4v6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-brun font-medium leading-tight" style={{ fontFamily: 'var(--font-dm-sans)' }}>{bien.etage}</p>
                        <p className="text-xs text-brun-mid/70" style={{ fontFamily: 'var(--font-dm-sans)' }}>Situation</p>
                      </div>
                    </div>
                  )}
                  {bien.distance_mer && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-creme flex items-center justify-center flex-shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C97B4B" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M2 16c.5-1 1.5-1.5 3-1.5s2.5.5 3 1.5 1.5 1.5 3 1.5 2.5-.5 3-1.5 1.5-1.5 3-1.5M3 20h18M12 4l3 5H9l3-5zm0 0V9" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-brun font-medium leading-tight" style={{ fontFamily: 'var(--font-dm-sans)' }}>{bien.distance_mer}</p>
                        <p className="text-xs text-brun-mid/70" style={{ fontFamily: 'var(--font-dm-sans)' }}>{t('distanceMer')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {bien.description && (
                <div>
                  <h2 className="text-2xl text-brun mb-4" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                    {t('leBien')}
                  </h2>
                  <p className="text-brun-mid leading-relaxed whitespace-pre-line" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {bien.description}
                  </p>
                </div>
              )}

              {/* Équipements */}
              {equips.length > 0 && (
                <div>
                  <h2 className="text-2xl text-brun mb-4" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                    {t('equipements')}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {equips.map((key) => {
                      const def = EQUIPEMENTS_MAP[key]
                      return (
                        <div key={key} className="flex items-center gap-3 p-3 rounded-xl border border-brun/8 bg-white hover:bg-creme transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C97B4B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                            <path d={def.path} />
                          </svg>
                          <span className="text-sm text-brun-mid" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            {locale === 'ar' ? def.label.ar : locale === 'en' ? def.label.en : def.label.fr}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Règles */}
              {regles.length > 0 && (
                <div>
                  <h2 className="text-2xl text-brun mb-4" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                    {t('regles')}
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {regles.map((key) => {
                      const rule = REGLES_OPTIONS.find((r) => r.key === key)
                      const label = rule
                        ? (locale === 'ar' ? rule.label.ar : locale === 'en' ? rule.label.en : rule.label.fr)
                        : key
                      return (
                        <li key={key} className="flex items-center gap-3 text-brun-mid" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C97B4B" strokeWidth="2" strokeLinecap="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          {label}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Localisation */}
              <div>
                <h2 className="text-2xl text-brun mb-4" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                  {t('localisation')}
                </h2>
                <div className="flex items-center gap-2 text-brun-mid" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C97B4B" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 2C8.1 2 5 5.1 5 9c0 5.3 6.2 12.4 6.5 12.7.3.3.7.3 1 0C12.8 21.4 19 14.3 19 9c0-3.9-3.1-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  {[bien.adresse, bien.ville].filter(Boolean).join(', ') || bien.ville || '—'}
                </div>
              </div>
            </div>

            {/* ── Right: sticky CTA card ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 bg-white rounded-2xl border border-brun/10 shadow-lg p-6 flex flex-col gap-5">
                {/* Prix */}
                {bien.prix_nuit && (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                      {bien.prix_nuit}
                    </span>
                    <span className="text-brun-mid text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      MAD{t('nuitLabel')}
                    </span>
                  </div>
                )}

                <div
                  className={`text-sm font-medium px-3 py-2 rounded-xl text-center ${isDisponible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  {isDisponible ? t('disponible') : t('nonDisponible')}
                </div>

                {/* WhatsApp CTA */}
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-medium rounded-full px-6 py-3.5 hover:bg-[#20ba59] transition-all duration-200"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12.05 2C6.495 2 2.01 6.485 2 12.044c-.004 1.99.521 3.931 1.516 5.637L2 22l4.49-1.494a10.063 10.063 0 0 0 5.557 1.638h.005C17.604 22.144 22 17.659 22 12.1 22 9.407 20.956 6.87 19.064 4.976A9.958 9.958 0 0 0 12.05 2zm.001 18.385a8.397 8.397 0 0 1-4.267-1.161l-.306-.181-3.174 1.053.855-3.227-.198-.33a8.39 8.39 0 0 1-1.287-4.495c.008-4.634 3.779-8.402 8.42-8.402a8.364 8.364 0 0 1 5.945 2.473A8.345 8.345 0 0 1 20.44 12.1c0 4.635-3.773 8.285-8.39 8.285z" />
                  </svg>
                  WhatsApp
                </a>

                {/* Contact CTA */}
                <Link
                  href="/contact"
                  className="w-full flex items-center justify-center gap-2 border-2 border-brun text-brun font-medium rounded-full px-6 py-3.5 hover:bg-brun hover:text-creme transition-all duration-200"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  {t('contacter')}
                </Link>

                {/* Platform links */}
                {(bien.airbnb_url || bien.booking_url || bien.avito_url) && (
                  <div className="border-t border-brun/8 pt-4 flex flex-col gap-2">
                    <p className="text-xs text-brun-mid/50 text-center mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      Réserver directement sur :
                    </p>
                    {bien.airbnb_url && (
                      <a href={bien.airbnb_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-medium px-4 py-2 rounded-full text-white text-center hover:opacity-85 transition-opacity"
                        style={{ backgroundColor: '#FF5A5F', fontFamily: 'var(--font-dm-sans)' }}>
                        Airbnb
                      </a>
                    )}
                    {bien.booking_url && (
                      <a href={bien.booking_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-medium px-4 py-2 rounded-full text-white text-center hover:opacity-85 transition-opacity"
                        style={{ backgroundColor: '#003580', fontFamily: 'var(--font-dm-sans)' }}>
                        Booking.com
                      </a>
                    )}
                    {bien.avito_url && (
                      <a href={bien.avito_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-medium px-4 py-2 rounded-full text-white text-center hover:opacity-85 transition-opacity"
                        style={{ backgroundColor: '#E07A2F', fontFamily: 'var(--font-dm-sans)' }}>
                        Avito.ma
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom CTA banner ── */}
        <section className="bg-creme border-t border-brun/8 py-16 px-4 mt-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl text-brun mb-3" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
              {t('ctaTitle')}
            </h2>
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
          </div>
        </section>
      </div>
    </>
  )
}
