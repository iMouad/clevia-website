import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600 // régénère toutes les heures

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cleviamaroc.com'
const LOCALES = ['fr', 'ar', 'en']
const PAGES = [
  { path: '',          priority: 1.0, changeFrequency: 'weekly'  as const },
  { path: '/services', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/comment',  priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/pourquoi', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/contact',  priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/biens',    priority: 0.9, changeFrequency: 'weekly'  as const },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // Pages statiques
  for (const locale of LOCALES) {
    for (const { path, priority, changeFrequency } of PAGES) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
      })
    }
  }

  // Pages biens dynamiques
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: biens } = await supabase
      .from('biens')
      .select('id, updated_at')
      .eq('statut', 'actif')

    for (const bien of biens ?? []) {
      for (const locale of LOCALES) {
        entries.push({
          url: `${BASE_URL}/${locale}/biens/${bien.id}`,
          lastModified: bien.updated_at ? new Date(bien.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }
  } catch {
    // Ne pas faire planter le build si Supabase est inaccessible
  }

  return entries
}
