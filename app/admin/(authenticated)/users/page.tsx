'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type AdminUser = {
  id: string
  email: string | undefined
  created_at: string
  last_sign_in_at: string | null
  is_sub_admin: boolean
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères.' })
      return
    }
    setSaving(true)
    setMessage(null)

    const res = await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    })
    const data = await res.json()

    if (res.ok) {
      setMessage({ type: 'success', text: `Admin créé : ${email.trim()}` })
      setEmail('')
      setPassword('')
      fetchUsers()
    } else {
      setMessage({ type: 'error', text: data.error ?? 'Une erreur est survenue.' })
    }
    setSaving(false)
  }

  async function handleDelete(userId: string, userEmail: string) {
    if (!confirm(`Supprimer l'accès de ${userEmail} ?`)) return
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const inputClass = 'w-full border border-brun/20 rounded-xl px-4 py-2.5 text-sm text-brun focus:outline-none focus:border-terra transition-colors bg-white'

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

      {/* Create form */}
      <div className="bg-white border border-brun/10 rounded-2xl p-6 mb-6">
        <h2 className="text-lg text-brun mb-4" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
          Ajouter un administrateur
        </h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-brun-mid/60 uppercase tracking-wide mb-1.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Email
            </label>
            <input
              type="email"
              className={inputClass}
              style={{ fontFamily: 'var(--font-dm-sans)' }}
              placeholder="email@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-brun-mid/60 uppercase tracking-wide mb-1.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Mot de passe (min. 8 caractères)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={inputClass}
                style={{ fontFamily: 'var(--font-dm-sans)' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brun-mid/40 hover:text-brun-mid transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  {showPassword
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  }
                </svg>
              </button>
            </div>
          </div>

          {message && (
            <div className={`px-4 py-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-100 text-green-700' : 'bg-red-50 border border-red-100 text-red-600'}`}
              style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="self-start flex items-center gap-2 bg-terra text-creme text-sm font-medium rounded-full px-6 py-2.5 hover:bg-brun transition-all disabled:opacity-50"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            {saving ? 'Création…' : 'Créer l\'admin'}
          </button>
        </form>
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
            Aucun utilisateur.
          </div>
        ) : (
          <div className="divide-y divide-brun/5">
            {users.map((u) => (
              <div key={u.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-brun" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {u.email}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_sub_admin ? 'bg-blue-50 text-blue-600' : 'bg-terra/10 text-terra'}`}
                      style={{ fontFamily: 'var(--font-dm-sans)' }}>
                      {u.is_sub_admin ? 'Admin' : 'Super admin'}
                    </span>
                  </div>
                  <p className="text-xs text-brun-mid/50 mt-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Créé le {format(new Date(u.created_at), 'd MMM yyyy', { locale: fr })}
                    {u.last_sign_in_at && ` · Dernière connexion ${format(new Date(u.last_sign_in_at), 'd MMM yyyy', { locale: fr })}`}
                  </p>
                </div>
                {u.is_sub_admin && (
                  <button
                    onClick={() => handleDelete(u.id, u.email ?? '')}
                    className="flex-shrink-0 text-xs text-red-400 hover:text-red-600 font-medium px-3 py-1.5 rounded-full hover:bg-red-50 transition-all"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
