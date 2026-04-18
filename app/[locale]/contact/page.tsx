import { getTranslations } from 'next-intl/server'
import { AnimateIn } from '@/components/ui/AnimateIn'
import ContactForm from '@/components/ContactForm'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })
  return {
    title: t('hero.title'),
    description: t('hero.subtitle'),
    openGraph: { url: `/${locale}/contact` },
    alternates: { canonical: `/${locale}/contact` },
  }
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full bg-terra/10 flex items-center justify-center flex-shrink-0 text-terra">
        {icon}
      </div>
      <div>
        <p className="text-creme/50 text-xs uppercase tracking-widest mb-0.5" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {label}
        </p>
        <p className="text-creme/90 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          {value}
        </p>
      </div>
    </div>
  )
}

export default async function ContactPage({
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ bien?: string }>
}) {
  const { bien } = await searchParams
  const t = await getTranslations('contact')

  return (
    <>
      {/* ── HERO ────────────────────────────────── */}
      <section className="bg-creme py-20 px-4 border-b border-brun/5">
        <div className="max-w-7xl mx-auto text-center">
          <AnimateIn>
            <span className="inline-block text-terra text-xs font-medium tracking-[0.2em] uppercase mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('tag')}
            </span>
            <h1 className="text-5xl md:text-6xl text-brun mb-4">{t('hero.title')}</h1>
            <p className="text-brun-mid text-lg" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              {t('hero.subtitle')}
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* ── MAIN CONTENT ────────────────────────── */}
      <section className="bg-creme py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-start">

            {/* Left — Infos (bg-brun card) */}
            <AnimateIn className="lg:col-span-2">
              <div className="bg-brun rounded-2xl p-8 flex flex-col gap-8 h-full">
                <div>
                  <h2 className="text-2xl text-creme mb-2">{t('title')}</h2>
                  <p className="text-creme/50 text-sm" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    {t('subtitle')}
                  </p>
                </div>

                <div className="flex flex-col gap-6">
                  <InfoItem
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                    }
                    label={t('info.zone.label')}
                    value={t('info.zone.value')}
                  />
                  <InfoItem
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <path d="M22 6l-10 7L2 6" />
                      </svg>
                    }
                    label={t('info.email.label')}
                    value={t('info.email.value')}
                  />
                  <InfoItem
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.08 1.18 2 2 0 012.07 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z" />
                      </svg>
                    }
                    label={t('info.phone.label')}
                    value={t('info.phone.value')}
                  />
                  <InfoItem
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    }
                    label={t('info.hours.label')}
                    value={t('info.hours.value')}
                  />
                </div>

                {/* Platforms */}
                <div className="pt-4 border-t border-creme/10">
                  <p className="text-creme/40 text-xs mb-3" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                    Plateformes gérées
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {['Airbnb', 'Booking', 'Avito'].map((p) => (
                      <span
                        key={p}
                        className="text-xs border border-sable/30 text-sable rounded-full px-3 py-1"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </AnimateIn>

            {/* Right — Form */}
            <AnimateIn delay={0.15} className="lg:col-span-3">
              <div className="bg-white border border-brun/10 rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl text-brun mb-6">{t('form.title')}</h2>
                <ContactForm defaultBien={bien} />
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>
    </>
  )
}
