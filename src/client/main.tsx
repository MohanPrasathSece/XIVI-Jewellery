import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadRazorpayCheckout } from "./lib/razorpay";
import { Analytics } from "@vercel/analytics/react";

// Preload Razorpay SDK to eliminate delay during checkout
loadRazorpayCheckout().catch(() => {
  // Silently fail - will be retried when needed
});

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Analytics />
  </>
);
