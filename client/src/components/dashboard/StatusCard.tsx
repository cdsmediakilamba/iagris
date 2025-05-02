import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { formatCurrency, formatNumber } from '@/lib/i18n';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: {
    value: string | number;
    direction: 'up' | 'down';
    label: string;
  };
  isCurrency?: boolean;
}

export default function StatusCard({ title, value, icon, trend, isCurrency = false }: StatusCardProps) {
  const { language } = useLanguage();
  
  const formattedValue = isCurrency 
    ? formatCurrency(typeof value === 'string' ? parseInt(value) : value, language)
    : typeof value === 'number' 
      ? formatNumber(value, language)
      : value;
      
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <h3 className="text-2xl font-medium">{formattedValue}</h3>
          </div>
          <div className="rounded-full bg-primary bg-opacity-10 p-2">
            {icon}
          </div>
        </div>
        <div className="flex items-center text-xs">
          <span className={`flex items-center ${trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend.direction === 'up' ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {trend.value}
          </span>
          <span className="text-gray-500 ml-2">{trend.label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
