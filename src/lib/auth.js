import { supabase } from "./store.js";
import { ALLOW_SIGNUP } from "./config.js";

/*
  المصادقة.

  قبل هذا كان الوصول مفتوحاً للمفتاح العام: أي شخص يملك رابط التطبيق يقرأ
  ويكتب. المفتاح يُشحن داخل ملف الجافاسكربت في صفحة عامة، فإخفاء المستودع
  لا يخفيه. ما يحمي البيانات فعلاً هو سياسات RLS التي تشترط جلسة مسجَّلة،
  وهذا الملف هو الذي ينشئ تلك الجلسة.

  لا يوجد تسجيل ذاتي داخل التطبيق عمداً: الرابط عام، ولو فُتح التسجيل
  لاستطاع أي زائر إنشاء حساب وقراءة كل شيء، وهو ما نحاول منعه أصلاً.
  الحسابات تُنشأ من لوحة Supabase: Authentication ← Users ← Add user.
*/

export const authReady = Boolean(supabase);
export const signupAllowed = ALLOW_SIGNUP;

export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("[auth] تعذّرت قراءة الجلسة:", error.message);
    return null;
  }
  return data.session;
}

export function onAuthChange(cb) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

/* رسائل Supabase إنجليزية وتقنية، فنترجم الشائع منها. */
function arabicError(message = "") {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "هذا البريد مسجَّل من قبل. سجّل الدخول به أو استعد كلمة المرور";
  if (m.includes("password should be") || m.includes("at least"))
    return "كلمة المرور قصيرة. استعمل ٦ أحرف على الأقل";
  if (m.includes("signups not allowed") || m.includes("signup is disabled"))
    return "إنشاء الحسابات مغلق في هذا النظام";
  if (m.includes("email not confirmed")) return "لم يُفعَّل هذا البريد بعد. أكّد الرسالة المُرسلة إليه أو فعّله من لوحة Supabase";
  // حدّ Supabase المجاني على إرسال البريد ضيّق (رسائل قليلة في الساعة).
  // الرسالة العامة "حاول لاحقاً" كانت تُخفي أن العائق هو إرسال البريد لا الدخول.
  if (m.includes("email rate limit") || m.includes("over_email_send_rate_limit"))
    return "بلغ إرسال رسائل التأكيد حدّه لهذه الساعة. عطّل تأكيد البريد من لوحة Supabase ليعمل الإنشاء فوراً، أو انتظر ساعة.";
  if (m.includes("too many requests") || m.includes("rate limit"))
    return "محاولات كثيرة متتالية. انتظر قليلاً ثم أعد المحاولة";
  if (m.includes("invalid") && m.includes("email"))
    return "صيغة البريد الإلكتروني غير صحيحة";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "تعذّر الوصول إلى الخادم. تحقّق من الاتصال بالإنترنت";
  return message || "تعذّر تسجيل الدخول";
}

export async function signIn(email, password) {
  if (!supabase) return { error: "قاعدة البيانات غير مهيأة" };
  const { data, error } = await supabase.auth.signInWithPassword({
    email: (email || "").trim(),
    password: password || "",
  });
  if (error) return { error: arabicError(error.message) };
  return { session: data.session };
}

export async function signUp(email, password) {
  if (!supabase) return { error: "قاعدة البيانات غير مهيأة" };
  const { data, error } = await supabase.auth.signUp({
    email: (email || "").trim(),
    password: password || "",
    options: { emailRedirectTo: window.location.origin + window.location.pathname },
  });
  if (error) return { error: arabicError(error.message) };
  // مع تفعيل تأكيد البريد لا تُفتح جلسة فوراً، بل تُرسل رسالة تأكيد.
  return { needsConfirm: !data.session, session: data.session };
}

export async function signOut() {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error("[auth] تعذّر تسجيل الخروج:", e.message || e);
  }
  // النسخة المحلية مرآة لبيانات القاعدة، فلا تُترك على جهاز مشترك بعد الخروج.
  try {
    localStorage.removeItem("alaseel-distributor-v1");
  } catch {
    /* تجاهل */
  }
}

export async function sendReset(email) {
  if (!supabase) return { error: "قاعدة البيانات غير مهيأة" };
  const { error } = await supabase.auth.resetPasswordForEmail((email || "").trim(), {
    redirectTo: window.location.origin + window.location.pathname,
  });
  if (error) return { error: arabicError(error.message) };
  return { ok: true };
}
