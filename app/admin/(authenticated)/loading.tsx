function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-brun/5 ${className}`} />
}

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-8">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton className="h-4 w-32 rounded-lg mt-2" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>

      {/* Occupation par bien */}
      <Skeleton className="h-6 w-40 rounded-lg mb-3" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <Skeleton className="h-6 w-44 rounded-lg mb-3" />
          <Skeleton className="h-64" />
        </div>
        <div>
          <Skeleton className="h-6 w-36 rounded-lg mb-3" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  )
}
