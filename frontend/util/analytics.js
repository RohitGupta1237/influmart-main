import { Platform } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_ENDPOINT from "../config";

// ── First-party visit tracking (web + app) ─────────────────────────────────
const genId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

let cachedVisitorId = null;
const getVisitorId = async () => {
  if (cachedVisitorId) return cachedVisitorId;
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      let id = localStorage.getItem("imart_vid");
      if (!id) { id = genId(); localStorage.setItem("imart_vid", id); }
      cachedVisitorId = id;
      return id;
    }
    let id = await AsyncStorage.getItem("imart_vid");
    if (!id) { id = genId(); await AsyncStorage.setItem("imart_vid", id); }
    cachedVisitorId = id;
    return id;
  } catch (e) {
    return genId();
  }
};

// Record one page/screen view to our own backend. Fire-and-forget.
export const trackVisit = async (path) => {
  try {
    const visitorId = await getVisitorId();
    axios
      .post(`${API_ENDPOINT}/track/visit`, {
        visitorId,
        path: path || "",
        platform: Platform.OS === "web" ? "web" : "app",
      })
      .catch(() => {});
  } catch (e) {}
};

// Lightweight analytics wrapper.
// - Web only (native app analytics would use posthog-react-native + a rebuild).
// - No-ops safely when EXPO_PUBLIC_POSTHOG_KEY is not set, so nothing breaks
//   until you create a PostHog project and add the key to your env / Vercel.
let posthog = null;

export const initAnalytics = () => {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  // Vercel Web Analytics — inject the script Vercel serves at this path once
  // Web Analytics is enabled in the project dashboard. Auto-tracks pageviews /
  // visitors / Web Vitals. (Same endpoint @vercel/analytics uses internally.)
  try {
    if (!document.getElementById("vercel-analytics")) {
      window.va =
        window.va ||
        function () {
          (window.vaq = window.vaq || []).push(arguments);
        };
      const s = document.createElement("script");
      s.id = "vercel-analytics";
      s.defer = true;
      s.src = "/_vercel/insights/script.js";
      document.head.appendChild(s);
    }
  } catch (e) {}

  // PostHog — product events & funnels. No-op until a key is set.
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  try {
    const ph = require("posthog-js").default;
    ph.init(key, {
      api_host: process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: true, // auto pageviews
      autocapture: true, // auto clicks/inputs → funnels without manual events
      person_profiles: "identified_only",
    });
    posthog = ph;
  } catch (e) {
    // never let analytics break the app
  }
};

// Fire a custom event, e.g. track("deal_sealed", { price }).
export const track = (event, props) => {
  try {
    if (posthog) posthog.capture(event, props);
  } catch (e) {}
};

// Tie events to a user once they log in.
export const identifyUser = (id, props) => {
  try {
    if (posthog && id) posthog.identify(String(id), props);
  } catch (e) {}
};
