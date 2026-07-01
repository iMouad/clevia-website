'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isBefore, startOfToday, parseISO,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase'
import AdminSelect from '@/components/admin/AdminSelect'

type Bien = { id: string; nom: string }

type Reservation = {
  id: string
  voyageur_nom: string
  date_arrivee: string
  date_depart: string
  plateforme: string | null
  montant: number | null
  statut: string
}

const SITE_URL = 'https://www.cleviamaroc.com'
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans O/0/I/1 pour éviter confusion
  let code = 'CLV-'
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

function getMonday(day: number) {
  // Convert Sunday=0 to Monday-first index
  return day === 0 ? 6 : day - 1
}

type ResInfo = { voyageur_nom: string; plateforme: string | null }

function expandReservationDates(reservations: { date_arrivee: string; date_depart: string; voyageur_nom?: string; plateforme?: string | null }[]) {
  const dates = new Set<string>()
  const map: Record<string, ResInfo> = {}
  const arrivalDates = new Set<string>()
  const lastNightDates = new Set<string>()
  for (const r of reservations) {
    try {
      const arrival = parseISO(r.date_arrivee)
      const depart = parseISO(r.date_depart)
      const lastNight = new Date(depart.getTime() - 86400000)
      if (lastNight < arrival) continue
      const arrivalStr = format(arrival, 'yyyy-MM-dd')
      const lastNightStr = format(lastNight, 'yyyy-MM-dd')
      arrivalDates.add(arrivalStr)
      lastNightDates.add(lastNightStr)
      const days = eachDayOfInterval({ start: arrival, end: lastNight })
      days.forEach((d) => {
        const key = format(d, 'yyyy-MM-dd')
        dates.add(key)
        if (r.voyageur_nom) map[key] = { voyageur_nom: r.voyageur_nom, plateforme: r.plateforme ?? null }
      })
    } catch {}
  }
  return { dates, map, arrivalDates, lastNightDates }
}

export default function CalendrierPage() {
  const supabase = createClient()
  const today = startOfToday()

  const [biens, setBiens] = useState<Bien[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [month, setMonth] = useState(new Date())
  const [reservationDates, setReservationDates] = useState<Set<string>>(new Set())
  const [resDateMap, setResDateMap] = useState<Record<string, { voyageur_nom: string; plateforme: string | null }>>({})
  const [arrivalDates, setArrivalDates] = useState<Set<string>>(new Set())
  const [lastNightDates, setLastNightDates] = useState<Set<string>>(new Set())
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())
  const [upcomingRes, setUpcomingRes] = useState<Reservation[]>([])
  const [ownerToken, setOwnerToken] = useState<string | null>(null)
  const [nomProprio, setNomProprio] = useState('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loadingCal, setLoadingCal] = useState(false)
  const [loadingToken, setLoadingToken] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  // Fetch biens + role
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsSuperAdmin(user?.app_metadata?.role !== 'admin')
    })
    supabase.from('biens').select('id, nom').eq('statut', 'actif').order('nom')
      .then(({ data }) => {
        setBiens(data ?? [])
        if (data?.[0]) setSelectedId(data[0].id)
      })
  }, [])

  // Fetch calendar data
  const fetchCalendar = useCallback(async () => {
    if (!selectedId) return
    setLoadingCal(true)
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const nextMonthEnd = format(endOfMonth(addMonths(month, 1)), 'yyyy-MM-dd')
    const end = nextMonthEnd
    const todayStr = format(today, 'yyyy-MM-dd')
    const in60days = format(new Date(Date.now() + 60 * 86400000), 'yyyy-MM-dd')

    const [{ data: resData }, { data: blockedData }, { data: upcomingData }] = await Promise.all([
      supabase.from('reservations')
        .select('id, voyageur_nom, date_arrivee, date_depart, plateforme')
        .eq('bien_id', selectedId)
        .in('statut', ['confirmee', 'terminee'])
        .lte('date_arrivee', end)
        .gte('date_depart', start),
      supabase.from('blocked_dates')
        .select('date')
        .eq('bien_id', selectedId)
        .gte('date', start)
        .lte('date', end),
      supabase.from('reservations')
        .select('id, voyageur_nom, date_arrivee, date_depart, plateforme, montant, statut')
        .eq('bien_id', selectedId)
        .in('statut', ['confirmee', 'terminee'])
        .gte('date_depart', todayStr)
        .lte('date_arrivee', in60days)
        .order('date_arrivee', { ascending: true })
        .limit(10),
    ])

    const { dates: resDates, map: resMap, arrivalDates: arrivals, lastNightDates: lastNights } = expandReservationDates(resData ?? [])
    setReservationDates(resDates)
    setResDateMap(resMap)
    setArrivalDates(arrivals)
    setLastNightDates(lastNights)
    setBlockedDates(new Set((blockedData ?? []).map((d) => d.date)))
    setUpcomingRes(upcomingData ?? [])
    setLoadingCal(false)
  }, [selectedId, month])

  // Fetch owner token
  const fetchToken = useCallback(async () => {
    if (!selectedId) return
    const { data } = await supabase.from('owner_tokens').select('token, nom_proprio').eq('bien_id', selectedId).maybeSingle()
    setOwnerToken(data?.token ?? null)
    setNomProprio(data?.nom_proprio ?? '')
  }, [selectedId])

  useEffect(() => { fetchCalendar(); fetchToken() }, [fetchCalendar, fetchToken])

  async function handleDayClick(dateStr: string) {
    if (!selectedId || toggling) return
    setToggling(dateStr)
    if (blockedDates.has(dateStr)) {
      await supabase.from('blocked_dates').delete().eq('bien_id', selectedId).eq('date', dateStr)
      setBlockedDates((prev) => { const n = new Set(prev); n.delete(dateStr); return n })
    } else {
      await supabase.from('blocked_dates').insert({ bien_id: selectedId, date: dateStr, raison: 'Bloqué manuellement' })
      setBlockedDates((prev) => new Set([...prev, dateStr]))
    }
    setToggling(null)
  }

  async function generateToken() {
    if (!selectedId) return
    setLoadingToken(true)
    if (ownerToken) {
      await supabase.from('owner_tokens').delete().eq('bien_id', selectedId)
    }
    const shortCode = generateShortCode()
    const { data } = await supabase.from('owner_tokens')
      .insert({ bien_id: selectedId, nom_proprio: nomProprio || null, token: shortCode })
      .select('token').single()
    setOwnerToken(data?.token ?? null)
    setLoadingToken(false)
  }

  async function revokeToken() {
    if (!selectedId || !ownerToken) return
    if (!confirm('Révoquer ce lien ? Le propriétaire n\'y aura plus accès.')) return
    setLoadingToken(true)
    await supabase.from('owner_tokens').delete().eq('bien_id', selectedId)
    setOwnerToken(null)
    setLoadingToken(false)
  }

  function copyCode() {
    if (!ownerToken) return
    const text = `Votre code d'accès au calendrier Clévia : ${ownerToken}\nConsultez vos réservations sur : ${SITE_URL}/calendrier`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Build calendar grid
  const firstDay = startOfMonth(month)
  const lastDay = endOfMonth(month)
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })
  const startPad = getMonday(getDay(firstDay))
  const endPad = 6 - getMonday(getDay(lastDay))

  function dayStatus(dateStr: string, date: Date): 'past' | 'reservation' | 'blocked' | 'available' {
    if (isBefore(date, today)) return 'past'
    if (reservationDates.has(dateStr)) return 'reservation'
    if (blockedDates.has(dateStr)) return 'blocked'
    return 'available'
  }

  const statusStyle: Record<string, { bg: string; text: string; cursor: string; border?: string }> = {
    past:        { bg: '#F9FAFB', text: '#C0C5CC', cursor: 'default' },
    reservation: { bg: '#C97B4B', text: '#FFFFFF', cursor: 'default' },
    blocked:     { bg: '#FEF3C7', text: '#92400E', cursor: 'pointer', border: '1px solid #F59E0B40' },
    available:   { bg: '#ECFDF5', text: '#065F46', cursor: 'pointer', border: '1px solid #10B98120' },
  }

  const selectedBien = biens.find((b) => b.id === selectedId)

  // Stats occupation du mois affiché
  const daysInMonth = days.length
  const reservedNights = days.filter((d) => reservationDates.has(format(d, 'yyyy-MM-dd'))).length
  const blockedNights = days.filter((d) => {
    const str = format(d, 'yyyy-MM-dd')
    return blockedDates.has(str) && !reservationDates.has(str)
  }).length
  const occupancyPct = daysInMonth > 0 ? Math.round((reservedNights / daysInMonth) * 100) : 0
  const freeNights = daysInMonth - reservedNights - blockedNights

  const PLAT_COLORS: Record<string, string> = {
    Airbnb:  '#FF5A5F',
    Booking: '#003580',
    Avito:   '#E07A2F',
    Facebook: '#1877F2',
    Direct:  '#6B4C35',
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl text-brun mb-8" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
        Calendrier de disponibilité
      </h1>

      {/* Sélecteur de bien */}
      <div className="bg-white rounded-2xl border border-brun/10 p-6 mb-6">
        <label className="block text-xs font-medium text-brun-mid uppercase tracking-wide mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Bien sélectionné
        </label>
        <AdminSelect value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {biens.map((b) => (
            <option key={b.id} value={b.id}>{b.nom}</option>
          ))}
        </AdminSelect>
      </div>

      {selectedId && (
        <>
          {/* Stats occupation du mois */}
          {!loadingCal && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Nuits réservées', value: reservedNights, color: '#C97B4B', textColor: '#C97B4B' },
                { label: 'Nuits bloquées', value: blockedNights, color: '#F59E0B', textColor: '#92400E' },
                { label: 'Nuits libres', value: freeNights, color: '#10B981', textColor: '#065F46' },
                { label: 'Taux d\'occupation', value: `${occupancyPct}%`, color: '#2C1A0E', textColor: '#2C1A0E' },
              ].map(({ label, value, color, textColor }) => (
                <div key={label} className="bg-white rounded-2xl border border-brun/10 p-4 text-center">
                  <p className="text-2xl font-semibold mt-1" style={{ color: textColor, fontFamily: 'var(--font-dm-sans)' }}>{value}</p>
                  <p className="text-xs text-brun-mid/50 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>{label}</p>
                  <div className="h-1 rounded-full mt-3" style={{ backgroundColor: color }} />
                </div>
              ))}
            </div>
          )}

          {/* Calendrier */}
          <div className="bg-white rounded-2xl border border-brun/10 p-6 mb-6">
            {/* Navigation mois */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <button onClick={() => setMonth((m) => subMonths(m, 1))}
                  className="w-9 h-9 rounded-full border border-brun/15 flex items-center justify-center hover:border-terra hover:text-terra transition-all">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                {format(month, 'yyyy-MM') !== format(today, 'yyyy-MM') && (
                  <button onClick={() => setMonth(new Date())}
                    className="text-xs font-medium text-terra border border-terra/30 rounded-full px-3 py-1.5 hover:bg-terra hover:text-white transition-all"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Aujourd&apos;hui
                  </button>
                )}
              </div>
              <h2 className="text-xl text-brun capitalize" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                {format(month, 'MMMM yyyy', { locale: fr })}
              </h2>
              <button onClick={() => setMonth((m) => addMonths(m, 1))}
                className="w-9 h-9 rounded-full border border-brun/15 flex items-center justify-center hover:border-terra hover:text-terra transition-all">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-brun-mid/50 py-2"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Grille des jours */}
            {loadingCal ? (
              <div className="h-48 flex items-center justify-center text-brun-mid/40 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Chargement…
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {/* Padding début */}
                {Array.from({ length: startPad }).map((_, i) => (
                  <div key={`s${i}`} />
                ))}

                {days.map((date) => {
                  const dateStr = format(date, 'yyyy-MM-dd')
                  const status = dayStatus(dateStr, date)
                  const style = statusStyle[status]
                  const isToday = dateStr === format(today, 'yyyy-MM-dd')
                  const isToggling = toggling === dateStr
                  const clickable = status === 'available' || status === 'blocked'
                  const resInfo = resDateMap[dateStr]
                  const isArrival = arrivalDates.has(dateStr) && status === 'reservation'
                  const isLastNight = lastNightDates.has(dateStr) && status === 'reservation'

                  return (
                    <button
                      key={dateStr}
                      disabled={!clickable || !!toggling}
                      onClick={() => clickable && handleDayClick(dateStr)}
                      title={resInfo ? `${resInfo.voyageur_nom}${resInfo.plateforme ? ` (${resInfo.plateforme})` : ''}${isArrival ? ' — Check-in' : ''}${isLastNight ? ' — Dernière nuit' : ''}` : status === 'blocked' ? 'Bloqué — cliquer pour débloquer' : undefined}
                      className={`group relative aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all duration-150 ${isToggling ? 'opacity-50' : ''} ${clickable ? 'hover:scale-105 hover:shadow-md' : ''}`}
                      style={{
                        backgroundColor: isArrival ? '#A0623A' : style.bg,
                        color: style.text,
                        cursor: style.cursor,
                        fontFamily: 'var(--font-dm-sans)',
                        border: isToday ? '2.5px solid #2C1A0E' : (style.border ?? 'none'),
                      }}
                    >
                      {format(date, 'd')}
                      {isArrival && (
                        <span className="absolute top-0.5 right-1 text-[8px] text-white/80 font-bold leading-none">IN</span>
                      )}
                      {isLastNight && (
                        <span className="absolute bottom-0.5 right-1 text-[8px] text-white/80 font-bold leading-none">OUT</span>
                      )}
                      {isToday && <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-brun" />}
                      {resInfo && status === 'reservation' && (
                        <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity -top-9 left-1/2 -translate-x-1/2 bg-brun text-creme text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap z-10 pointer-events-none shadow-lg">
                          {resInfo.voyageur_nom}{resInfo.plateforme ? ` · ${resInfo.plateforme}` : ''}
                        </span>
                      )}
                    </button>
                  )
                })}

                {/* Padding fin */}
                {Array.from({ length: endPad }).map((_, i) => (
                  <div key={`e${i}`} />
                ))}
              </div>
            )}

            {/* Légende */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-6 pt-5 border-t border-brun/8">
              {[
                { color: '#ECFDF5', border: '#10B98140', label: 'Disponible' },
                { color: '#FEF3C7', border: '#F59E0B40', label: 'Bloqué' },
                { color: '#C97B4B', border: '#C97B4B', label: 'Réservé' },
                { color: '#A0623A', border: '#A0623A', label: 'Check-in' },
                { color: '#F9FAFB', border: '#C0C5CC40', label: 'Passé' },
              ].map(({ color, border, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md flex-shrink-0" style={{ backgroundColor: color, border: `1px solid ${border}` }} />
                  <span className="text-[11px] text-brun-mid/60" style={{ fontFamily: 'var(--font-dm-sans)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mini aperçu mois suivant */}
          {!loadingCal && (() => {
            const nextMonth = addMonths(month, 1)
            const nFirst = startOfMonth(nextMonth)
            const nLast = endOfMonth(nextMonth)
            const nDays = eachDayOfInterval({ start: nFirst, end: nLast })
            const nStartPad = getMonday(getDay(nFirst))
            return (
              <div className="bg-white rounded-2xl border border-brun/10 p-5 mb-6">
                <h3 className="text-base text-brun mb-3 text-center capitalize" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                  {format(nextMonth, 'MMMM yyyy', { locale: fr })}
                </h3>
                <div className="grid grid-cols-7 gap-0.5">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-[10px] text-brun-mid/40 py-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>{d}</div>
                  ))}
                  {Array.from({ length: nStartPad }).map((_, i) => <div key={`ns${i}`} />)}
                  {nDays.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd')
                    const hasRes = reservationDates.has(dateStr)
                    const isBlocked = blockedDates.has(dateStr) && !hasRes
                    const isPast = isBefore(date, today)
                    return (
                      <div
                        key={dateStr}
                        className="aspect-square rounded-lg flex items-center justify-center text-[11px]"
                        style={{
                          backgroundColor: isPast ? '#F9FAFB' : hasRes ? '#C97B4B' : isBlocked ? '#FEF3C7' : '#ECFDF5',
                          color: isPast ? '#C0C5CC' : hasRes ? '#FFFFFF' : isBlocked ? '#92400E' : '#065F46',
                          fontFamily: 'var(--font-dm-sans)',
                        }}
                      >
                        {format(date, 'd')}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Accès propriétaire */}
          <div className="bg-white rounded-2xl border border-brun/10 p-6">
            <h3 className="text-xl text-brun mb-1" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
              Accès propriétaire — {selectedBien?.nom}
            </h3>
            <p className="text-xs text-brun-mid/60 mb-5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Générez un code d&apos;accès à communiquer au propriétaire. Il pourra consulter le calendrier sur{' '}
              <span className="text-terra">{SITE_URL}/calendrier</span>
            </p>

            {!ownerToken ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={nomProprio}
                  onChange={(e) => setNomProprio(e.target.value)}
                  placeholder="Nom du propriétaire (optionnel)"
                  className="flex-1 border border-brun/20 rounded-xl px-4 py-2.5 text-sm text-brun focus:outline-none focus:border-terra"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                />
                <button
                  onClick={generateToken}
                  disabled={loadingToken}
                  className="flex items-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-5 py-2.5 hover:bg-brun transition-all disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="11" width="20" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  {loadingToken ? 'Génération…' : 'Générer un code'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {nomProprio && (
                  <p className="text-sm text-brun-mid" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Propriétaire : <span className="font-medium text-brun">{nomProprio}</span>
                  </p>
                )}

                {/* Code affiché en grand */}
                <div style={{ backgroundColor: '#FAF6F1', border: '1px solid rgba(201,123,75,0.2)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
                  <p className="text-xs text-brun-mid/50 uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Code d&apos;accès
                  </p>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '32px', fontWeight: 700, letterSpacing: '0.15em', color: '#C97B4B' }}>
                    {ownerToken}
                  </p>
                  <p className="text-xs text-brun-mid/50 mt-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    À communiquer au propriétaire — accès sur{' '}
                    <span className="text-terra">{SITE_URL}/calendrier</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyCode}
                    className="flex-1 flex items-center justify-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-5 py-2.5 hover:bg-brun transition-all"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {copied ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" strokeLinecap="round" /></svg>
                        Copié !
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                        Copier code + lien
                      </>
                    )}
                  </button>
                  <button
                    onClick={revokeToken}
                    disabled={loadingToken}
                    className="flex items-center gap-2 border border-red-200 text-red-500 text-sm font-medium rounded-full px-5 py-2.5 hover:bg-red-50 transition-all disabled:opacity-50"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                    Révoquer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Réservations en cours & à venir — 60 jours */}
          {(() => {
            const todayStr = format(today, 'yyyy-MM-dd')
            const enCours = upcomingRes.filter((r) => r.date_arrivee <= todayStr && r.date_depart > todayStr)
            const aVenir = upcomingRes.filter((r) => r.date_arrivee > todayStr)
            return (
              <div className="bg-white rounded-2xl border border-brun/10 p-6 mt-6">
                <h3 className="text-xl text-brun mb-4" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                  Réservations — {selectedBien?.nom}
                </h3>
                {upcomingRes.length === 0 ? (
                  <p className="text-sm text-brun-mid/40 text-center py-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Aucune réservation dans les 60 prochains jours.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {enCours.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                            En cours
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          {enCours.map((r) => {
                            const arrivee = parseISO(r.date_arrivee)
                            const depart = parseISO(r.date_depart)
                            const nuits = Math.round((depart.getTime() - arrivee.getTime()) / 86400000)
                            const nuitsRestantes = Math.round((depart.getTime() - today.getTime()) / 86400000)
                            const platColor = PLAT_COLORS[r.plateforme ?? 'Direct'] ?? '#6B4C35'
                            return (
                              <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border-2 border-green-200 bg-green-50/50">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-brun truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                                    {r.voyageur_nom}
                                  </p>
                                  <p className="text-xs text-brun-mid/60 mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                                    {format(arrivee, 'd MMM', { locale: fr })} → {format(depart, 'd MMM yyyy', { locale: fr })}
                                    {' · '}{nuits} nuit{nuits > 1 ? 's' : ''}
                                    {' · '}<span className="text-green-700 font-medium">Check-out dans {nuitsRestantes}j</span>
                                  </p>
                                </div>
                                {r.plateforme && (
                                  <span className="text-xs font-medium text-white px-2.5 py-1 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: platColor, fontFamily: 'var(--font-dm-sans)' }}>
                                    {r.plateforme}
                                  </span>
                                )}
                                {isSuperAdmin && r.montant && (
                                  <span className="text-sm font-semibold text-brun flex-shrink-0" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                                    {r.montant.toLocaleString('fr-FR')} MAD
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {aVenir.length > 0 && (
                      <div>
                        {enCours.length > 0 && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-terra" />
                            <p className="text-xs font-semibold text-terra uppercase tracking-wider" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                              À venir
                            </p>
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          {aVenir.map((r) => {
                            const arrivee = parseISO(r.date_arrivee)
                            const depart = parseISO(r.date_depart)
                            const nuits = Math.round((depart.getTime() - arrivee.getTime()) / 86400000)
                            const platColor = PLAT_COLORS[r.plateforme ?? 'Direct'] ?? '#6B4C35'
                            return (
                              <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border border-brun/8 hover:bg-creme/40 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-brun truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                                    {r.voyageur_nom}
                                  </p>
                                  <p className="text-xs text-brun-mid/60 mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                                    {format(arrivee, 'd MMM', { locale: fr })} → {format(depart, 'd MMM yyyy', { locale: fr })}
                                    {' · '}{nuits} nuit{nuits > 1 ? 's' : ''}
                                  </p>
                                </div>
                                {r.plateforme && (
                                  <span className="text-xs font-medium text-white px-2.5 py-1 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: platColor, fontFamily: 'var(--font-dm-sans)' }}>
                                    {r.plateforme}
                                  </span>
                                )}
                                {isSuperAdmin && r.montant && (
                                  <span className="text-sm font-semibold text-brun flex-shrink-0" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                                    {r.montant.toLocaleString('fr-FR')} MAD
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
