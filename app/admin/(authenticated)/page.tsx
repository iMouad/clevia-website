import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Server-side Supabase with service role (full access)
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function StatCard({ label, value, sub, color = 'terra' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-brun/10">
      <p className="text-xs text-brun-mid uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-4xl mb-1 text-${color}`} style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 300 }}>
        {value}
      </p>
      {sub && <p className="text-xs text-brun-mid/60">{sub}</p>}
    </div>
  )
}

function StatusBadge({ statut }: { statut: string }) {
  const map: Record<string, string> = {
    confirmee: 'bg-green-100 text-green-700',
    annulee: 'bg-red-100 text-red-700',
    terminee: 'bg-gray-100 text-gray-600',
  }
  const labels: Record<string, string> = {
    confirmee: 'Confirmée', annulee: 'Annulée', terminee: 'Terminée',
  }
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${map[statut] || 'bg-gray-100 text-gray-600'}`}>
      {labels[statut] || statut}
    </span>
  )
}

export default async function AdminDashboard() {
  const supabase = getAdminSupabase()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: biensActifs },
    { count: reservationsMois },
    { data: reservationsData },
    { data: lastContacts },
    { count: vuesLocation },
    { count: vuesVente },
  ] = await Promise.all([
    supabase.from('biens').select('*', { count: 'exact', head: true }).eq('statut', 'actif'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).gte('created_at', monthStart).eq('statut', 'confirmee'),
    supabase.from('reservations').select('date_arrivee,date_depart,montant').gte('created_at', monthStart).eq('statut', 'confirmee'),
    supabase.from('contacts').select('*').eq('traite', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('biens_visites').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('vente_visites').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
  ])

  // Calcul revenus et taux d'occupation
  let revenusTotal = 0
  let totalNuits = 0
  for (const r of reservationsData ?? []) {
    revenusTotal += Number(r.montant ?? 0)
    const d1 = new Date(r.date_arrivee)
    const d2 = new Date(r.date_depart)
    totalNuits += Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000))
  }
  const tauxOccupation = biensActifs
    ? Math.round((totalNuits / (biensActifs * 30)) * 100)
    : 0

  // 5 dernières réservations
  const { data: lastReservations } = await supabase
    .from('reservations')
    .select('*, biens(nom)')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
          Tableau de bord
        </h1>
        <p className="text-brun-mid text-sm mt-1">
          {format(now, "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <StatCard label="Biens actifs" value={biensActifs ?? 0} sub="en gestion" />
        <StatCard label="Réservations ce mois" value={reservationsMois ?? 0} sub="confirmées ce mois" />
        <StatCard label="Taux d'occupation" value={`${tauxOccupation}%`} sub="sur 30 jours" color="brun-mid" />
        <StatCard
          label="Revenus ce mois"
          value={`${revenusTotal.toLocaleString('fr-MA')} MAD`}
          sub="hors commission"
          color="terra"
        />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Vues location ce mois" value={vuesLocation ?? 0} sub="pages biens à louer" color="brun-mid" />
        <StatCard label="Vues vente ce mois" value={vuesVente ?? 0} sub="pages biens à vendre" color="brun-mid" />
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* Dernières réservations */}
        <div className="bg-white rounded-2xl border border-brun/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-brun/8">
            <h2 className="text-base font-medium text-brun">Dernières réservations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brun/4">
                <tr>
                  {['Voyageur', 'Bien', 'Arrivée', 'Statut'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-brun-mid uppercase tracking-wide font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brun/5">
                {(lastReservations ?? []).map((r: any) => (
                  <tr key={r.id} className="hover:bg-creme/40 transition-colors">
                    <td className="px-4 py-3 text-brun font-medium">{r.voyageur_nom}</td>
                    <td className="px-4 py-3 text-brun-mid">{r.biens?.nom ?? '—'}</td>
                    <td className="px-4 py-3 text-brun-mid">
                      {format(new Date(r.date_arrivee), 'dd/MM/yy')}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge statut={r.statut} />
                    </td>
                  </tr>
                ))}
                {!lastReservations?.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-brun-mid/50 text-sm">
                      Aucune réservation
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dernières demandes non traitées */}
        <div className="bg-white rounded-2xl border border-brun/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-brun/8">
            <h2 className="text-base font-medium text-brun">Demandes non traitées</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brun/4">
                <tr>
                  {['Date', 'Nom', 'Téléphone', 'Ville'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-brun-mid uppercase tracking-wide font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brun/5">
                {(lastContacts ?? []).map((c: any) => (
                  <tr key={c.id} className="hover:bg-creme/40 transition-colors">
                    <td className="px-4 py-3 text-brun-mid">
                      {format(new Date(c.created_at), 'dd/MM/yy')}
                    </td>
                    <td className="px-4 py-3 text-brun font-medium">{c.nom ?? '—'}</td>
                    <td className="px-4 py-3 text-brun-mid">{c.telephone ?? '—'}</td>
                    <td className="px-4 py-3 text-brun-mid">{c.ville_bien ?? '—'}</td>
                  </tr>
                ))}
                {!lastContacts?.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-brun-mid/50 text-sm">
                      Aucune demande en attente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
