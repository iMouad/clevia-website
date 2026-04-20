'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isBefore, startOfToday, parseISO,
} from 'date-fns'
import { fr } from 'date-fns/locale'

type Range = { start: string; end: string }

const DAYS_SHORT = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

function monday(day: number) { return day === 0 ? 6 : day - 1 }

function expandRanges(ranges: Range[]): Set<string> {
  const dates = new Set<string>()
  for (const r of ranges) {
    try {
      eachDayOfInterval({ start: parseISO(r.start), end: parseISO(r.end) }).forEach((d) =>
        dates.add(format(d, 'yyyy-MM-dd'))
      )
    } catch {}
  }
  return dates
}

function MonthCalendar({
  month,
  bookedDates,
}: {
  month: Date
  bookedDates: Set<string>
}) {
  const today = startOfToday()
  const todayStr = format(today, 'yyyy-MM-dd')
  const firstDay = startOfMonth(month)
  const lastDay = endOfMonth(month)
  const days = eachDayOfInterval({ start: firstDay, end: lastDay })
  const startPad = monday(getDay(firstDay))
  const endPad = 6 - monday(getDay(lastDay))

  return (
    <div className="flex-1 min-w-0">
      <p
        className="text-center text-base font-medium text-brun capitalize mb-3"
        style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 500 }}
      >
        {format(month, 'MMMM yyyy', { locale: fr })}
      </p>

      {/* Entêtes jours */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-brun-mid/40 py-1"
            style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 gap-[3px]">
        {Array.from({ length: startPad }).map((_, i) => <div key={`s${i}`} />)}

        {days.map((date) => {
          const str = format(date, 'yyyy-MM-dd')
          const isPast = isBefore(date, today)
          const isBooked = bookedDates.has(str)
          const isToday = str === todayStr

          let cellStyle = ''
          let textStyle = ''

          if (isPast) {
            cellStyle = 'bg-transparent'
            textStyle = 'text-brun/20'
          } else if (isBooked) {
            cellStyle = 'bg-red-50'
            textStyle = 'text-red-400 line-through'
          } else {
            cellStyle = 'bg-green-50'
            textStyle = 'text-green-700 font-medium'
          }

          return (
            <div
              key={str}
              title={isBooked ? 'Non disponible' : isPast ? '' : 'Disponible'}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs transition-all ${cellStyle} ${isToday ? 'ring-2 ring-terra ring-offset-1' : ''}`}
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              <span className={textStyle}>{format(date, 'd')}</span>
            </div>
          )
        })}

        {Array.from({ length: endPad }).map((_, i) => <div key={`e${i}`} />)}
      </div>
    </div>
  )
}

export default function BienDisponibilite({ bienId }: { bienId: string }) {
  const [baseMonth, setBaseMonth] = useState(() => startOfMonth(new Date()))
  const [bookedRanges, setBookedRanges] = useState<Range[]>([])
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/biens/availability?bien_id=${bienId}`)
      .then((r) => r.json())
      .then((data) => {
        setBookedRanges(data.reservations ?? [])
        setBlockedDates(data.blocked ?? [])
      })
      .finally(() => setLoading(false))
  }, [bienId])

  const bookedDates = useMemo(() => {
    const set = expandRanges(bookedRanges)
    blockedDates.forEach((d) => set.add(d))
    return set
  }, [bookedRanges, blockedDates])

  const month2 = addMonths(baseMonth, 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
          Disponibilités
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBaseMonth((m) => subMonths(m, 1))}
            className="w-8 h-8 rounded-full border border-brun/15 flex items-center justify-center hover:border-terra hover:text-terra transition-all text-brun-mid"
            aria-label="Mois précédent"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={() => setBaseMonth((m) => addMonths(m, 1))}
            className="w-8 h-8 rounded-full border border-brun/15 flex items-center justify-center hover:border-terra hover:text-terra transition-all text-brun-mid"
            aria-label="Mois suivant"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-brun-mid/40 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Chargement…
        </div>
      ) : (
        <>
          {/* 2 mois côte à côte */}
          <div className="flex gap-6 sm:gap-10">
            <MonthCalendar month={baseMonth} bookedDates={bookedDates} />
            <MonthCalendar month={month2} bookedDates={bookedDates} />
          </div>

          {/* Légende */}
          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-brun/8">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-green-50 border border-green-200" />
              <span className="text-xs text-brun-mid/60" style={{ fontFamily: 'var(--font-dm-sans)' }}>Disponible</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-200" />
              <span className="text-xs text-brun-mid/60" style={{ fontFamily: 'var(--font-dm-sans)' }}>Non disponible</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border-2 border-terra" />
              <span className="text-xs text-brun-mid/60" style={{ fontFamily: 'var(--font-dm-sans)' }}>Aujourd&apos;hui</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
