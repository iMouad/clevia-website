export const EQUIPEMENT_KEYS = [
  'wifi', 'piscine', 'climatisation', 'parking',
  'cuisine_equipee', 'lave_linge', 'seche_linge', 'televiseur',
  'balcon', 'terrasse', 'vue_mer', 'barbecue',
  'ascenseur', 'gardien', 'digicode', 'fer_a_repasser',
  'machine_cafe', 'micro_ondes', 'lave_vaisselle',
  'baignoire', 'douche_italienne',
] as const

export type EquipementKey = (typeof EQUIPEMENT_KEYS)[number]

export type EquipementDef = {
  key: EquipementKey
  label: { fr: string; ar: string; en: string }
  path: string // SVG path for 24x24 viewBox
}

export const EQUIPEMENTS: EquipementDef[] = [
  {
    key: 'wifi',
    label: { fr: 'WiFi', ar: 'واي فاي', en: 'WiFi' },
    path: 'M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01',
  },
  {
    key: 'piscine',
    label: { fr: 'Piscine', ar: 'مسبح', en: 'Swimming pool' },
    path: 'M2 12c.5-1 1.5-1.5 3-1.5s2.5.5 3 1.5 1.5 1.5 3 1.5 2.5-.5 3-1.5 1.5-1.5 3-1.5M2 17c.5-1 1.5-1.5 3-1.5s2.5.5 3 1.5 1.5 1.5 3 1.5 2.5-.5 3-1.5 1.5-1.5 3-1.5M7 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm5 2V7',
  },
  {
    key: 'climatisation',
    label: { fr: 'Climatisation', ar: 'مكيف هواء', en: 'Air conditioning' },
    path: 'M12 2v20M4.93 4.93l14.14 14.14M2 12h20M4.93 19.07L19.07 4.93M12 6a2 2 0 0 1 0-4M12 22a2 2 0 0 0 0-4',
  },
  {
    key: 'parking',
    label: { fr: 'Parking', ar: 'موقف سيارات', en: 'Parking' },
    path: 'M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3M9 12H7v8h2v-3h2a3 3 0 0 0 0-6H9v1zm0 3v-2h2a1 1 0 1 1 0 2H9zM22 21v-6a2 2 0 0 0-2-2H14v8h2v-3h2v3h2zm-4-5h2',
  },
  {
    key: 'cuisine_equipee',
    label: { fr: 'Cuisine équipée', ar: 'مطبخ مجهز', en: 'Equipped kitchen' },
    path: 'M3 11l19-9-9 19-2-8-8-2zM12 12l-3.5 3.5',
  },
  {
    key: 'lave_linge',
    label: { fr: 'Lave-linge', ar: 'غسالة', en: 'Washing machine' },
    path: 'M2 3a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3zm10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  },
  {
    key: 'seche_linge',
    label: { fr: 'Sèche-linge', ar: 'مجفف ملابس', en: 'Dryer' },
    path: 'M2 3a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3zm4 2v2m4-2v2M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  },
  {
    key: 'televiseur',
    label: { fr: 'Télévision', ar: 'تلفزيون', en: 'Television' },
    path: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zm7 13h6m-3 0v-2',
  },
  {
    key: 'balcon',
    label: { fr: 'Balcon', ar: 'بلكونة', en: 'Balcony' },
    path: 'M3 9h18M3 15h18M9 9v6m6-6v6M3 9a2 2 0 0 0 2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2',
  },
  {
    key: 'terrasse',
    label: { fr: 'Terrasse', ar: 'تراس', en: 'Terrace' },
    path: 'M2 20h20M4 20V10l8-7 8 7v10M10 20v-6h4v6',
  },
  {
    key: 'vue_mer',
    label: { fr: 'Vue mer', ar: 'إطلالة بحرية', en: 'Sea view' },
    path: 'M2 16c.5-1 1.5-1.5 3-1.5s2.5.5 3 1.5 1.5 1.5 3 1.5 2.5-.5 3-1.5 1.5-1.5 3-1.5M3 20h18M12 4l3 5H9l3-5zm0 0V9',
  },
  {
    key: 'barbecue',
    label: { fr: 'Barbecue', ar: 'شواية', en: 'Barbecue' },
    path: 'M8 22L6 12h12l-2 10H8zM6 12a6 6 0 0 1 12 0M12 2v4m-4 0h8',
  },
  {
    key: 'ascenseur',
    label: { fr: 'Ascenseur', ar: 'مصعد', en: 'Elevator' },
    path: 'M2 4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zm7 4l-3 3 3 3m5-6l3 3-3 3',
  },
  {
    key: 'gardien',
    label: { fr: 'Gardien', ar: 'حارس', en: 'Security guard' },
    path: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  },
  {
    key: 'digicode',
    label: { fr: 'Digicode', ar: 'قفل رقمي', en: 'Keypad lock' },
    path: 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zm4-7v3m4-3v3m4-3v3',
  },
  {
    key: 'fer_a_repasser',
    label: { fr: 'Fer à repasser', ar: 'مكواة', en: 'Iron' },
    path: 'M2 16l4-10h12l2 4H6l-2 6H2zM6 16v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3',
  },
  {
    key: 'machine_cafe',
    label: { fr: 'Machine à café', ar: 'آلة قهوة', en: 'Coffee machine' },
    path: 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zm4 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3',
  },
  {
    key: 'micro_ondes',
    label: { fr: 'Micro-ondes', ar: 'ميكروويف', en: 'Microwave' },
    path: 'M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6zm14 2v8m-10 0h6',
  },
  {
    key: 'lave_vaisselle',
    label: { fr: 'Lave-vaisselle', ar: 'غسالة أطباق', en: 'Dishwasher' },
    path: 'M2 3a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3zm5 8a5 5 0 0 0 10 0',
  },
  {
    key: 'baignoire',
    label: { fr: 'Baignoire', ar: 'حوض استحمام', en: 'Bathtub' },
    path: 'M2 12h20v2a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6v-2zM6 12V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2v1',
  },
  {
    key: 'douche_italienne',
    label: { fr: 'Douche italienne', ar: 'دوش إيطالي', en: 'Walk-in shower' },
    path: 'M9 6a3 3 0 1 0 6 0M12 9v13M5 12h14M5 12v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8',
  },
]

export const EQUIPEMENTS_MAP: Record<string, EquipementDef> = Object.fromEntries(
  EQUIPEMENTS.map((e) => [e.key, e])
)

export const REGLES_OPTIONS = [
  { key: 'non_fumeur', label: { fr: 'Non-fumeur', ar: 'ممنوع التدخين', en: 'No smoking' } },
  { key: 'pas_animaux', label: { fr: 'Pas d\'animaux', ar: 'ممنوع الحيوانات', en: 'No pets' } },
  { key: 'pas_fetes', label: { fr: 'Pas de fêtes', ar: 'ممنوع الحفلات', en: 'No parties' } },
  { key: 'checkin_flexible', label: { fr: 'Check-in flexible', ar: 'تسجيل وصول مرن', en: 'Flexible check-in' } },
]
