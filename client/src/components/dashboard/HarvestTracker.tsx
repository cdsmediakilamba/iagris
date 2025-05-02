import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/context/LanguageContext';
import { Crop } from '@shared/schema';
import { formatRelativeTime } from '@/lib/i18n';
import { CalendarIcon, MapPin, Leaf } from 'lucide-react';

interface HarvestTrackerProps {
  crops: Crop[];
  progressPercentage: number;
  isLoading?: boolean;
}

export default function HarvestTracker({ crops, progressPercentage, isLoading = false }: HarvestTrackerProps) {
  const { t, language } = useLanguage();

  const formatHarvestDate = (date: Date | null | undefined) => {
    if (!date) return '-';
    return formatRelativeTime(new Date(date), new Date(), language);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.upcomingHarvests')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-2 bg-gray-200 rounded mb-2"></div>
            <div className="flex justify-between text-xs mb-4">
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-3 bg-gray-200 rounded w-8"></div>
            </div>
            
            <div className="space-y-4 mt-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex">
                  <div className="flex-shrink-0 h-12 w-12 rounded-md bg-gray-200 mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-36 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-28"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.upcomingHarvests')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs mt-1">
            <span>{t('dashboard.progress')}</span>
            <span>{progressPercentage}%</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {crops.length > 0 ? (
            crops.slice(0, 3).map((crop) => (
              <div key={crop.id} className="flex">
                <div className="flex-shrink-0 h-12 w-12 rounded-md bg-primary bg-opacity-10 flex items-center justify-center mr-3">
                  <Leaf className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-medium">{crop.name}</h4>
                  <div className="flex items-center text-xs text-gray-500">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    <span>{t('dashboard.estHarvest')}: {formatHarvestDate(crop.expectedHarvestDate)}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{t('dashboard.sector')}: {crop.sector}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              {t('crops.noCrops')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
