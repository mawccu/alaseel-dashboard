export const fmtNum = (n) => new Intl.NumberFormat("ar-JO", { maximumFractionDigits: 0 }).format(n || 0);
export const fmtJD = (n) => fmtNum(n) + " د.أ";
export const fmtPct = (n) => (n > 0 ? "+" : "") + (n || 0).toFixed(1) + "%";
export const daysAgo = (dateStr) => Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
export const isoDate = (d) => d.toISOString().slice(0, 10);
export const dateOffset = (days) => isoDate(new Date(Date.now() - days * 86400000));

export const statusOf = (lastOrder) => {
  if (!lastOrder) return "lost";
  const d = daysAgo(lastOrder);
  if (d <= 90) return "active";
  if (d <= 180) return "risk";
  return "lost";
};
