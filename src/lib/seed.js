import { CATEGORIES, PRODUCTS, REPS } from "./constants.js";
import { dateOffset } from "./helpers.js";

export function seedData() {
  const names = [
    ["صيدلية الشفاء", "عمّان", "تلاع العلي"], ["صيدلية الحياة", "عمّان", "الصويفية"],
    ["صيدلية النور", "إربد", "شارع الجامعة"], ["صيدلية الرازي", "الزرقاء", "الزرقاء الجديدة"],
    ["صيدلية دواء كير", "عمّان", "خلدا"], ["صيدلية المدينة", "البلقاء", "السلط"],
    ["صيدلية البحر الأحمر", "العقبة", "وسط البلد"], ["صيدلية الأمل", "الكرك", "المرج"],
    ["صيدلية فارما ون", "عمّان", "عبدون"], ["صيدلية الياسمين", "مادبا", "وسط المدينة"],
    ["صيدلية الزيتون", "جرش", "شارع الملك عبدالله"], ["صيدلية السلام", "إربد", "الحصن"],
    ["صيدلية ميديكا", "عمّان", "الجاردنز"], ["صيدلية الوفاء", "المفرق", "وسط البلد"],
    ["صيدلية الروضة", "الزرقاء", "الرصيفة"], ["صيدلية عجلون الحديثة", "عجلون", "وسط المدينة"],
  ];
  const pharmacies = names.map(([name, gov, area], i) => ({
    id: "PH" + (i + 1),
    name, governorate: gov, city: gov, area,
    code: "ALS-" + String(1001 + i),
    category: CATEGORIES[i % 4],
    owner: ["د. محمد عودة", "د. رنا خليل", "د. يوسف حسن", "د. هالة عمر"][i % 4],
    mobile: "07901234" + String(10 + i),
    rep: REPS[i % 4],
    openDate: dateOffset(400 + i * 15),
    notes: "",
  }));
  // معاملات: توزيع الحالات — بعضها نشط، بعضها معرّض للخطر، بعضها مفقود
  const txs = [];
  let inv = 5000;
  pharmacies.forEach((p, i) => {
    const profile = i % 5; // 0-2 نشط، 3 خطر، 4 مفقود
    const lastGap = profile <= 2 ? 5 + i * 4 : profile === 3 ? 100 + i * 3 : 200 + i * 5;
    const orderCount = profile <= 2 ? 6 : profile === 3 ? 3 : 2;
    for (let o = 0; o < orderCount; o++) {
      const gap = lastGap + o * (30 + (i % 3) * 10);
      txs.push({
        id: "TX" + inv,
        date: dateOffset(gap),
        invoiceNo: "INV-" + inv++,
        pharmacyId: p.id,
        product: PRODUCTS[(i + o) % PRODUCTS.length],
        qty: 10 + ((i + o) % 6) * 5,
        value: 150 + ((i * 7 + o * 13) % 20) * 45,
      });
    }
  });
  return { pharmacies, transactions: txs, reviews: [] };
}

