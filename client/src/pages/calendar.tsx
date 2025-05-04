import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter
} from 'lucide-react';
import { Task } from '@shared/schema';

export default function Calendar() {
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [selectedFarm, setSelectedFarm] = useState<string | null>(null);
  const [filteredStatus, setFilteredStatus] = useState<string | null>(null);

  // Load tasks from the API
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Load farms from the API for the filter
  const { data: farms } = useQuery({
    queryKey: ['/api/farms'],
  });

  // Get the appropriate locale for date formatting
  const dateLocale = language === 'pt' ? ptBR : enUS;

  // Format dates based on current language
  const formatDate = (date: Date, formatString: string) => {
    return format(date, formatString, { locale: dateLocale });
  };

  // Navigate to the previous month
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  // Navigate to the next month
  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get the start and end dates of the month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Get all days in the month
  const daysInMonth = eachDayOfInterval({
    start: monthStart,
    end: monthEnd
  });

  // Calculate the day header cells for the month view (Mon, Tue, Wed, etc.)
  const dayNames = Array.from({ length: 7 }, (_, i) => {
    // Start with Monday (1) and wrap around to Sunday (0)
    const day = i === 6 ? 0 : i + 1;
    return formatDate(new Date(2021, 0, day + 3), 'EEEEEE');
  });

  // Filter tasks based on the currently selected filters and date
  const filteredTasks = tasks?.filter(task => {
    // Filter by farm if a farm is selected
    if (selectedFarm && task.farmId !== parseInt(selectedFarm)) {
      return false;
    }
    
    // Filter by status if a status is selected
    if (filteredStatus && task.status !== filteredStatus) {
      return false;
    }

    // For month view, include all tasks in the current month
    if (view === 'month') {
      return isSameMonth(new Date(task.dueDate), currentDate);
    }
    
    // For agenda view, include only tasks due on the selected date
    return isSameDay(new Date(task.dueDate), currentDate);
  });

  // Group tasks by date for the month view
  const tasksByDate = filteredTasks?.reduce<Record<string, Task[]>>((acc, task) => {
    const dateStr = format(new Date(task.dueDate), 'yyyy-MM-dd');
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(task);
    return acc;
  }, {}) || {};

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return t('tasks.status.completed');
      case 'overdue':
        return t('tasks.status.overdue');
      case 'in_progress':
        return t('tasks.status.inProgress');
      case 'pending':
        return t('tasks.status.pending');
      default:
        return status;
    }
  };

  // Render task item for agenda view
  const renderTaskItem = (task: Task) => (
    <div key={task.id} className="p-3 border-l-4 border-primary bg-gray-50 rounded-md mb-2">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-gray-900">{task.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          <div className="flex items-center mt-2 text-sm">
            <Badge variant="outline" className={getStatusColor(task.status)}>
              {getStatusLabel(task.status)}
            </Badge>
            <span className="text-gray-500 ml-2 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(new Date(task.dueDate), 'p')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render month view
  const renderMonthView = () => {
    // Array to hold all the weeks
    const weeks = [];
    let currentWeek = [];
    
    // Start with the first day of the month
    const firstDay = monthStart.getDay();
    // Adjust for starting week on Monday (0 is Sunday, we want Monday as 0)
    const firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayIndex; i++) {
      currentWeek.push(null);
    }
    
    // Add cells for all days in the month
    for (const day of daysInMonth) {
      currentWeek.push(day);
      
      // Start a new week if we've reached Sunday
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }
    
    // Add empty cells for days after the end of the month
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push([...currentWeek]);
    }

    return (
      <div>
        <div className="grid grid-cols-7 text-center">
          {dayNames.map((name, i) => (
            <div key={i} className="p-2 text-xs uppercase tracking-wide text-gray-500 font-semibold">
              {name}
            </div>
          ))}
        </div>
        
        <div className="border rounded-md mt-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <div key={`empty-${dayIndex}`} className="h-24 p-1 border-r last:border-r-0 bg-gray-50" />;
                }
                
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayTasks = tasksByDate[dateStr] || [];
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div 
                    key={dateStr} 
                    className={`h-auto min-h-24 p-1 border-r last:border-r-0 transition-colors ${
                      isToday ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      setCurrentDate(day);
                      setView('agenda');
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`inline-flex items-center justify-center h-6 w-6 text-sm rounded-full ${
                        isToday ? 'bg-primary text-white' : 'text-gray-700'
                      }`}>
                        {formatDate(day, 'd')}
                      </span>
                    </div>
                    
                    <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                      {dayTasks.slice(0, 3).map(task => (
                        <div key={task.id} className="text-xs p-1 bg-white border rounded truncate text-gray-700 cursor-pointer">
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-gray-500 p-1">
                          +{dayTasks.length - 3} {t('calendar.moreTasks')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render agenda view
  const renderAgendaView = () => {
    return (
      <div>
        <h3 className="font-medium mb-4 text-xl">
          {formatDate(currentDate, 'PPPP')}
        </h3>
        
        {filteredTasks && filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map(renderTaskItem)}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>{t('calendar.noTasks')}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          {t('calendar.title')}
        </h1>
        <p className="text-sm text-gray-500">
          {t('calendar.description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <CardTitle>{t('calendar.schedule')}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="flex">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousMonth}
                  className="rounded-r-none border-r-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="rounded-none"
                >
                  {t('calendar.today')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextMonth}
                  className="rounded-l-none border-l-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Select
                value={view}
                onValueChange={(value) => setView(value as 'month' | 'agenda')}
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder={t('calendar.selectView')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">{t('calendar.monthView')}</SelectItem>
                  <SelectItem value="agenda">{t('calendar.agendaView')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="md:w-1/4 lg:w-1/5">
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <Filter className="h-4 w-4 mr-1" />
                {t('calendar.filters')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">
                    {t('calendar.filterByFarm')}
                  </label>
                  <Select
                    value={selectedFarm || ""}
                    onValueChange={(value) => setSelectedFarm(value || null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('calendar.allFarms')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('calendar.allFarms')}</SelectItem>
                      {farms?.map(farm => (
                        <SelectItem key={farm.id} value={farm.id.toString()}>
                          {farm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500 mb-1 block">
                    {t('calendar.filterByStatus')}
                  </label>
                  <Select
                    value={filteredStatus || ""}
                    onValueChange={(value) => setFilteredStatus(value || null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('calendar.allStatuses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('calendar.allStatuses')}</SelectItem>
                      <SelectItem value="pending">{t('tasks.status.pending')}</SelectItem>
                      <SelectItem value="in_progress">{t('tasks.status.inProgress')}</SelectItem>
                      <SelectItem value="completed">{t('tasks.status.completed')}</SelectItem>
                      <SelectItem value="overdue">{t('tasks.status.overdue')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">{t('calendar.legend')}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        {t('tasks.status.completed')}
                      </Badge>
                      <span className="ml-2 text-xs text-gray-600 flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                        {t('calendar.completedDesc')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        {t('tasks.status.pending')}
                      </Badge>
                      <span className="ml-2 text-xs text-gray-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                        {t('calendar.pendingDesc')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                        {t('tasks.status.overdue')}
                      </Badge>
                      <span className="ml-2 text-xs text-gray-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                        {t('calendar.overdueDesc')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator orientation="vertical" className="hidden md:block" />
            
            <div className="md:w-3/4 lg:w-4/5">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : view === 'month' ? (
                renderMonthView()
              ) : (
                renderAgendaView()
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}