import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely suppress benign WebSocket / Vite HMR errors and warnings that trigger workspace overlays
if (typeof window !== "undefined") {
  const ignorePatterns = ["WebSocket", "vite", "HMR", "ws://", "wss://", "closed without opened"];

  const shouldIgnore = (msg: any) => {
    if (!msg) return false;
    const str = String(msg);
    return ignorePatterns.some(pattern => str.toLowerCase().includes(pattern.toLowerCase()));
  };

  // Intercept unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason?.message || event.reason?.stack || String(event.reason);
    if (shouldIgnore(reason)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, { capture: true });

  // Intercept standard window errors
  window.addEventListener("error", (event) => {
    const msg = event.message || String(event.error);
    if (shouldIgnore(msg)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, { capture: true });

  // Intercept console.warn to suppress platform overlays
  const originalWarn = console.warn;
  console.warn = function (...args) {
    if (args.some(arg => shouldIgnore(arg))) {
      return; // Silence completely
    }
    originalWarn.apply(console, args);
  };

  // Intercept console.error to suppress platform overlays
  const originalError = console.error;
  console.error = function (...args) {
    if (args.some(arg => shouldIgnore(arg))) {
      return; // Silence completely
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

