import { DM_Sans } from 'next/font/google'
import AdminSidebar from '@/components/admin/AdminSidebar'
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
      <body className="flex h-screen overflow-hidden bg-[#F5F0EA]" style={{ fontFamily: 'var(--font-dm-sans)' }}>
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </body>
    </html>
  )
}
