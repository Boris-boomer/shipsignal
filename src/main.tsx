import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import { Providers } from "./app/providers";
import "./i18n";
import "./index.css";

const bootT0 = performance.now();
console.log(
  `[boot] main.tsx evaluated at ${bootT0.toFixed(0)}ms (page origin)`
);

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("#root not found in index.html");
}

console.log("[boot] mounting React tree …");
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>
);

window.addEventListener("load", () => {
  console.log(
    `[boot] window load event at ${performance.now().toFixed(0)}ms`
  );
});