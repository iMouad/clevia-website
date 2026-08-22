const PREFIXES: { code: string; flag: string; label: string }[] = [
  { code: '+212', flag: '🇲🇦', label: 'Maroc' },
  { code: '+33',  flag: '🇫🇷', label: 'France' },
  { code: '+34',  flag: '🇪🇸', label: 'Espagne' },
  { code: '+44',  flag: '🇬🇧', label: 'UK' },
  { code: '+49',  flag: '🇩🇪', label: 'Allemagne' },
  { code: '+1',   flag: '🇺🇸', label: 'USA/Canada' },
  { code: '+39',  flag: '🇮🇹', label: 'Italie' },
  { code: '+32',  flag: '🇧🇪', label: 'Belgique' },
  { code: '+31',  flag: '🇳🇱', label: 'Pays-Bas' },
  { code: '+216', flag: '🇹🇳', label: 'Tunisie' },
  { code: '+213', flag: '🇩🇿', label: 'Algérie' },
  { code: '+966', flag: '🇸🇦', label: 'Arabie S.' },
  { code: '+971', flag: '🇦🇪', label: 'EAU' },
]

export { PREFIXES }

export function getFlag(phone: string | null | undefined): string {
  if (!phone) return ''
  const match = PREFIXES.find(p => phone.startsWith(p.code))
  return match?.flag ?? ''
}

export function getPrefix(phone: string | null | undefined): string {
  if (!phone) return '+212'
  return phone.match(/^(\+\d{1,4})/)?.[1] ?? '+212'
}

export function getNumber(phone: string | null | undefined): string {
  if (!phone) return ''
  return phone.replace(/^\+\d{1,4}\s?/, '')
}
