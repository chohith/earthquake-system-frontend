"use client";

import { I18nextProvider } from "react-i18next";
import i18n from "../lib/i18n";
import React, { useEffect } from "react";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleLangChange = (lng: string) => {
      // Languages like Arabic (ar) or Urdu (ur) require RTL layout.
      document.documentElement.dir = (lng === 'ar' || lng === 'ur') ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
    };
    
    // Subscribe to i18n changes
    i18n.on('languageChanged', handleLangChange);
    // Initialize
    handleLangChange(i18n.language);
    
    return () => { i18n.off('languageChanged', handleLangChange); };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
