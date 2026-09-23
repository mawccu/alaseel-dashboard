import React, { useState } from "react";
import { C, PRODUCTS, lbl } from "../lib/constants.js";
import { fmtNum, fmtJD, isoDate } from "../lib/helpers.js";
import { Card, KPI, SectionTitle, Btn, Input, Select } from "./ui.jsx";

export default function Sales({ data, stats, persist, exportCSV }) {
  const [editing, setEditing] = useState(null);
  const empty = { date: isoDate(new Date()), invoiceNo: "", pharmacyId: data.pharmacies[0]?.id || "", product: PRODUCTS[0], qty: 1, value: 0 };

  const save = () => {
    if (!editing.invoiceNo.trim() || !editing.pharmacyId) return;
    const list = [...data.transactions];
    if (editing.id) {
      const i = list.findIndex((t) => t.id === editing.id);
      list[i] = { ...editing, qty: +editing.qty, value: +editing.value };
    } else {
      list.push({ ...editing, id: "TX" + Date.now(), qty: +editing.qty, value: +editing.value });
    }
    persist({ ...data, transactions: list });
    setEditing(null);
  };
  const remove = (id) => persist({ ...data, transactions: data.transactions.filter((t) => t.id !== id) });
  const pharmName = (id) => data.pharmacies.find((p) => p.id === id)?.name || "—";
  const sorted = [...stats.txs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="grid-kpi">
        <KPI title="إجمالي المبيعات (مفلتر)" value={fmtJD(stats.totalSales)} color={C.blue} />
        <KPI title="عدد الفواتير" value={fmtNum(stats.orders)} color={C.gray} />
        <KPI title="متوسط الفاتورة" value={fmtJD(stats.avgInvoice)} color={C.green} />
        <KPI title="متوسط الأيام بين الطلبات" value={fmtNum(stats.netAvgGap) + " يوم"} color={C.orange} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <Btn onClick={() => setEditing(empty)}>＋ فاتورة جديدة</Btn>
        <Btn outline onClick={() => exportCSV(sorted.map((t) => ({
          date: t.date, invoice: t.invoiceNo, pharmacy: pharmName(t.pharmacyId), product: t.product, qty: t.qty, value: t.value
        })), "sales")}>⬇️ تصدير الفواتير CSV</Btn>
      </div>

      {editing && (
        <Card style={{ border: `2px solid ${C.blue}` }}>
          <SectionTitle>{editing.id ? "تعديل فاتورة" : "فاتورة جديدة"}</SectionTitle>
          <div className="grid-form">
            <div><label style={lbl}>تاريخ الفاتورة</label><Input type="date" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></div>
            <div><label style={lbl}>رقم الفاتورة *</label><Input value={editing.invoiceNo} onChange={(e) => setEditing({ ...editing, invoiceNo: e.target.value })} /></div>
            <div><label style={lbl}>الصيدلية</label><Select value={editing.pharmacyId} onChange={(e) => setEditing({ ...editing, pharmacyId: e.target.value })} options={data.pharmacies.map((p) => ({ value: p.id, label: p.name }))} /></div>
            <div><label style={lbl}>المنتج</label><Select value={editing.product} onChange={(e) => setEditing({ ...editing, product: e.target.value })} options={PRODUCTS} /></div>
            <div><label style={lbl}>الكمية</label><Input type="number" min="1" value={editing.qty} onChange={(e) => setEditing({ ...editing, qty: e.target.value })} /></div>
            <div><label style={lbl}>قيمة الفاتورة (د.أ)</label><Input type="number" min="0" value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} /></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Btn onClick={save} color={C.green}>حفظ</Btn>
            <Btn outline onClick={() => setEditing(null)} color={C.grayMid}>إلغاء</Btn>
          </div>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto", maxHeight: 520, overflowY: "auto" }}>
          <table>
            <thead style={{ position: "sticky", top: 0 }}><tr>
              <th>التاريخ</th><th>رقم الفاتورة</th><th>الصيدلية</th><th>المنتج</th><th>الكمية</th><th>القيمة</th><th className="no-print"></th>
            </tr></thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td><td style={{ fontWeight: 600 }} dir="ltr">{t.invoiceNo}</td>
                  <td>{pharmName(t.pharmacyId)}</td><td>{t.product}</td><td>{t.qty}</td>
                  <td style={{ fontWeight: 700, color: C.blueDark }}>{fmtJD(t.value)}</td>
                  <td className="no-print" style={{ whiteSpace: "nowrap" }}>
                    <Btn small outline onClick={() => setEditing({ ...t })}>✏️</Btn>{" "}
                    <Btn small outline color={C.red} onClick={() => remove(t.id)}>🗑️</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
