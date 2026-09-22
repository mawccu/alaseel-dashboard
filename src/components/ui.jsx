import { C, STATUS_META } from "../lib/constants.js";

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

export const Btn = ({ children, onClick, color = C.blue, outline, small, style }) => (
  <button onClick={onClick} style={{
    background: outline ? C.white : color, color: outline ? color : "#fff",
    border: `1.5px solid ${color}`, borderRadius: 10,
    padding: small ? "6px 12px" : "9px 18px", fontSize: small ? 12 : 13.5,
    fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s", ...style
  }}
    onMouseEnter={(e) => e.currentTarget.style.opacity = ".85"}
    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>{children}</button>
);

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

