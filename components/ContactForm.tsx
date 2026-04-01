'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { submitContact } from '@/app/[locale]/contact/actions'

type Status = 'idle' | 'success' | 'error'

function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
    </svg>
  )
}

export default function ContactForm() {
  const t = useTranslations('contact.form')
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<Status>('idle')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isPending) return

    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget

    startTransition(async () => {
      try {
        await submitContact(formData)
        setStatus('success')
        form.reset()
      } catch {
        setStatus('error')
      }
    })
  }

  const inputClass =
    'w-full border border-brun/20 rounded-xl px-4 py-3 text-sm text-brun placeholder-brun-mid/40 focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors bg-white'
  const labelClass = 'block text-xs font-medium text-brun-mid mb-1.5 tracking-wide'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {/* Nom + Téléphone */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {t('name')} <span className="text-terra">*</span>
          </label>
          <input
            name="nom"
            type="text"
            required
            placeholder={t('namePlaceholder')}
            className={inputClass}
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          />
        </div>
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {t('phone')} <span className="text-terra">*</span>
          </label>
          <input
            name="telephone"
            type="tel"
            required
            placeholder={t('phonePlaceholder')}
            className={inputClass}
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {t('email')}
        </label>
        <input
          name="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          className={inputClass}
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        />
      </div>

      {/* Ville + Type */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {t('city')}
          </label>
          <input
            name="ville_bien"
            type="text"
            placeholder={t('cityPlaceholder')}
            className={inputClass}
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          />
        </div>
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {t('type')}
          </label>
          <select
            name="type_bien"
            className={inputClass}
            defaultValue=""
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            <option value="" disabled>{t('typePlaceholder')}</option>
            <option value="Appartement">{t('typeOptions.apartment')}</option>
            <option value="Villa">{t('typeOptions.villa')}</option>
            <option value="Studio">{t('typeOptions.studio')}</option>
            <option value="Autre">{t('typeOptions.other')}</option>
          </select>
        </div>
      </div>

      {/* Message */}
      <div>
        <label className={labelClass} style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {t('message')}
        </label>
        <textarea
          name="message"
          rows={4}
          placeholder={t('messagePlaceholder')}
          className={`${inputClass} resize-none`}
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        />
      </div>

      {/* Feedback messages */}
      {status === 'success' && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="9" fill="#16a34a" fillOpacity="0.15" />
            <path d="M5 9l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('success')}
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="9" fill="#dc2626" fillOpacity="0.15" />
            <path d="M6 6l6 6M12 6l-6 6" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {t('error')}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || status === 'success'}
        className="flex items-center justify-center gap-2 bg-terra text-creme font-medium rounded-full px-8 py-3.5 hover:bg-brun transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ fontFamily: 'var(--font-dm-sans)' }}
      >
        {isPending ? (
          <>
            <Spinner />
            {t('submitting')}
          </>
        ) : (
          t('submit')
        )}
      </button>
    </form>
  )
}
