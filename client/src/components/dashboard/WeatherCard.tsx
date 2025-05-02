import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { CloudRain, CloudSun, Sun } from 'lucide-react';

interface WeatherDay {
  day: string;
  icon: 'sunny' | 'cloudy' | 'rainy';
  temperature: number;
}

interface WeatherCardProps {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy';
  location: string;
  forecast: WeatherDay[];
  lastUpdated: string;
  isLoading?: boolean;
}

export default function WeatherCard({ 
  temperature, 
  condition, 
  location, 
  forecast, 
  lastUpdated,
  isLoading = false
}: WeatherCardProps) {
  const { t } = useLanguage();

  const getWeatherIcon = (condition: string, size = 'large') => {
    switch (condition) {
      case 'sunny':
        return size === 'large' ? 
          <Sun className="h-12 w-12 text-amber-400" /> : 
          <Sun className="h-5 w-5 text-amber-400" />;
      case 'cloudy':
        return size === 'large' ? 
          <CloudSun className="h-12 w-12 text-gray-400" /> : 
          <CloudSun className="h-5 w-5 text-gray-400" />;
      case 'rainy':
        return size === 'large' ? 
          <CloudRain className="h-12 w-12 text-blue-400" /> : 
          <CloudRain className="h-5 w-5 text-blue-400" />;
      default:
        return size === 'large' ? 
          <Sun className="h-12 w-12 text-amber-400" /> : 
          <Sun className="h-5 w-5 text-amber-400" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.weather')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse flex flex-col items-center mb-4">
            <div className="rounded-full bg-gray-200 h-12 w-12 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse p-2">
                <div className="h-4 bg-gray-200 rounded mb-2 mx-auto w-8"></div>
                <div className="h-5 w-5 bg-gray-200 rounded-full mx-auto mb-1"></div>
                <div className="h-4 bg-gray-200 rounded mx-auto w-10"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.weather')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-4">
          {getWeatherIcon(condition)}
          <div className="text-3xl font-medium">{temperature}°C</div>
          <div className="text-gray-500 text-sm">
            {t(`dashboard.${condition}`)}
          </div>
          <div className="text-gray-500 text-sm">
            {location}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {forecast.map((day, index) => (
            <div key={index} className="p-2">
              <div className="font-medium">
                {t(`dashboard.weekDays.${day.day}`)}
              </div>
              {getWeatherIcon(day.icon, 'small')}
              <div>{day.temperature}°C</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-gray-500 text-center mt-2">
          {t('dashboard.lastUpdated')}: {lastUpdated}
        </div>
      </CardContent>
    </Card>
  );
}
