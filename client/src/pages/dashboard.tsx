import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusCard from '@/components/dashboard/StatusCard';
import WeatherCard from '@/components/dashboard/WeatherCard';
import InventoryAlert from '@/components/dashboard/InventoryAlert';
import HarvestTracker from '@/components/dashboard/HarvestTracker';
import { formatDate } from '@/lib/i18n';
import { Leaf, DollarSign, CalendarDays, MapPin } from 'lucide-react';
import { Crop, Inventory, Farm } from '@shared/schema';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  // Farm data query
  const { data: farms, isLoading: isLoadingFarms } = useQuery<Farm[]>({
    queryKey: ['/api/farms'],
  });

  // Set selected farm when farms are loaded
  useEffect(() => {
    if (farms && farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  // Get current farm
  const currentFarm = farms?.find(farm => farm.id === selectedFarmId) || null;
  const farmId = currentFarm?.id;

  // Crops query
  const { data: crops, isLoading: isLoadingCrops } = useQuery<Crop[]>({
    queryKey: ['/api/farms', farmId, 'crops'],
    enabled: !!farmId,
  });

  // Inventory query
  const { data: criticalInventory, isLoading: isLoadingInventory } = useQuery<Inventory[]>({
    queryKey: ['/api/farms', farmId, 'inventory/critical'],
    enabled: !!farmId,
  });

  // Mock weather data - in a real app, this would come from a weather API
  const weatherData = {
    temperature: 27,
    condition: 'sunny' as const,
    location: 'Huambo, Angola',
    forecast: [
      { day: 'tue', icon: 'sunny' as const, temperature: 28 },
      { day: 'wed', icon: 'cloudy' as const, temperature: 25 },
      { day: 'thu', icon: 'cloudy' as const, temperature: 24 },
      { day: 'fri', icon: 'rainy' as const, temperature: 22 },
    ],
    lastUpdated: `${t('common.today')}, 10:30`
  };

  // Calculate harvest progress
  const harvestProgress = crops?.length ? 
    Math.round((crops.filter(crop => crop.status === 'harvested').length / crops.length) * 100) : 0;

  return (
    <DashboardLayout>
      {/* Dashboard Header */}
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-center mb-2">
          <h1 className="text-2xl font-medium text-gray-900">
            {t('dashboard.title')}
          </h1>
          
          {/* Farm Selector */}
          {farms && farms.length > 0 && (
            <div className="w-60">
              <Select 
                value={selectedFarmId?.toString()} 
                onValueChange={(value) => setSelectedFarmId(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('dashboard.selectFarm')} />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap items-center text-sm text-gray-500 gap-2">
          <span className="flex items-center">
            <CalendarDays className="h-4 w-4 mr-1" />
            <span>
              {formatDate(new Date(), 'PP', language)}
            </span>
          </span>
          <span className="mx-2">|</span>
          <span className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            <span>
              {currentFarm?.name || t('dashboard.farm')}
              {currentFarm?.location ? `, ${currentFarm.location}` : ''}
            </span>
          </span>
        </div>
      </div>
      
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatusCard
          title={t('dashboard.cultivatedArea')}
          value={`${crops?.reduce((acc, crop) => acc + crop.area, 0) || 0} ha`}
          icon={<Leaf className="h-5 w-5 text-secondary" />}
          trend={{
            value: "+5 ha",
            direction: "up",
            label: t('dashboard.since.lastSeason')
          }}
        />
        
        <StatusCard
          title={t('dashboard.currentBalance')}
          value={1450000}
          icon={<DollarSign className="h-5 w-5 text-blue-500" />}
          trend={{
            value: "-8%",
            direction: "down",
            label: t('dashboard.since.lastWeek')
          }}
          isCurrency={true}
        />
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather */}
        <WeatherCard 
          temperature={weatherData.temperature}
          condition={weatherData.condition}
          location={weatherData.location}
          forecast={weatherData.forecast}
          lastUpdated={weatherData.lastUpdated}
          isLoading={false}
        />
        
        {/* Inventory Alert */}
        <InventoryAlert 
          items={criticalInventory || []} 
          isLoading={isLoadingInventory}
          onOrder={(itemId) => console.log('Order item:', itemId)}
        />
        
        {/* Next Harvest */}
        <HarvestTracker 
          crops={crops || []} 
          progressPercentage={harvestProgress}
          isLoading={isLoadingCrops} 
        />
      </div>
    </DashboardLayout>
  );
}
