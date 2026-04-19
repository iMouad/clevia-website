import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-creme/30 lg:flex">
      <AdminSidebar />
      <main className="flex-1 pt-14 lg:pt-0 lg:h-screen lg:overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
