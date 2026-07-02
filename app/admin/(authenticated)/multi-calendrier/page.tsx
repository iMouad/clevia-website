'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { platBg } from '@/lib/plateformes'
import type { Plateforme } from '@/lib/plateformes'

type Reservation = {
  id: string
  bien_id: string
  voyageur_nom: string
  date_arrivee: string
  date_depart: string
  plateforme: string | null
  statut: string
}

type Bien = { id: string; nom: string; statut: string }
type Blocked = { bien_id: string; date: string }

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export default function MultiCalendrierPage() {
  const supabase = createClient()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [biens, setBiens] = useState<Bien[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [blocked, setBlocked] = useState<Blocked[]>([])
  const [plateformes, setPlateformes] = useState<Plateforme[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('biens').select('id, nom, statut').eq('statut', 'actif').neq('disponible', false).order('nom'),
      supabase.from('reservations').select('id, bien_id, voyageur_nom, date_arrivee, date_depart, plateforme, statut').in('statut', ['confirmee', 'terminee']),
      supabase.from('blocked_dates').select('bien_id, date'),
      supabase.from('plateformes').select('*').eq('actif', true).order('ordre'),
    ]).then(([{ data: b }, { data: r }, { data: bl }, { data: p }]) => {
      setBiens(b ?? [])
      setReservations(r ?? [])
      setBlocked(bl ?? [])
      setPlateformes(p ?? [])
      setLoading(false)
    })
  }, [])

  const platColorMap: Record<string, string> = {}
  plateformes.forEach((p) => { platColorMap[p.nom] = p.couleur })

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = (firstDay.getDay() + 6) % 7

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function getResForDay(bienId: string, day: number): Reservation | null {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return reservations.find((r) =>
      r.bien_id === bienId && r.date_arrivee <= dateStr && r.date_depart > dateStr
    ) || null
  }

  function isBlocked(bienId: string, day: number): boolean {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return blocked.some((b) => b.bien_id === bienId && b.date === dateStr)
  }

  function isCheckout(bienId: string, day: number): boolean {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return reservations.some((r) => r.bien_id === bienId && r.date_depart === dateStr)
  }

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>Multi-calendrier</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-9 h-9 rounded-xl border border-brun/15 flex items-center justify-center text-brun-mid hover:border-terra hover:text-terra transition-all">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="text-lg text-brun min-w-[180px] text-center" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
            {MOIS_FR[month]} {year}
          </span>
          <button onClick={nextMonth} className="w-9 h-9 rounded-xl border border-brun/15 flex items-center justify-center text-brun-mid hover:border-terra hover:text-terra transition-all">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M8 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {(month !== now.getMonth() || year !== now.getFullYear()) && (
            <button onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()) }} className="text-xs text-terra underline underline-offset-2 ml-1">
              Aujourd&apos;hui
            </button>
          )}
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-100 border border-green-300" />
          <span className="text-[10px] text-brun-mid/60">Libre</span>
        </div>
        {plateformes.map((p) => (
          <div key={p.id} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: p.couleur }} />
            <span className="text-[10px] text-brun-mid/60">{p.nom}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-300" />
          <span className="text-[10px] text-brun-mid/60">Bloqué</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-orange-100 border border-dashed border-orange-300" />
          <span className="text-[10px] text-brun-mid/60">Checkout</span>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-10 text-brun-mid/50 text-sm">Chargement…</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header jours */}
            <div className="flex">
              <div className="w-28 flex-shrink-0" />
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dow = (startDow + i) % 7
                const isToday = dateStr === todayStr
                const isWeekend = dow >= 5
                return (
                  <div
                    key={day}
                    className={`flex-1 min-w-[28px] text-center py-1.5 border-b-2 ${isToday ? 'border-terra' : 'border-brun/10'}`}
                  >
                    <p className={`text-[9px] uppercase ${isWeekend ? 'text-terra/60' : 'text-brun-mid/40'}`}>{JOURS[dow]}</p>
                    <p className={`text-xs font-medium ${isToday ? 'text-terra' : isWeekend ? 'text-brun-mid/70' : 'text-brun'}`}>{day}</p>
                  </div>
                )
              })}
            </div>

            {/* Lignes par bien */}
            {biens.map((bien) => {
              const bienRes = reservations.filter((r) => r.bien_id === bien.id)
              let occupiedNights = 0
              for (let d = 1; d <= daysInMonth; d++) {
                if (getResForDay(bien.id, d)) occupiedNights++
              }
              const occRate = Math.round((occupiedNights / daysInMonth) * 100)

              return (
                <div key={bien.id} className="flex border-b border-brun/5 group hover:bg-creme/30 transition-colors">
                  <div className="w-28 flex-shrink-0 px-2 py-2 flex flex-col justify-center border-r border-brun/10">
                    <p className="text-xs font-medium text-brun truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>{bien.nom}</p>
                    <p className="text-[10px] text-brun-mid/40 mt-0.5">{occRate}% occupé</p>
                  </div>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1
                    const res = getResForDay(bien.id, day)
                    const blockedDay = isBlocked(bien.id, day)
                    const checkout = isCheckout(bien.id, day)
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const isArrival = res && res.date_arrivee === dateStr

                    let bg = 'bg-green-50'
                    let border = 'border-green-200/50'
                    let textColor = ''
                    let title = 'Libre'

                    if (res) {
                      const color = platColorMap[res.plateforme ?? ''] ?? '#6B4C35'
                      bg = ''
                      border = ''
                      title = `${res.voyageur_nom} (${res.plateforme ?? '—'})`
                      textColor = color
                    } else if (blockedDay) {
                      bg = 'bg-gray-200'
                      border = 'border-gray-300'
                      title = 'Bloqué'
                    } else if (checkout) {
                      bg = 'bg-orange-50'
                      border = 'border-orange-200 border-dashed'
                      title = 'Checkout'
                    }

                    return (
                      <div
                        key={day}
                        className={`flex-1 min-w-[28px] h-9 border-r border-brun/5 flex items-center justify-center relative ${!res ? bg : ''} ${!res ? `border ${border}` : ''}`}
                        style={res ? { backgroundColor: platBg(textColor, 0.25) } : undefined}
                        title={title}
                      >
                        {isArrival && (
                          <span className="text-[7px] font-bold text-white px-1 rounded" style={{ backgroundColor: textColor }}>IN</span>
                        )}
                        {checkout && !res && (
                          <span className="text-[7px] font-bold text-orange-500">OUT</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {biens.length === 0 && (
              <div className="text-center py-10 text-brun-mid/50 text-sm">Aucun bien actif.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
