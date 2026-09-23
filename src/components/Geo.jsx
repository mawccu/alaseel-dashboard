import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { C, GOVS } from "../lib/constants.js";
import { fmtJD } from "../lib/helpers.js";
import { Card, SectionTitle, ChartTip, Empty } from "./ui.jsx";
import { Y_NUM, Y_NUM_SM, TICK, angledX, GRID, SALES, R_V } from "../lib/chart.js";

export default function Geo({ stats }) {
  const govStats = GOVS.map((g) => {
    const pharms = stats.perPharm.filter((p) => p.governorate === g);
    const sales = stats.govData.find((x) => x.name === g)?.المبيعات || 0;
    return {
      gov: g, sales,
      active: pharms.filter((p) => p.status === "active").length,
      newAcc: pharms.filter((p) => p.isNew).length,
      lost: pharms.filter((p) => p.status === "lost").length,
      total: pharms.length,
      share: stats.totalSales ? (sales / stats.totalSales) * 100 : 0,
    };
  }).filter((g) => g.total > 0 || g.sales > 0).sort((a, b) => b.sales - a.sales);

  return (
    <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="grid-charts">
        <Card>
          <SectionTitle>💰 المبيعات حسب المحافظة</SectionTitle>
          {govStats.length ? (
<ResponsiveContainer width="100%" height={330}>
            <BarChart data={govStats}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="gov" {...angledX} />
              <YAxis tick={TICK} width={Y_NUM} />
              <Tooltip content={<ChartTip fmt={fmtJD} />} cursor={{ fill: "rgba(37,99,235,.06)" }} />
              <Bar dataKey="sales" name="المبيعات" fill={SALES} radius={R_V} />
            </BarChart>
          </ResponsiveContainer>
          ) : <Empty />}
        </Card>
        <Card>
          <SectionTitle>🏥 الصيدليات: نشطة / جديدة / مفقودة</SectionTitle>
          {govStats.length ? (
<ResponsiveContainer width="100%" height={330}>
            <BarChart data={govStats}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="gov" {...angledX} />
              <YAxis tick={TICK} allowDecimals={false} width={Y_NUM_SM} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(37,99,235,.06)" }} /><Legend wrapperStyle={{ fontFamily: "Tajawal", fontSize: 12 }} />
              <Bar dataKey="active" name="نشطة" fill={C.green} radius={R_V} />
              <Bar dataKey="newAcc" name="جديدة" fill={C.blue} radius={R_V} />
              <Bar dataKey="lost" name="مفقودة" fill={C.red} radius={R_V} />
            </BarChart>
          </ResponsiveContainer>
          ) : <Empty />}
        </Card>
      </div>

      <div className="grid-cards">
        {govStats.map((g) => (
          <Card key={g.gov} style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <b style={{ fontSize: 15 }}>📍 {g.gov}</b>
              <span style={{ background: C.blueLight, color: C.blueDark, borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 800 }}>{g.share.toFixed(1)}%</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.blueDark, marginBottom: 8 }}>{fmtJD(g.sales)}</div>
            <div style={{ height: 6, background: C.grayLight, borderRadius: 999, marginBottom: 10 }}>
              <div style={{ height: "100%", width: g.share + "%", background: C.blue, borderRadius: 999, transition: "width .5s" }} />
            </div>
            <div style={{ display: "flex", gap: 10, fontSize: 12, fontWeight: 700 }}>
              <span style={{ color: C.green }}>● نشطة {g.active}</span>
              <span style={{ color: C.blue }}>● جديدة {g.newAcc}</span>
              <span style={{ color: C.red }}>● مفقودة {g.lost}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
