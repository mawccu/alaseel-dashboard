/*
  لكل حالة لونان: لون العلامة (تعبئة الرسم، الشريط الجانبي، النقطة) يحتاج
  تبايناً 3:1 مع الخلفية، ولون النص (الشارات، القيم) يحتاج 4.5:1.
  كانت الشارات الثلاث كلها ترسو تحت 4.5 (نشط 3.15، معرّض للخطر 3.35، مفقود 4.41).
  وبرتقالي #EA580C كان يبعد عن الأحمر ΔE 8.7 فقط للعين السليمة، وهما متجاوران
  في الرسم الدائري، فاستُبدل بكهرماني #F59E0B الذي يبعد 24.1.
*/
export const C = {
  blue: "#2563EB", blueDark: "#1E40AF", blueLight: "#EFF6FF", blueText: "#1D4ED8",
  green: "#16A34A", greenLight: "#F0FDF4", greenText: "#15803D",
  orange: "#EA580C", orangeLight: "#FFF7ED", orangeText: "#B45309",
  amber: "#F59E0B",
  red: "#DC2626", redLight: "#FEF2F2", redText: "#B91C1C",
  gray: "#334155", grayMid: "#64748B", grayLight: "#F1F5F9",
  border: "#E2E8F0", white: "#FFFFFF", bg: "#F8FAFC",
};
export const GOVS = ["عمّان", "إربد", "الزرقاء", "البلقاء", "العقبة", "الكرك", "مادبا", "جرش", "المفرق", "عجلون", "معان", "الطفيلة"];
export const CATEGORIES = ["فئة A - كبيرة", "فئة B - متوسطة", "فئة C - صغيرة", "سلسلة صيدليات"];
export const PRODUCTS = [
  // العناية بالبشرة
  "Face Milk - حليب الوجه",
  "SUNBLOCK - واقي شمس",
  "Serum Dermavita - سيروم ديرما فيتا",
  "Retinol Night Cream - كريم الريتنول الليلي",
  "Water Cream - ووتر كريم",
  "Face Mist - بخاخ الوجه",
  "Micellar Water - مزيل المكياج",
  "Foam Face Cleanser - غسول الوجه الرغوي",
  "Nail Oil - زيت الأظافر",
  "Body Butter Vanilla - زبدة الجسم فانيلا",
  "Body Butter Apple - زبدة الجسم تفاح",
  "Body Oil - زيت الجسم",
  // العناية بالشعر
  "Hair Oil - زيت الشعر",
  "Hair Mask - ماسك الشعر",
  "L-Arginine - ليف إن بخاخ للشعر",
  "L-Arginine - شامبو للشعر العادي",
  "L-Arginine - شامبو للشعر الجاف",
  "L-Arginine - شامبو للشعر الكيرلي",
  "L-Arginine - بلسم للشعر",
  "Eyelash Serum - سيروم الرموش والحواجب",
  "Adore - عطر الشعر",
  "Emily - عطر الشعر",
  "Floral - عطر الشعر",
  "Royalty - عطر الشعر",
];
export const REPS = ["أحمد خالد", "سارة محمود", "عمر النابلسي", "ليان الحديد"];
export const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
export const STORAGE_KEY = "alaseel-distributor-v1";

export const STATUS_META = {
  active: { label: "نشط", color: C.greenText, mark: C.green, bg: C.greenLight },
  risk: { label: "معرّض للخطر", color: C.orangeText, mark: C.amber, bg: C.orangeLight },
  lost: { label: "مفقود", color: C.redText, mark: C.red, bg: C.redLight },
};

/*
  اللون الذي يُمرَّر إلى زر أو شارة هو لون علامة، والنص المرسوم به أو فوقه
  يحتاج 4.5:1. الأخضر #16A34A يعطي 3.3 والبرتقالي #EA580C يعطي 3.56،
  فنُبدلهما بالدرجة الداكنة المقابلة عند استعمالهما كنص.
*/
const TEXT_SAFE = { [C.green]: C.greenText, [C.orange]: C.orangeText, [C.amber]: C.orangeText, [C.red]: C.redText };
export const readable = (c) => TEXT_SAFE[c] || c;

export const lbl = { fontSize: 12, color: C.grayMid, fontWeight: 600, display: "block", marginBottom: 4 };
