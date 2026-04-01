import { DM_Sans } from 'next/font/google'
import '../globals.css'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
})

export const metadata = {
  title: { template: '%s | Admin Clévia', default: 'Admin Clévia' },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={dmSans.variable}>
      <body className="bg-[#F5F0EA]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
        {children}
      </body>
    </html>
  )
}
