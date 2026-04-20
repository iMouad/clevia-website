export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove accents
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')     // keep alphanum, spaces, hyphens
    .trim()
    .replace(/\s+/g, '-')             // spaces → hyphens
    .replace(/-+/g, '-')              // collapse multiple hyphens
}

/** Slug for biens à vendre: titre-ville[-reference|-id_prefix] */
export function generateVenteSlug(
  titre: string,
  ville: string,
  reference: string | null,
  id: string,
): string {
  const base = slugify(`${titre} ${ville}`)
  const suffix = reference ? slugify(reference) : id.slice(0, 8)
  return `${base}-${suffix}`
}

/** Slug for biens à louer: nom-ville-id_prefix */
export function generateLocationSlug(
  nom: string,
  ville: string | null,
  id: string,
): string {
  const base = slugify(`${nom}${ville ? ' ' + ville : ''}`)
  return `${base}-${id.slice(0, 8)}`
}
