'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

type Props = {
  bienTitre: string
  bienReference: string | null
  bienVille: string
  bienCategorie: string
}

export default function DemandeVisiteForm({ bienTitre, bienReference, bienVille, bienCategorie }: Props) {
  const [open, setOpen] = useState(false)
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [date, setDate] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim() || !telephone.trim()) return
    setStatus('loading')

    const ref = bienReference ? ` (Réf : ${bienReference})` : ''
    const dateLine = date ? `\nDate souhaitée : ${date}` : ''
    const msgLine = message.trim() ? `\nMessage : ${message.trim()}` : ''
    const fullMessage = `Demande de visite pour : ${bienTitre}${ref}.${dateLine}${msgLine}`

    const { error } = await supabase.from('contacts').insert({
      nom: nom.trim(),
      email: '',
      telephone: telephone.trim(),
      ville_bien: bienVille,
      type_bien: `Demande de visite — ${bienCategorie}`,
      message: fullMessage,
      traite: false,
    })

    setStatus(error ? 'error' : 'success')
  }

  const inputClass = 'w-full rounded-xl border border-brun/15 px-3.5 py-2.5 text-sm text-brun bg-creme/50 focus:outline-none focus:border-terra/50 transition-colors'

  if (status === 'success') {
    return (
      <div className="mt-4 pt-4 border-t border-brun/8">
        <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" className="mt-0.5 flex-shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Demande envoyée !
            </p>
            <p className="text-xs text-green-600 mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              On vous contacte sous 24h pour confirmer le créneau.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-brun/8">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-sm font-medium text-brun-mid hover:text-brun transition-colors"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        <span className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          Demander une visite
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div>
            <label className="block text-xs text-brun-mid/60 mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Nom complet *
            </label>
            <input
              className={inputClass}
              style={{ fontFamily: 'var(--font-dm-sans)' }}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Votre nom"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-brun-mid/60 mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Téléphone *
            </label>
            <input
              className={inputClass}
              style={{ fontFamily: 'var(--font-dm-sans)' }}
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="+212 6XX XXX XXX"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-brun-mid/60 mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Date souhaitée
            </label>
            <input
              className={inputClass}
              style={{ fontFamily: 'var(--font-dm-sans)' }}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-xs text-brun-mid/60 mb-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Message (optionnel)
            </label>
            <textarea
              className={`${inputClass} resize-none`}
              style={{ fontFamily: 'var(--font-dm-sans)' }}
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Précisions, questions…"
            />
          </div>

          {status === 'error' && (
            <p className="text-xs text-red-500" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Une erreur est survenue. Réessayez ou contactez-nous directement.
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 bg-brun text-creme text-sm font-medium rounded-full px-5 py-2.5 hover:bg-terra transition-all disabled:opacity-60"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {status === 'loading' ? 'Envoi…' : 'Envoyer la demande'}
          </button>
        </form>
      )}
    </div>
  )
}
