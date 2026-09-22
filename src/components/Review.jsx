import React, { useState } from "react";
import { C, MONTHS_AR, lbl } from "../lib/constants.js";
import { Card, SectionTitle, Btn, Input } from "./ui.jsx";

const taStyle = {
  width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`, borderRadius: 9,
  padding: "10px 12px", fontSize: 13, fontFamily: "inherit", color: C.gray, resize: "vertical", outline: "none",
};

export default function Review({ data, persist }) {
  const now = new Date();
  const defaultMonth = now.toISOString().slice(0, 7);
  const [form, setForm] = useState({ month: defaultMonth, achievements: "", challenges: "", competitors: "", opportunities: "", actions: "" });

  const save = () => {
    if (!form.achievements && !form.challenges && !form.actions) return;
    const reviews = [...(data.reviews || [])];
    const i = reviews.findIndex((r) => r.month === form.month);
    if (i >= 0) reviews[i] = { ...form, id: reviews[i].id };
    else reviews.push({ ...form, id: "RV" + Date.now() });
    persist({ ...data, reviews });
    setForm({ month: defaultMonth, achievements: "", challenges: "", competitors: "", opportunities: "", actions: "" });
  };
  const remove = (id) => persist({ ...data, reviews: data.reviews.filter((r) => r.id !== id) });
  const load = (r) => setForm({ ...r });

  const fields = [
    ["achievements", "✅ أبرز الإنجازات", "أهم ما تحقق هذا الشهر: أرقام، حسابات جديدة، تغطية…"],
    ["challenges", "⚠️ أبرز التحديات", "معوقات البيع، التحصيل، التوزيع…"],
    ["competitors", "🎯 نشاط المنافسين", "عروض المنافسين، أسعارهم، تحركاتهم في السوق…"],
    ["opportunities", "💡 فرص السوق", "مناطق غير مغطاة، منتجات مطلوبة، شراكات محتملة…"],
    ["actions", "📋 خطة الشهر القادم", "إجراءات محددة قابلة للقياس مع مسؤول وموعد…"],
  ];

  return (
    <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <SectionTitle>📝 نموذج المراجعة الشهرية للموزّع</SectionTitle>
        <div style={{ maxWidth: 260, marginBottom: 12 }}>
          <label style={lbl}>الشهر</label>
          <Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {fields.map(([f, l, p]) => (
            <div key={f}>
              <label style={lbl}>{l}</label>
              <textarea value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                placeholder={p} rows={3} style={taStyle} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <Btn onClick={save} color={C.green}>حفظ المراجعة</Btn>
        </div>
      </Card>

      {(data.reviews || []).length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {[...data.reviews].sort((a, b) => b.month.localeCompare(a.month)).map((r) => {
            const [y, m] = r.month.split("-");
            return (
              <Card key={r.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <b style={{ fontSize: 15, color: C.blueDark }}>📅 مراجعة {MONTHS_AR[+m - 1]} {y}</b>
                  <div className="no-print">
                    <Btn small outline onClick={() => load(r)}>✏️ تعديل</Btn>{" "}
                    <Btn small outline color={C.red} onClick={() => remove(r.id)}>🗑️</Btn>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, fontSize: 13 }}>
                  {fields.map(([f, l]) => r[f] && (
                    <div key={f} style={{ background: C.bg, borderRadius: 10, padding: 12 }}>
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>{l}</div>
                      <div style={{ color: C.grayMid, whiteSpace: "pre-wrap" }}>{r[f]}</div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
