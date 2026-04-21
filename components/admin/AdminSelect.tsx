import { SelectHTMLAttributes } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string
}

export default function AdminSelect({ className = '', children, style, ...props }: Props) {
  return (
    <div className="relative">
      <select
        {...props}
        style={{ fontFamily: 'var(--font-dm-sans)', ...style }}
        className={`w-full appearance-none border border-brun/20 rounded-xl px-4 py-3 pr-10 text-sm text-brun bg-white focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-colors cursor-pointer ${className}`}
      >
        {children}
      </select>
      {/* Flèche custom */}
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brun-mid/50">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  )
}
