import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { C, PRODUCTS } from "../lib/constants.js";
import { fmtJD, fmtPct } from "../lib/helpers.js";
import { Card, SectionTitle } from "./ui.jsx";

export default function Products({ stats }) {
  // نمو لكل منتج: نصف الفترة الأخيرة مقابل السابقة
  const growthMap = useMemo(() => {
    const m = {};
    PRODUCTS.forEach((prod) => {
      const txs = stats.txs.filter((t) => t.product === prod).sort((a, b) => a.date.localeCompare(b.date));
      if (txs.length < 2) { m[prod] = 0; return; }
      const mid = Math.floor(txs.length / 2);
      const older = txs.slice(0, mid).reduce((s, t) => s + t.value, 0);
      const newer = txs.slice(mid).reduce((s, t) => s + t.value, 0);
      m[prod] = older ? ((newer - older) / older) * 100 : 0;
    });
    return m;
  }, [stats.txs]);

  const rows = stats.productData.map((p) => ({ ...p, growth: growthMap[p.name] || 0 }));
  const top = rows.slice(0, 3);
  const weak = [...rows].reverse().slice(0, 3);

  return (
    <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        <Card>
          <SectionTitle>📦 المبيعات حسب المنتج</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rows} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10.5, fontFamily: "Tajawal" }} />
              <Tooltip formatter={(v) => fmtJD(v)} />
              <Bar dataKey="المبيعات" fill={C.blue} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ background: C.greenLight, borderColor: C.green }}>
            <SectionTitle>🏆 أقوى المنتجات</SectionTitle>
            {top.map((p, i) => (
              <div key={p.name} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none", fontSize: 13.5 }}>
                <b>{i + 1}. {p.name}</b>
                <span style={{ fontWeight: 800, color: C.green }}>{fmtJD(p.المبيعات)}</span>
              </div>
            ))}
          </Card>
          <Card style={{ background: C.orangeLight, borderColor: C.orange }}>
            <SectionTitle>⚠️ المنتجات الضعيفة — تحتاج خطة دفع</SectionTitle>
            {weak.map((p, i) => (
              <div key={p.name} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none", fontSize: 13.5 }}>
                <b>{p.name}</b>
                <span style={{ fontWeight: 800, color: C.orange }}>{fmtJD(p.المبيعات)}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>#</th><th>المنتج</th><th>المبيعات</th><th>عدد الصيدليات المشترية</th><th>النمو %</th><th>الحصة من المبيعات</th></tr></thead>
            <tbody>{rows.map((p, i) => (
              <tr key={p.name}>
                <td style={{ fontWeight: 800, color: C.grayMid }}>{i + 1}</td>
                <td style={{ fontWeight: 700 }}>{p.name}</td>
                <td style={{ fontWeight: 700, color: C.blueDark }}>{fmtJD(p.المبيعات)}</td>
                <td>{p.صيدليات}</td>
                <td style={{ fontWeight: 800, color: p.growth >= 0 ? C.green : C.red }}>{fmtPct(p.growth)}</td>
                <td>{stats.totalSales ? ((p.المبيعات / stats.totalSales) * 100).toFixed(1) : 0}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
