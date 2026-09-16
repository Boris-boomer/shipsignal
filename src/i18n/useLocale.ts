import { useTranslation } from "react-i18next";
import { setSetting } from "@/lib/db";
import type { Locale } from "./index";

export function useLocale() {
  const { i18n } = useTranslation();
  const locale: Locale =
    i18n.language === "en" ? "en" : ("zh" as Locale);

  async function setLocale(next: Locale) {
    await i18n.changeLanguage(next);
    await setSetting("locale", next);
  }

  return { locale, setLocale };
}