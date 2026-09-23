import { C, STATUS_META, readable } from "../lib/constants.js";

export const Card = ({ children, style }) => (
  <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, ...style }}>{children}</div>
);

export const KPI = ({ title, value, sub, color = C.blue, icon }) => (
  <div style={{
    background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px",
    display: "flex", flexDirection: "column", gap: 6, position: "relative", overflow: "hidden",
    transition: "transform .2s, box-shadow .2s",
  }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(15,23,42,.08)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
    <div style={{ position: "absolute", insetInlineStart: 0, top: 0, bottom: 0, width: 4, background: color }} />
    <div style={{ fontSize: 13, color: C.grayMid, fontWeight: 500 }}>{icon} {title}</div>
    <div style={{ fontSize: 26, fontWeight: 800, color: C.gray }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.grayMid }}>{sub}</div>}
  </div>
);

export const SectionTitle = ({ children }) => (
  <h3 style={{ fontSize: 15, fontWeight: 700, color: C.gray, margin: "0 0 14px" }}>{children}</h3>
);

export const Btn = ({ children, onClick, color = C.blue, outline, small, style }) => {
  const col = readable(color); // النص بلون الزر أو فوقه يحتاج تبايناً 4.5:1
  return (
    <button onClick={onClick} style={{
      background: outline ? C.white : col, color: outline ? col : "#fff",
      border: `1.5px solid ${col}`, borderRadius: 10,
      padding: small ? "6px 12px" : "9px 18px", fontSize: small ? 12 : 13.5,
      fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s", ...style
    }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = ".85"}
      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>{children}</button>
  );
};

export const Input = (props) => (
  <input {...props} style={{
    border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "8px 12px", fontSize: 13,
    fontFamily: "inherit", color: C.gray, width: "100%", boxSizing: "border-box",
    outline: "none", background: C.white, ...props.style
  }} onFocus={(e) => e.target.style.borderColor = C.blue} onBlur={(e) => e.target.style.borderColor = C.border} />
);

export const Select = ({ options, ...props }) => (
  <select {...props} style={{
    border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "8px 10px", fontSize: 13,
    fontFamily: "inherit", color: C.gray, background: C.white, width: "100%", boxSizing: "border-box", outline: "none", ...props.style
  }}>
    {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
  </select>
);

export const StatusBadge = ({ status }) => {
  const m = STATUS_META[status];
  return <span style={{ background: m.bg, color: m.color, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>● {m.label}</span>;
};


/*
  تلميح مخصّص للرسوم. تلميح recharts الافتراضي يرث اتجاه الصفحة بشكل
  غير متوقّع ولا يُنسّق الأرقام، فتظهر القيمة خاماً مثل 3825 بلا فاصلة ولا عملة.
*/
export const ChartTip = ({ active, payload, label, fmt }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "9px 12px", fontSize: 12.5, fontFamily: "Tajawal, sans-serif",
      direction: "rtl", boxShadow: "0 6px 20px rgba(15,23,42,.12)", minWidth: 120,
    }}>
      {label !== undefined && label !== "" && (
        <div style={{ fontWeight: 800, color: C.gray, marginBottom: 6 }}>{label}</div>
      )}
      {payload.map((p) => (
        <div key={p.dataKey ?? p.name} style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color || p.fill, flex: "none" }} />
          <span style={{ color: C.grayMid }}>{p.name}</span>
          <b style={{ marginInlineStart: "auto", color: C.gray }}>{fmt ? fmt(p.value) : p.value}</b>
        </div>
      ))}
    </div>
  );
};

/* حالة فارغة. الفلاتر قد لا تُطابق شيئاً، وكان الرسم يظهر عندها فارغاً بلا تفسير. */
export const Empty = ({ height = 200, text = "لا توجد بيانات مطابقة للفلاتر المحددة" }) => (
  <div style={{
    height, display: "grid", placeItems: "center", color: C.grayMid,
    fontSize: 13, textAlign: "center", padding: 16,
  }}>
    <div>
      <div style={{ fontSize: 26, marginBottom: 6, opacity: .45 }}>🗂️</div>
      {text}
    </div>
  </div>
);
