import React, { useState } from "react";
import { C } from "../lib/constants.js";
import { ALASEEL_LOGO } from "../lib/logo.js";
import { Btn } from "./ui.jsx";
import { signIn, sendReset } from "../lib/auth.js";

const field = {
  width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`,
  borderRadius: 10, padding: "11px 14px", fontSize: 14, fontFamily: "inherit",
  color: C.gray, outline: "none", background: C.white, direction: "ltr", textAlign: "left",
};
const label = { fontSize: 12.5, color: C.grayMid, fontWeight: 600, display: "block", marginBottom: 6 };

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr(""); setNote("");
    if (!email.trim() || !password) { setErr("أدخل البريد الإلكتروني وكلمة المرور"); return; }
    setBusy(true);
    const r = await signIn(email, password);
    setBusy(false);
    if (r.error) setErr(r.error);
    // النجاح لا يحتاج معالجة: مستمع تغيّر الجلسة في App يعيد الرسم.
  };

  const reset = async () => {
    setErr(""); setNote("");
    if (!email.trim()) { setErr("أدخل بريدك الإلكتروني أولاً ثم اضغط على استعادة كلمة المرور"); return; }
    setBusy(true);
    const r = await sendReset(email);
    setBusy(false);
    r.error ? setErr(r.error) : setNote("إن كان هذا البريد مسجّلاً فستصلك رسالة لإعادة التعيين");
  };

  return (
    <div style={{
      fontFamily: "Tajawal, 'Segoe UI', sans-serif", direction: "rtl", minHeight: "100vh",
      background: `linear-gradient(180deg, ${C.bg} 0%, #EEF2F8 100%)`,
      display: "grid", placeItems: "center", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* الترويسة نفسها المستعملة داخل النظام */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 22 }}>
          <img src={ALASEEL_LOGO} alt="ALASEEL Cosmetics" style={{ height: 38, width: "auto", display: "block" }} />
          <span style={{ fontSize: 17, color: C.grayMid, fontWeight: 300 }}>×</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="44" height="29" viewBox="0 0 120 78" aria-hidden="true">
              <ellipse cx="60" cy="39" rx="56" ry="35" fill="none" stroke="#9CA3AF" strokeWidth="9" />
              <path d="M38 58 V22 h13 l9 12 9-12 h13 v36 h-11 V38 l-11 14 -11-14 v20 z" fill="#1E4B8F" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1E4B8F", fontFamily: "Georgia, serif" }}>Masrouji Group</span>
              <span style={{ fontSize: 10.5, color: "#1E4B8F", fontWeight: 500 }}>مجموعة مسروجي</span>
            </div>
          </div>
        </div>

        <form onSubmit={submit} style={{
          background: C.white, border: `1px solid ${C.border}`, borderRadius: 16,
          padding: "26px 24px", boxShadow: "0 12px 40px rgba(15,23,42,.09)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.blueDark }}>نظام إدارة الأداء</div>
            <div style={{ fontSize: 12.5, color: C.grayMid, marginTop: 4 }}>قنوات التوزيع في الأردن</div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={label} htmlFor="email">البريد الإلكتروني</label>
            <input id="email" type="email" autoComplete="username" dir="ltr" style={field}
              value={email} onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = C.blue)}
              onBlur={(e) => (e.target.style.borderColor = C.border)} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={label} htmlFor="password">كلمة المرور</label>
            <input id="password" type="password" autoComplete="current-password" dir="ltr" style={field}
              value={password} onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = C.blue)}
              onBlur={(e) => (e.target.style.borderColor = C.border)} />
          </div>

          {err && (
            <div role="alert" style={{
              background: C.redLight, color: C.redText, border: `1px solid #FECACA`,
              borderRadius: 10, padding: "10px 12px", fontSize: 13, marginBottom: 14, fontWeight: 600,
            }}>{err}</div>
          )}
          {note && (
            <div role="status" style={{
              background: C.greenLight, color: C.greenText, border: `1px solid #BBF7D0`,
              borderRadius: 10, padding: "10px 12px", fontSize: 13, marginBottom: 14, fontWeight: 600,
            }}>{note}</div>
          )}

          <button type="submit" disabled={busy} style={{
            width: "100%", background: busy ? C.grayMid : C.blue, color: "#fff",
            border: "none", borderRadius: 10, padding: "12px 18px", fontSize: 14.5,
            fontWeight: 700, cursor: busy ? "default" : "pointer", fontFamily: "inherit",
            transition: "opacity .15s",
          }}>{busy ? "جارٍ التحقق…" : "تسجيل الدخول"}</button>

          <div style={{ textAlign: "center", marginTop: 14 }}>
            <button type="button" onClick={reset} disabled={busy} style={{
              background: "none", border: "none", color: C.blueText, fontSize: 12.5,
              fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline",
            }}>نسيت كلمة المرور؟</button>
          </div>
        </form>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11.5, color: C.grayMid, lineHeight: 1.7 }}>
          الحسابات يُنشئها مدير النظام. لا يوجد تسجيل ذاتي.
        </div>
      </div>
    </div>
  );
}
