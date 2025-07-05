import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { AlertTriangle, AlertCircle, Package, ArrowRight } from 'lucide-react';
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
    // Convert to numbers to avoid NaN issues
    const qtyNum = Number(quantity) || 0;
    const minLevel = Number(minimumLevel) || 0;
    
    if (!minLevel) return <Package className="h-5 w-5 text-gray-400" />;
    
    // If quantity is less than 50% of minimum level, show high priority alert
    if (qtyNum <= minLevel * 0.5) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    
    // If quantity is below minimum level but above 50%, show medium priority alert
    return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  };

  const getCriticalBadge = (quantity: number, minimumLevel: number | null | undefined) => {
    const qtyNum = Number(quantity) || 0;
    const minLevel = Number(minimumLevel) || 0;
    
    if (!minLevel) return null;
    
    if (qtyNum <= minLevel * 0.5) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {t('inventory.critical')}
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        {t('inventory.low')}
      </span>
    );
  };

  // Limit to first 5 items for better UX
  const displayItems = items.slice(0, 5);
  


  if (isLoading) {
    return (
      <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2 text-red-500" />
              {t('dashboard.criticalInventory')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gray-200 rounded-full mr-3"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Package className="h-5 w-5 mr-2 text-red-500" />
            {t('dashboard.criticalInventory')}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-primary hover:text-primary-dark hover:bg-primary/10 transition-colors"
            onClick={() => window.location.href = '/inventory'}
          >
            {t('common.viewAll')}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {displayItems.length > 0 ? (
          displayItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border border-gray-100 p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div className="flex-shrink-0 mr-3">
                    {getCriticalIcon(Number(item.quantity) || 0, Number(item.minimumLevel) || 0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate text-base">
                          {item.name}
                        </h4>
                        {item.category && (
                          <p className="text-xs text-gray-500 capitalize">
                            {item.category}
                          </p>
                        )}
                      </div>
                      {getCriticalBadge(Number(item.quantity) || 0, Number(item.minimumLevel) || 0)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">
                        {formatNumber(Number(item.quantity) || 0, language)} {item.unit}
                      </span>
                      {item.minimumLevel && (
                        <span className="text-gray-500 ml-1">
                          / {formatNumber(Number(item.minimumLevel) || 0, language)} {item.unit} {t('inventory.minimum')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">{t('inventory.noItems')}</p>
          </div>
        )}
        
        {items.length > 5 && (
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {t('dashboard.showing')} 5 {t('dashboard.of')} {items.length} {t('dashboard.criticalItems')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
