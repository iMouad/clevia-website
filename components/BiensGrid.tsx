'use client'

import { useState, useMemo } from 'react'
import BienCard from './BienCard'
import type { BienPublic } from './BienCard'

const TYPES = ['Appartement', 'Villa', 'Studio', 'Autre']

type Props = {
  biens: BienPublic[]
  allLabel: string
  emptyLabel: string
}

export default function BiensGrid({ biens, allLabel, emptyLabel }: Props) {
  const [filter, setFilter] = useState<string | null>(null)

  const availableTypes = useMemo(() => {
    const types = new Set(biens.map((b) => b.type).filter(Boolean))
    return TYPES.filter((t) => types.has(t))
  }, [biens])

  const filtered = filter ? biens.filter((b) => b.type === filter) : biens

  return (
    <>
      {/* Filter bar — only shown if more than one type */}
      {availableTypes.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-10">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
              !filter
                ? 'bg-terra text-creme'
                : 'border border-brun/20 text-brun-mid hover:border-terra hover:text-terra'
            }`}
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {allLabel}
          </button>
          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                filter === type
                  ? 'bg-terra text-creme'
                  : 'border border-brun/20 text-brun-mid hover:border-terra hover:text-terra'
              }`}
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-brun-mid/40" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {emptyLabel}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((b) => (
            <BienCard key={b.id} bien={b} />
          ))}
        </div>
      )}
    </>
  )
}
