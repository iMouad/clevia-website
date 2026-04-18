import type { Metadata } from 'next'
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

export const metadata: Metadata = {
  title: 'Calendrier propriétaire · Clévia',
  robots: { index: false, follow: false },
}

export default function CalendrierLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${playfair.variable} ${dmSans.variable} bg-creme text-brun antialiased`}>
        {children}
      </body>
    </html>
  )
}
