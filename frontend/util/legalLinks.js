import { Linking, Platform } from "react-native";

// Canonical, publicly-hosted policies (used for Google OAuth + Play Store verification).
export const PRIVACY_URL = "https://www.influmart.in/privacy.html";
export const TERMS_URL = "https://www.influmart.in/terms.html";

const openHosted = (file, fallback) => {
  const url =
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.origin + file
      : fallback;
  Linking.openURL(url);
};

// On web uses the current origin (works on localhost/preview); native opens prod.
export const openPrivacyPolicy = () => openHosted("/privacy.html", PRIVACY_URL);
export const openTerms = () => openHosted("/terms.html", TERMS_URL);
