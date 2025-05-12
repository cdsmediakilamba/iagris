import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatusCard from '@/components/dashboard/StatusCard';
import TasksList from '@/components/dashboard/TasksList';
import AnimalHealthTable from '@/components/dashboard/AnimalHealthTable';
import WeatherCard from '@/components/dashboard/WeatherCard';
import InventoryAlert from '@/components/dashboard/InventoryAlert';
import HarvestTracker from '@/components/dashboard/HarvestTracker';
import { formatDate } from '@/lib/i18n';
import { PawPrint, Leaf, DollarSign, CalendarDays, MapPin } from 'lucide-react';
import { Task, Animal, Crop, Inventory, Farm } from '@shared/schema';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  // Farm data query
  const { data: farms, isLoading: isLoadingFarms } = useQuery<Farm[]>({
    queryKey: ['/api/farms'],
  });

  // Use first farm for now (in real app, would have farm selector)
  const currentFarm = farms && farms.length > 0 ? farms[0] : null;
  const farmId = currentFarm?.id;

  // Animals query
  const { data: animals, isLoading: isLoadingAnimals } = useQuery<Animal[]>({
    queryKey: ['/api/farms', farmId, 'animals'],
    enabled: !!farmId,
  });

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

  // Tasks query
  const { data: pendingTasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['/api/farms', farmId, 'tasks/pending'],
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
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          {t('dashboard.title')}
        </h1>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatusCard
          title={t('dashboard.totalAnimals')}
          value={animals?.length || 0}
          icon={<PawPrint className="h-5 w-5 text-primary" />}
          trend={{
            value: "+12",
            direction: "up",
            label: t('dashboard.since.lastMonth')
          }}
          isLoading={isLoadingAnimals}
        />
        
        <StatusCard
          title={t('dashboard.cultivatedArea')}
          value={`${crops?.reduce((acc, crop) => acc + crop.area, 0) || 0} ha`}
          icon={<Leaf className="h-5 w-5 text-secondary" />}
          trend={{
            value: "+5 ha",
            direction: "up",
            label: t('dashboard.since.lastSeason')
          }}
          isLoading={isLoadingCrops}
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
          isLoading={false}
        />
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tasks Overview */}
          <TasksList tasks={pendingTasks || []} isLoading={isLoadingTasks} />
          
          {/* Animal Health Status */}
          <AnimalHealthTable animals={animals || []} isLoading={isLoadingAnimals} />
        </div>
        
        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
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
      </div>
    </DashboardLayout>
  );
}
