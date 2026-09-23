import React, { useState } from "react";
import { C } from "../lib/constants.js";
import { fmtNum, fmtJD } from "../lib/helpers.js";
import { Card, KPI, StatusBadge } from "./ui.jsx";

export default function Customers({ stats }) {
  const rank = stats.custRank.filter((p) => p.orders > 0);
  const top20 = rank.slice(0, 20);
  const bottom20 = [...rank].reverse().slice(0, 20);
  const newCust = stats.perPharm.filter((p) => p.isNew);
  const lostCust = stats.perPharm.filter((p) => p.status === "lost");

  const CustTable = ({ rows, showRank }) => (
    <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto" }}>
      <table>
        <thead style={{ position: "sticky", top: 0 }}><tr>
          {showRank && <th>#</th>}<th>الصيدلية</th><th>المحافظة</th><th>المبيعات مدى الحياة</th><th>الطلبات</th><th>متوسط الفاتورة</th><th>تكرار الطلب (يوم)</th><th>الحالة</th>
        </tr></thead>
        <tbody>{rows.map((p, i) => (
          <tr key={p.id}>
            {showRank && <td style={{ fontWeight: 800, color: i < 3 ? C.blue : C.grayMid }}>{i + 1}</td>}
            <td style={{ fontWeight: 700 }}>{p.name}</td><td>{p.governorate}</td>
            <td style={{ fontWeight: 700, color: C.blueDark }}>{fmtJD(p.lifetime)}</td>
            <td>{p.orders}</td><td>{fmtJD(p.avgInvoice)}</td><td>{p.avgGap || "—"}</td>
            <td><StatusBadge status={p.status} /></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );

  const [view, setView] = useState("top");
  const views = [
    ["top", "🏆 أفضل 20 عميل", top20],
    ["bottom", "📉 أضعف 20 عميل", bottom20],
    ["new", "🆕 عملاء جدد (" + newCust.length + ")", newCust],
    ["react", "🔄 أعيد تنشيطهم (" + stats.reactivated.length + ")", stats.perPharm.filter((p) => stats.reactivated.some((r) => r.id === p.id))],
    ["lost", "🔴 عملاء مفقودون (" + lostCust.length + ")", lostCust],
  ];

  return (
    <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="grid-kpi">
        <KPI title="متوسط تكرار الطلبات" value={fmtNum(stats.netAvgGap) + " يوم"} color={C.blue} icon="⏱️" />
        <KPI title="متوسط قيمة الفاتورة" value={fmtJD(stats.avgInvoice)} color={C.green} icon="🧾" />
        <KPI title="عملاء جدد" value={fmtNum(newCust.length)} color={C.blue} icon="🆕" />
        <KPI title="أعيد تنشيطهم" value={fmtNum(stats.reactivated.length)} color={C.green} icon="🔄" />
        <KPI title="عملاء مفقودون" value={fmtNum(lostCust.length)} color={C.red} icon="🔴" />
      </div>
      <div className="no-print" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {views.map(([k, label]) => (
          <button key={k} onClick={() => setView(k)} style={{
            background: view === k ? C.blue : C.white, color: view === k ? "#fff" : C.grayMid,
            border: `1.5px solid ${view === k ? C.blue : C.border}`, borderRadius: 9, padding: "8px 14px",
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>{label}</button>
        ))}
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <CustTable rows={views.find((v) => v[0] === view)[2]} showRank={view === "top" || view === "bottom"} />
      </Card>
    </div>
  );
}
