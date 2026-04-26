export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const PLATF_COLORS: Record<string, string> = {
  Airbnb: 'bg-rose-100 text-rose-600',
  Booking: 'bg-blue-100 text-blue-600',
  Avito: 'bg-orange-100 text-orange-600',
  Facebook: 'bg-blue-100 text-blue-700',
  Direct: 'bg-green-100 text-green-700',
}

export default async function VoyageursPage() {
  const supabase = getAdminSupabase()
  const { data: voyageurs } = await supabase
    .from('voyageurs')
    .select('*')
    .order('updated_at', { ascending: false })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
            Voyageurs
          </h1>
          <p className="text-brun-mid text-sm mt-1">{voyageurs?.length ?? 0} voyageur(s) enregistré(s)</p>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden flex flex-col gap-3">
        {!voyageurs?.length ? (
          <p className="text-center py-10 text-brun-mid/50 text-sm">Aucun voyageur pour le moment</p>
        ) : voyageurs.map((v: any) => (
          <div key={v.id} className="bg-white rounded-2xl border border-brun/10 p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-medium text-brun text-sm">{v.nom}</p>
              <span className="text-xs text-brun-mid/50 bg-brun/5 rounded-full px-2 py-0.5">
                {v.nb_reservations} rés.
              </span>
            </div>
            <p className="text-xs text-brun-mid/60 mb-2">{v.telephone ?? '—'} {v.email ? `· ${v.email}` : ''}</p>
            <div className="flex flex-wrap gap-1">
              {(v.sources as string[])?.map((s: string) => (
                <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATF_COLORS[s] ?? 'bg-gray-100 text-gray-500'}`}>{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden lg:block bg-white rounded-2xl border border-brun/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brun/4">
              <tr>
                {['Nom', 'Téléphone', 'Email', 'Sources', 'Réservations', 'Premier contact'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-brun-mid uppercase tracking-wide font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brun/5">
              {!voyageurs?.length ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-brun-mid/50">Aucun voyageur pour le moment</td></tr>
              ) : voyageurs.map((v: any) => (
                <tr key={v.id} className="hover:bg-creme/40 transition-colors">
                  <td className="px-4 py-3 text-brun font-medium">{v.nom}</td>
                  <td className="px-4 py-3 text-brun-mid">{v.telephone ?? '—'}</td>
                  <td className="px-4 py-3 text-brun-mid">{v.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(v.sources as string[])?.map((s: string) => (
                        <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATF_COLORS[s] ?? 'bg-gray-100 text-gray-500'}`}>{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block bg-terra/10 text-terra text-xs font-medium px-2.5 py-1 rounded-full">
                      {v.nb_reservations}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brun-mid whitespace-nowrap">
                    {format(new Date(v.created_at), 'dd/MM/yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
