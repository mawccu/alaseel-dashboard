/*
  إعدادات مشتركة للرسوم.

  ما كان يكسر التخطيط:
  - محور الأرقام بعرض 55px لا يتسع لرقم مثل "١٤٬٠٠٠" بخط Tajawal، فكان يُقصّ
    إلى "١٤" و"٧٠" فتبدو أرقاماً خاطئة لا مقصوصة.
  - أسماء المنتجات ثنائية اللغة طويلة، وrecharts يلفّها داخل عرض المحور،
    فتتحوّل إلى أشرطة عمودية متراكبة فوق الأعمدة.
  - ارتفاع ثابت 300px مع 21 منتجاً يترك 14px للصف الواحد، فتتراكب الأسماء.
*/

// عرض محور الأرقام. يتسع لخمسة أرقام عربية مع الفواصل.
export const Y_NUM = 78;
// محور عددي صغير (أعداد صحيحة قليلة الخانات).
export const Y_NUM_SM = 44;
// عرض محور الفئات النصية.
export const Y_CAT = 176;

export const TICK = { fontSize: 11, fontFamily: "Tajawal" };
export const TICK_SM = { fontSize: 10.5, fontFamily: "Tajawal" };

// قصّ بدل الالتفاف: سطر واحد لا يتراكب مع جاره.
export const cut = (n) => (s) => {
  const t = String(s ?? "");
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
};

// ارتفاع يتناسب مع عدد الفئات بدل رقم ثابت.
export const barsHeight = (count, per = 30, min = 260) => Math.max(min, count * per + 64);

// شبكة بخط شعري متصل. التقطيع (strokeDasharray) ضوضاء بصرية ويُقرأ كأنه
// عتبة أو إسقاط بينما هو مجرد شبكة.
export const GRID = { stroke: "#EEF2F6", strokeWidth: 1, vertical: false };

// المبيعات بالدينار تُرسم بالأزرق في كل مكان. كان رسم "أفضل المنتجات" أخضر
// بينما يقيس نفس المقدار، فيبدو اللون كأنه يحمل معنى وهو لا يحمله.
export const SALES = "#2563EB";

// نهايات مستديرة رفيعة مثبّتة على خط الأساس.
export const R_H = [0, 5, 5, 0];
export const R_V = [5, 5, 0, 0];

// تسميات المحور الأفقي العربية تتصادم أفقياً، فنميلها ونحجز لها ارتفاعاً.
export const angledX = {
  interval: 0,
  angle: -35,
  textAnchor: "end",
  height: 74,
  tick: TICK,
};
