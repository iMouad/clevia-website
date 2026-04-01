'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    startTransition(async () => {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError('Email ou mot de passe incorrect.')
      } else {
        router.push('/admin')
        router.refresh()
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#F5F0EA] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/logo.svg" alt="Clévia" width={180} height={50} priority />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-brun/10">
          <div className="text-center mb-8">
            <h1 className="text-2xl text-brun mb-1" style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 400 }}>
              Administration
            </h1>
            <p className="text-brun-mid text-sm">Connectez-vous à votre espace</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-medium text-brun-mid mb-1.5 tracking-wide uppercase">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@clevia.ma"
                className="w-full border border-brun/20 rounded-xl px-4 py-3 text-sm text-brun placeholder-brun-mid/40 focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brun-mid mb-1.5 tracking-wide uppercase">
                Mot de passe
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-brun/20 rounded-xl px-4 py-3 text-sm text-brun placeholder-brun-mid/40 focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="8" fill="#dc2626" fillOpacity="0.15" />
                  <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center gap-2 bg-terra text-creme font-medium rounded-full px-8 py-3.5 hover:bg-brun transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                  </svg>
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-brun-mid/40 text-xs mt-6">
          © 2025 Clévia Conciergerie
        </p>
      </div>
    </div>
  )
}
