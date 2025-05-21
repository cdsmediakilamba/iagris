import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { CloudRain, CloudSun, Sun, Cloud, CloudLightning, CloudSnow, CloudDrizzle, Wind, ChevronDown, ChevronUp, Droplets, Thermometer } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WeatherDay {
  day: string;
  icon: string;
  temperature: number;
  minTemp?: number;
  maxTemp?: number;
  humidity?: number;
  windSpeed?: number;
  description?: string;
  date?: Date;
}

// Lista de cidades de Angola
const angolanCities = [
  { value: "Luanda", label: "Luanda" },
  { value: "Benguela", label: "Benguela" },
  { value: "Huambo", label: "Huambo" },
  { value: "Lubango", label: "Lubango" },
  { value: "Malanje", label: "Malanje" },
  { value: "Lobito", label: "Lobito" },
  { value: "Namibe", label: "Namibe" },
  { value: "Cabinda", label: "Cabinda" },
  { value: "Soyo", label: "Soyo" },
  { value: "Uíge", label: "Uíge" },
  { value: "Kuito", label: "Kuito" },
  { value: "Saurimo", label: "Saurimo" },
  { value: "Menongue", label: "Menongue" },
  { value: "Dundo", label: "Dundo" },
  { value: "Sumbe", label: "Sumbe" },
  { value: "Ndalatando", label: "N'dalatando" },
  { value: "Ondjiva", label: "Ondjiva" },
  { value: "Cuito Cuanavale", label: "Cuito Cuanavale" },
  { value: "Caxito", label: "Caxito" },
  { value: "Mbanza Congo", label: "Mbanza Congo" }
];

export default function WeatherCard(): React.ReactElement {
  const { t } = useLanguage();
  
  // Estados do componente
  const [selectedCity, setSelectedCity] = useState<string>("Luanda");
  const [temperature, setTemperature] = useState<number>(0);
  const [condition, setCondition] = useState<string>('clear');
  const [forecast, setForecast] = useState<WeatherDay[]>([]);
  const [extendedForecast, setExtendedForecast] = useState<WeatherDay[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showExtendedForecast, setShowExtendedForecast] = useState<boolean>(false);

  // Função para obter o ícone do clima com base na condição
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
  
  // Mapear condições climáticas da API para nossos ícones
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
  
  // Converter número do dia da semana para nome
  const getDayName = (dayNum: number): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNum];
  };
  
  // Função para lidar com a mudança de cidade selecionada
  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    setIsLoading(true);
  };
  
  // Buscar dados climáticos da OpenWeatherMap API
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!selectedCity) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Obter a chave da API do servidor
        const apiKeyResponse = await fetch('/api/weather/key');
        const apiKeyData = await apiKeyResponse.json();
        const weatherApiKey = apiKeyData.key;
        
        if (!weatherApiKey) {
          console.error('No API key available');
          setIsLoading(false);
          return;
        }
        
        // Buscar clima atual com código do país para Angola (AO)
        const cityQuery = `${selectedCity},AO`;
        const currentWeatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityQuery)}&units=metric&appid=${weatherApiKey}`
        );
        
        // Extrair dados climáticos atuais
        const currentData = currentWeatherResponse.data;
        setTemperature(Math.round(currentData.main.temp));
        setCondition(mapWeatherCondition(currentData.weather[0].main));
        
        // Buscar previsão de 5 dias
        const forecastResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityQuery)}&units=metric&appid=${weatherApiKey}`
        );
        
        // Processar dados de previsão (precisamos de previsão diária, não intervalos de 3 horas)
        const forecastList = forecastResponse.data.list;
        
        // Previsão básica para exibição (próximos 4 dias)
        const dailyForecasts: WeatherDay[] = [];
        
        // Previsão estendida (todos os dias disponíveis com mais detalhes)
        const extendedForecasts: WeatherDay[] = [];
        
        // Rastrear datas processadas para previsão básica
        const processedDates = new Set<string>();
        
        // Mapa para coletar todas as previsões para cada dia - ajuda a calcular médias de temperatura
        const dailyForecastMap = new Map<string, any[]>();
        
        // Agrupar itens de previsão por dia
        for (const item of forecastList) {
          const date = new Date(item.dt * 1000);
          const dateStr = date.toDateString();
          
          // Pular hoje
          if (date.getDate() === new Date().getDate()) {
            continue;
          }
          
          // Adicionar ao mapa de previsões diárias
          if (!dailyForecastMap.has(dateStr)) {
            dailyForecastMap.set(dateStr, []);
          }
          dailyForecastMap.get(dateStr)?.push(item);
        }
        
        // Processar previsões diárias
        dailyForecastMap.forEach((items, dateStr) => {
          if (items.length === 0) return;
          
          // Obter a previsão do meio-dia como representativa do dia
          // Ou a primeira se o meio-dia não estiver disponível
          const middayIndex = items.findIndex(item => {
            const hour = new Date(item.dt * 1000).getHours();
            return hour >= 11 && hour <= 13;
          });
          
          const representative = middayIndex >= 0 ? items[middayIndex] : items[0];
          const date = new Date(representative.dt * 1000);
          
          // Calcular temperatura média e mín/máx
          const temperatures = items.map(item => item.main.temp);
          const avgTemp = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
          const minTemp = Math.min(...temperatures);
          const maxTemp = Math.max(...temperatures);
          
          // Calcular umidade média
          const humidities = items.map(item => item.main.humidity);
          const avgHumidity = humidities.reduce((sum, humidity) => sum + humidity, 0) / humidities.length;
          
          // Calcular velocidade média do vento
          const windSpeeds = items.map(item => item.wind.speed);
          const avgWindSpeed = windSpeeds.reduce((sum, speed) => sum + speed, 0) / windSpeeds.length;
          
          // Criar previsão detalhada do dia
          const dayForecast: WeatherDay = {
            day: getDayName(date.getDay()),
            icon: mapWeatherCondition(representative.weather[0].main),
            temperature: Math.round(avgTemp),
            minTemp: Math.round(minTemp),
            maxTemp: Math.round(maxTemp),
            humidity: Math.round(avgHumidity),
            windSpeed: Math.round(avgWindSpeed * 10) / 10, // Uma casa decimal
            description: representative.weather[0].description,
            date: date
          };
          
          // Adicionar à previsão estendida
          extendedForecasts.push(dayForecast);
          
          // Adicionar à previsão básica se ainda não tivermos dias suficientes
          if (!processedDates.has(dateStr) && dailyForecasts.length < 4) {
            dailyForecasts.push({
              day: getDayName(date.getDay()),
              icon: mapWeatherCondition(representative.weather[0].main),
              temperature: Math.round(avgTemp)
            });
            processedDates.add(dateStr);
          }
        });
        
        // Ordenar por data
        extendedForecasts.sort((a, b) => {
          if (!a.date || !b.date) return 0;
          return a.date.getTime() - b.date.getTime();
        });
        
        setForecast(dailyForecasts);
        setExtendedForecast(extendedForecasts);
        setLastUpdated(new Date().toLocaleString());
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setIsLoading(false);
      }
    };
    
    setIsLoading(true);
    fetchWeatherData();
  }, [selectedCity]);

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.weather')}</CardTitle>
          <div className="mt-2">
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('dashboard.selectCity') || "Selecione uma cidade"} />
              </SelectTrigger>
              <SelectContent>
                {angolanCities.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

  // Renderizar componente principal
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.weather')}</CardTitle>
        <div className="mt-2">
          <Select value={selectedCity} onValueChange={handleCityChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('dashboard.selectCity') || "Selecione uma cidade"} />
            </SelectTrigger>
            <SelectContent>
              {angolanCities.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-4">
          {getWeatherIcon(condition)}
          <div className="text-3xl font-medium">{temperature}°C</div>
          <div className="text-gray-500 text-sm">
            {t(`dashboard.${condition}`) || condition}
          </div>
          <div className="text-gray-500 text-sm">
            {selectedCity}, Angola
          </div>
        </div>

        {!showExtendedForecast ? (
          /* Visualização básica da previsão (4 dias) */
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {forecast.map((day, index) => (
              <div key={index} className="p-2">
                <div className="font-medium">
                  {t(`dashboard.weekDays.${day.day}`) || day.day}
                </div>
                {getWeatherIcon(day.icon, 'small')}
                <div>{day.temperature}°C</div>
              </div>
            ))}
          </div>
        ) : (
          /* Visualização estendida e detalhada da previsão */
          <div className="mt-2 text-sm">
            {extendedForecast.map((day, index) => (
              <div key={index} className="border-t border-gray-100 py-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">
                    {t(`dashboard.weekDays.${day.day}`) || day.day}
                  </div>
                  <div className="flex items-center">
                    {getWeatherIcon(day.icon, 'small')}
                    <span className="ml-1 font-medium">{day.temperature}°C</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-1 text-xs text-gray-600">
                  <div className="flex items-center">
                    <Thermometer className="h-3 w-3 mr-1 text-rose-500" />
                    <span>Máx: {day.maxTemp}°C</span>
                  </div>
                  <div className="flex items-center">
                    <Thermometer className="h-3 w-3 mr-1 text-blue-500" />
                    <span>Mín: {day.minTemp}°C</span>
                  </div>
                  <div className="flex items-center">
                    <Droplets className="h-3 w-3 mr-1 text-blue-400" />
                    <span>{day.humidity}%</span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-1 italic">
                  {day.description}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Botão para alternar entre visualizações */}
        <div className="flex justify-center mt-3">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-xs flex items-center text-gray-500 hover:text-primary"
            onClick={() => setShowExtendedForecast(!showExtendedForecast)}
          >
            {showExtendedForecast ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                {t('common.showLess') || 'Mostrar menos'}
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                {t('common.showMore') || 'Ver previsão detalhada'}
              </>
            )}
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 text-center mt-2">
          {t('dashboard.lastUpdated')}: {lastUpdated}
        </div>
      </CardContent>
    </Card>
  );
}