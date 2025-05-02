import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations } from '@/translations';

export type Language = 'pt' | 'en';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with localStorage value or default to Portuguese
  const [language, setLanguageState] = useState<Language>(
    () => (localStorage.getItem('language') as Language) || 'pt'
  );

  // Update localStorage and state when language changes
  const setLanguage = (lang: Language) => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
    // Set html lang attribute for accessibility
    document.documentElement.lang = lang;
  };

  // Translation function
  const t = (key: string): string => {
    const translationObj = translations[language];
    const keyParts = key.split('.');
    
    // Navigate through nested translation objects
    let result = translationObj;
    for (const part of keyParts) {
      if (result && result[part]) {
        result = result[part];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return the key if translation not found
      }
    }
    
    return result as string;
  };

  // Set initial html lang attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
