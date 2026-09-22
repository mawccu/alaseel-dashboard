import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { C, GOVS } from "../lib/constants.js";
import { fmtJD } from "../lib/helpers.js";
import { Card, SectionTitle } from "./ui.jsx";

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        <Card>
          <SectionTitle>💰 المبيعات حسب المحافظة</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={govStats}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="gov" tick={{ fontSize: 11, fontFamily: "Tajawal" }} />
              <YAxis tick={{ fontSize: 11 }} width={55} />
              <Tooltip formatter={(v) => fmtJD(v)} />
              <Bar dataKey="sales" name="المبيعات" fill={C.blue} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>🏥 الصيدليات: نشطة / جديدة / مفقودة</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={govStats}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="gov" tick={{ fontSize: 11, fontFamily: "Tajawal" }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={35} />
              <Tooltip /><Legend wrapperStyle={{ fontFamily: "Tajawal", fontSize: 12 }} />
              <Bar dataKey="active" name="نشطة" fill={C.green} radius={[4, 4, 0, 0]} />
              <Bar dataKey="newAcc" name="جديدة" fill={C.blue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="lost" name="مفقودة" fill={C.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
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
