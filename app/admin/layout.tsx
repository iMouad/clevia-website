import { Playfair_Display, DM_Sans } from 'next/font/google'
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

export const metadata = {
  title: { template: '%s | Admin Clévia', default: 'Admin Clévia' },
  robots: { index: false, follow: false },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="bg-[#F5F0EA]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
        {children}
      </body>
    </html>
  )
}
