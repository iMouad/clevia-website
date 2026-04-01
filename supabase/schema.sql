-- ════════════════════════════════════════
-- Clévia Conciergerie — Schéma Supabase
-- À exécuter dans : Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════

-- ── Table biens ──────────────────────────
create table if not exists biens (
  id          uuid        default gen_random_uuid() primary key,
  nom         text        not null,
  ville       text,
  adresse     text,
  type        text        check (type in ('Appartement','Villa','Studio','Autre')),
  capacite    int,
  prix_nuit   decimal(10,2),
  description text,
  statut      text        default 'actif' check (statut in ('actif','en_attente','inactif')),
  photos      text[],
  airbnb_url  text,
  booking_url text,
  avito_url   text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Migration (si table déjà créée) ──────
-- alter table biens add column if not exists adresse     text;
-- alter table biens add column if not exists airbnb_url  text;
-- alter table biens add column if not exists booking_url text;
-- alter table biens add column if not exists avito_url   text;

-- ── Table reservations ───────────────────
create table if not exists reservations (
  id               uuid        default gen_random_uuid() primary key,
  bien_id          uuid        references biens(id) on delete set null,
  voyageur_nom     text        not null,
  voyageur_email   text,
  voyageur_phone   text,
  date_arrivee     date        not null,
  date_depart      date        not null,
  plateforme       text        check (plateforme in ('Airbnb','Booking','Avito','Direct')),
  montant          decimal(10,2),
  taux_commission  decimal(4,2) default 20.00,
  statut           text        default 'confirmee' check (statut in ('confirmee','annulee','terminee')),
  notes            text,
  created_at       timestamptz default now()
);

-- ── Table contacts ───────────────────────
create table if not exists contacts (
  id          uuid        default gen_random_uuid() primary key,
  nom         text,
  email       text,
  telephone   text,
  ville_bien  text,
  type_bien   text,
  message     text,
  traite      boolean     default false,
  created_at  timestamptz default now()
);

-- ── Table settings ───────────────────────
create table if not exists settings (
  key        text primary key,
  value_fr   text,
  value_ar   text,
  value_en   text,
  updated_at timestamptz default now()
);

-- ── Settings par défaut ──────────────────
insert into settings (key, value_fr, value_ar, value_en) values
  ('slogan',     'Votre bien, notre priorité',
                 'بيتك في أيدٍ أمينة',
                 'Your home, handled.'),
  ('sous_titre', 'Nous gérons vos locations courte durée sur Airbnb, Booking et Avito.',
                 'نحن ندير إيجاراتك القصيرة المدة على Airbnb و Booking و Avito.',
                 'We manage your short-term rentals on Airbnb, Booking and Avito.'),
  ('zone',       'Mansouria · Mohammedia · Région de Casablanca',
                 'منصورية · المحمدية · منطقة الدار البيضاء',
                 'Mansouria · Mohammedia · Casablanca Region'),
  ('email',      'contact@clevia.ma',    'contact@clevia.ma',    'contact@clevia.ma'),
  ('telephone',  '+212 6XX XXX XXX',     '+212 6XX XXX XXX',     '+212 6XX XXX XXX'),
  ('horaires',   'Lun–Sam, 9h–19h',      'الإثنين–السبت، 9ص–7م', 'Mon–Sat, 9am–7pm'),
  ('instagram',  '@clevia.ma',           '@clevia.ma',           '@clevia.ma'),
  ('facebook',   'facebook.com/clevia.ma','facebook.com/clevia.ma','facebook.com/clevia.ma')
on conflict (key) do nothing;

-- ── Row Level Security ───────────────────
alter table biens        enable row level security;
alter table reservations enable row level security;
alter table contacts     enable row level security;
alter table settings     enable row level security;

-- Lecture publique (biens actifs + settings)
create policy "biens actifs publics"
  on biens for select using (statut = 'actif');

create policy "settings publics"
  on settings for select using (true);

create policy "contacts insert public"
  on contacts for insert with check (true);

-- Accès complet pour admin authentifié
create policy "admin biens"
  on biens for all using (auth.role() = 'authenticated');

create policy "admin reservations"
  on reservations for all using (auth.role() = 'authenticated');

create policy "admin contacts select"
  on contacts for select using (auth.role() = 'authenticated');

create policy "admin contacts update"
  on contacts for update using (auth.role() = 'authenticated');

create policy "admin settings"
  on settings for all using (auth.role() = 'authenticated');

-- ── Table temoignages ───────────────────────
create table if not exists temoignages (
  id          uuid        default gen_random_uuid() primary key,
  nom         text        not null,
  ville       text,
  type_bien   text,
  note        int         default 5 check (note between 1 and 5),
  message     text        not null,
  photo_url   text,
  actif       boolean     default true,
  ordre       int         default 0,
  created_at  timestamptz default now()
);

alter table temoignages enable row level security;

create policy "temoignages publics"
  on temoignages for select using (actif = true);

create policy "admin temoignages"
  on temoignages for all using (auth.role() = 'authenticated');

-- ── Storage bucket (à créer manuellement) ─
-- Supabase Dashboard → Storage → New bucket
-- Nom : "biens-photos"
-- Public : true
