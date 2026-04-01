import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://clevia.ma'
const LOCALES = ['fr', 'ar', 'en']
const PAGES = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: '/services', priority: 0.9, changeFrequency: 'monthly' as const },
  { path: '/comment', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/pourquoi', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/contact', priority: 0.9, changeFrequency: 'monthly' as const },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

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

  return entries
}
