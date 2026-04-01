// Root page — the proxy redirects / to /fr automatically.
// This file is kept to satisfy Next.js's file-system routing.
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/fr')
}
