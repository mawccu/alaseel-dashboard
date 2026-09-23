import React, { useState } from "react";
import { C, GOVS, CATEGORIES, REPS, lbl } from "../lib/constants.js";
import { fmtJD, isoDate } from "../lib/helpers.js";
import { Card, SectionTitle, Btn, Input, Select, StatusBadge } from "./ui.jsx";

export default function Pharmacies({ data, stats, persist }) {
  const [editing, setEditing] = useState(null);
  const empty = { name: "", code: "", governorate: GOVS[0], city: "", area: "", category: CATEGORIES[0], owner: "", mobile: "", rep: REPS[0], openDate: isoDate(new Date()), notes: "" };

  const save = () => {
    if (!editing.name.trim()) return;
    const list = [...data.pharmacies];
    if (editing.id) {
      const i = list.findIndex((p) => p.id === editing.id);
      list[i] = { ...list[i], ...editing };
    } else {
      list.push({ ...editing, id: "PH" + Date.now() });
    }
    persist({ ...data, pharmacies: list });
    setEditing(null);
  };
  const remove = (id) => {
    persist({ ...data, pharmacies: data.pharmacies.filter((p) => p.id !== id), transactions: data.transactions.filter((t) => t.pharmacyId !== id) });
  };

  return (
    <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 14, color: C.grayMid }}>عدد السجلات: <b style={{ color: C.gray }}>{stats.perPharm.length}</b> · الحالة تُحتسب تلقائياً من آخر عملية شراء</div>
        <Btn onClick={() => setEditing(empty)}>＋ صيدلية جديدة</Btn>
      </div>

      {editing && (
        <Card style={{ border: `2px solid ${C.blue}` }}>
          <SectionTitle>{editing.id ? "تعديل صيدلية" : "إضافة صيدلية جديدة"}</SectionTitle>
          <div className="grid-form">
            <div><label style={lbl}>اسم الصيدلية *</label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><label style={lbl}>كود الحساب</label><Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} /></div>
            <div><label style={lbl}>المحافظة</label><Select value={editing.governorate} onChange={(e) => setEditing({ ...editing, governorate: e.target.value })} options={GOVS} /></div>
            <div><label style={lbl}>المدينة</label><Input value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></div>
            <div><label style={lbl}>المنطقة</label><Input value={editing.area} onChange={(e) => setEditing({ ...editing, area: e.target.value })} /></div>
            <div><label style={lbl}>فئة الصيدلية</label><Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} options={CATEGORIES} /></div>
            <div><label style={lbl}>المالك / الصيدلاني</label><Input value={editing.owner} onChange={(e) => setEditing({ ...editing, owner: e.target.value })} /></div>
            <div><label style={lbl}>رقم الموبايل</label><Input value={editing.mobile} onChange={(e) => setEditing({ ...editing, mobile: e.target.value })} /></div>
            <div><label style={lbl}>المندوب</label><Select value={editing.rep} onChange={(e) => setEditing({ ...editing, rep: e.target.value })} options={REPS} /></div>
            <div><label style={lbl}>تاريخ فتح الحساب</label><Input type="date" value={editing.openDate} onChange={(e) => setEditing({ ...editing, openDate: e.target.value })} /></div>
            <div style={{ gridColumn: "1 / -1" }}><label style={lbl}>ملاحظات</label><Input value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Btn onClick={save} color={C.green}>حفظ</Btn>
            <Btn outline onClick={() => setEditing(null)} color={C.grayMid}>إلغاء</Btn>
          </div>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="wide">
            <thead><tr>
              <th>الصيدلية</th><th>الكود</th><th>المحافظة</th><th>المنطقة</th><th>الفئة</th><th>المالك</th><th>الموبايل</th><th>المندوب</th>
              <th>فتح الحساب</th><th>أول طلب</th><th>آخر طلب</th><th>مبيعات YTD</th><th>الطلبات</th><th>متوسط الفاتورة</th><th>أيام بين الطلبات</th><th>الحالة</th><th className="no-print"></th>
            </tr></thead>
            <tbody>
              {stats.perPharm.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700 }}>{p.name}</td><td>{p.code}</td><td>{p.governorate}</td><td>{p.area}</td>
                  <td>{p.category}</td><td>{p.owner}</td><td dir="ltr">{p.mobile}</td><td>{p.rep}</td>
                  <td>{p.openDate}</td><td>{p.firstOrder || "—"}</td><td>{p.lastOrder || "—"}</td>
                  <td style={{ fontWeight: 700, color: C.blueDark }}>{fmtJD(p.ytd)}</td>
                  <td>{p.orders}</td><td>{fmtJD(p.avgInvoice)}</td><td>{p.avgGap || "—"}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="no-print" style={{ whiteSpace: "nowrap" }}>
                    <Btn small outline onClick={() => setEditing({ ...p })}>✏️</Btn>{" "}
                    <Btn small outline color={C.red} onClick={() => remove(p.id)}>🗑️</Btn>
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
