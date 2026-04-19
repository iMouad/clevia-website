import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'

export type BienVente = {
  id: string
  titre: string
  categorie: string
  statut: 'a_vendre' | 'sous_compromis' | 'vendu'
  prix: number | null
  surface: number | null
  chambres: number | null
  ville: string
  photos: string[] | null
  reference: string | null
}

const STATUT_STYLE = {
  a_vendre:      { bg: '#DCFCE7', color: '#15803D' },
  sous_compromis:{ bg: '#FEF3C7', color: '#D97706' },
  vendu:         { bg: '#F3F4F6', color: '#6B7280' },
}

export default function BienVenteCard({ bien }: { bien: BienVente }) {
  const t = useTranslations('vente')
  const locale = useLocale()
  const photo = bien.photos?.[0] ?? null
  const statut = STATUT_STYLE[bien.statut] ?? STATUT_STYLE.a_vendre

  const prixFormate = bien.prix
    ? bien.prix.toLocaleString('fr-MA') + ' MAD'
    : null

  return (
    <div
      className="bg-white border border-brun/10 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200 flex flex-col"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] bg-brun/5 flex-shrink-0">
        {photo ? (
          <Image src={photo} alt={bien.titre} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="text-brun/20" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* Badge statut */}
        <span
          className="absolute top-3 left-3 text-xs font-medium rounded-full px-2.5 py-1"
          style={{ backgroundColor: statut.bg, color: statut.color, fontFamily: 'var(--font-dm-sans)' }}
        >
          {t(`statuts.${bien.statut}`)}
        </span>

        {/* Badge catégorie */}
        <span
          className="absolute top-3 right-3 text-xs font-medium rounded-full px-2.5 py-1"
          style={{ backgroundColor: 'rgba(44,26,14,0.75)', color: '#FAF6F1', fontFamily: 'var(--font-dm-sans)' }}
        >
          {t(`categories.${bien.categorie}`)}
        </span>
      </div>

      {/* Contenu */}
      <div className="p-5 flex flex-col flex-1">
        {bien.reference && (
          <p className="text-xs text-brun-mid/40 mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {t('reference')} {bien.reference}
          </p>
        )}

        <h3 className="text-lg text-brun mb-1 line-clamp-2 leading-snug" style={{ fontFamily: 'var(--font-cormorant)' }}>
          {bien.titre}
        </h3>

        <p className="text-sm text-brun-mid/70 mb-3 flex items-center gap-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          {bien.ville}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3 mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {bien.surface && (
            <span className="text-xs text-brun-mid/70">
              <span className="font-medium text-brun">{bien.surface}</span> {t('surface')}
            </span>
          )}
          {bien.chambres && (
            <span className="text-xs text-brun-mid/70">
              <span className="font-medium text-brun">{bien.chambres}</span> {t('chambres')}
            </span>
          )}
        </div>

        {/* Prix */}
        <div className="mt-auto">
          {prixFormate ? (
            <p className="text-xl font-semibold text-terra" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {prixFormate}
            </p>
          ) : (
            <p className="text-base text-brun-mid/60 italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
              {t('surDemande')}
            </p>
          )}

          <Link
            href={`/vente/${bien.id}`}
            className="mt-3 flex items-center justify-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-5 py-2.5 hover:bg-brun transition-all duration-200"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {t('voirBien')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
