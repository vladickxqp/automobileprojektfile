import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ru from "./locales/ru.json";
import de from "./locales/de.json";

export const resources = {
  en: { translation: en },
  ru: { translation: ru },
  de: { translation: de },
} as const;

export const supportedLngs = ["en", "ru", "de"] as const;

const deviceLng = getLocales()[0]?.languageCode ?? "en";
const initialLng = (supportedLngs as readonly string[]).includes(deviceLng) ? deviceLng : "en";

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
