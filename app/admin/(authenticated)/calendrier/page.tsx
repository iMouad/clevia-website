'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isBefore, startOfToday,
  eachDayOfInterval as eachDay, parseISO,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase'

type Bien = { id: string; nom: string }

const SITE_URL = 'https://www.cleviamaroc.com'
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function getMonday(day: number) {
  // Convert Sunday=0 to Monday-first index
  return day === 0 ? 6 : day - 1
}

function expandReservationDates(reservations: { date_arrivee: string; date_depart: string }[]): Set<string> {
  const dates = new Set<string>()
  for (const r of reservations) {
    try {
      const days = eachDay({ start: parseISO(r.date_arrivee), end: parseISO(r.date_depart) })
      days.forEach((d) => dates.add(format(d, 'yyyy-MM-dd')))
    } catch {}
  }
  return dates
}

export default function CalendrierPage() {
  const supabase = createClient()
  const today = startOfToday()

  const [biens, setBiens] = useState<Bien[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [month, setMonth] = useState(new Date())
  const [reservationDates, setReservationDates] = useState<Set<string>>(new Set())
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set())
  const [ownerToken, setOwnerToken] = useState<string | null>(null)
  const [nomProprio, setNomProprio] = useState('')
  const [loadingCal, setLoadingCal] = useState(false)
  const [loadingToken, setLoadingToken] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  // Fetch biens
  useEffect(() => {
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
    const end = format(endOfMonth(month), 'yyyy-MM-dd')

    const [{ data: resData }, { data: blockedData }] = await Promise.all([
      supabase.from('reservations')
        .select('date_arrivee, date_depart')
        .eq('bien_id', selectedId)
        .eq('statut', 'confirmee')
        .lte('date_arrivee', end)
        .gte('date_depart', start),
      supabase.from('blocked_dates')
        .select('date')
        .eq('bien_id', selectedId)
        .gte('date', start)
        .lte('date', end),
    ])

    setReservationDates(expandReservationDates(resData ?? []))
    setBlockedDates(new Set((blockedData ?? []).map((d) => d.date)))
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
    const { data } = await supabase.from('owner_tokens')
      .insert({ bien_id: selectedId, nom_proprio: nomProprio || null })
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

  function copyLink() {
    if (!ownerToken) return
    navigator.clipboard.writeText(`${SITE_URL}/calendrier/${ownerToken}`)
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

  const statusStyle: Record<string, { bg: string; text: string; cursor: string }> = {
    past:        { bg: '#F3F4F6', text: '#9CA3AF', cursor: 'default' },
    reservation: { bg: '#FEE2E2', text: '#DC2626', cursor: 'default' },
    blocked:     { bg: '#FEF3C7', text: '#D97706', cursor: 'pointer' },
    available:   { bg: '#DCFCE7', text: '#15803D', cursor: 'pointer' },
  }

  const selectedBien = biens.find((b) => b.id === selectedId)

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
        <select
          className="w-full border border-brun/20 rounded-xl px-4 py-3 text-sm text-brun focus:outline-none focus:border-terra"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {biens.map((b) => (
            <option key={b.id} value={b.id}>{b.nom}</option>
          ))}
        </select>
      </div>

      {selectedId && (
        <>
          {/* Calendrier */}
          <div className="bg-white rounded-2xl border border-brun/10 p-6 mb-6">
            {/* Navigation mois */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setMonth((m) => subMonths(m, 1))}
                className="w-9 h-9 rounded-full border border-brun/15 flex items-center justify-center hover:border-terra hover:text-terra transition-all">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
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

                  return (
                    <button
                      key={dateStr}
                      disabled={!clickable || !!toggling}
                      onClick={() => clickable && handleDayClick(dateStr)}
                      className={`relative aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-150 ${isToggling ? 'opacity-50' : ''}`}
                      style={{
                        backgroundColor: style.bg,
                        color: style.text,
                        cursor: style.cursor,
                        fontFamily: 'var(--font-dm-sans)',
                        outline: isToday ? '2px solid #C97B4B' : 'none',
                        outlineOffset: '-2px',
                      }}
                    >
                      {format(date, 'd')}
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
            <div className="flex flex-wrap gap-4 mt-6 pt-5 border-t border-brun/8">
              {[
                { color: '#DCFCE7', text: '#15803D', label: 'Disponible (cliquer pour bloquer)' },
                { color: '#FEF3C7', text: '#D97706', label: 'Bloqué manuellement (cliquer pour débloquer)' },
                { color: '#FEE2E2', text: '#DC2626', label: 'Réservation enregistrée' },
                { color: '#F3F4F6', text: '#9CA3AF', label: 'Passé' },
              ].map(({ color, text, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md flex-shrink-0" style={{ backgroundColor: color, border: `1px solid ${text}30` }} />
                  <span className="text-xs text-brun-mid/70" style={{ fontFamily: 'var(--font-dm-sans)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lien propriétaire */}
          <div className="bg-white rounded-2xl border border-brun/10 p-6">
            <h3 className="text-xl text-brun mb-4" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
              Lien propriétaire — {selectedBien?.nom}
            </h3>

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
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                  {loadingToken ? 'Génération…' : 'Générer le lien'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {nomProprio && (
                  <p className="text-sm text-brun-mid" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Propriétaire : <span className="font-medium text-brun">{nomProprio}</span>
                  </p>
                )}

                {/* URL du lien */}
                <div className="flex items-center gap-2 bg-creme rounded-xl px-4 py-3 border border-brun/10">
                  <svg className="text-terra flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                  <span className="flex-1 text-sm text-brun-mid truncate" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {SITE_URL}/calendrier/{ownerToken}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyLink}
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
                        Copier le lien
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
        </>
      )}
    </div>
  )
}
