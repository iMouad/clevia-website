'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type AdminUser = {
  id: string
  email: string | undefined
  created_at: string
  last_sign_in_at: string | null
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function fetchUsers() {
    const res = await fetch('/api/admin/users')
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setInviting(true)
    setMessage(null)

    const res = await fetch('/api/admin/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    const data = await res.json()

    if (res.ok) {
      setMessage({ type: 'success', text: `Invitation envoyée à ${email.trim()}. L'utilisateur recevra un email pour créer son mot de passe.` })
      setEmail('')
      fetchUsers()
    } else {
      setMessage({ type: 'error', text: data.error ?? 'Une erreur est survenue.' })
    }
    setInviting(false)
  }

  async function handleDelete(userId: string, userEmail: string) {
    if (!confirm(`Supprimer l'accès de ${userEmail} ? Cette action est irréversible.`)) return
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    }
  }

  const inputClass = 'w-full border border-brun/20 rounded-xl px-4 py-2.5 text-sm text-brun focus:outline-none focus:border-terra transition-colors'

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl text-brun" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
          Administrateurs
        </h1>
        <p className="text-sm text-brun-mid/60 mt-1" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Gérez les comptes ayant accès au panel admin.
        </p>
      </div>

      {/* Invite form */}
      <div className="bg-white border border-brun/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg text-brun mb-4" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
          Inviter un nouvel administrateur
        </h2>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            className={inputClass}
            style={{ fontFamily: 'var(--font-dm-sans)' }}
            placeholder="email@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={inviting}
            className="flex-shrink-0 flex items-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-5 py-2.5 hover:bg-brun transition-all disabled:opacity-50 whitespace-nowrap"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {inviting ? 'Envoi…' : 'Envoyer l\'invitation'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 px-4 py-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-600'}`}
            style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {message.text}
          </div>
        )}
      </div>

      {/* Users list */}
      <div className="bg-white border border-brun/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-brun/8">
          <h2 className="text-base font-medium text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Comptes actifs
          </h2>
        </div>
        {loading ? (
          <div className="px-6 py-10 text-center text-brun-mid/40 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Chargement…
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-10 text-center text-brun-mid/40 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Aucun utilisateur trouvé.
          </div>
        ) : (
          <div className="divide-y divide-brun/5">
            {users.map((u) => (
              <div key={u.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {u.email}
                  </p>
                  <p className="text-xs text-brun-mid/50 mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Créé le {format(new Date(u.created_at), 'd MMM yyyy', { locale: fr })}
                    {u.last_sign_in_at && ` · Dernière connexion ${format(new Date(u.last_sign_in_at), 'd MMM yyyy', { locale: fr })}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(u.id, u.email ?? '')}
                  className="flex-shrink-0 text-xs text-red-400 hover:text-red-600 font-medium px-3 py-1.5 rounded-full hover:bg-red-50 transition-all"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  Révoquer
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
