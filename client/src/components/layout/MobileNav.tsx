import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useLocation } from 'wouter';
import {
  LayoutDashboard,
  PawPrint,
  Leaf,
  Warehouse,
  MoreHorizontal
} from 'lucide-react';

export default function MobileNav() {
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  
  const navItems = [
    {
      title: t('common.dashboard'),
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/',
      active: location === '/',
    },
    {
      title: t('common.crops'),
      icon: <Leaf className="h-5 w-5" />,
      path: '/crops',
      active: location === '/crops',
    },
    {
      title: t('common.inventory'),
      icon: <Warehouse className="h-5 w-5" />,
      path: '/inventory',
      active: location === '/inventory',
    },
    {
      title: t('common.more'),
      icon: <MoreHorizontal className="h-5 w-5" />,
      path: '/more',
      active: false,
    },
  ];
  
  return (
    <nav className="lg:hidden bg-white border-t border-gray-200 shadow-md flex items-center justify-around fixed bottom-0 left-0 right-0 px-4 py-2 z-10">
      {navItems.map((item, index) => (
        <a
          key={index}
          href={item.path}
          onClick={(e) => {
            e.preventDefault();
            setLocation(item.path);
          }}
          className={`flex flex-col items-center p-2 ${
            item.active ? 'text-primary' : 'text-gray-500 hover:text-primary'
          }`}
        >
          {item.icon}
          <span className="text-xs mt-1">{item.title}</span>
        </a>
      ))}
    </nav>
  );
}
