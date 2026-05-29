import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing root element");

createRoot(rootElement).render(
  <StrictMode>
