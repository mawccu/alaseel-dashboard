import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { isoDate } from "./helpers.js";

/*
  طبقة البيانات.

  التطبيق يسلّم المجموعة كاملة ونحن نطابقها مع Postgres: نضيف/نعدّل الموجود
  ونحذف ما أُزيل. مع نسخة محلية احتياطية تعمل بدون إنترنت.

  ثلاث قواعد تحمي البيانات، لا تُخالف:
  1) القراءة الفاشلة لا تُخلط أبداً مع القراءة الفارغة. loadData ترجع { ok, data }،
     وإذا كانت ok=false يدخل التطبيق وضع القراءة فقط ولا يكتب شيئاً.
  2) زرع البيانات التجريبية يحدث مرة واحدة فقط لكل قاعدة بيانات (علامة في app_meta)،
     ويكتب بالإضافة فقط بدون أي حذف.
  3) كل قراءة مُصفّحة: حد Supabase الافتراضي 1000 صف، ومقارنة غير مُصفّحة كانت
     ستحذف صفوفاً حيّة.
*/

const LOCAL_KEY = "alaseel-distributor-v1";
const SEED_FLAG = "alaseel-seeded-v1";
const EMPTY = { pharmacies: [], transactions: [], reviews: [] };

const PAGE = 1000;          // حد Supabase الافتراضي للصفحة
const UPSERT_CHUNK = 500;   // حجم دفعة الكتابة
const FILTER_CHUNK = 100;   // .in() يُبنى في الرابط، فلا نُطيله

const configured =
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(SUPABASE_URL || "") && Boolean(SUPABASE_ANON_KEY);

export const supabase = configured
  ? createClient(SUPABASE_URL.replace(/\/$/, ""), SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  : null;

let cloudLive = configured;
let readOk = true;
export const isCloud = () => cloudLive;
export const backendLabel = () => {
  if (!configured) return "💾 تخزين محلي";
  if (!readOk) return "⚠️ تعذّر الاتصال — عرض فقط";
  return cloudLive ? "☁️ متصل بقاعدة البيانات" : "⚠️ تعذّر الحفظ";
};

/* ---------- تحويل الصفوف ---------- */
const nn = (v) => (v === "" || v === undefined ? null : v);
const today = () => isoDate(new Date());

const pharmToRow = (p) => ({
  id: p.id,
  name: p.name || "",
  governorate: nn(p.governorate),
  city: nn(p.city),
  area: nn(p.area),
  code: nn(p.code),
  category: nn(p.category),
  owner: nn(p.owner),
  mobile: nn(p.mobile),
  rep: nn(p.rep),
  open_date: nn(p.openDate), // العمود يقبل NULL
  notes: nn(p.notes),
});
const rowToPharm = (r) => ({
  id: r.id,
  name: r.name || "",
  governorate: r.governorate || "",
  city: r.city || "",
  area: r.area || "",
  code: r.code || "",
  category: r.category || "",
  owner: r.owner || "",
  mobile: r.mobile || "",
  rep: r.rep || "",
  openDate: r.open_date || "",
  notes: r.notes || "",
});

const txToRow = (t) => ({
  id: t.id,
  // العمود date NOT NULL: حقل تاريخ مُفرَّغ كان يرسل "" ويُعطّل كل حفظ لاحق.
  date: t.date || today(),
  invoice_no: nn(t.invoiceNo),
  pharmacy_id: nn(t.pharmacyId),
  product: nn(t.product),
  qty: Math.round(Number(t.qty) || 0), // العمود integer
  value: Number(t.value) || 0,
});
const rowToTx = (r) => ({
  id: r.id,
  date: r.date,
  invoiceNo: r.invoice_no || "",
  pharmacyId: r.pharmacy_id || "",
  product: r.product || "",
  qty: Number(r.qty) || 0,
  value: Number(r.value) || 0,
});

const reviewToRow = (r) => ({
  id: r.id,
  month: r.month || today().slice(0, 7), // NOT NULL + فهرس فريد
  achievements: nn(r.achievements),
  challenges: nn(r.challenges),
  competitors: nn(r.competitors),
  opportunities: nn(r.opportunities),
  actions: nn(r.actions),
});
const rowToReview = (r) => ({
  id: r.id,
  month: r.month,
  achievements: r.achievements || "",
  challenges: r.challenges || "",
  competitors: r.competitors || "",
  opportunities: r.opportunities || "",
  actions: r.actions || "",
});

/* ---------- نسخة محلية ---------- */
function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const p = raw ? JSON.parse(raw) : null;
    return p && typeof p === "object" ? { ...EMPTY, ...p } : null;
  } catch {
    return null;
  }
}
function writeLocal(data) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch {
    /* ممتلئ أو محظور */
  }
}

/* ---------- قراءة مُصفّحة ---------- */
// بدون ORDER BY يطبّق PostgREST الإزاحة على مسح غير مرتّب، فتتكرر صفوف وتسقط أخرى.
async function selectAll(table, columns, key = "id") {
  const out = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(key, { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export async function loadData() {
  if (!supabase) {
    readOk = true;
    return { ok: true, data: readLocal() || { ...EMPTY } };
  }
  try {
    const [ph, tx, rv] = await Promise.all([
      selectAll("pharmacies", "*"),
      selectAll("transactions", "*"),
      selectAll("reviews", "*", "month"),
    ]);
    cloudLive = true;
    readOk = true;
    const data = {
      pharmacies: ph.map(rowToPharm),
      transactions: tx.map(rowToTx),
      reviews: rv.map(rowToReview),
    };
    writeLocal(data);
    return { ok: true, data };
  } catch (e) {
    // فشل القراءة لا يعني قاعدة فارغة. لا نكتب شيئاً بعد هذا.
    cloudLive = false;
    readOk = false;
    console.error("[store] تعذّرت القراءة من Supabase:", e.message || e);
    return { ok: false, data: readLocal() || { ...EMPTY } };
  }
}

/* ---------- علامة التهيئة ---------- */
// الزرع يجب أن يحدث مرة واحدة لكل قاعدة بيانات، لا مرة لكل متصفّح.
export async function isInitialised(loaded) {
  const hasRows = Boolean(
    loaded && (loaded.pharmacies.length || loaded.transactions.length || loaded.reviews.length)
  );
  if (!supabase) {
    try {
      if (localStorage.getItem(SEED_FLAG) === "1") return true;
    } catch { /* تجاهل */ }
    return hasRows;
  }
  try {
    // قائمة وليس maybeSingle: الصيغة المفردة ترد 406/PGRST116 عند صفر صفوف،
    // فيُقرأ "لا توجد علامة" خطأً على أنه فشل اتصال.
    const { data, error } = await supabase.from("app_meta").select("value").eq("key", "seeded").limit(1);
    if (error) throw error;
    if (data && data.length) return true;
    if (hasRows) {
      // قاعدة قائمة قبل إضافة الجدول: علّمها ولا تزرع فوقها أبداً.
      await markInitialised();
      return true;
    }
    return false;
  } catch (e) {
    // لا نزرع فوق قاعدة لم نستطع فحصها.
    console.error("[store] تعذّرت قراءة علامة التهيئة:", e.message || e);
    return true;
  }
}

export async function markInitialised() {
  try {
    localStorage.setItem(SEED_FLAG, "1");
  } catch { /* تجاهل */ }
  if (!supabase) return;
  const { error } = await supabase
    .from("app_meta")
    .upsert({ key: "seeded", value: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}

/* ---------- كتابة ---------- */
async function syncTable(table, rows, toRow, { mirror = true, key = "id" } = {}) {
  // إزالة التكرار على مفتاح التعارض: وإلا رفض Postgres الدفعة كاملة.
  const seen = new Map();
  rows.map(toRow).forEach((r) => seen.set(r[key], r));
  const desired = [...seen.values()];

  for (let i = 0; i < desired.length; i += UPSERT_CHUNK) {
    const { error } = await supabase
      .from(table)
      .upsert(desired.slice(i, i + UPSERT_CHUNK), { onConflict: key });
    if (error) throw error;
  }

  if (!mirror) return; // الزرع يضيف فقط

  const existing = await selectAll(table, key, key);
  const keep = new Set(desired.map((r) => r[key]));
  const drop = existing.map((r) => r[key]).filter((v) => !keep.has(v));
  for (let i = 0; i < drop.length; i += FILTER_CHUNK) {
    const { error } = await supabase.from(table).delete().in(key, drop.slice(i, i + FILTER_CHUNK));
    if (error) throw error;
  }
}

export async function saveData(next, { mirror = true } = {}) {
  const data = {
    pharmacies: next.pharmacies || [],
    transactions: next.transactions || [],
    reviews: next.reviews || [],
  };
  writeLocal(data);
  if (!supabase) return;
  if (!readOk) throw new Error("لم تنجح آخر قراءة من قاعدة البيانات، فالكتابة موقوفة لحماية البيانات");

  // الصيدليات أولاً: المبيعات تشير إليها بمفتاح خارجي، فلا يجوز إدراج
  // فاتورة قبل صيدليتها. وعند الحذف يتكفل cascade بفواتيرها.
  await syncTable("pharmacies", data.pharmacies, pharmToRow, { mirror });
  await syncTable("transactions", data.transactions, txToRow, { mirror });
  // المراجعات: المفتاح التجاري هو الشهر، والفهرس الفريد عليه.
  await syncTable("reviews", data.reviews, reviewToRow, { mirror, key: "month" });
  cloudLive = true;
}
