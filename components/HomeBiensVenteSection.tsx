import { createClient } from '@/lib/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'

export default async function HomeBiensVenteSection() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'vente' })
  const supabase = await createClient()

  const { count } = await supabase
    .from('biens_vente')
    .select('id', { count: 'exact', head: true })
    .eq('statut', 'a_vendre')

  if (!count || count === 0) return null

  // Fetch a few photos for the visual montage
  const { data: featured } = await supabase
    .from('biens_vente')
    .select('id, titre, photos, ville, categorie')
    .eq('statut', 'a_vendre')
    .not('photos', 'is', null)
    .limit(4)

  const photos = (featured ?? [])
    .map((b) => ({ src: (b.photos as string[])?.[0] ?? null, titre: b.titre, ville: b.ville, categorie: b.categorie }))
    .filter((b) => b.src)
    .slice(0, 4)

  const categories = ['Appartements', 'Villas', 'Terrains', 'Fermes']

  return (
    <section className="bg-brun py-16 px-4 relative overflow-hidden">
      {/* Texture subtile */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #C97B4B 0%, transparent 50%), radial-gradient(circle at 80% 20%, #E8A87C 0%, transparent 40%)`,
        }}
      />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">

          {/* ── Gauche: texte ── */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Tag */}
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-terra/60" />
              <span
                className="text-terra text-xs font-medium tracking-[0.2em] uppercase"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {t('tag')}
              </span>
            </div>

            {/* Titre + compteur */}
            <div>
              <h2
                className="text-4xl md:text-5xl text-creme leading-tight"
                style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}
              >
                {t('homeTitle')}
              </h2>
              <div className="flex items-baseline gap-2 mt-3">
                <span
                  className="text-6xl md:text-7xl font-light text-terra"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {count}
                </span>
                <span
                  className="text-creme/60 text-lg"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  bien{count > 1 ? 's' : ''} disponible{count > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Description */}
            <p
              className="text-creme/60 text-sm leading-relaxed max-w-md"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {t('homeSubtitle')}
            </p>

            {/* Catégories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="text-xs rounded-full px-3 py-1.5 border"
                  style={{
                    borderColor: 'rgba(201,123,75,0.35)',
                    color: '#E8A87C',
                    fontFamily: 'var(--font-dm-sans)',
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mt-2">
              <Link
                href="/vente"
                className="inline-flex items-center gap-2 bg-terra text-creme font-medium rounded-full px-6 py-3 text-sm hover:bg-sable transition-all duration-200"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {t('viewAll')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 border border-creme/20 text-creme/70 font-medium rounded-full px-6 py-3 text-sm hover:border-creme/50 hover:text-creme transition-all duration-200"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                {t('ctaButton')}
              </Link>
            </div>
          </div>

          {/* ── Droite: montage photos ── */}
          {photos.length > 0 && (
            <div className="lg:col-span-2">
              <div className={`grid gap-3 ${photos.length >= 4 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {photos.slice(0, 4).map((p, i) => (
                  <div
                    key={i}
                    className="relative rounded-2xl overflow-hidden group"
                    style={{ aspectRatio: photos.length === 1 ? '16/9' : '1/1' }}
                  >
                    <Image
                      src={p.src!}
                      alt={p.titre}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />
                    {/* Overlay + info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-brun/70 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p
                        className="text-creme text-xs font-medium truncate"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        {p.ville}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback si pas de photos */}
          {photos.length === 0 && (
            <div className="lg:col-span-2 flex items-center justify-center">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(201,123,75,0.15)' }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C97B4B" strokeWidth="1">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
                  <path d="M9 21V12h6v9" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
