import { createClient } from '@/lib/supabase/server'
import { getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

export default async function HomeBiensVenteSection() {
  const locale = await getLocale()
  const supabase = await createClient()

  const { count } = await supabase
    .from('biens_vente')
    .select('id', { count: 'exact', head: true })
    .eq('statut', 'a_vendre')

  if (!count || count === 0) return null

  const label =
    locale === 'ar'
      ? `هل تبحث عن شراء عقار؟ ${count} عقار${count > 1 ? 'ات' : ''} متاح${count > 1 ? 'ة' : ''} للبيع`
      : locale === 'en'
      ? `Looking to buy? ${count} propert${count > 1 ? 'ies' : 'y'} for sale`
      : `Vous cherchez à acheter\u00a0? ${count} bien${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''} à la vente`

  const cta =
    locale === 'ar' ? 'اكتشف' : locale === 'en' ? 'Discover' : 'Découvrir'

  return (
    <div className="bg-white border-t border-brun/8 py-5 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
        <span className="h-px flex-1 max-w-16 bg-brun/10 hidden sm:block" />
        <Link
          href="/vente"
          className="flex items-center gap-2.5 group"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          <span className="text-sm text-brun-mid/50 group-hover:text-brun-mid transition-colors duration-200">
            {label}
          </span>
          <span className="flex items-center gap-1 text-sm font-medium text-terra/70 group-hover:text-terra transition-colors duration-200 whitespace-nowrap">
            {cta}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </Link>
        <span className="h-px flex-1 max-w-16 bg-brun/10 hidden sm:block" />
      </div>
    </div>
  )
}
