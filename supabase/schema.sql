-- ALASEEL Cosmetics × Masrouji Group
-- نظام إدارة الأداء — قنوات التوزيع في الأردن
-- شغّل هذا الملف مرة واحدة في Supabase → SQL Editor.
-- آمن لإعادة التشغيل (idempotent).

-- ============ الجداول ============

create table if not exists public.pharmacies (
  id           text primary key,
  name         text not null,
  governorate  text,
  city         text,
  area         text,
  code         text,
  category     text,
  owner        text,
  mobile       text,
  rep          text,
  open_date    date,
  notes        text,
  created_at   timestamptz not null default now()
);

create table if not exists public.transactions (
  id           text primary key,
  date         date not null,
  invoice_no   text,
  pharmacy_id  text references public.pharmacies(id) on delete cascade,
  product      text,
  qty          integer not null default 0,
  value        numeric(12,2) not null default 0,
  created_at   timestamptz not null default now()
);

-- علامات النظام. وجود المفتاح seeded يعني أن هذه القاعدة هُيّئت من قبل،
-- فلا يزرع التطبيق البيانات التجريبية فوق بيانات حقيقية مهما بدت الجداول فارغة.
create table if not exists public.app_meta (
  key    text primary key,
  value  text
);

create table if not exists public.reviews (
  id             text primary key,
  month          text not null,
  achievements   text,
  challenges     text,
  competitors    text,
  opportunities  text,
  actions        text,
  created_at     timestamptz not null default now()
);

-- شهر واحد = مراجعة واحدة
create unique index if not exists reviews_month_key on public.reviews (month);

-- فهارس للاستعلامات الشائعة
create index if not exists transactions_pharmacy_idx on public.transactions (pharmacy_id);
create index if not exists transactions_date_idx     on public.transactions (date desc);
create index if not exists pharmacies_gov_idx        on public.pharmacies (governorate);
create index if not exists pharmacies_rep_idx        on public.pharmacies (rep);

-- ============ الحماية (RLS) ============
-- النظام داخلي ويُستخدم بمفتاح المتصفح العام بدون تسجيل دخول،
-- لذلك الوصول مفتوح للمفتاح العام (anon). لا تضع في هذه القاعدة
-- أي بيانات لا تريد أن يراها من يملك رابط التطبيق.

alter table public.pharmacies   enable row level security;
alter table public.transactions enable row level security;
alter table public.reviews      enable row level security;
alter table public.app_meta     enable row level security;

drop policy if exists "open access" on public.pharmacies;
drop policy if exists "open access" on public.transactions;
drop policy if exists "open access" on public.reviews;
drop policy if exists "open access" on public.app_meta;

create policy "open access" on public.pharmacies
  for all to anon, authenticated using (true) with check (true);

create policy "open access" on public.transactions
  for all to anon, authenticated using (true) with check (true);

create policy "open access" on public.reviews
  for all to anon, authenticated using (true) with check (true);

create policy "open access" on public.app_meta
  for all to anon, authenticated using (true) with check (true);

-- ============ تحقق ============
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('pharmacies','transactions','reviews','app_meta')
order by tablename;
