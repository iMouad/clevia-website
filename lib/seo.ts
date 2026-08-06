const SITE_URL = 'https://www.cleviamaroc.com'

export function getPageSeo(locale: string, path: string, title: string, description: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const ogImageUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(description.slice(0, 80))}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}${cleanPath}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}${cleanPath}`,
      languages: {
        'fr': `${SITE_URL}/fr${cleanPath}`,
        'ar': `${SITE_URL}/ar${cleanPath}`,
        'en': `${SITE_URL}/en${cleanPath}`,
        'x-default': `${SITE_URL}/fr${cleanPath}`,
      },
    },
  }
}
