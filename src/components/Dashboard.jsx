import React from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { C, GOVS } from "../lib/constants.js";
import { Y_NUM, Y_CAT, TICK, TICK_SM, cut, angledX } from "../lib/chart.js";
import { fmtNum, fmtJD, fmtPct } from "../lib/helpers.js";
import { Card, KPI, SectionTitle, StatusBadge } from "./ui.jsx";

export default function Dashboard({ stats }) {
  const pieData = [
    { name: "نشط", value: stats.counts.active, color: C.green },
    { name: "معرّض للخطر", value: stats.counts.risk, color: C.orange },
    { name: "مفقود", value: stats.counts.lost, color: C.red },
  ];
  return (
    <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="grid-kpi">
        <KPI title="إجمالي المبيعات" value={fmtJD(stats.totalSales)} sub={`${fmtNum(stats.orders)} فاتورة`} color={C.blue} icon="💰" />
        <KPI title="النمو الشهري" value={fmtPct(stats.growth)} sub="مقارنة بالشهر السابق" color={stats.growth >= 0 ? C.green : C.red} icon="📈" />
        <KPI title="حسابات نشطة" value={fmtNum(stats.counts.active)} sub="آخر شراء ≤ 90 يوم" color={C.green} icon="✅" />
        <KPI title="حسابات جديدة" value={fmtNum(stats.counts.newAcc)} sub="فُتحت خلال 90 يوم" color={C.blue} icon="🆕" />
        <KPI title="معرّضة للخطر" value={fmtNum(stats.counts.risk)} sub="91 – 180 يوم بلا شراء" color={C.orange} icon="⚠️" />
        <KPI title="حسابات مفقودة" value={fmtNum(stats.counts.lost)} sub="أكثر من 180 يوم" color={C.red} icon="🔴" />
        <KPI title="متوسط الفاتورة" value={fmtJD(stats.avgInvoice)} color={C.blue} icon="🧾" />
        <KPI title="متوسط الأيام بين الطلبات" value={fmtNum(stats.netAvgGap) + " يوم"} color={C.gray} icon="⏱️" />
        <KPI title="إجمالي الصيدليات الفعّالة" value={fmtNum(stats.counts.active)} sub={`من أصل ${fmtNum(stats.perPharm.length)}`} color={C.green} icon="🏥" />
        <KPI title="التغطية الجغرافية" value={fmtNum(stats.coverage) + " محافظة"} sub={`من أصل ${GOVS.length}`} color={C.blueDark} icon="🗺️" />
      </div>

      <div className="grid-charts">
        <Card>
          <SectionTitle>📈 اتجاه المبيعات الشهري</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.monthlyTrend}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.blue} stopOpacity={.25} /><stop offset="100%" stopColor={C.blue} stopOpacity={0} />
              </linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "Tajawal" }} />
              <YAxis tick={TICK} width={Y_NUM} />
              <Tooltip formatter={(v) => fmtJD(v)} />
              <Area type="monotone" dataKey="المبيعات" stroke={C.blue} strokeWidth={2.5} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>🗺️ المبيعات حسب المحافظة</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.govData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" {...angledX} />
              <YAxis tick={TICK} width={Y_NUM} />
              <Tooltip formatter={(v) => fmtJD(v)} />
              <Bar dataKey="المبيعات" fill={C.blue} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>🎯 توزيع حالة الحسابات</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip /><Legend wrapperStyle={{ fontFamily: "Tajawal", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>📦 أفضل المنتجات</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.productData.slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis type="number" tick={TICK} />
              <YAxis type="category" dataKey="name" width={Y_CAT} tick={TICK_SM} interval={0} tickFormatter={cut(24)} />
              <Tooltip formatter={(v) => fmtJD(v)} />
              <Bar dataKey="المبيعات" fill={C.green} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle>🏆 أفضل العملاء</SectionTitle>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>#</th><th>الصيدلية</th><th>المحافظة</th><th>المندوب</th><th>المبيعات</th><th>الطلبات</th><th>الحالة</th></tr></thead>
            <tbody>
              {stats.custRank.slice(0, 10).map((p, i) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 800, color: i < 3 ? C.blue : C.grayMid }}>{i + 1}</td>
                  <td style={{ fontWeight: 700 }}>{p.name}</td><td>{p.governorate}</td><td>{p.rep}</td>
                  <td style={{ fontWeight: 700, color: C.blueDark }}>{fmtJD(p.filteredSales)}</td>
                  <td>{p.filteredOrders}</td><td><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
