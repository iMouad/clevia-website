import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { AnimateIn, StaggerContainer, StaggerItem } from '@/components/ui/AnimateIn'

type Temoignage = {
  id: string
  nom: string
  ville: string | null
  type_bien: string | null
  note: number
  message: string
  photo_url: string | null
}

function Stars({ note }: { note: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width="14" height="14" viewBox="0 0 14 14" fill={i < note ? '#C97B4B' : 'none'}
          stroke="#C97B4B" strokeWidth="1.2"
        >
          <path d="M7 1l1.55 3.14L12 4.72l-2.5 2.43.59 3.44L7 8.9l-3.09 1.69.59-3.44L2 4.72l3.45-.58L7 1z" />
        </svg>
      ))}
    </div>
  )
}

function Avatar({ nom, photoUrl }: { nom: string; photoUrl: string | null }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoUrl} alt={nom} className="w-10 h-10 rounded-full object-cover" />
    )
  }
  const initials = nom.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="w-10 h-10 rounded-full bg-terra/15 flex items-center justify-center flex-shrink-0">
      <span className="text-terra text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
        {initials}
      </span>
    </div>
  )
}

export default async function TemoignagesSection() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'testimonials' })

  const supabase = await createClient()
  const { data } = await supabase
    .from('temoignages')
    .select('id, nom, ville, type_bien, note, message, photo_url')
    .eq('actif', true)
    .order('ordre', { ascending: true })
    .order('created_at', { ascending: false })

  const temoignages: Temoignage[] = data ?? []

  if (!temoignages.length) return null

  return (
    <section className="bg-brun/3 border-y border-brun/8 py-24 px-4">
      <div className="max-w-7xl mx-auto">

        <AnimateIn className="text-center mb-14">
          <span
            className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-4"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {t('tag')}
          </span>
          <h2 className="text-4xl md:text-5xl text-brun mb-4">{t('title')}</h2>
          <p className="text-brun-mid max-w-md mx-auto" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {t('subtitle')}
          </p>
        </AnimateIn>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {temoignages.map((temo) => (
            <StaggerItem key={temo.id}>
              <div className="bg-white rounded-2xl p-7 border border-brun/8 shadow-sm flex flex-col gap-5 h-full">

                {/* Stars + quote mark */}
                <div className="flex items-start justify-between">
                  <Stars note={temo.note} />
                  <svg
                    width="28" height="22" viewBox="0 0 28 22" fill="none"
                    className="text-terra/20 flex-shrink-0"
                  >
                    <path
                      d="M0 22V13.2C0 9.73 .907 6.907 2.72 4.72 4.587 2.48 7.2 1.013 10.56 .32L11.68 2.88C9.707 3.467 8.16 4.4 7.04 5.68 5.973 6.907 5.387 8.453 5.28 10.32H10.56V22H0zm16.32 0V13.2c0-3.467.907-6.293 2.72-8.48C21.007 2.48 23.627 1.013 26.88.32L28 2.88c-1.973.587-3.52 1.52-4.64 2.8-1.067 1.227-1.653 2.773-1.76 4.64H26.88V22H16.32z"
                      fill="currentColor"
                    />
                  </svg>
                </div>

                {/* Message */}
                <p
                  className="text-brun/80 leading-relaxed flex-1 text-[0.95rem]"
                  style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.05rem', fontStyle: 'italic' }}
                >
                  {temo.message}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-brun/8">
                  <Avatar nom={temo.nom} photoUrl={temo.photo_url} />
                  <div>
                    <p className="text-brun text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {temo.nom}
                    </p>
                    {(temo.ville || temo.type_bien) && (
                      <p className="text-brun-mid/60 text-xs" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        {[temo.type_bien, temo.ville].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

      </div>
    </section>
  )
}
