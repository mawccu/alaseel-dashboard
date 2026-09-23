import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Built into docs/ so GitHub Pages can serve it straight from main.
export default defineConfig({
  plugins: [react()],
  // مسارات نسبية: نفس البناء يعمل على نطاق جذري (Cloudflare Pages)
  // وعلى مسار فرعي (GitHub Pages) دون إعادة بناء.
  base: "./",
  build: { outDir: "docs", emptyOutDir: true },
});