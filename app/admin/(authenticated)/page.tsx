'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase'
import { platBg } from '@/lib/plateformes'
import type { Plateforme } from '@/lib/plateformes'

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

export default function AdminDashboard() {
  const supabase = createClient()
  const now = new Date()
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [adminName, setAdminName] = useState('Admin')
  const [biensActifs, setBiensActifs] = useState(0)
  const [biensActifsData, setBiensActifsData] = useState<{ id: string; nom: string }[]>([])
  const [reservationsData, setReservationsData] = useState<any[]>([])
  const [lastContacts, setLastContacts] = useState<any[]>([])
  const [lastReservations, setLastReservations] = useState<any[]>([])
  const [enCoursData, setEnCoursData] = useState<any[]>([])
  const [checkoutDemainData, setCheckoutDemainData] = useState<any[]>([])
  const [checkinDemainData, setCheckinDemainData] = useState<any[]>([])
  const [vuesLocation, setVuesLocation] = useState(0)
  const [vuesVente, setVuesVente] = useState(0)
  const [whatsappClicsMois, setWhatsappClicsMois] = useState(0)
  const [lastWhatsappClics, setLastWhatsappClics] = useState<any[]>([])
  const [plateformes, setPlateformes] = useState<Plateforme[]>([])

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const todayStr = now.toISOString().split('T')[0]
  const demainStr = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().split('T')[0]

  useEffect(() => {
    Promise.all([
      supabase.auth.getUser(),
      supabase.from('biens').select('id,nom', { count: 'exact' }).eq('statut', 'actif').neq('disponible', false),
      supabase.from('reservations').select('bien_id,date_arrivee,date_depart,montant,taux_commission,commission_fixe').gt('date_depart', monthStart).lte('date_arrivee', monthEnd).in('statut', ['confirmee', 'terminee']),
      supabase.from('contacts').select('*').eq('traite', false).order('created_at', { ascending: false }).limit(5),
      supabase.from('biens_visites').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('vente_visites').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('vente_whatsapp_clicks').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('vente_whatsapp_clicks').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('reservations').select('*, biens(nom)').order('date_arrivee', { ascending: false }).limit(5),
      supabase.from('reservations').select('voyageur_nom, date_arrivee, date_depart, plateforme, bien_id, biens(nom)').lte('date_arrivee', todayStr).gt('date_depart', todayStr).in('statut', ['confirmee', 'terminee']),
      supabase.from('reservations').select('voyageur_nom, date_arrivee, date_depart, plateforme, bien_id, biens(nom)').eq('date_depart', demainStr).in('statut', ['confirmee', 'terminee']),
      supabase.from('reservations').select('voyageur_nom, date_arrivee, date_depart, plateforme, bien_id, biens(nom)').eq('date_arrivee', demainStr).in('statut', ['confirmee']),
      supabase.from('plateformes').select('*').eq('actif', true).order('ordre'),
    ]).then(([
      { data: { user } },
      { data: biensData, count: biensCount },
      { data: resData },
      { data: contacts },
      { count: vuesLoc },
      { count: vuesV },
      { count: waClics },
      { data: waData },
      { data: lastRes },
      { data: enCours },
      { data: checkoutDemain },
      { data: checkinDemain },
      { data: platData },
    ]) => {
      setIsSuperAdmin(user?.app_metadata?.role !== 'admin')
      setAdminName(user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin')
      setBiensActifs(biensCount ?? 0)
      setBiensActifsData(biensData ?? [])
      setReservationsData(resData ?? [])
      setLastContacts(contacts ?? [])
      setVuesLocation(vuesLoc ?? 0)
      setVuesVente(vuesV ?? 0)
      setWhatsappClicsMois(waClics ?? 0)
      setLastWhatsappClics(waData ?? [])
      setLastReservations(lastRes ?? [])
      setEnCoursData(enCours ?? [])
      setCheckoutDemainData(checkoutDemain ?? [])
      setCheckinDemainData(checkinDemain ?? [])
      setPlateformes(platData ?? [])
      setLoading(false)
    })
  }, [])

  const platColorMap: Record<string, string> = {}
  plateformes.forEach((p) => { platColorMap[p.nom] = p.couleur })

  const mStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  let revenusTotal = 0
  let commissionsTotal = 0
  let totalNuits = 0
  for (const r of reservationsData) {
    const montant = Number(r.montant ?? 0)
    revenusTotal += montant
    const fixe = Number(r.commission_fixe ?? 0)
    commissionsTotal += fixe > 0 ? fixe : montant * (Number(r.taux_commission ?? 0) / 100)
    const d1 = new Date(r.date_arrivee)
    const d2 = new Date(r.date_depart)
    const clampedStart = d1 < mStart ? mStart : d1
    const clampedEnd = d2 > mEnd ? mEnd : d2
    totalNuits += Math.max(0, Math.round((clampedEnd.getTime() - clampedStart.getTime()) / 86400000))
  }
  const tauxOccupation = biensActifs
    ? Math.round((totalNuits / (biensActifs * 30)) * 100)
    : 0

  const occupationParBien = biensActifsData.map((bien) => {
    const resaBien = reservationsData.filter((r: any) => r.bien_id === bien.id)
    let nuits = 0
    for (const r of resaBien) {
      const d1 = new Date(r.date_arrivee)
      const d2 = new Date(r.date_depart)
      const cs = d1 < mStart ? mStart : d1
      const ce = d2 > mEnd ? mEnd : d2
      nuits += Math.max(0, Math.round((ce.getTime() - cs.getTime()) / 86400000))
    }
    const taux = Math.round((nuits / 30) * 100)
    return { id: bien.id, nom: bien.nom, nuits, taux, reservations: resaBien.length }
  })

  const reservationsMois = reservationsData.length

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const jourFormate = format(now, "EEEE d MMMM yyyy", { locale: fr })
  const heureFormatee = format(now, "HH:mm", { locale: fr })

  return (
    <div>
      {/* Header greeting */}
      <div className="mb-8 bg-gradient-to-br from-brun to-brun/90 rounded-2xl px-6 py-7 sm:px-8 sm:py-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-terra/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-sable/8 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="relative">
          <p className="text-sable/70 text-xs uppercase tracking-[0.2em] mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {jourFormate} · {heureFormatee}
          </p>
          <h1 className="text-2xl sm:text-3xl text-creme" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
            {greeting}, <span className="text-terra">{adminName}</span>
          </h1>
          {!loading && (
            <p className="text-creme/50 text-sm mt-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {enCoursData.length > 0
                ? `${enCoursData.length} séjour${enCoursData.length > 1 ? 's' : ''} en cours · ${biensActifs} bien${biensActifs > 1 ? 's' : ''} actif${biensActifs > 1 ? 's' : ''}`
                : `${biensActifs} bien${biensActifs > 1 ? 's' : ''} actif${biensActifs > 1 ? 's' : ''} · Aucun séjour en cours`
              }
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-brun/10 animate-pulse">
                <div className="h-3 bg-brun/10 rounded w-20 mb-4" />
                <div className="h-8 bg-brun/10 rounded w-16 mb-2" />
                <div className="h-2 bg-brun/5 rounded w-24" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-brun/10 animate-pulse">
                <div className="h-3 bg-brun/10 rounded w-20 mb-4" />
                <div className="h-8 bg-brun/10 rounded w-16" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-brun/10 p-6 animate-pulse">
            <div className="h-4 bg-brun/10 rounded w-48 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-6 bg-brun/5 rounded" />)}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Alertes demain */}
          {(checkoutDemainData.length > 0 || checkinDemainData.length > 0) && (
            <div className="mb-6 flex flex-col gap-3">
              {checkoutDemainData.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🧹</span>
                    <h3 className="text-sm font-semibold text-amber-800">
                      Check-out demain — {checkoutDemainData.length} départ{checkoutDemainData.length > 1 ? 's' : ''}
                    </h3>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {checkoutDemainData.map((r: any, i: number) => {
                      const nuits = Math.round((new Date(r.date_depart).getTime() - new Date(r.date_arrivee).getTime()) / 86400000)
                      return (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-amber-900 truncate">{r.voyageur_nom}</span>
                            <span className="text-xs text-amber-700/60">·</span>
                            <span className="text-xs text-amber-700/70 truncate">{r.biens?.nom ?? '—'}</span>
                          </div>
                          <span className="text-xs text-amber-600 flex-shrink-0 ml-2">{nuits} nuit{nuits > 1 ? 's' : ''} · {r.plateforme ?? '—'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {checkinDemainData.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔑</span>
                    <h3 className="text-sm font-semibold text-blue-800">
                      Check-in demain — {checkinDemainData.length} arrivée{checkinDemainData.length > 1 ? 's' : ''}
                    </h3>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {checkinDemainData.map((r: any, i: number) => {
                      const nuits = Math.round((new Date(r.date_depart).getTime() - new Date(r.date_arrivee).getTime()) / 86400000)
                      return (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-blue-900 truncate">{r.voyageur_nom}</span>
                            <span className="text-xs text-blue-700/60">·</span>
                            <span className="text-xs text-blue-700/70 truncate">{r.biens?.nom ?? '—'}</span>
                          </div>
                          <span className="text-xs text-blue-600 flex-shrink-0 ml-2">{nuits} nuit{nuits > 1 ? 's' : ''} · {r.plateforme ?? '—'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
            <StatCard label="Biens actifs" value={biensActifs} sub="en gestion" />
            <StatCard label="Réservations ce mois" value={reservationsMois} sub="confirmées + terminées" />
            <StatCard label="Taux d'occupation" value={`${tauxOccupation}%`} sub="sur 30 jours" color="brun-mid" />
            {isSuperAdmin && (
              <StatCard label="Revenus ce mois" value={`${revenusTotal.toLocaleString('fr-MA')} MAD`} sub="montant total voyageurs" color="terra" />
            )}
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {isSuperAdmin && (
              <StatCard label="Commissions ce mois" value={`${Math.round(commissionsTotal).toLocaleString('fr-MA')} MAD`} sub="part Clévia" color="terra" />
            )}
            <StatCard label="Vues location ce mois" value={vuesLocation} sub="pages biens à louer" color="brun-mid" />
            <StatCard label="Vues vente ce mois" value={vuesVente} sub="pages biens à vendre" color="brun-mid" />
            <StatCard label="Clics WhatsApp ce mois" value={whatsappClicsMois} sub="intérêts biens à vendre" color="terra" />
          </div>

          {/* Occupation par bien */}
          <div className="bg-white rounded-2xl border border-brun/10 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-brun/8">
              <h2 className="text-base font-medium text-brun">Occupation par bien — ce mois</h2>
            </div>
            <div className="divide-y divide-brun/5">
              {occupationParBien.map((b) => (
                <div key={b.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-brun truncate mr-4">{b.nom}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-brun-mid/60">{b.nuits} nuit{b.nuits > 1 ? 's' : ''} · {b.reservations} résa{b.reservations > 1 ? 's' : ''}</span>
                      <span className="text-sm font-medium text-terra min-w-[3rem] text-right">{b.taux}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-brun/5 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(b.taux, 100)}%`,
                        backgroundColor: b.taux >= 50 ? '#22c55e' : b.taux >= 25 ? '#C97B4B' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              ))}
              {!occupationParBien.length && (
                <p className="px-6 py-8 text-center text-brun-mid/50 text-sm">Aucun bien actif</p>
              )}
            </div>
          </div>

          {/* Séjours en cours aujourd'hui */}
          {enCoursData.length > 0 && (
            <div className="bg-white rounded-2xl border border-brun/10 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-brun/8 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-base font-medium text-brun">En cours aujourd&apos;hui</h2>
                <span className="text-xs text-brun-mid/50 ml-1">({enCoursData.length} séjour{enCoursData.length > 1 ? 's' : ''})</span>
              </div>
              <div className="divide-y divide-brun/5">
                {enCoursData.map((r: any, i: number) => {
                  const depart = new Date(r.date_depart)
                  const nuitsRestantes = Math.max(0, Math.round((depart.getTime() - now.getTime()) / 86400000))
                  const nuits = Math.round((depart.getTime() - new Date(r.date_arrivee).getTime()) / 86400000)
                  const bienNom = r.biens?.nom ?? '—'
                  const color = platColorMap[r.plateforme] ?? '#6B4C35'
                  return (
                    <div key={i} className="px-6 py-3.5 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brun truncate">{r.voyageur_nom}</p>
                        <p className="text-xs text-brun-mid/60 mt-0.5">
                          {bienNom} · {nuits} nuit{nuits > 1 ? 's' : ''} · <span className="text-green-600 font-medium">Check-out dans {nuitsRestantes}j</span>
                        </p>
                      </div>
                      {r.plateforme && (
                        <span className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}>
                          {r.plateforme}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="grid xl:grid-cols-2 gap-6">
            {/* Dernières réservations */}
            <div className="bg-white rounded-2xl border border-brun/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-brun/8">
                <h2 className="text-base font-medium text-brun">Dernières réservations</h2>
              </div>
              <div className="lg:hidden divide-y divide-brun/5">
                {lastReservations.map((r: any) => (
                  <div key={r.id} className="px-4 py-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-brun text-sm">{r.voyageur_nom}</span>
                      <StatusBadge statut={r.statut} />
                    </div>
                    <span className="text-xs text-brun-mid/70">{r.biens?.nom ?? '—'} · {format(new Date(r.date_arrivee), 'dd/MM/yy')}</span>
                  </div>
                ))}
                {!lastReservations.length && <p className="px-4 py-8 text-center text-brun-mid/50 text-sm">Aucune réservation</p>}
              </div>
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
                    {lastReservations.map((r: any) => (
                      <tr key={r.id} className="hover:bg-creme/40 transition-colors">
                        <td className="px-4 py-3 text-brun font-medium">{r.voyageur_nom}</td>
                        <td className="px-4 py-3 text-brun-mid">{r.biens?.nom ?? '—'}</td>
                        <td className="px-4 py-3 text-brun-mid">{format(new Date(r.date_arrivee), 'dd/MM/yy')}</td>
                        <td className="px-4 py-3"><StatusBadge statut={r.statut} /></td>
                      </tr>
                    ))}
                    {!lastReservations.length && (
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
              <div className="lg:hidden divide-y divide-brun/5">
                {lastContacts.map((c: any) => (
                  <div key={c.id} className="px-4 py-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-brun text-sm">{c.nom ?? '—'}</span>
                      <span className="text-xs text-brun-mid/60">{format(new Date(c.created_at), 'dd/MM/yy')}</span>
                    </div>
                    <span className="text-xs text-brun-mid/70">{c.telephone ?? '—'}{c.ville_bien ? ` · ${c.ville_bien}` : ''}</span>
                  </div>
                ))}
                {!lastContacts.length && <p className="px-4 py-8 text-center text-brun-mid/50 text-sm">Aucune demande en attente</p>}
              </div>
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
                    {lastContacts.map((c: any) => (
                      <tr key={c.id} className="hover:bg-creme/40 transition-colors">
                        <td className="px-4 py-3 text-brun-mid">{format(new Date(c.created_at), 'dd/MM/yy')}</td>
                        <td className="px-4 py-3 text-brun font-medium">{c.nom ?? '—'}</td>
                        <td className="px-4 py-3 text-brun-mid">{c.telephone ?? '—'}</td>
                        <td className="px-4 py-3 text-brun-mid">{c.ville_bien ?? '—'}</td>
                      </tr>
                    ))}
                    {!lastContacts.length && (
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
            <div className="lg:hidden divide-y divide-brun/5">
              {lastWhatsappClics.map((c: any) => (
                <div key={c.id} className="px-4 py-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-brun text-sm">{c.bien_titre ?? '—'}</span>
                    <span className="text-xs text-brun-mid/60 capitalize">{c.appareil ?? '—'}</span>
                  </div>
                  <span className="text-xs text-brun-mid/70">{c.telephone ?? '—'} · {format(new Date(c.created_at), 'dd/MM/yy HH:mm')}</span>
                </div>
              ))}
              {!lastWhatsappClics.length && <p className="px-4 py-8 text-center text-brun-mid/50 text-sm">Aucun clic WhatsApp pour le moment</p>}
            </div>
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
                  {lastWhatsappClics.map((c: any) => (
                    <tr key={c.id} className="hover:bg-creme/40 transition-colors">
                      <td className="px-4 py-3 text-brun-mid">{format(new Date(c.created_at), 'dd/MM/yy HH:mm')}</td>
                      <td className="px-4 py-3 text-brun font-medium">{c.bien_titre ?? '—'}</td>
                      <td className="px-4 py-3 text-brun-mid">{c.telephone ?? '—'}</td>
                      <td className="px-4 py-3 text-brun-mid capitalize">{c.appareil ?? '—'}</td>
                    </tr>
                  ))}
                  {!lastWhatsappClics.length && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-brun-mid/50 text-sm">Aucun clic WhatsApp pour le moment</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
