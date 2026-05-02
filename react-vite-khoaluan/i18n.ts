import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

i18n
  // i18next-http-backend
  // loads translations from your server
  // https://github.com/i18next/i18next-http-backend
  .use(Backend)
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: false,
    fallbackLng: "vi",
    // lng: "vi", // default language
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: {
      // Thứ tự i18next sẽ tìm ngôn ngữ
      // 1. localStorage -> 2. cookie -> 3. Ngôn ngữ trình duyệt
      order: [
        "localStorage",
        "cookie",
        "navigator",
        "htmlTag",
        "path",
        "subdomain",
      ],
      // Key để lưu trong localStorage
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
