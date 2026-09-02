import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language } from '@/types/compass';
import { translations } from '@/lib/translations';

const LANGUAGE_STORAGE_KEY = 'com.hcompass.app_language';

type TranslationKey = {
  [K in keyof typeof translations['hi']]: (typeof translations['hi'])[K] extends string ? K : never;
}[keyof typeof translations['hi']];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'hi') return saved;
    } catch {}
    return 'hi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'hi' ? 'en' : 'hi');
  };

  const t = (key: TranslationKey): string => {
    const val = translations[language][key] || translations['hi'][key];
    return typeof val === 'string' ? val : String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
