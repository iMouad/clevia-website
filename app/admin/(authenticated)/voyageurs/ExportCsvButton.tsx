'use client'

type Voyageur = {
  nom: string
  telephone: string | null
  sources: string[] | null
}

export default function ExportCsvButton({ voyageurs }: { voyageurs: Voyageur[] }) {
  function exportCSV() {
    const rows = [
      ['Nom', 'Tel', 'Source'],
      ...voyageurs.map((v) => [
        v.nom,
        v.telephone ?? '',
        (v.sources ?? []).join(' / '),
      ]),
    ]
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voyageurs-clevia.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={exportCSV}
      className="flex items-center gap-2 border border-brun/20 text-brun-mid text-sm font-medium rounded-full px-4 py-2.5 hover:border-terra hover:text-terra transition-all"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Export CSV
    </button>
  )
}
