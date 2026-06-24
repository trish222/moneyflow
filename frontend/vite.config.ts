/* vite.config.ts configures the Vite dev server and build for the frontend.
 * - sets up React plugin and Tailwind integration used during dev and build.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
