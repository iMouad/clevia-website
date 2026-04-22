import type { Metadata, Viewport } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import '../globals.css'

const playfair = Playfair_Display({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
})

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export const viewport: Viewport = {
  themeColor: '#C97B4B',
  width: 'device-width',
  initialScale: 1,
}

const SITE_URL = 'https://www.cleviamaroc.com'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'hero' })

  return {
    title: {
      template: '%s | Clévia Immobilier - Conciergerie',
      default: 'Clévia Immobilier - Conciergerie · Maroc',
    },
    description: t('subtitle'),
    icons: {
      icon: '/favicon.svg',
      shortcut: '/icon.svg',
      apple: '/icon.svg',
    },
    openGraph: {
      siteName: 'Clévia Immobilier - Conciergerie',
      locale: locale === 'ar' ? 'ar_MA' : locale === 'en' ? 'en_US' : 'fr_MA',
      type: 'website',
    },
    alternates: {
      languages: {
        'fr': `${SITE_URL}/fr`,
        'ar': `${SITE_URL}/ar`,
        'en': `${SITE_URL}/en`,
        'x-default': `${SITE_URL}/fr`,
      },
    },
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html
      lang={locale}
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
      className={`${playfair.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
