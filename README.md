# ALASEEL × Masrouji: نظام إدارة الأداء

Performance-management dashboard for ALASEEL Cosmetics distribution channels in Jordan,
run with Masrouji Group. Arabic (RTL), built with Vite + React, backed by Supabase.

**Live:** https://mawccu.github.io/alaseel-dashboard/

## What it does

Seven sections:

| Tab | What it shows |
|---|---|
| لوحة القيادة | 10 KPIs, monthly sales trend, sales by governorate, account-status donut, top products, top customers |
| قاعدة الصيدليات | Full pharmacy CRUD: code, category, owner, mobile, rep, first/last order, YTD, avg invoice, order gap, status |
| حركات المبيعات | Invoice CRUD, filtered totals, CSV export |
| التوزيع الجغرافي | Sales and account health per governorate, with share-of-sales bars |
| تحليل العملاء | Top 20 / bottom 20 / new / reactivated / lost |
| أداء المنتجات | Per-product sales, growth, buying-pharmacy count, share |
| المراجعة الشهرية | Monthly review form (achievements, challenges, competitors, opportunities, next-month plan) |

Account status is derived from the last order date: **نشط** ≤ 90 days, **معرّض للخطر** 91 to 180, **مفقود** > 180.

Exports: Excel (two sheets) and CSV. Print/PDF via the browser, with `.no-print` chrome hidden.

## Stack

- **Vite + React 18**, plain JSX
- **recharts** for charts, **xlsx** for the Excel export
- **Supabase** (Postgres) for storage, plus a localStorage mirror so the app keeps working offline

## Database

Project `alaseel-distributor`, region Central EU (Frankfurt).
Schema lives in [`supabase/schema.sql`](supabase/schema.sql): tables `pharmacies`, `transactions`
and `reviews`. Run it once in the Supabase SQL editor.

`src/lib/config.js` holds the project URL and the **publishable** browser key. That key is meant to
be public; access is governed by the RLS policies in the schema.

> **Note on access:** the policies are deliberately open to the anon key. There is no login, so
> anyone with the app URL can read and write. That suits an internal tool. Do not put anything in
> this database you would not show to everyone who has the link. To lock it down later, add Supabase
> Auth and replace the `open access` policies with role-gated ones.

The data layer (`src/lib/store.js`) keeps the original whole-object save contract: the app hands it
the full dataset and it reconciles rows against Postgres (upsert what exists, delete what no longer
does), pharmacies first so the `transactions.pharmacy_id` foreign key stays satisfied.

On first run against an empty database the app seeds the demo dataset (16 pharmacies, 75 invoices)
and writes it to Supabase. **إعادة تهيئة البيانات** in the header regenerates it.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173/alaseel-dashboard/
npm run build      # -> docs/
npm run preview
```

## Deploying

`vite build` writes to `docs/`, and GitHub Pages serves `main` at `/docs`. So:

```bash
npm run build
git add -A && git commit -m "rebuild" && git push
```

`base` in `vite.config.js` is `/alaseel-dashboard/` and must match the repo name.

## Origin

Ported from a single-file Claude artifact (`alaseel-distributor-dashboard.jsx`, 1010 lines). The
components were split out by line range, so the UI is byte identical to the original. The only
rewritten part is persistence, which moved from the artifact's `window.storage` to Supabase.
