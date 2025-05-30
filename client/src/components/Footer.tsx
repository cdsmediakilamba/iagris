import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-gray-100 border-t py-4 px-6 mt-auto">
      <div className="text-center text-sm text-gray-600">
        © 2025 {t('common.allRightsReserved')}
      </div>
    </footer>
  );
}