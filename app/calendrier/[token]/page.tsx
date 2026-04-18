import { notFound } from 'next/navigation'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isBefore,
  startOfToday,
  format,
  parseISO,
  getDaysInMonth,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

type Props = {
  params: Promise<{ token: string }>
  searchParams: Promise<{ mois?: string }>
}

type Reservation = {
  date_arrivee: string
  date_depart: string
  statut: string
}

type BlockedDate = {
  date: string
}

function expandDates(reservations: Reservation[]): Set<string> {
  const set = new Set<string>()
  for (const r of reservations) {
    try {
      const days = eachDayOfInterval({
        start: parseISO(r.date_arrivee),
        end: parseISO(r.date_depart),
      })
      days.forEach((d) => set.add(format(d, 'yyyy-MM-dd')))
    } catch {}
  }
  return set
}

function CalendarGrid({
  month,
  reservedDates,
  blockedDates,
}: {
  month: Date
  reservedDates: Set<string>
  blockedDates: Set<string>
}) {
  const today = startOfToday()
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Monday-first offset
  const startDay = getDay(monthStart)
  const offset = startDay === 0 ? 6 : startDay - 1

  const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div>
      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 500,
              color: '#9CA3AF',
              padding: '4px 0',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {/* Empty offset cells */}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isPast = isBefore(day, today)
          const isReserved = reservedDates.has(dateStr)
          const isBlocked = blockedDates.has(dateStr)
          const isToday = dateStr === format(today, 'yyyy-MM-dd')

          let bg = '#F0FDF4'
          let color = '#15803D'
          let label = 'Disponible'

          if (isPast) {
            bg = '#F3F4F6'
            color = '#9CA3AF'
            label = 'Passé'
          } else if (isReserved) {
            bg = '#FEE2E2'
            color = '#DC2626'
            label = 'Réservé'
          } else if (isBlocked) {
            bg = '#FEF3C7'
            color = '#D97706'
            label = 'Bloqué'
          }

          return (
            <div
              key={dateStr}
              title={label}
              style={{
                backgroundColor: bg,
                color: color,
                borderRadius: '8px',
                padding: '6px 4px',
                textAlign: 'center',
                fontSize: '13px',
                fontWeight: 500,
                border: isToday ? '2px solid #C97B4B' : '2px solid transparent',
                fontFamily: 'var(--font-dm-sans)',
                lineHeight: 1.2,
              }}
            >
              {format(day, 'd')}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default async function OwnerCalendarPage({ params, searchParams }: Props) {
  const { token } = await params
  const { mois } = await searchParams

  const supabase = await createClient()

  // Fetch owner token → bien
  const { data: tokenRow, error: tokenError } = await supabase
    .from('owner_tokens')
    .select('id, bien_id, nom_proprio, biens(id, nom, ville, type)')
    .eq('token', token)
    .single()

  if (tokenError || !tokenRow) {
    notFound()
  }

  const bien = (Array.isArray(tokenRow.biens) ? tokenRow.biens[0] : tokenRow.biens) as { id: string; nom: string; ville: string; type: string } | null
  if (!bien) notFound()

  // Determine current month from searchParams or default to today
  let currentMonth: Date
  if (mois) {
    try {
      currentMonth = parseISO(`${mois}-01`)
    } catch {
      currentMonth = new Date()
    }
  } else {
    currentMonth = new Date()
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  // Fetch reservations for this bien in this month
  const { data: reservations } = await supabase
    .from('reservations')
    .select('date_arrivee, date_depart, statut')
    .eq('bien_id', bien.id)
    .eq('statut', 'confirmee')
    .lte('date_arrivee', format(monthEnd, 'yyyy-MM-dd'))
    .gte('date_depart', format(monthStart, 'yyyy-MM-dd'))

  // Fetch blocked_dates for this bien in this month
  const { data: blocked } = await supabase
    .from('blocked_dates')
    .select('date')
    .eq('bien_id', bien.id)
    .gte('date', format(monthStart, 'yyyy-MM-dd'))
    .lte('date', format(monthEnd, 'yyyy-MM-dd'))

  const reservedDates = expandDates(reservations ?? [])
  const blockedSet = new Set<string>((blocked ?? []).map((b: BlockedDate) => b.date))

  // Stats
  const daysInMonth = getDaysInMonth(currentMonth)
  const today = startOfToday()
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  let reservedCount = 0
  let blockedCount = 0
  for (const day of monthDays) {
    const dateStr = format(day, 'yyyy-MM-dd')
    if (reservedDates.has(dateStr)) reservedCount++
    else if (blockedSet.has(dateStr)) blockedCount++
  }
  const occupancyRate = Math.round(((reservedCount + blockedCount) / daysInMonth) * 100)

  // Nav months
  const prevMonth = format(subMonths(currentMonth, 1), 'yyyy-MM')
  const nextMonth = format(addMonths(currentMonth, 1), 'yyyy-MM')
  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: fr })

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAF6F1',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: '#2C1A0E',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Image src="/logo-light.svg" alt="Clévia" width={120} height={34} />
        {tokenRow.nom_proprio && (
          <span
            style={{
              color: '#FAF6F1',
              opacity: 0.7,
              fontSize: '13px',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            Espace de {tokenRow.nom_proprio}
          </span>
        )}
      </header>

      {/* Main */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Property info */}
        <div style={{ marginBottom: '28px' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#C97B4B',
              marginBottom: '8px',
            }}
          >
            Calendrier de disponibilité
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '28px',
              fontWeight: 400,
              color: '#2C1A0E',
              marginBottom: '4px',
            }}
          >
            {bien.nom}
          </h1>
          <p style={{ fontSize: '13px', color: '#6B4C35' }}>
            {bien.type} · {bien.ville}
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          {[
            { label: 'Nuits réservées', value: reservedCount, color: '#DC2626', bg: '#FEE2E2' },
            { label: 'Nuits bloquées', value: blockedCount, color: '#D97706', bg: '#FEF3C7' },
            { label: "Taux d'occupation", value: `${occupancyRate}%`, color: '#15803D', bg: '#F0FDF4' },
          ].map(({ label, value, color, bg }) => (
            <div
              key={label}
              style={{
                backgroundColor: bg,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '22px', fontWeight: 600, color, lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: '11px', color: '#6B4C35', marginTop: '4px' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Calendar card */}
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid rgba(44,26,14,0.1)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}
        >
          {/* Month nav */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <Link
              href={`/calendrier/${token}?mois=${prevMonth}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid rgba(44,26,14,0.15)',
                color: '#2C1A0E',
                textDecoration: 'none',
                fontSize: '16px',
              }}
            >
              ‹
            </Link>

            <h2
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '20px',
                fontWeight: 400,
                color: '#2C1A0E',
                textTransform: 'capitalize',
              }}
            >
              {monthLabel}
            </h2>

            <Link
              href={`/calendrier/${token}?mois=${nextMonth}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid rgba(44,26,14,0.15)',
                color: '#2C1A0E',
                textDecoration: 'none',
                fontSize: '16px',
              }}
            >
              ›
            </Link>
          </div>

          <CalendarGrid
            month={currentMonth}
            reservedDates={reservedDates}
            blockedDates={blockedSet}
          />

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(44,26,14,0.08)',
            }}
          >
            {[
              { bg: '#F0FDF4', color: '#15803D', label: 'Disponible' },
              { bg: '#FEE2E2', color: '#DC2626', label: 'Réservé' },
              { bg: '#FEF3C7', color: '#D97706', label: 'Bloqué' },
              { bg: '#F3F4F6', color: '#9CA3AF', label: 'Passé' },
            ].map(({ bg, color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '4px',
                    backgroundColor: bg,
                    border: `1.5px solid ${color}`,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '12px', color: '#6B4C35' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#A07850',
            marginTop: '24px',
          }}
        >
          Ce calendrier est mis à jour par l&apos;équipe Clévia. Pour toute question :{' '}
          <a href="mailto:contact@cleviamaroc.com" style={{ color: '#C97B4B' }}>
            contact@cleviamaroc.com
          </a>
        </p>
      </main>
    </div>
  )
}
