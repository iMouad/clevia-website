'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { createClient } from '@/lib/supabase'

type Contact = {
  id: string
  nom: string | null
  email: string | null
  telephone: string | null
  ville_bien: string | null
  type_bien: string | null
  message: string | null
  traite: boolean
  source: string | null
  created_at: string
}

type Filter = 'all' | 'unread' | 'read' | 'contact' | 'simulateur' | 'visite'

const SOURCE_LABELS: Record<string, string> = {
  contact: 'Formulaire',
  simulateur: 'Simulateur',
  visite: 'Visite',
}
const SOURCE_COLORS: Record<string, string> = {
  contact: 'bg-blue-50 text-blue-700',
  simulateur: 'bg-purple-50 text-purple-700',
  visite: 'bg-terra/10 text-terra',
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-brun/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  )
}

export default function ContactsPage() {
  const supabase = createClient()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  async function fetchContacts() {
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false })
    setContacts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchContacts() }, [])

  const filtered = contacts.filter((c) => {
    if (filter === 'unread') return !c.traite
    if (filter === 'read') return c.traite
    if (filter === 'contact' || filter === 'simulateur' || filter === 'visite') return c.source === filter
    return true
  })

  async function toggleTraite(c: Contact) {
    setToggling(c.id)
    await supabase.from('contacts').update({ traite: !c.traite }).eq('id', c.id)
    setContacts((prev) => prev.map((x) => x.id === c.id ? { ...x, traite: !x.traite } : x))
    if (selected?.id === c.id) setSelected((prev) => prev ? { ...prev, traite: !prev.traite } : null)
    setToggling(null)
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'unread', label: 'Non traités' },
    { key: 'read', label: 'Traités' },
    { key: 'contact', label: 'Formulaire' },
    { key: 'simulateur', label: 'Simulateur' },
    { key: 'visite', label: 'Visite' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>Demandes de contact</h1>
        <span className="text-sm text-brun-mid/60">{contacts.filter((c) => !c.traite).length} non traité(s)</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-sm font-medium rounded-full px-4 py-1.5 transition-all ${filter === key ? 'bg-terra text-creme' : 'border border-brun/20 text-brun-mid hover:border-terra hover:text-terra'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Mobile : cartes ── */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading ? (
          <p className="text-center py-10 text-brun-mid/50 text-sm">Chargement…</p>
        ) : !filtered.length ? (
          <p className="text-center py-10 text-brun-mid/50 text-sm">Aucune demande</p>
        ) : filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl border border-brun/10 p-4 cursor-pointer active:bg-creme/40"
            onClick={() => setSelected(c)}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-medium text-brun text-sm">{c.nom ?? '—'}</p>
                <p className="text-xs text-brun-mid/50 mt-0.5">{format(new Date(c.created_at), 'dd/MM/yy HH:mm')}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {c.source && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SOURCE_COLORS[c.source] ?? 'bg-gray-100 text-gray-600'}`}>
                    {SOURCE_LABELS[c.source] ?? c.source}
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleTraite(c) }}
                  disabled={toggling === c.id}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all ${
                    c.traite ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {toggling === c.id ? '…' : c.traite ? '✓' : '!'}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-brun-mid/70">
              {c.telephone && <span>📞 {c.telephone}</span>}
              {c.ville_bien && <span>📍 {c.ville_bien}</span>}
              {c.type_bien && <span>🏠 {c.type_bien}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop : table ── */}
      <div className="hidden lg:block bg-white rounded-2xl border border-brun/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brun/4">
              <tr>
                {['Date', 'Nom', 'Téléphone', 'Email', 'Ville', 'Type', 'Source', 'Traité'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-brun-mid uppercase tracking-wide font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brun/5">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-brun-mid/50">Chargement…</td></tr>
              ) : !filtered.length ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-brun-mid/50">Aucune demande</td></tr>
              ) : filtered.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-creme/40 transition-colors cursor-pointer"
                  onClick={() => setSelected(c)}
                >
                  <td className="px-4 py-3 text-brun-mid whitespace-nowrap">
                    {format(new Date(c.created_at), 'dd/MM/yy HH:mm')}
                  </td>
                  <td className="px-4 py-3 text-brun font-medium">{c.nom ?? '—'}</td>
                  <td className="px-4 py-3 text-brun-mid">{c.telephone ?? '—'}</td>
                  <td className="px-4 py-3 text-brun-mid">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-brun-mid">{c.ville_bien ?? '—'}</td>
                  <td className="px-4 py-3 text-brun-mid">{c.type_bien ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.source ? (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${SOURCE_COLORS[c.source] ?? 'bg-gray-100 text-gray-600'}`}>
                        {SOURCE_LABELS[c.source] ?? c.source}
                      </span>
                    ) : <span className="text-brun-mid/40">—</span>}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleTraite(c)}
                      disabled={toggling === c.id}
                      className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
                        c.traite
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}
                    >
                      {toggling === c.id ? '…' : c.traite ? '✓ Traité' : 'Non traité'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <div className="p-6 border-b border-brun/10 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
                  {selected.nom ?? 'Sans nom'}
                </h2>
                <p className="text-brun-mid/60 text-xs mt-1">
                  {format(new Date(selected.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-brun-mid hover:text-brun flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Téléphone', value: selected.telephone },
                  { label: 'Email', value: selected.email },
                  { label: 'Ville du bien', value: selected.ville_bien },
                  { label: 'Type de bien', value: selected.type_bien },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-brun-mid/60 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm text-brun">{value ?? '—'}</p>
                  </div>
                ))}
                {selected.source && (
                  <div>
                    <p className="text-xs text-brun-mid/60 uppercase tracking-wide mb-1">Source</p>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${SOURCE_COLORS[selected.source] ?? 'bg-gray-100 text-gray-600'}`}>
                      {SOURCE_LABELS[selected.source] ?? selected.source}
                    </span>
                  </div>
                )}
              </div>

              {selected.message && (
                <div>
                  <p className="text-xs text-brun-mid/60 uppercase tracking-wide mb-2">Message</p>
                  <div className="bg-creme rounded-xl p-4 text-sm text-brun leading-relaxed">
                    {selected.message}
                  </div>
                </div>
              )}

              <button
                onClick={() => toggleTraite(selected)}
                disabled={toggling === selected.id}
                className={`self-start flex items-center gap-2 text-sm font-medium rounded-full px-5 py-2 transition-all ${
                  selected.traite
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-terra text-creme hover:bg-brun'
                }`}
              >
                {selected.traite ? '✓ Marquer comme non traité' : 'Marquer comme traité'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
