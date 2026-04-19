export type CategorieVente = 'Appartement' | 'Studio' | 'Villa' | 'Terrain' | 'Ferme' | 'Commercial'

export type EquipementVenteDef = {
  key: string
  label: { fr: string; ar: string; en: string }
  path: string // SVG path 24x24
}

// ── Logements (Appartement, Studio, Villa) ────────────────
const EQUIPEMENTS_LOGEMENT: EquipementVenteDef[] = [
  { key: 'wifi',            label: { fr: 'WiFi',                ar: 'واي فاي',             en: 'WiFi' },              path: 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01' },
  { key: 'climatisation',   label: { fr: 'Climatisation',       ar: 'مكيف هواء',           en: 'Air conditioning' },   path: 'M12 2v20M4.93 4.93l14.14 14.14M2 12h20M4.93 19.07L19.07 4.93' },
  { key: 'chauffage',       label: { fr: 'Chauffage',           ar: 'تدفئة',               en: 'Heating' },            path: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 6v6M8 14h8' },
  { key: 'parking',         label: { fr: 'Parking',             ar: 'موقف سيارات',         en: 'Parking' },            path: 'M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3M9 12H7v8h2v-3h2a3 3 0 0 0 0-6H9v1zm0 3v-2h2a1 1 0 1 1 0 2H9z' },
  { key: 'piscine',         label: { fr: 'Piscine',             ar: 'مسبح',                en: 'Swimming pool' },      path: 'M2 12c.5-1 1.5-1.5 3-1.5s2.5.5 3 1.5 1.5 1.5 3 1.5 2.5-.5 3-1.5 1.5-1.5 3-1.5M2 17c.5-1 1.5-1.5 3-1.5s2.5.5 3 1.5 1.5 1.5 3 1.5 2.5-.5 3-1.5 1.5-1.5 3-1.5' },
  { key: 'ascenseur',       label: { fr: 'Ascenseur',           ar: 'مصعد',                en: 'Elevator' },           path: 'M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zm7 4l-3 3 3 3m5-6l3 3-3 3' },
  { key: 'gardien',         label: { fr: 'Gardien / Sécurité',  ar: 'حارس / أمن',          en: 'Security guard' },     path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { key: 'digicode',        label: { fr: 'Digicode / Interphone',ar: 'نظام دخول رقمي',    en: 'Keypad / Intercom' },  path: 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zm4-7v3m4-3v3m4-3v3' },
  { key: 'balcon',          label: { fr: 'Balcon',              ar: 'بلكونة',              en: 'Balcony' },            path: 'M3 9h18M3 15h18M9 9v6m6-6v6' },
  { key: 'terrasse',        label: { fr: 'Terrasse',            ar: 'تراس',                en: 'Terrace' },            path: 'M2 20h20M4 20V10l8-7 8 7v10M10 20v-6h4v6' },
  { key: 'jardin',          label: { fr: 'Jardin',              ar: 'حديقة',               en: 'Garden' },             path: 'M12 22V12m0 0C12 7 7 5 7 5s0 5 5 7zm0 0c0-5 5-7 5-7s0 5-5 7z' },
  { key: 'cave',            label: { fr: 'Cave / Sous-sol',     ar: 'قبو',                 en: 'Basement / Cellar' },  path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { key: 'meuble',          label: { fr: 'Meublé',              ar: 'مفروش',               en: 'Furnished' },          path: 'M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3M2 11h20M4 11v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8' },
  { key: 'vue_mer',         label: { fr: 'Vue mer',             ar: 'إطلالة بحرية',        en: 'Sea view' },           path: 'M2 16c.5-1 1.5-1.5 3-1.5s2.5.5 3 1.5 1.5 1.5 3 1.5 2.5-.5 3-1.5 1.5-1.5 3-1.5M3 20h18' },
  { key: 'cuisine_equipee', label: { fr: 'Cuisine équipée',     ar: 'مطبخ مجهز',           en: 'Equipped kitchen' },   path: 'M3 11l19-9-9 19-2-8-8-2z' },
  { key: 'double_vitrage',  label: { fr: 'Double vitrage',      ar: 'زجاج مزدوج',          en: 'Double glazing' },     path: 'M3 3h18v18H3zM9 3v18M3 9h6M3 15h6' },
]

// ── Terrain ───────────────────────────────────────────────
const EQUIPEMENTS_TERRAIN: EquipementVenteDef[] = [
  { key: 'acces_eau',       label: { fr: 'Accès eau potable',   ar: 'توصيل مياه',          en: 'Water access' },       path: 'M12 2C6 2 3 9 3 13a9 9 0 0 0 18 0c0-4-3-11-9-11zm0 16a5 5 0 0 1-5-5' },
  { key: 'acces_electr',    label: { fr: 'Accès électricité',   ar: 'توصيل كهرباء',        en: 'Electricity access' }, path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { key: 'cloture',         label: { fr: 'Clôturé',             ar: 'محاط بسياج',          en: 'Fenced' },             path: 'M4 4h2v16H4zm14 0h2v16h-2zM4 4h16M4 20h16M4 12h16' },
  { key: 'route_goudron',   label: { fr: 'Route goudronnée',    ar: 'طريق معبد',           en: 'Paved road access' },  path: 'M3 17l3-10h12l3 10H3zM6 17v3m12-3v3M9 7V4m6 3V4' },
  { key: 'titre_foncier',   label: { fr: 'Titre foncier',       ar: 'عقد ملكية',           en: 'Property title deed' },path: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z' },
  { key: 'plan_cadastral',  label: { fr: 'Plan cadastral',      ar: 'مخطط مساحي',          en: 'Cadastral plan' },     path: 'M9 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4M9 20h6M9 20V4m6 16h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4M15 20V4M9 4h6' },
  { key: 'vue_mer',         label: { fr: 'Vue mer',             ar: 'إطلالة بحرية',        en: 'Sea view' },           path: 'M2 16c.5-1 1.5-1.5 3-1.5s2.5.5 3 1.5 1.5 1.5 3 1.5 2.5-.5 3-1.5 1.5-1.5 3-1.5M3 20h18' },
  { key: 'constructible',   label: { fr: 'Zone constructible',  ar: 'منطقة قابلة للبناء',  en: 'Building zone' },      path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { key: 'plat',            label: { fr: 'Terrain plat',        ar: 'أرض مستوية',          en: 'Flat land' },          path: 'M3 12h18M3 6h18M3 18h18' },
  { key: 'orientation_sud', label: { fr: 'Orientation sud',     ar: 'واجهة جنوبية',        en: 'South-facing' },       path: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83' },
]

// ── Ferme ─────────────────────────────────────────────────
const EQUIPEMENTS_FERME: EquipementVenteDef[] = [
  { key: 'puits',           label: { fr: 'Puits',               ar: 'بئر',                 en: 'Well' },               path: 'M12 2C8 2 5 5 5 9v1h14V9c0-4-3-7-7-7zM5 10v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10H5z' },
  { key: 'acces_eau',       label: { fr: 'Accès eau potable',   ar: 'توصيل مياه',          en: 'Water access' },       path: 'M12 2C6 2 3 9 3 13a9 9 0 0 0 18 0c0-4-3-11-9-11z' },
  { key: 'acces_electr',    label: { fr: 'Électricité',         ar: 'كهرباء',              en: 'Electricity' },        path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { key: 'irrigue',         label: { fr: 'Irrigué',             ar: 'مسقي',                en: 'Irrigated' },          path: 'M12 2v10M5 19a7 7 0 0 1 14 0M3 22h18' },
  { key: 'arboriculture',   label: { fr: 'Arboriculture',       ar: 'زراعة أشجار',         en: 'Tree cultivation' },   path: 'M12 22V12m0 0C12 7 7 5 7 5s0 5 5 7zm0 0c0-5 5-7 5-7s0 5-5 7z' },
  { key: 'hangar',          label: { fr: 'Hangar / Remise',     ar: 'مستودع',              en: 'Barn / Storage' },     path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10' },
  { key: 'batiment',        label: { fr: 'Bâtiment / Maison',  ar: 'مبنى / منزل',        en: 'Building / House' },   path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { key: 'cloture',         label: { fr: 'Clôturée',            ar: 'محاطة بسياج',         en: 'Fenced' },             path: 'M4 4h2v16H4zm14 0h2v16h-2zM4 4h16M4 20h16' },
  { key: 'titre_foncier',   label: { fr: 'Titre foncier',       ar: 'عقد ملكية',           en: 'Property title deed' },path: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z' },
  { key: 'bergerie',        label: { fr: 'Bergerie / Étable',   ar: 'حظيرة',               en: 'Sheepfold / Stable' }, path: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
  { key: 'serre',           label: { fr: 'Serre',               ar: 'بيت زجاجي',           en: 'Greenhouse' },         path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { key: 'route_acces',     label: { fr: 'Route d\'accès',      ar: 'طريق وصول',           en: 'Access road' },        path: 'M3 17l3-10h12l3 10H3z' },
]

// ── Commercial ────────────────────────────────────────────
const EQUIPEMENTS_COMMERCIAL: EquipementVenteDef[] = [
  { key: 'vitrine',         label: { fr: 'Vitrine',             ar: 'واجهة زجاجية',        en: 'Shop window' },        path: 'M3 3h18v18H3zM3 9h18M9 9v12' },
  { key: 'parking',         label: { fr: 'Parking',             ar: 'موقف سيارات',         en: 'Parking' },            path: 'M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3M9 12H7v8h2v-3h2a3 3 0 0 0 0-6H9v1zm0 3v-2h2a1 1 0 1 1 0 2H9z' },
  { key: 'climatisation',   label: { fr: 'Climatisation',       ar: 'مكيف هواء',           en: 'Air conditioning' },   path: 'M12 2v20M4.93 4.93l14.14 14.14M2 12h20M4.93 19.07L19.07 4.93' },
  { key: 'wc',              label: { fr: 'Toilettes',           ar: 'دورة مياه',           en: 'Restroom' },           path: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm6 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
  { key: 'reserve',         label: { fr: 'Réserve / Stock',     ar: 'مخزن',                en: 'Storage room' },       path: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' },
  { key: 'cave',            label: { fr: 'Cave',                ar: 'قبو',                 en: 'Cellar' },             path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { key: 'ascenseur',       label: { fr: 'Ascenseur',           ar: 'مصعد',                en: 'Elevator' },           path: 'M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zm7 4l-3 3 3 3m5-6l3 3-3 3' },
  { key: 'alarme',          label: { fr: 'Alarme / Sécurité',   ar: 'إنذار / أمن',         en: 'Alarm / Security' },   path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { key: 'acces_pmr',       label: { fr: 'Accès PMR',           ar: 'وصول لذوي الإعاقة',   en: 'Disability access' },  path: 'M16 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-4 17v-5l-3-3 3-6h8l-3 6h-2v3l2 5h-5z' },
  { key: 'local_nu',        label: { fr: 'Local nu',            ar: 'محل فارغ',            en: 'Empty unit' },         path: 'M3 3h18v18H3z' },
  { key: 'bail_commercial', label: { fr: 'Bail commercial',     ar: 'إيجار تجاري',         en: 'Commercial lease' },   path: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 13h8M8 17h5' },
  { key: 'cuisine',         label: { fr: 'Cuisine / Fournil',   ar: 'مطبخ',                en: 'Kitchen' },            path: 'M3 11l19-9-9 19-2-8-8-2z' },
]

// ── Map par catégorie ─────────────────────────────────────
export const EQUIPEMENTS_PAR_CATEGORIE: Record<CategorieVente, EquipementVenteDef[]> = {
  Appartement: EQUIPEMENTS_LOGEMENT,
  Studio:      EQUIPEMENTS_LOGEMENT,
  Villa:       EQUIPEMENTS_LOGEMENT,
  Terrain:     EQUIPEMENTS_TERRAIN,
  Ferme:       EQUIPEMENTS_FERME,
  Commercial:  EQUIPEMENTS_COMMERCIAL,
}

export function getEquipementsForCategorie(cat: string): EquipementVenteDef[] {
  return EQUIPEMENTS_PAR_CATEGORIE[cat as CategorieVente] ?? EQUIPEMENTS_LOGEMENT
}
