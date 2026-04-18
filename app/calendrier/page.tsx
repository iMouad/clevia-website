'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function CalendrierAccesPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return

    setLoading(true)
    setError('')

    // Check code exists via API route
    const res = await fetch(`/api/calendrier/check?code=${encodeURIComponent(trimmed)}`)
    const json = await res.json()

    if (json.valid) {
      router.push(`/calendrier/${trimmed}`)
    } else {
      setError('Code invalide. Vérifiez le code communiqué par Clévia.')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAF6F1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      {/* Card */}
      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid rgba(44,26,14,0.1)',
          borderRadius: '20px',
          padding: '40px 32px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 4px 24px rgba(44,26,14,0.06)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <Image src="/logo.svg" alt="Clévia" width={130} height={38} />
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: '24px',
            fontWeight: 400,
            color: '#2C1A0E',
            textAlign: 'center',
            marginBottom: '8px',
          }}
        >
          Espace propriétaire
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: '#6B4C35',
            textAlign: 'center',
            marginBottom: '28px',
            lineHeight: 1.5,
          }}
        >
          Entrez le code d&apos;accès communiqué par l&apos;équipe Clévia pour consulter le calendrier de votre bien.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError('')
            }}
            placeholder="Ex : CLV-AB3K7M"
            maxLength={12}
            autoFocus
            style={{
              width: '100%',
              border: error ? '1.5px solid #DC2626' : '1.5px solid rgba(44,26,14,0.2)',
              borderRadius: '12px',
              padding: '14px 16px',
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textAlign: 'center',
              color: '#2C1A0E',
              outline: 'none',
              fontFamily: 'var(--font-dm-sans)',
              backgroundColor: '#FAF6F1',
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <p style={{ fontSize: '13px', color: '#DC2626', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!code.trim() || loading}
            style={{
              backgroundColor: code.trim() && !loading ? '#C97B4B' : '#E8A87C',
              color: '#FAF6F1',
              border: 'none',
              borderRadius: '50px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: code.trim() && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-dm-sans)',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Vérification…' : 'Accéder au calendrier'}
          </button>
        </form>
      </div>

      <p style={{ fontSize: '12px', color: '#A07850', marginTop: '20px' }}>
        Vous n&apos;avez pas de code ?{' '}
        <a href="mailto:contact@cleviamaroc.com" style={{ color: '#C97B4B' }}>
          Contactez Clévia
        </a>
      </p>
    </div>
  )
}
