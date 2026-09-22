import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Built into docs/ so GitHub Pages can serve it straight from main.
export default defineConfig({
  plugins: [react()],
  base: "/alaseel-dashboard/",
  build: { outDir: "docs", emptyOutDir: true },
});
