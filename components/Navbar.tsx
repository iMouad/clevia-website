'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations, useLocale } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'

const LOCALES = [
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'ع' },
  { code: 'en', label: 'EN' },
]

// Desktop: label court / Mobile: label complet via t(key)
const NAV_LINKS = [
  { href: '/',         key: 'home',     desktop: null },
  { href: '/services', key: 'services', desktop: null },
  { href: '/biens',    key: 'biens',    desktop: null },
  { href: '/vente',    key: 'vente',    desktop: null },
  { href: '/comment',  key: 'how',      desktop: 'Comment' },
  { href: '/pourquoi', key: 'why',      desktop: 'Pourquoi' },
] as const

// Liens affichés en desktop (on retire Accueil — le logo fait ce travail)
const DESKTOP_LINKS = NAV_LINKS.filter((l) => l.href !== '/')

export default function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale })
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-creme/95 backdrop-blur-md shadow-sm'
            : 'bg-creme/90 backdrop-blur-sm'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo.svg"
              alt="Clévia Conciergerie"
              width={130}
              height={37}
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden lg:flex items-center gap-5">
            {DESKTOP_LINKS.map(({ href, key, desktop }) => (
              <li key={key}>
                <Link
                  href={href}
                  className={`text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                    isActive(href)
                      ? 'text-terra underline underline-offset-4 decoration-terra/50'
                      : 'text-brun hover:text-terra'
                  }`}
                >
                  {desktop ?? t(key)}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right side: lang switcher + CTA */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Language switcher */}
            <div className="flex items-center gap-1 border border-brun/20 rounded-full px-2 py-1">
              {LOCALES.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => switchLocale(code)}
                  className={`px-2 py-0.5 rounded-full text-sm font-medium transition-all duration-150 ${
                    locale === code
                      ? 'bg-terra text-creme'
                      : 'text-brun-mid hover:text-brun'
                  }`}
                  aria-label={`Switch to ${label}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Simulateur button — outline */}
            <Link
              href="/simulateur"
              className={`border font-medium rounded-full px-4 py-2 text-sm whitespace-nowrap transition-all duration-200 ${
                isActive('/simulateur')
                  ? 'border-terra bg-terra/10 text-terra'
                  : 'border-brun/30 text-brun hover:border-terra hover:text-terra'
              }`}
            >
              Simulateur
            </Link>

            {/* CTA confier */}
            <Link
              href="/contact"
              className="bg-terra text-creme font-medium rounded-full px-5 py-2 text-sm whitespace-nowrap hover:bg-brun transition-all duration-200"
            >
              {t('contact')}
            </Link>

            {/* CTA vendre */}
            <Link
              href="/vente"
              className={`border font-medium rounded-full px-4 py-2 text-sm whitespace-nowrap transition-all duration-200 ${
                isActive('/vente')
                  ? 'border-terra bg-terra/10 text-terra'
                  : 'border-terra/60 text-terra hover:border-terra hover:bg-terra/5'
              }`}
            >
              {t('vendre')}
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex items-center justify-center w-10 h-10 text-brun"
            aria-label={mobileOpen ? t('menuClose') : t('menuOpen')}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </nav>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-brun/40 backdrop-blur-sm" />
          <div
            className={`absolute top-16 inset-x-0 bg-creme shadow-xl p-6 flex flex-col gap-6 ${
              locale === 'ar' ? 'text-right' : 'text-left'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile nav links */}
            <ul className="flex flex-col gap-4">
              {NAV_LINKS.map(({ href, key }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className={`block text-lg font-medium transition-colors ${
                      isActive(href) ? 'text-terra' : 'text-brun'
                    }`}
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/contact"
                  className="block text-lg font-medium text-brun"
                >
                  {t('contact')}
                </Link>
              </li>
            </ul>

            {/* Simulateur CTA — mobile */}
            <Link
              href="/simulateur"
              className={`border-2 font-medium rounded-full px-8 py-3 text-center transition-all duration-200 ${
                isActive('/simulateur')
                  ? 'border-terra bg-terra/10 text-terra'
                  : 'border-terra text-terra hover:bg-terra hover:text-creme'
              }`}
            >
              {t('simulateur')}
            </Link>

            {/* Vendre votre bien CTA — mobile */}
            <Link
              href="/vente"
              className={`border-2 font-medium rounded-full px-8 py-3 text-center transition-all duration-200 ${
                isActive('/vente')
                  ? 'border-brun bg-brun/10 text-brun'
                  : 'border-brun/30 text-brun-mid hover:border-brun hover:text-brun'
              }`}
            >
              {t('vendre')}
            </Link>

            {/* Mobile lang switcher */}
            <div className="flex items-center gap-2 pt-2 border-t border-brun/10">
              {LOCALES.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => switchLocale(code)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    locale === code
                      ? 'bg-terra text-creme'
                      : 'border border-brun/20 text-brun-mid hover:border-terra hover:text-terra'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Mobile CTA */}
            <Link
              href="/contact"
              className="bg-terra text-creme font-medium rounded-full px-8 py-3 text-center hover:bg-brun transition-all duration-200"
            >
              {t('contact')}
            </Link>
          </div>
        </div>
      )}

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16" />
    </>
  )
}
