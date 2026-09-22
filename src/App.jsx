import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import { C, GOVS, CATEGORIES, PRODUCTS, REPS, MONTHS_AR, STATUS_META } from "./lib/constants.js";
import { fmtNum, fmtJD, fmtPct, daysAgo, isoDate, dateOffset, statusOf } from "./lib/helpers.js";
import { seedData } from "./lib/seed.js";
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

  useEffect(() => { refresh(); }, [refresh]);

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
    let txs = transactions.filter((t) => {
      const d = new Date(t.date);
      if (filters.year !== "all" && d.getFullYear() !== +filters.year) return false;
      if (filters.month !== "all" && d.getMonth() !== +filters.month) return false;
      if (filters.product !== "all" && t.product !== filters.product) return false;
      const p = pharmacies.find((x) => x.id === t.pharmacyId);
      if (!p) return false;
      if (filters.gov !== "all" && p.governorate !== filters.gov) return false;
      if (filters.rep !== "all" && p.rep !== filters.rep) return false;
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
        tr:hover td { background: ${C.blueLight}; }
        @media (prefers-reduced-motion: reduce) { .fade { animation: none; } }
      `}</style>

      {/* ===== الترويسة ===== */}
      <header style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "16px 24px", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* اللوجوهات فوق */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {/* لوجو الأصيل */}
              <img src="data:image/png;base64,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" alt="ALASEEL Cosmetics" style={{ height: 40, width: "auto", display: "block" }} />
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
              <div style={{ fontSize: 12, color: C.grayMid, marginTop: 2 }}>نظام إدارة الأداء — قنوات التوزيع في الأردن · <span title="مصدر البيانات">{backendLabel()}</span>{saveState && <b style={{ color: C.green }}> · {saveState}</b>}</div>
            </div>
          </div>
          <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
      <div className="no-print" style={{ padding: "14px 24px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, maxWidth: 1400, margin: "0 auto" }}>
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
