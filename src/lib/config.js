// Supabase connection — project "alaseel-distributor" (Central EU / Frankfurt).
// The publishable key is a BROWSER key and is safe to commit; what a holder of it
// can actually do is decided by the RLS policies in supabase/schema.sql.
// Leave both blank to run the app on localStorage only.
export const SUPABASE_URL = "https://fzzivhfqbsoaiamxumef.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_NFvrfGzH5Y2A2ADERCgGIg_h3GkrKoE";

// مؤقت: يسمح بإنشاء حساب من داخل التطبيق حتى يوجد أول حساب.
// أعِده إلى false بعد إنشاء الحسابات، فالرابط عام والتسجيل المفتوح
// يتيح لأي زائر إنشاء حساب.
export const ALLOW_SIGNUP = true;
