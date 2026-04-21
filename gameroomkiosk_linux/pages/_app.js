import { useEffect } from "react";
import "../styles/global.css";

const APP_CACHE_PREFIXES = ["gameroom-static-", "gameroom-pages-"];

async function unregisterDevelopmentServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map((registration) => registration.unregister()),
  );

  if (!("caches" in window)) {
    return;
  }

  const cacheKeys = await caches.keys();
  await Promise.all(
    cacheKeys
      .filter((key) =>
        APP_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)),
      )
      .map((key) => caches.delete(key)),
  );
}

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      unregisterDevelopmentServiceWorkers().catch((err) => {
        console.warn("[SW] Dev cleanup failed:", err);
      });
      return;
    }

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SW] Registered, scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[SW] Registration failed:", err);
        });
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
