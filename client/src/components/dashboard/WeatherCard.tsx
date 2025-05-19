import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { CloudRain, CloudSun, Sun, Cloud, CloudLightning, CloudSnow, CloudDrizzle, Wind } from 'lucide-react';

interface WeatherDay {
  day: string;
  icon: string;
  temperature: number;
}

interface WeatherCardProps {
  location: string;
  apiKey?: string;
}

export default function WeatherCard({ 
  location,
  apiKey = 'af1a0f9f1f6ef7d2adce861e96489c4b' // OpenWeatherMap API key
}: WeatherCardProps) {
  const { t } = useLanguage();
  const [temperature, setTemperature] = useState<number>(0);
  const [condition, setCondition] = useState<string>('clear');
  const [forecast, setForecast] = useState<WeatherDay[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getWeatherIcon = (condition: string, size = 'large') => {
    const largeClass = "h-12 w-12";
    const smallClass = "h-5 w-5";
    const iconClass = size === 'large' ? largeClass : smallClass;
    
    switch (condition) {
      case 'clear':
        return <Sun className={`${iconClass} text-amber-400`} />;
      case 'clouds':
        return <Cloud className={`${iconClass} text-gray-400`} />;
      case 'few clouds':
      case 'scattered clouds':
      case 'broken clouds':
        return <CloudSun className={`${iconClass} text-gray-400`} />;
      case 'rain':
      case 'shower rain':
        return <CloudRain className={`${iconClass} text-blue-400`} />;
      case 'thunderstorm':
        return <CloudLightning className={`${iconClass} text-purple-400`} />;
      case 'snow':
        return <CloudSnow className={`${iconClass} text-blue-200`} />;
      case 'mist':
      case 'fog':
      case 'haze':
        return <CloudDrizzle className={`${iconClass} text-gray-300`} />;
      case 'drizzle':
        return <CloudDrizzle className={`${iconClass} text-blue-300`} />;
      default:
        return <Sun className={`${iconClass} text-amber-400`} />;
    }
  };
  
  // Map OpenWeatherMap weather conditions to our component conditions
  const mapWeatherCondition = (apiCondition: string): string => {
    const condition = apiCondition.toLowerCase();
    if (condition.includes('clear')) return 'clear';
    if (condition.includes('cloud')) return 'clouds';
    if (condition.includes('rain')) return 'rain';
    if (condition.includes('drizzle')) return 'drizzle';
    if (condition.includes('thunderstorm')) return 'thunderstorm';
    if (condition.includes('snow')) return 'snow';
    if (condition.includes('mist') || condition.includes('fog') || condition.includes('haze')) return 'mist';
    return 'clear';
  };
  
  // Convert weekday number to name
  const getDayName = (dayNum: number): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNum];
  };
  
  // Fetch weather data from OpenWeatherMap API
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!location) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Fetch current weather
        const currentWeatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}`
        );
        
        // Extract current weather data
        const currentData = currentWeatherResponse.data;
        setTemperature(Math.round(currentData.main.temp));
        setCondition(mapWeatherCondition(currentData.weather[0].main));
        
        // Fetch 5-day forecast
        const forecastResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}`
        );
        
        // Process forecast data (we need daily forecast, not 3-hour intervals)
        const forecastList = forecastResponse.data.list;
        const dailyForecasts: WeatherDay[] = [];
        
        // Process the first 4 days (skipping today)
        const processedDates = new Set<string>();
        
        for (const item of forecastList) {
          const date = new Date(item.dt * 1000);
          const dateStr = date.toDateString();
          
          // Skip today and already processed days
          if (date.getDate() === new Date().getDate() || processedDates.has(dateStr)) {
            continue;
          }
          
          // Add this day to forecast
          dailyForecasts.push({
            day: getDayName(date.getDay()),
            icon: mapWeatherCondition(item.weather[0].main),
            temperature: Math.round(item.main.temp)
          });
          
          processedDates.add(dateStr);
          
          // We only need 4 days of forecast
          if (dailyForecasts.length >= 4) {
            break;
          }
        }
        
        setForecast(dailyForecasts);
        setLastUpdated(new Date().toLocaleString());
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setIsLoading(false);
      }
    };
    
    setIsLoading(true);
    fetchWeatherData();
  }, [location, apiKey]);

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
            {t(`dashboard.${condition}`, condition)}
          </div>
          <div className="text-gray-500 text-sm">
            {location}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {forecast.map((day, index) => (
            <div key={index} className="p-2">
              <div className="font-medium">
                {t(`dashboard.weekDays.${day.day}`, day.day)}
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
