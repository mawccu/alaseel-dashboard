-- ALASEEL × Masrouji — إغلاق الوصول المجهول
--
-- شغّل هذا الملف في Supabase → SQL Editor **بعد** إنشاء حساب واحد على الأقل
-- وتأكيد نجاح تسجيل الدخول من التطبيق. تشغيله قبل ذلك يقفل النظام على الجميع.
--
-- ما كان قبله: السياسات مفتوحة للدور anon، أي أن مفتاح المتصفح وحده يكفي
-- للقراءة والكتابة. والمفتاح يُشحن داخل ملف الجافاسكربت في صفحة عامة، فلا
-- يخفيه جعل المستودع خاصاً. بعد هذا الملف: لا شيء بدون جلسة مسجَّلة.

alter table public.pharmacies   enable row level security;
alter table public.transactions enable row level security;
alter table public.reviews      enable row level security;
alter table public.app_meta     enable row level security;

drop policy if exists "open access" on public.pharmacies;
drop policy if exists "open access" on public.transactions;
drop policy if exists "open access" on public.reviews;
drop policy if exists "open access" on public.app_meta;

drop policy if exists "authenticated access" on public.pharmacies;
drop policy if exists "authenticated access" on public.transactions;
drop policy if exists "authenticated access" on public.reviews;
drop policy if exists "authenticated access" on public.app_meta;

create policy "authenticated access" on public.pharmacies
  for all to authenticated using (true) with check (true);

create policy "authenticated access" on public.transactions
  for all to authenticated using (true) with check (true);

create policy "authenticated access" on public.reviews
  for all to authenticated using (true) with check (true);

create policy "authenticated access" on public.app_meta
  for all to authenticated using (true) with check (true);

-- تحقّق: يجب ألا يبقى أي دور anon في العمود الأخير.
select tablename, policyname, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('pharmacies','transactions','reviews','app_meta')
order by tablename;

-- للتراجع: أعد تشغيل schema.sql، فهو يعيد سياسات "open access".
