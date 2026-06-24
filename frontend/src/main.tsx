/* main.tsx boots the React application and mounts `App` into the DOM root element.
 * - it sets up StrictMode and renders the top-level `App` component.
 * - this file is the entry point referenced by `index.html` and Vite.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
