import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

const PAGE_SIZE = 20

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type Props = { searchParams: Promise<{ page?: string }> }

export default async function WhatsappClicksPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = getAdminSupabase()

  const { data, count } = await supabase
    .from('vente_whatsapp_clicks')
    .select('*, biens_vente(slug, titre)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
            Clics WhatsApp — Biens à vendre
          </h1>
          <p className="text-brun-mid text-sm mt-1">{count ?? 0} clic{(count ?? 0) > 1 ? 's' : ''} au total</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brun/10 overflow-hidden">
        {/* Mobile */}
        <div className="lg:hidden divide-y divide-brun/5">
          {(data ?? []).map((c: any) => {
            const slug = c.biens_vente?.slug ?? null
            const localisation = c.ville_geo && c.pays ? `${c.ville_geo}, ${c.pays}` : c.pays ?? null
            return (
              <div key={c.id} className="px-4 py-4 flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-brun text-sm">{c.bien_titre ?? '—'}</span>
                  {slug && (
                    <a href={`/fr/vente/${slug}`} target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 inline-flex items-center gap-1 text-terra text-xs font-medium">
                      Voir
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                    </a>
                  )}
                </div>
                <span className="text-xs text-brun-mid/70">{c.telephone ?? '—'}</span>
                <div className="flex items-center gap-2 text-xs text-brun-mid/60">
                  <span className="capitalize">{c.appareil ?? '—'}</span>
                  {localisation && <><span>·</span><span>{localisation}</span></>}
                  <span>·</span>
                  <span>{format(new Date(c.created_at), 'dd/MM/yy HH:mm', { locale: fr })}</span>
                </div>
              </div>
            )
          })}
          {!data?.length && <p className="px-4 py-12 text-center text-brun-mid/50 text-sm">Aucun clic WhatsApp enregistré</p>}
        </div>
        {/* Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brun/4">
              <tr>
                {['Date & heure', 'Bien', 'Téléphone', 'Appareil', 'Localisation', 'Lien'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-brun-mid uppercase tracking-wide font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brun/5">
              {(data ?? []).map((c: any) => {
                const slug = c.biens_vente?.slug ?? null
                const localisation = c.ville_geo && c.pays ? `${c.ville_geo}, ${c.pays}` : c.pays ?? '—'
                return (
                  <tr key={c.id} className="hover:bg-creme/40 transition-colors">
                    <td className="px-4 py-3 text-brun-mid whitespace-nowrap">{format(new Date(c.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</td>
                    <td className="px-4 py-3 text-brun font-medium max-w-[200px] truncate">{c.bien_titre ?? '—'}</td>
                    <td className="px-4 py-3 text-brun-mid whitespace-nowrap">{c.telephone ?? '—'}</td>
                    <td className="px-4 py-3 text-brun-mid capitalize whitespace-nowrap">{c.appareil ?? '—'}</td>
                    <td className="px-4 py-3 text-brun-mid whitespace-nowrap">{localisation}</td>
                    <td className="px-4 py-3">
                      {slug ? (
                        <a href={`/fr/vente/${slug}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-terra hover:text-brun transition-colors text-xs font-medium">
                          Voir
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                          </svg>
                        </a>
                      ) : <span className="text-brun-mid/40 text-xs">—</span>}
                    </td>
                  </tr>
                )
              })}
              {!data?.length && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-brun-mid/50 text-sm">Aucun clic WhatsApp enregistré</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-brun/8 flex items-center justify-between">
            <p className="text-xs text-brun-mid/60">
              Page {page} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`?page=${page - 1}`}
                  className="px-4 py-2 text-sm border border-brun/20 rounded-xl text-brun hover:border-terra hover:text-terra transition-all"
                >
                  ← Précédent
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`?page=${page + 1}`}
                  className="px-4 py-2 text-sm border border-brun/20 rounded-xl text-brun hover:border-terra hover:text-terra transition-all"
                >
                  Suivant →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
