"use client";

import * as React from "react";
import { DEFAULT_LANGUAGE, getStoredLanguage, i18next, LANGUAGE_STORAGE_KEY, type AppLanguage } from "@/lib/i18n";

type I18nContextValue = {
  language: AppLanguage;
  changeLanguage: (language: AppLanguage) => Promise<void>;
  t: (key: string) => string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = React.useState<AppLanguage>(DEFAULT_LANGUAGE);

  React.useEffect(() => {
    const storedLanguage = getStoredLanguage();
    void i18next.changeLanguage(storedLanguage);
    setLanguage(storedLanguage);
    document.documentElement.lang = storedLanguage;

    const handleLanguageChanged = (nextLanguage: string) => {
      const normalizedLanguage = (nextLanguage || DEFAULT_LANGUAGE) as AppLanguage;
      setLanguage(normalizedLanguage);
      document.documentElement.lang = normalizedLanguage;
    };

    i18next.on("languageChanged", handleLanguageChanged);
    return () => {
      i18next.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  const changeLanguage = React.useCallback(async (nextLanguage: AppLanguage) => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    await i18next.changeLanguage(nextLanguage);
  }, []);

  const value = React.useMemo<I18nContextValue>(
    () => ({
      language,
      changeLanguage,
      t: (key: string) => i18next.t(key),
    }),
    [changeLanguage, language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider.");
  }

  return context;
}
