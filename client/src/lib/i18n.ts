import { format, formatDistance, formatRelative } from 'date-fns';
import { enUS, pt } from 'date-fns/locale';
import { Language } from '@/context/LanguageContext';

// Date-fns locales mapping
const locales = {
  en: enUS,
  pt: pt,
};

// Format date based on current language
export const formatDate = (
  date: Date | string | number,
  formatString: string,
  language: Language
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString, {
    locale: locales[language],
  });
};

// Simple date formatter for common use (DD/MM/YYYY or MM/DD/YYYY)
export const formatDateSimple = (
  date: Date | string | number,
  language: Language
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatString = language === 'pt' ? 'dd/MM/yyyy' : 'MM/dd/yyyy';
  return format(dateObj, formatString, {
    locale: locales[language],
  });
};

// Format relative time based on current language
export const formatRelativeTime = (
  date: Date | number,
  baseDate: Date | number,
  language: Language
): string => {
  return formatRelative(date, baseDate, {
    locale: locales[language],
  });
};

// Format distance between dates based on current language
export const formatDistanceToNow = (
  date: Date | number,
  language: Language,
  addSuffix = true
): string => {
  return formatDistance(date, new Date(), {
    addSuffix,
    locale: locales[language],
  });
};

// Format currency based on location (Angola uses Kwanza)
export const formatCurrency = (
  amount: number,
  language: Language,
  currency = 'AOA'
): string => {
  return new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format number with locale-appropriate separators
export const formatNumber = (
  number: number | string,
  language: Language,
  options?: Intl.NumberFormatOptions
): string => {
  const numberValue = typeof number === 'string' ? parseFloat(number) : number;
  return new Intl.NumberFormat(language === 'pt' ? 'pt-PT' : 'en-US', options).format(numberValue);
};
