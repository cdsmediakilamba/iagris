import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FileText,
  Download,
  Filter,
  Loader2,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Calendar,
  Search,
} from 'lucide-react';

// Sample data for charts
const productionData = [
  { name: 'Jan', animals: 4000, crops: 2400 },
  { name: 'Feb', animals: 3000, crops: 1398 },
  { name: 'Mar', animals: 2000, crops: 9800 },
  { name: 'Apr', animals: 2780, crops: 3908 },
  { name: 'May', animals: 1890, crops: 4800 },
  { name: 'Jun', animals: 2390, crops: 3800 },
];

const inventoryData = [
  { name: 'Feed', value: 400 },
  { name: 'Seeds', value: 300 },
  { name: 'Equipment', value: 300 },
  { name: 'Fertilizer', value: 200 },
  { name: 'Medicine', value: 100 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Reports() {
  const { t, language } = useLanguage();
  const [reportType, setReportType] = useState('production');
  const [timeRange, setTimeRange] = useState('month');
  const [farmId, setFarmId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Get locale for date formatting
  const dateLocale = language === 'pt' ? ptBR : enUS;
  
  const formatDate = (date: Date) => {
    return format(date, 'PPP', { locale: dateLocale });
  };

  // Load farms from API
  const { data: farms, isLoading: isLoadingFarms } = useQuery({
    queryKey: ['/api/farms'],
  });

  // Generate report download handler
  const handleDownloadReport = () => {
    // In a real app, this would trigger an API call to generate a report
    alert(t('reports.downloadStarted'));
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          {t('reports.title')}
        </h1>
        <p className="text-sm text-gray-500">
          {t('reports.description')}
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('reports.filters')}</CardTitle>
          <CardDescription>
            {t('reports.filtersDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('reports.reportType')}
              </label>
              <Select
                value={reportType}
                onValueChange={setReportType}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('reports.selectReportType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">{t('reports.types.production')}</SelectItem>
                  <SelectItem value="inventory">{t('reports.types.inventory')}</SelectItem>
                  <SelectItem value="financial">{t('reports.types.financial')}</SelectItem>
                  <SelectItem value="tasks">{t('reports.types.tasks')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('reports.timeRange')}
              </label>
              <Select
                value={timeRange}
                onValueChange={setTimeRange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('reports.selectTimeRange')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">{t('reports.timeRanges.week')}</SelectItem>
                  <SelectItem value="month">{t('reports.timeRanges.month')}</SelectItem>
                  <SelectItem value="quarter">{t('reports.timeRanges.quarter')}</SelectItem>
                  <SelectItem value="year">{t('reports.timeRanges.year')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('reports.farm')}
              </label>
              <Select
                value={farmId || ''}
                onValueChange={(value) => setFarmId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('reports.selectFarm')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('reports.allFarms')}</SelectItem>
                  {farms?.map((farm: any) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="self-end"
              onClick={handleDownloadReport}
            >
              <Download className="mr-2 h-4 w-4" />
              {t('reports.downloadReport')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="charts">
        <TabsList className="mb-4">
          <TabsTrigger value="charts" className="flex items-center">
            <BarChartIcon className="mr-2 h-4 w-4" />
            {t('reports.visualizations')}
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            {t('reports.summary')}
          </TabsTrigger>
          <TabsTrigger value="raw" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            {t('reports.rawData')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType === 'production' && t('reports.titles.productionOverTime')}
                {reportType === 'inventory' && t('reports.titles.inventoryDistribution')}
                {reportType === 'financial' && t('reports.titles.financialPerformance')}
                {reportType === 'tasks' && t('reports.titles.taskCompletion')}
              </CardTitle>
              <CardDescription>
                {timeRange === 'month' && t('reports.periods.lastMonth')}
                {timeRange === 'week' && t('reports.periods.lastWeek')}
                {timeRange === 'quarter' && t('reports.periods.lastQuarter')}
                {timeRange === 'year' && t('reports.periods.lastYear')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {reportType === 'production' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productionData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="animals" fill="#8884d8" name={t('reports.labels.livestock')} />
                      <Bar dataKey="crops" fill="#82ca9d" name={t('reports.labels.crops')} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                
                {reportType === 'inventory' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inventoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {inventoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}`, t('reports.labels.quantity')]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                
                {reportType === 'financial' && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">{t('reports.comingSoon')}</p>
                  </div>
                )}
                
                {reportType === 'tasks' && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">{t('reports.comingSoon')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('reports.kpi.totalProduction')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {reportType === 'production' && '7,329 kg'}
                  {reportType === 'inventory' && '1,300 items'}
                  {reportType === 'financial' && '$15,280'}
                  {reportType === 'tasks' && '156 tasks'}
                </div>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  +12.5% {t('reports.fromPreviousPeriod')}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('reports.kpi.efficiency')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">87%</div>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  +5.3% {t('reports.fromPreviousPeriod')}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('reports.kpi.forecastedGrowth')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">+23%</div>
                <p className="text-sm text-gray-500 mt-2 flex items-center">
                  {t('reports.nextQuarter')}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.summary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p>
                  {t('reports.summaryText')}
                </p>
                
                <h3>{t('reports.keyFindings')}</h3>
                <ul>
                  <li>{t('reports.findings.1')}</li>
                  <li>{t('reports.findings.2')}</li>
                  <li>{t('reports.findings.3')}</li>
                </ul>
                
                <h3>{t('reports.recommendations')}</h3>
                <ul>
                  <li>{t('reports.recommendations.1')}</li>
                  <li>{t('reports.recommendations.2')}</li>
                  <li>{t('reports.recommendations.3')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>{t('reports.rawData')}</CardTitle>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t('common.search')}
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <div className="grid grid-cols-4 border-b bg-gray-50 p-3">
                  <div className="font-medium text-gray-700 text-sm">{t('reports.columns.date')}</div>
                  <div className="font-medium text-gray-700 text-sm">{t('reports.columns.category')}</div>
                  <div className="font-medium text-gray-700 text-sm">{t('reports.columns.value')}</div>
                  <div className="font-medium text-gray-700 text-sm">{t('reports.columns.status')}</div>
                </div>
                
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="grid grid-cols-4 border-b last:border-b-0 p-3">
                    <div className="text-gray-900 text-sm">{formatDate(new Date(2025, 0, i))}</div>
                    <div className="text-gray-900 text-sm">{i % 2 === 0 ? t('reports.categories.animals') : t('reports.categories.crops')}</div>
                    <div className="text-gray-900 text-sm">{i * 100} kg</div>
                    <div className="text-gray-900 text-sm">
                      <Badge variant="outline" className={i % 3 === 0 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                        {i % 3 === 0 ? t('reports.statuses.pending') : t('reports.statuses.completed')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}