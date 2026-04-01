import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fr', 'ar', 'en'],
  defaultLocale: 'fr',
})

export type Locale = (typeof routing.locales)[number]
