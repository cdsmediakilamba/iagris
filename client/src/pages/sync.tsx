import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  Upload,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  Wifi,
  Database,
  Server,
  Settings,
  Shield,
  Loader2
} from 'lucide-react';

export default function Sync() {
  const { t, language } = useLanguage();
  const [isOnline, setIsOnline] = useState(true); 
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState('15');
  const [progress, setProgress] = useState(0);

  // Get locale for date formatting
  const dateLocale = language === 'pt' ? ptBR : enUS;
  
  const formatDate = (date: Date) => {
    return format(date, 'PPpp', { locale: dateLocale });
  };

  // Recent synchronization history
  const syncHistory = [
    { id: 1, date: new Date(Date.now() - 1000 * 60 * 30), status: 'success', items: 45 },
    { id: 2, date: new Date(Date.now() - 1000 * 60 * 60 * 2), status: 'success', items: 23 },
    { id: 3, date: new Date(Date.now() - 1000 * 60 * 60 * 8), status: 'warning', items: 12 },
    { id: 4, date: new Date(Date.now() - 1000 * 60 * 60 * 24), status: 'success', items: 67 },
  ];

  // Toggle online status for demo purposes
  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
  };

  // Start synchronization process
  const startSync = () => {
    setIsSyncing(true);
    setProgress(0);

    // Simulate syncing progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          {t('sync.title')}
        </h1>
        <p className="text-sm text-gray-500">
          {t('sync.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('sync.status')}
            </CardTitle>
            <div
              className={`flex items-center rounded-full p-1 px-2 ${
                isOnline ? 'bg-green-100' : 'bg-yellow-100'
              }`}
            >
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <WifiOff className="h-4 w-4 text-yellow-600 mr-1" />
              )}
              <span
                className={`text-xs font-medium ${
                  isOnline ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {isOnline ? t('sync.online') : t('sync.offline')}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {isOnline
                ? t('sync.systemSynced')
                : t('sync.offlineMode')}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isOnline
                ? t('sync.lastSync', { time: '30 min' })
                : t('sync.pendingSyncs', { count: 32 })}
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={toggleOnlineStatus}
            >
              {isOnline ? t('sync.toggleOffline') : t('sync.toggleOnline')}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('sync.dataStatus')}
            </CardTitle>
            <Database className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('sync.items.tasks')}</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {t('sync.synced')}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('sync.items.animals')}</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {t('sync.synced')}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('sync.items.crops')}</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  {t('sync.pendingUpdates', { count: 3 })}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('sync.items.inventory')}</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {t('sync.synced')}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('sync.items.users')}</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  {t('sync.synced')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('sync.storage')}
            </CardTitle>
            <Server className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">
                    {t('sync.localStorage')}
                  </span>
                  <span className="text-sm text-gray-500">85% (340MB/400MB)</span>
                </div>
                <Progress value={85} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">
                    {t('sync.cacheSize')}
                  </span>
                  <span className="text-sm text-gray-500">120MB</span>
                </div>
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  {t('sync.clearCache')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('sync.syncHistory')}</CardTitle>
              <CardDescription>
                {t('sync.syncHistoryDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <div className="grid grid-cols-4 gap-4 bg-gray-50 p-3 border-b text-sm font-medium text-gray-500">
                  <div>{t('sync.columns.datetime')}</div>
                  <div>{t('sync.columns.items')}</div>
                  <div>{t('sync.columns.status')}</div>
                  <div>{t('sync.columns.actions')}</div>
                </div>
                {syncHistory.map((item) => (
                  <div key={item.id} className="grid grid-cols-4 gap-4 p-3 border-b last:border-b-0 items-center">
                    <div className="text-sm">{formatDate(item.date)}</div>
                    <div className="text-sm">{item.items} {t('sync.items.updated')}</div>
                    <div>
                      {item.status === 'success' ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {t('sync.success')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {t('sync.warning')}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <Button variant="ghost" size="sm">
                        {t('sync.viewDetails')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('sync.syncData')}</CardTitle>
              <CardDescription>
                {t('sync.syncDataDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSyncing ? (
                <div className="space-y-4">
                  <div className="text-center text-sm text-gray-500 mb-2">
                    {t('sync.syncingInProgress')}
                  </div>
                  <Progress value={progress} />
                  <div className="text-center text-xs text-gray-500">
                    {progress}% {t('sync.complete')}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button 
                    className="w-full" 
                    onClick={startSync}
                    disabled={!isOnline}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('sync.syncNow')}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={!isOnline}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t('sync.pushData')}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={!isOnline}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('sync.pullData')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('sync.settings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-sync">{t('sync.autoSync')}</Label>
                  <div className="text-xs text-gray-500">
                    {t('sync.autoSyncDescription')}
                  </div>
                </div>
                <Switch
                  id="auto-sync"
                  checked={autoSync}
                  onCheckedChange={setAutoSync}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sync-interval">{t('sync.syncInterval')}</Label>
                <Select
                  value={syncInterval}
                  onValueChange={setSyncInterval}
                  disabled={!autoSync}
                >
                  <SelectTrigger id="sync-interval">
                    <SelectValue placeholder={t('sync.selectInterval')} />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="5">{t('sync.intervals.fiveMinutes')}</SelectItem>
                    <SelectItem value="15">{t('sync.intervals.fifteenMinutes')}</SelectItem>
                    <SelectItem value="30">{t('sync.intervals.thirtyMinutes')}</SelectItem>
                    <SelectItem value="60">{t('sync.intervals.oneHour')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sync-wifi-only">{t('sync.syncWifiOnly')}</Label>
                  <div className="text-xs text-gray-500">
                    {t('sync.syncWifiOnlyDescription')}
                  </div>
                </div>
                <Switch
                  id="sync-wifi-only"
                  defaultChecked
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {!isOnline && (
        <Alert variant="default" className="mt-6 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>{t('sync.offlineWarningTitle')}</AlertTitle>
          <AlertDescription>
            {t('sync.offlineWarningDescription')}
          </AlertDescription>
        </Alert>
      )}
    </DashboardLayout>
  );
}