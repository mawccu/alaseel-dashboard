import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { C, GOVS, CATEGORIES, PRODUCTS, REPS, MONTHS_AR, STATUS_META } from "./lib/constants.js";
import { fmtNum, fmtJD, fmtPct, daysAgo, isoDate, dateOffset, statusOf } from "./lib/helpers.js";
import { seedData } from "./lib/seed.js";
import { ALASEEL_LOGO } from "./lib/logo.js";
import { authReady, getSession, onAuthChange, signOut } from "./lib/auth.js";
import Login from "./components/Login.jsx";
import { loadData, saveData, backendLabel, isInitialised, markInitialised } from "./lib/store.js";
import { Card, KPI, SectionTitle, Btn, Input, Select, StatusBadge } from "./components/ui.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Pharmacies from "./components/Pharmacies.jsx";
import Sales from "./components/Sales.jsx";
import Geo from "./components/Geo.jsx";
import Customers from "./components/Customers.jsx";
import Products from "./components/Products.jsx";
import Review from "./components/Review.jsx";

export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [filters, setFilters] = useState({ year: "all", month: "all", gov: "all", rep: "all", product: "all", status: "all" });
  const [saveState, setSaveState] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  // undefined = لم نتحقّق بعد، null = غير مسجّل، كائن = جلسة قائمة
  const [session, setSession] = useState(authReady ? undefined : null);

  /* تحميل البيانات.
     قراءة فاشلة لا تعني قاعدة فارغة: في تلك الحالة نعرض آخر نسخة محلية
     ونمنع الكتابة، وإلا لمسحت المطابقة كل صف حيّ في القاعدة. */
  const refresh = useCallback(async () => {
    const { ok, data: loaded } = await loadData();
    setReadOnly(!ok);
    setData(loaded);
    if (!ok) return;
    if (await isInitialised(loaded)) return;
    // قاعدة جديدة فعلاً: ازرع البيانات التجريبية مرة واحدة، إضافةً بلا حذف.
    const fresh = seedData();
    setData(fresh);
    try {
      await saveData(fresh, { mirror: false });
      await markInitialised();
    } catch (e) {
      console.error("seed save failed", e);
    }
  }, []);

  /* الجلسة */
  useEffect(() => {
    if (!authReady) return;
    let alive = true;
    getSession().then((s) => { if (alive) setSession(s); });
    const off = onAuthChange((s) => setSession(s));
    return () => { alive = false; off(); };
  }, []);

  // البيانات تُحمّل بعد ثبوت الجلسة فقط: بدونها ترفض القاعدة القراءة.
  const signedIn = !authReady || Boolean(session);
  useEffect(() => { if (signedIn) refresh(); }, [signedIn, refresh]);

  /* حفظ البيانات */
  const persist = useCallback(async (next) => {
    setData(next);
    if (readOnly) {
      setSaveState("عرض فقط — لم يُحفظ");
      setTimeout(() => setSaveState(""), 3500);
      return;
    }
    setSaveState("جارٍ الحفظ…");
    try {
      await saveData(next);
      setSaveState("تم الحفظ ✓");
    } catch (e) {
      console.error("save failed", e);
      setSaveState("تعذّر الحفظ");
    }
    setTimeout(() => setSaveState(""), 2500);
  }, [readOnly]);

  /* ===== الإحصاءات المشتقة ===== */
  const stats = useMemo(() => {
    if (!data) return null;
    const { pharmacies, transactions } = data;

    // فلترة المعاملات
    // حالة كل صيدلية تُحتسب من كامل تاريخها لا من الجزء المفلتر.
    const lastById = {};
    transactions.forEach((t) => {
      if (!lastById[t.pharmacyId] || t.date > lastById[t.pharmacyId]) lastById[t.pharmacyId] = t.date;
    });
    const statusById = {};
    pharmacies.forEach((p) => { statusById[p.id] = statusOf(lastById[p.id] || null); });

    let txs = transactions.filter((t) => {
      const d = new Date(t.date);
      if (filters.year !== "all" && d.getFullYear() !== +filters.year) return false;
      if (filters.month !== "all" && d.getMonth() !== +filters.month) return false;
      if (filters.product !== "all" && t.product !== filters.product) return false;
      const p = pharmacies.find((x) => x.id === t.pharmacyId);
      if (!p) return false;
      if (filters.gov !== "all" && p.governorate !== filters.gov) return false;
      if (filters.rep !== "all" && p.rep !== filters.rep) return false;
      // مرشّح الحالة كان يُطبَّق على جدول الصيدليات فقط، فتبقى المؤشرات والرسوم
      // على كامل المبيعات بينما يظهر الجدول مفلتراً. الآن يعمل كأخويه.
      if (filters.status !== "all" && statusById[p.id] !== filters.status) return false;
      return true;
    });

    // إحصاءات لكل صيدلية (من كامل المعاملات لتحديد الحالة، ومن المفلترة للمبيعات)
    const perPharm = pharmacies.map((p) => {
      const all = transactions.filter((t) => t.pharmacyId === p.id).sort((a, b) => a.date.localeCompare(b.date));
      const filtered = txs.filter((t) => t.pharmacyId === p.id);
      const last = all.length ? all[all.length - 1].date : null;
      const first = all.length ? all[0].date : null;
      const ytd = all.filter((t) => new Date(t.date).getFullYear() === new Date().getFullYear())
        .reduce((s, t) => s + t.value, 0);
      let avgGap = 0;
      if (all.length > 1) {
        let sum = 0;
        for (let i = 1; i < all.length; i++) sum += daysAgo(all[i - 1].date) - daysAgo(all[i].date);
        avgGap = Math.round(sum / (all.length - 1));
      }
      const totalSales = filtered.reduce((s, t) => s + t.value, 0);
      const status = statusOf(last);
      return {
        ...p, firstOrder: first, lastOrder: last, ytd, orders: all.length,
        filteredSales: totalSales, filteredOrders: filtered.length,
        avgInvoice: all.length ? Math.round(all.reduce((s, t) => s + t.value, 0) / all.length) : 0,
        avgGap, status,
        lifetime: all.reduce((s, t) => s + t.value, 0),
        isNew: p.openDate && daysAgo(p.openDate) <= 90,
      };
    }).filter((p) => {
      if (filters.gov !== "all" && p.governorate !== filters.gov) return false;
      if (filters.rep !== "all" && p.rep !== filters.rep) return false;
      if (filters.status !== "all" && p.status !== filters.status) return false;
      return true;
    });

    const totalSales = txs.reduce((s, t) => s + t.value, 0);
    const orders = txs.length;

    // نمو شهري: مقارنة آخر شهرين في البيانات
    const byMonth = {};
    transactions.forEach((t) => {
      const k = t.date.slice(0, 7);
      byMonth[k] = (byMonth[k] || 0) + t.value;
    });
    const monthKeys = Object.keys(byMonth).sort();
    const monthlyTrend = monthKeys.slice(-12).map((k) => {
      const [y, m] = k.split("-");
      return { name: MONTHS_AR[+m - 1] + " " + y.slice(2), المبيعات: byMonth[k] };
    });
    let growth = 0;
    if (monthKeys.length >= 2) {
      const a = byMonth[monthKeys[monthKeys.length - 2]], b = byMonth[monthKeys[monthKeys.length - 1]];
      growth = a ? ((b - a) / a) * 100 : 0;
    }

    const byGov = {};
    txs.forEach((t) => {
      const p = pharmacies.find((x) => x.id === t.pharmacyId);
      if (p) byGov[p.governorate] = (byGov[p.governorate] || 0) + t.value;
    });
    const govData = Object.entries(byGov).map(([name, v]) => ({ name, المبيعات: v })).sort((a, b) => b.المبيعات - a.المبيعات);

    const byProduct = {};
    const productPharms = {};
    txs.forEach((t) => {
      byProduct[t.product] = (byProduct[t.product] || 0) + t.value;
      (productPharms[t.product] = productPharms[t.product] || new Set()).add(t.pharmacyId);
    });
    const productData = Object.entries(byProduct).map(([name, v]) => ({
      name, المبيعات: v, صيدليات: productPharms[name]?.size || 0
    })).sort((a, b) => b.المبيعات - a.المبيعات);

    const custRank = [...perPharm].sort((a, b) => b.filteredSales - a.filteredSales);

    const counts = {
      active: perPharm.filter((p) => p.status === "active").length,
      risk: perPharm.filter((p) => p.status === "risk").length,
      lost: perPharm.filter((p) => p.status === "lost").length,
      newAcc: perPharm.filter((p) => p.isNew).length,
    };

    // متوسط الأيام بين الطلبات على مستوى الشبكة
    const gaps = perPharm.filter((p) => p.avgGap > 0).map((p) => p.avgGap);
    const netAvgGap = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0;

    // عملاء أعيد تنشيطهم: طلب خلال 90 يوم بعد فجوة > 120 يوم
    const reactivated = pharmacies.filter((p) => {
      const all = transactions.filter((t) => t.pharmacyId === p.id).sort((a, b) => a.date.localeCompare(b.date));
      if (all.length < 2) return false;
      const last = all[all.length - 1], prev = all[all.length - 2];
      return daysAgo(last.date) <= 90 && (daysAgo(prev.date) - daysAgo(last.date)) > 120;
    });

    return {
      txs, perPharm, totalSales, orders, growth, monthlyTrend, govData, productData,
      custRank, counts, netAvgGap, reactivated,
      avgInvoice: orders ? Math.round(totalSales / orders) : 0,
      coverage: new Set(perPharm.filter((p) => p.status === "active").map((p) => p.governorate)).size,
    };
  }, [data, filters]);

  /* ===== التصدير ===== */
  const exportCSV = (rows, filename) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = "\uFEFF" + [keys.join(","), ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename + ".csv"; a.click();
  };
  const exportExcel = () => {
    if (!stats) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stats.perPharm.map((p) => ({
      "الصيدلية": p.name, "الكود": p.code, "المحافظة": p.governorate, "المنطقة": p.area,
      "الفئة": p.category, "المندوب": p.rep, "آخر طلب": p.lastOrder || "-",
      "المبيعات YTD": p.ytd, "عدد الطلبات": p.orders, "متوسط الفاتورة": p.avgInvoice,
      "متوسط الأيام بين الطلبات": p.avgGap, "الحالة": STATUS_META[p.status].label,
    }))), "الصيدليات");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.transactions.map((t) => ({
      "التاريخ": t.date, "رقم الفاتورة": t.invoiceNo,
      "الصيدلية": data.pharmacies.find((p) => p.id === t.pharmacyId)?.name || "",
      "المنتج": t.product, "الكمية": t.qty, "القيمة": t.value,
    }))), "المبيعات");
    XLSX.writeFile(wb, "ALASEEL-x-MASROUJI-Performance.xlsx");
  };
  const exportPharmCSV = () => exportCSV(stats.perPharm.map((p) => ({
    name: p.name, code: p.code, governorate: p.governorate, area: p.area, rep: p.rep,
    lastOrder: p.lastOrder, ytd: p.ytd, orders: p.orders, avgInvoice: p.avgInvoice,
    status: STATUS_META[p.status].label,
  })), "pharmacies");

  if (authReady && session === undefined) return (
    <div style={{ fontFamily: "Tajawal, sans-serif", direction: "rtl", minHeight: "100vh", display: "grid", placeItems: "center", background: C.bg, color: C.grayMid }}>
      جارٍ التحقق…
    </div>
  );

  if (authReady && !session) return <Login />;

  if (!data || !stats) return (
    <div style={{ fontFamily: "Tajawal, sans-serif", direction: "rtl", minHeight: "100vh", display: "grid", placeItems: "center", background: C.bg, color: C.grayMid }}>
      جارٍ تحميل النظام…
    </div>
  );

  const TABS = [
    ["dashboard", "📊 لوحة القيادة"],
    ["pharmacies", "🏥 قاعدة الصيدليات"],
    ["sales", "🧾 حركات المبيعات"],
    ["geo", "🗺️ التوزيع الجغرافي"],
    ["customers", "👥 تحليل العملاء"],
    ["products", "📦 أداء المنتجات"],
    ["review", "📝 المراجعة الشهرية"],
  ];

  const years = [...new Set(data.transactions.map((t) => t.date.slice(0, 4)))].sort().reverse();

  return (
    <div style={{ fontFamily: "Tajawal, 'Segoe UI', sans-serif", direction: "rtl", minHeight: "100vh", background: C.bg, color: C.gray }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; }
        @media print { .no-print { display: none !important; } body { background: #fff; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .fade { animation: fadeUp .35s ease both; }
        table { border-collapse: collapse; width: 100%; }
        th { background: ${C.grayLight}; color: ${C.gray}; font-size: 12px; font-weight: 700; padding: 10px 8px; text-align: right; border-bottom: 2px solid ${C.border}; white-space: nowrap; }
        td { font-size: 12.5px; padding: 9px 8px; border-bottom: 1px solid ${C.border}; }
        /* تخطيط متناوب: الجدول العريض فيه 17 عموداً، والتناوب يُبقي العين على الصف */
        tbody tr:nth-child(even) td { background: #FBFCFD; }
        tr:hover td { background: ${C.blueLight}; }

        /* جدول الصيدليات 17 عموداً وعرضه أكبر من الشاشة. نُثبّت عمود الاسم
           عند الحافة حتى لا يضيع السياق عند التمرير الأفقي. */
        table.wide th:first-child, table.wide td:first-child {
          position: sticky; inset-inline-start: auto; right: 0; z-index: 1;
          background: ${C.white}; box-shadow: -1px 0 0 ${C.border};
        }
        table.wide thead th:first-child { z-index: 3; background: ${C.grayLight}; }
        table.wide tbody tr:nth-child(even) td:first-child { background: #FBFCFD; }
        table.wide tr:hover td:first-child { background: ${C.blueLight}; }

        /* أرقام متساوية العرض حيث تصطف رأسياً: الجداول ومحاور الرسوم.
           القيم الكبيرة في بطاقات المؤشرات تبقى بأرقام متناسبة. */
        td, .recharts-cartesian-axis-tick text { font-variant-numeric: tabular-nums; }

        /* وضوح لمستخدم لوحة المفاتيح */
        :focus-visible { outline: 2px solid ${C.blue}; outline-offset: 2px; border-radius: 6px; }

        /* شريط تمرير رفيع للجداول العريضة بدل الشريط العريض الافتراضي */
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 8px; border: 2px solid transparent; background-clip: content-box; }
        ::-webkit-scrollbar-thumb:hover { background: #94A3B8; background-clip: content-box; }
        ::-webkit-scrollbar-track { background: transparent; }

        /* الشبكات. minmax(0,1fr) ضروري: القيمة 1fr وحدها لا تصغُر تحت حجم
           محتواها، فتتمدد البطاقة ويخرج الرسم من حدودها فوق ما بجانبه. */
        .grid-kpi    { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); }
        .grid-charts { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .grid-wide   { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); }
        .grid-cards  { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); }
        .grid-form   { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
        .grid-filters{ display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
        @media (max-width: 1000px) { .grid-charts { grid-template-columns: minmax(0, 1fr); } }
        @media (max-width: 560px)  { .grid-kpi, .grid-cards, .grid-form { grid-template-columns: minmax(0, 1fr); } }
        /* ستة مرشّحات فوق بعضها تدفع المحتوى بعيداً على الهاتف */
        @media (max-width: 560px)  { .grid-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

        /* الجداول تُمرَّر أفقياً داخل غلافها، فالالتفاف داخل الخلية يشوّه الصف بلا فائدة */
        td { white-space: nowrap; }
        td.wrap { white-space: normal; }

        /* لا يتجاوز الرسم بطاقته مهما ضاقت */
        .recharts-wrapper, .recharts-surface { max-width: 100%; }

        /* جذر مشكلة تراكب النصوص على الرسوم:
           الصفحة dir=rtl، وrecharts يرسم تسميات المحاور بـ text-anchor:end.
           مع اتجاه rtl ينقلب معنى end، فيُرسم النص يمين نقطة الإرساء أي
           داخل منطقة الرسم فوق الأعمدة، بدل أن يستقر في حيّزه.
           نُثبّت اتجاه نصوص الرسم على ltr: تشكيل الحروف العربية داخل المقطع
           يبقى صحيحاً (ثنائي الاتجاه يعالجه لكل مقطع)، ويعود الإرساء سليماً. */
        .recharts-surface text { direction: ltr; }
        .chart-scroll { overflow-x: auto; overflow-y: hidden; }
        @media (prefers-reduced-motion: reduce) { .fade { animation: none; } }
      `}</style>

      {/* ===== الترويسة ===== */}
      <header style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "16px 24px", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* اللوجوهات فوق */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {/* لوجو الأصيل */}
              <img src={ALASEEL_LOGO} alt="ALASEEL Cosmetics" style={{ height: 40, width: "auto", display: "block" }} />
              <span style={{ fontSize: 18, color: C.grayMid, fontWeight: 300 }}>×</span>
              {/* لوجو مسروجي */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="48" height="31" viewBox="0 0 120 78">
                  <ellipse cx="60" cy="39" rx="56" ry="35" fill="none" stroke="#9CA3AF" strokeWidth="9" />
                  <path d="M38 58 V22 h13 l9 12 9-12 h13 v36 h-11 V38 l-11 14 -11-14 v20 z" fill="#1E4B8F" />
                </svg>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1E4B8F", fontFamily: "Georgia, serif" }}>Masrouji Group</span>
                  <span style={{ fontSize: 11, color: "#1E4B8F", fontWeight: 500 }}>مجموعة مسروجي</span>
                </div>
              </div>
            </div>
            {/* اسم النظام تحت */}
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.blueDark }}>Performance Management</div>
              <div style={{ fontSize: 12, color: C.grayMid, marginTop: 2 }}>نظام إدارة الأداء — قنوات التوزيع في الأردن · <span title="مصدر البيانات">{backendLabel()}</span>{session?.user?.email && <span title="الحساب المسجَّل"> · {session.user.email}</span>}{saveState && <b style={{ color: C.green }}> · {saveState}</b>}</div>
            </div>
          </div>
          <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {session && (
              <Btn small outline color={C.grayMid} onClick={signOut} style={{ marginInlineEnd: 4 }}>
                ⎋ خروج
              </Btn>
            )}
            <Btn small outline onClick={refresh}>↻ تحديث</Btn>
            <Btn small outline onClick={exportExcel}>⬇️ Excel</Btn>
            <Btn small outline onClick={exportPharmCSV}>⬇️ CSV</Btn>
            <Btn small outline onClick={() => window.print()}>🖨️ طباعة / PDF</Btn>
            <Btn small outline color={C.orange} onClick={async () => {
              if (!window.confirm("سيتم مسح كل البيانات الحالية وإعادة توليد البيانات التجريبية بأسماء المنتجات الصحيحة. هل أنت متأكد؟")) return;
              const fresh = seedData();
              await persist(fresh);
            }}>🔄 إعادة تهيئة البيانات</Btn>
          </div>
        </div>
        {/* التبويبات */}
        <nav className="no-print" style={{ display: "flex", gap: 6, marginTop: 14, overflowX: "auto", paddingBottom: 2 }}>
          {TABS.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              background: tab === k ? C.blue : "transparent", color: tab === k ? "#fff" : C.grayMid,
              border: "none", borderRadius: 9, padding: "8px 16px", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "background .2s",
            }}>{label}</button>
          ))}
        </nav>
      </header>

      {/* ===== الفلاتر ===== */}
      <div className="no-print grid-filters" style={{ padding: "14px 16px 0", maxWidth: 1400, margin: "0 auto" }}>
        <Select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          options={[{ value: "all", label: "كل السنوات" }, ...years.map((y) => ({ value: y, label: y }))]} />
        <Select value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })}
          options={[{ value: "all", label: "كل الشهور" }, ...MONTHS_AR.map((m, i) => ({ value: i, label: m }))]} />
        <Select value={filters.gov} onChange={(e) => setFilters({ ...filters, gov: e.target.value })}
          options={[{ value: "all", label: "كل المحافظات" }, ...GOVS]} />
        <Select value={filters.rep} onChange={(e) => setFilters({ ...filters, rep: e.target.value })}
          options={[{ value: "all", label: "كل المندوبين" }, ...REPS]} />
        <Select value={filters.product} onChange={(e) => setFilters({ ...filters, product: e.target.value })}
          options={[{ value: "all", label: "كل المنتجات" }, ...PRODUCTS]} />
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          options={[{ value: "all", label: "كل الحالات" }, { value: "active", label: "نشط" }, { value: "risk", label: "معرّض للخطر" }, { value: "lost", label: "مفقود" }]} />
      </div>

      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        {tab === "dashboard" && <Dashboard stats={stats} />}
        {tab === "pharmacies" && <Pharmacies data={data} stats={stats} persist={persist} />}
        {tab === "sales" && <Sales data={data} stats={stats} persist={persist} exportCSV={exportCSV} />}
        {tab === "geo" && <Geo stats={stats} />}
        {tab === "customers" && <Customers stats={stats} />}
        {tab === "products" && <Products stats={stats} />}
        {tab === "review" && <Review data={data} persist={persist} />}
      </main>
    </div>
  );
}
