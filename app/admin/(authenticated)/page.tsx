export const dynamic = 'force-dynamic'

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
    { count: whatsappClicsMois },
  ] = await Promise.all([
    supabase.from('biens').select('*', { count: 'exact', head: true }).eq('statut', 'actif'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).gte('created_at', monthStart).in('statut', ['confirmee', 'terminee']),
    supabase.from('reservations').select('date_arrivee,date_depart,montant,taux_commission').gte('created_at', monthStart).in('statut', ['confirmee', 'terminee']),
    supabase.from('contacts').select('*').eq('traite', false).order('created_at', { ascending: false }).limit(5),
    supabase.from('biens_visites').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('vente_visites').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('vente_whatsapp_clicks').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
  ])

  // Calcul revenus et taux d'occupation
  let revenusTotal = 0
  let commissionsTotal = 0
  let totalNuits = 0
  for (const r of reservationsData ?? []) {
    const montant = Number(r.montant ?? 0)
    revenusTotal += montant
    commissionsTotal += montant * (Number(r.taux_commission ?? 0) / 100)
    const d1 = new Date(r.date_arrivee)
    const d2 = new Date(r.date_depart)
    totalNuits += Math.max(0, Math.round((d2.getTime() - d1.getTime()) / 86400000))
  }
  const tauxOccupation = biensActifs
    ? Math.round((totalNuits / (biensActifs * 30)) * 100)
    : 0

  // 5 derniers clics WhatsApp
  const { data: lastWhatsappClics } = await supabase
    .from('vente_whatsapp_clicks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

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
        <StatCard label="Réservations ce mois" value={reservationsMois ?? 0} sub="confirmées + terminées" />
        <StatCard label="Taux d'occupation" value={`${tauxOccupation}%`} sub="sur 30 jours" color="brun-mid" />
        <StatCard
          label="Revenus ce mois"
          value={`${revenusTotal.toLocaleString('fr-MA')} MAD`}
          sub="montant total voyageurs"
          color="terra"
        />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Commissions ce mois"
          value={`${Math.round(commissionsTotal).toLocaleString('fr-MA')} MAD`}
          sub="part Clévia"
          color="terra"
        />
        <StatCard label="Vues location ce mois" value={vuesLocation ?? 0} sub="pages biens à louer" color="brun-mid" />
        <StatCard label="Vues vente ce mois" value={vuesVente ?? 0} sub="pages biens à vendre" color="brun-mid" />
        <StatCard label="Clics WhatsApp ce mois" value={whatsappClicsMois ?? 0} sub="intérêts biens à vendre" color="terra" />
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* Dernières réservations */}
        <div className="bg-white rounded-2xl border border-brun/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-brun/8">
            <h2 className="text-base font-medium text-brun">Dernières réservations</h2>
          </div>
          {/* Mobile */}
          <div className="lg:hidden divide-y divide-brun/5">
            {(lastReservations ?? []).map((r: any) => (
              <div key={r.id} className="px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-brun text-sm">{r.voyageur_nom}</span>
                  <StatusBadge statut={r.statut} />
                </div>
                <span className="text-xs text-brun-mid/70">{r.biens?.nom ?? '—'} · {format(new Date(r.date_arrivee), 'dd/MM/yy')}</span>
              </div>
            ))}
            {!lastReservations?.length && <p className="px-4 py-8 text-center text-brun-mid/50 text-sm">Aucune réservation</p>}
          </div>
          {/* Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brun/4">
                <tr>
                  {['Voyageur', 'Bien', 'Arrivée', 'Statut'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-brun-mid uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brun/5">
                {(lastReservations ?? []).map((r: any) => (
                  <tr key={r.id} className="hover:bg-creme/40 transition-colors">
                    <td className="px-4 py-3 text-brun font-medium">{r.voyageur_nom}</td>
                    <td className="px-4 py-3 text-brun-mid">{r.biens?.nom ?? '—'}</td>
                    <td className="px-4 py-3 text-brun-mid">{format(new Date(r.date_arrivee), 'dd/MM/yy')}</td>
                    <td className="px-4 py-3"><StatusBadge statut={r.statut} /></td>
                  </tr>
                ))}
                {!lastReservations?.length && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-brun-mid/50 text-sm">Aucune réservation</td></tr>
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
          {/* Mobile */}
          <div className="lg:hidden divide-y divide-brun/5">
            {(lastContacts ?? []).map((c: any) => (
              <div key={c.id} className="px-4 py-3 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-brun text-sm">{c.nom ?? '—'}</span>
                  <span className="text-xs text-brun-mid/60">{format(new Date(c.created_at), 'dd/MM/yy')}</span>
                </div>
                <span className="text-xs text-brun-mid/70">{c.telephone ?? '—'}{c.ville_bien ? ` · ${c.ville_bien}` : ''}</span>
              </div>
            ))}
            {!lastContacts?.length && <p className="px-4 py-8 text-center text-brun-mid/50 text-sm">Aucune demande en attente</p>}
          </div>
          {/* Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brun/4">
                <tr>
                  {['Date', 'Nom', 'Téléphone', 'Ville'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-brun-mid uppercase tracking-wide font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-brun/5">
                {(lastContacts ?? []).map((c: any) => (
                  <tr key={c.id} className="hover:bg-creme/40 transition-colors">
                    <td className="px-4 py-3 text-brun-mid">{format(new Date(c.created_at), 'dd/MM/yy')}</td>
                    <td className="px-4 py-3 text-brun font-medium">{c.nom ?? '—'}</td>
                    <td className="px-4 py-3 text-brun-mid">{c.telephone ?? '—'}</td>
                    <td className="px-4 py-3 text-brun-mid">{c.ville_bien ?? '—'}</td>
                  </tr>
                ))}
                {!lastContacts?.length && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-brun-mid/50 text-sm">Aucune demande en attente</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Derniers clics WhatsApp */}
      <div className="mt-6 bg-white rounded-2xl border border-brun/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-brun/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.103 1.523 5.828L.057 23.143l5.462-1.432A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.66-.518-5.172-1.418l-.371-.218-3.843 1.008 1.027-3.736-.241-.386A9.937 9.937 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
            <h2 className="text-base font-medium text-brun">Derniers clics WhatsApp — Biens à vendre</h2>
          </div>
          <a href="/admin/vente/whatsapp-clicks" className="text-xs text-terra hover:text-brun transition-colors font-medium">
            Voir tout →
          </a>
        </div>
        {/* Mobile */}
        <div className="lg:hidden divide-y divide-brun/5">
          {(lastWhatsappClics ?? []).map((c: any) => (
            <div key={c.id} className="px-4 py-3 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-brun text-sm">{c.bien_titre ?? '—'}</span>
                <span className="text-xs text-brun-mid/60 capitalize">{c.appareil ?? '—'}</span>
              </div>
              <span className="text-xs text-brun-mid/70">{c.telephone ?? '—'} · {format(new Date(c.created_at), 'dd/MM/yy HH:mm')}</span>
            </div>
          ))}
          {!lastWhatsappClics?.length && <p className="px-4 py-8 text-center text-brun-mid/50 text-sm">Aucun clic WhatsApp pour le moment</p>}
        </div>
        {/* Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brun/4">
              <tr>
                {['Date', 'Bien', 'Téléphone', 'Appareil'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-brun-mid uppercase tracking-wide font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brun/5">
              {(lastWhatsappClics ?? []).map((c: any) => (
                <tr key={c.id} className="hover:bg-creme/40 transition-colors">
                  <td className="px-4 py-3 text-brun-mid">{format(new Date(c.created_at), 'dd/MM/yy HH:mm')}</td>
                  <td className="px-4 py-3 text-brun font-medium">{c.bien_titre ?? '—'}</td>
                  <td className="px-4 py-3 text-brun-mid">{c.telephone ?? '—'}</td>
                  <td className="px-4 py-3 text-brun-mid capitalize">{c.appareil ?? '—'}</td>
                </tr>
              ))}
              {!lastWhatsappClics?.length && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-brun-mid/50 text-sm">Aucun clic WhatsApp pour le moment</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
