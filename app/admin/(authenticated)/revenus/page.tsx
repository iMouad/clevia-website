'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase'
import AdminSelect from '@/components/admin/AdminSelect'
import { platBg } from '@/lib/plateformes'
import type { Plateforme } from '@/lib/plateformes'

type Reservation = {
  id: string
  bien_id: string
  voyageur_nom: string
  date_arrivee: string
  date_depart: string
  plateforme: string | null
  montant: number | null
  taux_commission: number
  commission_fixe: number | null
  statut: string
}

type Bien = { id: string; nom: string }

const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function nuits(d1: string, d2: string) {
  if (!d1 || !d2) return 0
  return Math.max(0, Math.round((new Date(d2).getTime() - new Date(d1).getTime()) / 86400000))
}

function calcCommission(r: { montant?: number | null; taux_commission?: number; commission_fixe?: number | null }) {
  if (r.commission_fixe != null && r.commission_fixe > 0) return r.commission_fixe
  if (r.montant && r.taux_commission) return r.montant * r.taux_commission / 100
  return 0
}

export default function RevenusPage() {
  const supabase = createClient()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [biens, setBiens] = useState<Bien[]>([])
  const [plateformes, setPlateformes] = useState<Plateforme[]>([])
  const [loading, setLoading] = useState(true)
  const [mois, setMois] = useState(new Date().getMonth() + 1)
  const [annee, setAnnee] = useState(new Date().getFullYear())
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('reservations').select('id, bien_id, voyageur_nom, date_arrivee, date_depart, plateforme, montant, taux_commission, commission_fixe, statut').in('statut', ['confirmee', 'terminee']),
      supabase.from('biens').select('id, nom'),
      supabase.from('plateformes').select('*').eq('actif', true).order('ordre'),
      supabase.auth.getUser(),
    ]).then(([{ data: resData }, { data: biensData }, { data: platData }, { data: { user } }]) => {
      setReservations(resData ?? [])
      setBiens(biensData ?? [])
      setPlateformes(platData ?? [])
      setIsSuperAdmin(user?.app_metadata?.role !== 'admin')
      setLoading(false)
    })
  }, [])

  const platColorMap: Record<string, string> = {}
  plateformes.forEach((p) => { platColorMap[p.nom] = p.couleur })

  const mStart = new Date(annee, mois - 1, 1)
  const mEnd = new Date(annee, mois, 0)
  const daysInMonth = mEnd.getDate()

  const resMois = reservations.filter((r) => {
    const d1 = new Date(r.date_arrivee)
    const d2 = new Date(r.date_depart)
    return d2 > mStart && d1 <= mEnd
  })

  const bienStats = biens.map((b) => {
    const res = resMois.filter((r) => r.bien_id === b.id)
    let totalNuits = 0
    for (const r of res) {
      const d1 = new Date(r.date_arrivee)
      const d2 = new Date(r.date_depart)
      const cs = d1 < mStart ? mStart : d1
      const ce = d2 > mEnd ? new Date(mEnd.getTime() + 86400000) : d2
      totalNuits += Math.max(0, Math.round((ce.getTime() - cs.getTime()) / 86400000))
    }
    const revenus = res.reduce((s, r) => s + (r.montant ?? 0), 0)
    const commission = res.reduce((s, r) => s + calcCommission(r), 0)
    const taux = Math.min(100, Math.round((totalNuits / daysInMonth) * 100))
    const parPlatforme: Record<string, { revenus: number; nuits: number; count: number }> = {}
    for (const r of res) {
      const p = r.plateforme ?? 'Autre'
      if (!parPlatforme[p]) parPlatforme[p] = { revenus: 0, nuits: 0, count: 0 }
      parPlatforme[p].revenus += r.montant ?? 0
      parPlatforme[p].nuits += nuits(r.date_arrivee, r.date_depart)
      parPlatforme[p].count += 1
    }
    return { ...b, reservations: res, totalNuits, revenus, commission, taux, parPlatforme, count: res.length }
  }).filter((b) => b.count > 0 || biens.length <= 10).sort((a, b) => b.revenus - a.revenus)

  const grandTotalRevenus = bienStats.reduce((s, b) => s + b.revenus, 0)
  const grandTotalCommission = bienStats.reduce((s, b) => s + b.commission, 0)
  const grandTotalNuits = bienStats.reduce((s, b) => s + b.totalNuits, 0)

  function exportRapportBien(b: typeof bienStats[0]) {
    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport — ${b.nom} — ${MOIS_FR[mois - 1]} ${annee}</title><style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Helvetica Neue',Arial,sans-serif;color:#2C1A0E;padding:40px;font-size:13px}
      .header{border-bottom:2px solid #C97B4B;padding-bottom:16px;margin-bottom:24px}
      .logo{font-size:18px;font-weight:700;color:#C97B4B;letter-spacing:0.1em}
      h1{font-size:17px;font-weight:600;margin-top:8px}
      .subtitle{color:#6B4C35;font-size:11px;margin-top:4px}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
      .stat{background:#FAF6F1;border-radius:8px;padding:12px 16px}
      .stat-val{font-size:22px;font-weight:700;color:#C97B4B}
      .stat-lbl{font-size:10px;color:#6B4C35;text-transform:uppercase;letter-spacing:0.05em;margin-top:2px}
      table{width:100%;border-collapse:collapse;margin-bottom:24px}
      th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#6B4C35;border-bottom:2px solid #E8DDD4;padding:8px 10px}
      td{padding:8px 10px;border-bottom:1px solid #F0EBE5;font-size:12px}
      .total-row td{font-weight:700;background:#FAF6F1;color:#C97B4B;border-top:2px solid #C97B4B}
      .footer{margin-top:32px;padding-top:12px;border-top:1px solid #E8DDD4;font-size:10px;color:#A07850;text-align:center}
      @media print{@page{margin:1.5cm}body{padding:0}}
    </style></head><body>
      <div class="header">
        <div class="logo">CLÉVIA CONCIERGERIE</div>
        <h1>Rapport — ${b.nom} — ${MOIS_FR[mois - 1]} ${annee}</h1>
        <div class="subtitle">Généré le ${format(new Date(), 'dd/MM/yyyy')} · ${daysInMonth} jours</div>
      </div>
      <div class="stats">
        <div class="stat"><div class="stat-val">${b.count}</div><div class="stat-lbl">Réservations</div></div>
        <div class="stat"><div class="stat-val">${b.totalNuits}</div><div class="stat-lbl">Nuits louées</div></div>
        <div class="stat"><div class="stat-val">${b.revenus.toLocaleString('fr-MA')} MAD</div><div class="stat-lbl">Revenus</div></div>
        <div class="stat"><div class="stat-val">${Math.round(b.commission).toLocaleString('fr-MA')} MAD</div><div class="stat-lbl">Commission Clévia</div></div>
      </div>
      <p style="font-size:12px;color:#6B4C35;margin-bottom:16px">Taux d'occupation : <strong style="color:#C97B4B">${b.taux}%</strong> (${b.totalNuits}/${daysInMonth} nuits) · Revenu net propriétaire : <strong style="color:#C97B4B">${Math.round(b.revenus - b.commission).toLocaleString('fr-MA')} MAD</strong></p>
      <table>
        <thead><tr><th>Voyageur</th><th>Arrivée</th><th>Départ</th><th>Nuits</th><th>Plateforme</th><th>Montant</th><th>Commission</th><th>Net proprio</th></tr></thead>
        <tbody>
          ${b.reservations.map((r) => `<tr>
            <td>${r.voyageur_nom}</td>
            <td>${format(new Date(r.date_arrivee), 'dd/MM/yyyy')}</td>
            <td>${format(new Date(r.date_depart), 'dd/MM/yyyy')}</td>
            <td style="text-align:center">${nuits(r.date_arrivee, r.date_depart)}</td>
            <td>${r.plateforme ?? '—'}</td>
            <td>${r.montant ? r.montant.toLocaleString('fr-MA') + ' MAD' : '—'}</td>
            <td>${r.montant ? Math.round(calcCommission(r)).toLocaleString('fr-MA') + ' MAD' : '—'}</td>
            <td style="font-weight:600;color:#C97B4B">${r.montant ? Math.round((r.montant ?? 0) - calcCommission(r)).toLocaleString('fr-MA') + ' MAD' : '—'}</td>
          </tr>`).join('')}
          <tr class="total-row">
            <td colspan="3">TOTAL</td>
            <td style="text-align:center">${b.totalNuits}</td>
            <td></td>
            <td>${b.revenus.toLocaleString('fr-MA')} MAD</td>
            <td>${Math.round(b.commission).toLocaleString('fr-MA')} MAD</td>
            <td>${Math.round(b.revenus - b.commission).toLocaleString('fr-MA')} MAD</td>
          </tr>
        </tbody>
      </table>
      <div class="footer">Clévia Conciergerie · Mansouria-Mohammedia, Maroc · cleviamaroc.com</div>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`
    const w = window.open('', '_blank', 'width=900,height=700')
    if (w) { w.document.write(html); w.document.close() }
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-brun-mid/50 text-sm">Accès réservé aux super administrateurs.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>Revenus par bien</h1>
        <div className="flex items-center gap-2">
          <AdminSelect value={mois} onChange={(e) => setMois(Number(e.target.value))}>
            {MOIS_FR.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </AdminSelect>
          <AdminSelect value={annee} onChange={(e) => setAnnee(Number(e.target.value))}>
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </AdminSelect>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-10 text-brun-mid/50 text-sm">Chargement…</p>
      ) : (
        <>
          {/* Résumé global */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Revenus total', value: `${grandTotalRevenus.toLocaleString('fr-MA')} MAD` },
              { label: 'Commission Clévia', value: `${Math.round(grandTotalCommission).toLocaleString('fr-MA')} MAD` },
              { label: 'Net propriétaires', value: `${Math.round(grandTotalRevenus - grandTotalCommission).toLocaleString('fr-MA')} MAD` },
              { label: 'Nuits louées', value: grandTotalNuits },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl border border-brun/10 p-5">
                <p className="text-xs text-brun-mid/50 uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
                <p className="text-2xl text-terra" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Par bien */}
          <div className="flex flex-col gap-4">
            {bienStats.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-brun/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-brun/8 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>{b.nom}</h2>
                    <p className="text-xs text-brun-mid/50 mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {b.count} résa{b.count > 1 ? 's' : ''} · {b.totalNuits} nuit{b.totalNuits > 1 ? 's' : ''} · Occupation {b.taux}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportRapportBien(b)}
                      className="flex items-center gap-1.5 border border-brun/20 text-brun-mid text-xs font-medium rounded-full px-3 py-2 hover:border-terra hover:text-terra transition-all"
                      style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                      Exporter PDF
                    </button>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-creme/60 rounded-xl p-3 text-center">
                      <p className="text-lg font-semibold text-terra" style={{ fontFamily: 'var(--font-dm-sans)' }}>{b.revenus.toLocaleString('fr-MA')} MAD</p>
                      <p className="text-[10px] text-brun-mid/50 uppercase tracking-wide">Revenus</p>
                    </div>
                    <div className="bg-creme/60 rounded-xl p-3 text-center">
                      <p className="text-lg font-semibold text-terra" style={{ fontFamily: 'var(--font-dm-sans)' }}>{Math.round(b.commission).toLocaleString('fr-MA')} MAD</p>
                      <p className="text-[10px] text-brun-mid/50 uppercase tracking-wide">Commission</p>
                    </div>
                    <div className="bg-creme/60 rounded-xl p-3 text-center">
                      <p className="text-lg font-semibold text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>{Math.round(b.revenus - b.commission).toLocaleString('fr-MA')} MAD</p>
                      <p className="text-[10px] text-brun-mid/50 uppercase tracking-wide">Net propriétaire</p>
                    </div>
                  </div>

                  {/* Distribution par plateforme */}
                  {Object.keys(b.parPlatforme).length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-brun-mid/50 uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>Par plateforme</p>
                      <div className="flex flex-col gap-1.5">
                        {Object.entries(b.parPlatforme).sort(([, a], [, b]) => b.revenus - a.revenus).map(([plat, data]) => {
                          const pct = b.revenus > 0 ? Math.round((data.revenus / b.revenus) * 100) : 0
                          const color = platColorMap[plat] ?? '#6B4C35'
                          return (
                            <div key={plat} className="flex items-center gap-3">
                              <span className="text-xs font-medium w-16 truncate" style={{ color }}>{plat}</span>
                              <div className="flex-1 h-3 bg-brun/5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                              </div>
                              <span className="text-xs text-brun-mid/60 w-24 text-right" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                                {data.revenus.toLocaleString('fr-MA')} MAD
                              </span>
                              <span className="text-xs font-medium w-8 text-right" style={{ color }}>{pct}%</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Liste des réservations */}
                  {b.reservations.length > 0 && (
                    <div className="border border-brun/10 rounded-xl overflow-hidden">
                      <table className="w-full text-xs" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                        <thead>
                          <tr className="bg-brun/4 border-b border-brun/10">
                            {['Voyageur', 'Arrivée', 'Départ', 'Nuits', 'Platf.', 'Montant', 'Comm.', 'Net'].map((h) => (
                              <th key={h} className="text-left px-3 py-2 text-brun-mid/50 font-medium uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brun/5">
                          {b.reservations.map((r) => (
                            <tr key={r.id}>
                              <td className="px-3 py-2 text-brun font-medium truncate max-w-[100px]">{r.voyageur_nom}</td>
                              <td className="px-3 py-2 text-brun-mid">{format(new Date(r.date_arrivee), 'dd/MM')}</td>
                              <td className="px-3 py-2 text-brun-mid">{format(new Date(r.date_depart), 'dd/MM')}</td>
                              <td className="px-3 py-2 text-center text-brun-mid">{nuits(r.date_arrivee, r.date_depart)}</td>
                              <td className="px-3 py-2">
                                <span className="px-1.5 py-0.5 rounded-full font-medium text-[10px]" style={{ backgroundColor: platBg(platColorMap[r.plateforme ?? ''] ?? '#6B4C35'), color: platColorMap[r.plateforme ?? ''] ?? '#6B4C35' }}>
                                  {r.plateforme ?? '—'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-brun-mid whitespace-nowrap">{r.montant ? `${r.montant.toLocaleString('fr-MA')} MAD` : '—'}</td>
                              <td className="px-3 py-2 text-terra whitespace-nowrap">{r.montant ? `${Math.round(calcCommission(r)).toLocaleString('fr-MA')} MAD` : '—'}</td>
                              <td className="px-3 py-2 font-medium text-brun whitespace-nowrap">{r.montant ? `${Math.round((r.montant ?? 0) - calcCommission(r)).toLocaleString('fr-MA')} MAD` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {b.count === 0 && (
                    <p className="text-center text-sm text-brun-mid/40 py-4">Aucune réservation ce mois-ci</p>
                  )}
                </div>
              </div>
            ))}

            {bienStats.length === 0 && (
              <div className="bg-white rounded-2xl border border-brun/10 p-10 text-center">
                <p className="text-brun-mid/50 text-sm">Aucune donnée pour cette période.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
