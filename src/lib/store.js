import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

/*
  طبقة البيانات.

  الواجهة التي يستعملها التطبيق هي نفسها التي كانت في النسخة الأصلية:
  نقرأ الكائن كاملاً ونحفظه كاملاً. الفرق أن الحفظ هنا يتم على Supabase
  بمطابقة الصفوف (إضافة/تعديل/حذف) بدل استبدال ملف واحد، مع نسخة محلية
  احتياطية تعمل بدون إنترنت.
*/

const LOCAL_KEY = "alaseel-distributor-v1";
const EMPTY = { pharmacies: [], transactions: [], reviews: [] };

const configured =
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(SUPABASE_URL || "") && Boolean(SUPABASE_ANON_KEY);

export const supabase = configured
  ? createClient(SUPABASE_URL.replace(/\/$/, ""), SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  : null;

let cloudLive = configured;
export const isCloud = () => cloudLive;
export const backendLabel = () =>
  cloudLive ? "☁️ متصل بقاعدة البيانات" : configured ? "⚠️ تعذّر الاتصال — تخزين محلي" : "💾 تخزين محلي";

/* ---------- تحويل الصفوف ---------- */
const nn = (v) => (v === "" || v === undefined ? null : v);

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
  open_date: nn(p.openDate),
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
  date: t.date,
  invoice_no: nn(t.invoiceNo),
  pharmacy_id: nn(t.pharmacyId),
  product: nn(t.product),
  qty: Number(t.qty) || 0,
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
  month: r.month,
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
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeLocal(data) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  } catch {
    /* ممتلئ أو محظور — لا يؤثر على الحفظ السحابي */
  }
}

/* ---------- قراءة ---------- */
export async function loadData() {
  if (supabase) {
    try {
      const [ph, tx, rv] = await Promise.all([
        supabase.from("pharmacies").select("*"),
        supabase.from("transactions").select("*"),
        supabase.from("reviews").select("*"),
      ]);
      const err = ph.error || tx.error || rv.error;
      if (err) throw err;
      cloudLive = true;
      const data = {
        pharmacies: (ph.data || []).map(rowToPharm),
        transactions: (tx.data || []).map(rowToTx),
        reviews: (rv.data || []).map(rowToReview),
      };
      writeLocal(data);
      return data;
    } catch (e) {
      cloudLive = false;
      console.error("[store] تعذّر القراءة من Supabase، سيتم استخدام النسخة المحلية:", e.message || e);
    }
  }
  return readLocal() || { ...EMPTY };
}

/* ---------- كتابة ---------- */
async function syncTable(table, rows, toRow) {
  const desired = rows.map(toRow);
  if (desired.length) {
    const { error } = await supabase.from(table).upsert(desired, { onConflict: "id" });
    if (error) throw error;
  }
  // احذف ما لم يعد موجوداً
  const { data: existing, error: selErr } = await supabase.from(table).select("id");
  if (selErr) throw selErr;
  const keep = new Set(desired.map((r) => r.id));
  const drop = (existing || []).map((r) => r.id).filter((id) => !keep.has(id));
  if (drop.length) {
    const { error } = await supabase.from(table).delete().in("id", drop);
    if (error) throw error;
  }
}

export async function saveData(next) {
  const data = {
    pharmacies: next.pharmacies || [],
    transactions: next.transactions || [],
    reviews: next.reviews || [],
  };
  writeLocal(data);
  if (!supabase) return;

  // الصيدليات أولاً: المبيعات تشير إليها بمفتاح خارجي.
  await syncTable("pharmacies", data.pharmacies, pharmToRow);
  await syncTable("transactions", data.transactions, txToRow);
  await syncTable("reviews", data.reviews, reviewToRow);
  cloudLive = true;
}
