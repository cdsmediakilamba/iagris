import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { Inventory } from '@shared/schema';
import { formatNumber } from '@/lib/i18n';

interface InventoryAlertProps {
  items: Inventory[];
  isLoading?: boolean;
  onOrder?: (itemId: number) => void;
}

export default function InventoryAlert({ items, isLoading = false, onOrder }: InventoryAlertProps) {
  const { t, language } = useLanguage();

  const getCriticalIcon = (quantity: number, minimumLevel: number | null | undefined) => {
    if (!minimumLevel) return null;
    
    // If quantity is less than 50% of minimum level, show high priority alert
    if (quantity <= minimumLevel * 0.5) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    
    // If quantity is below minimum level but above 50%, show medium priority alert
    return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex justify-between items-center pb-2">
          <CardTitle>{t('dashboard.criticalInventory')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center justify-between py-2 border-b border-gray-200">
              <div className="flex items-center">
                <div className="h-5 w-5 bg-gray-200 rounded-full mr-2"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center pb-2">
        <CardTitle>{t('dashboard.criticalInventory')}</CardTitle>
        <Button variant="link" className="text-primary" onClick={() => window.location.href = '/inventory'}>
          {t('common.viewAll')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200">
              <div className="flex items-center">
                {getCriticalIcon(item.quantity, item.minimumLevel)}
                <div className="ml-2">
                  <div className="font-medium">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t('inventory.stockLevel')}: {formatNumber(item.quantity, language)} {item.unit}
                  </div>
                </div>
              </div>
              <Button 
                variant="link" 
                className="text-primary hover:underline text-sm"
                onClick={() => onOrder && onOrder(item.id)}
              >
                {t('dashboard.order')}
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            {t('inventory.noItems')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
