// Supabase connection — project "alaseel-distributor" (Central EU / Frankfurt).
// The publishable key is a BROWSER key and is safe to commit; what a holder of it
// can actually do is decided by the RLS policies in supabase/schema.sql.
// Leave both blank to run the app on localStorage only.
export const SUPABASE_URL = "https://fzzivhfqbsoaiamxumef.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_NFvrfGzH5Y2A2ADERCgGIg_h3GkrKoE";

// النظام للإداريين فقط: لا تسجيل ذاتي. الحسابات تُنشأ إدارياً.
// هذا يُخفي الزر فقط، والمنع الحقيقي مُفعَّل على الخادم أيضاً
// (disable_signup) لأن إخفاء الزر لا يمنع نداء /auth/v1/signup مباشرة.
export const ALLOW_SIGNUP = false;
