import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { AlertCircle, Droplet, Package } from 'lucide-react';
import { Task } from '@shared/schema';
import { formatRelativeTime } from '@/lib/i18n';

interface TasksListProps {
  tasks: Task[];
  isLoading?: boolean;
}

export default function TasksList({ tasks, isLoading = false }: TasksListProps) {
  const { t, language } = useLanguage();

  // Function to render the appropriate icon based on task category
  const getTaskIcon = (category: string) => {
    switch (category) {
      case 'animal':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'crop':
        return <Droplet className="h-5 w-5 text-blue-500" />;
      case 'inventory':
        return <Package className="h-5 w-5 text-primary" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Function to format the due date
  const formatDueDate = (dueDate: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    const dueDateTime = new Date(dueDate).setHours(0, 0, 0, 0);
    const todayTime = today.setHours(0, 0, 0, 0);
    const tomorrowTime = tomorrow.setHours(0, 0, 0, 0);
    
    if (dueDateTime === todayTime) {
      return t('common.today');
    } else if (dueDateTime === tomorrowTime) {
      return t('common.tomorrow');
    } else {
      return formatRelativeTime(dueDate, new Date(), language);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex justify-between items-center pb-2">
          <CardTitle>{t('dashboard.pendingTasks')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-3">
          <div className="flex items-center animate-pulse">
            <div className="h-10 w-10 rounded-full bg-gray-200 mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="flex items-center animate-pulse">
            <div className="h-10 w-10 rounded-full bg-gray-200 mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="flex items-center animate-pulse">
            <div className="h-10 w-10 rounded-full bg-gray-200 mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center pb-2">
        <CardTitle>{t('dashboard.pendingTasks')}</CardTitle>
        <Button variant="link" className="text-primary" onClick={() => window.location.href = '/tasks'}>
          {t('common.viewAll')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center bg-gray-50 p-3 rounded-md">
              <div className="mr-3">
                {getTaskIcon(task.category)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{task.title}</h4>
                <p className="text-sm text-gray-500">{task.description}</p>
              </div>
              <div className="text-right text-sm">
                <div className={`font-medium ${
                  new Date(task.dueDate).getTime() < new Date().getTime() ? 'text-red-500' :
                  new Date(task.dueDate).getTime() < new Date().getTime() + 86400000 ? 'text-amber-500' :
                  'text-gray-700'
                }`}>
                  {formatDueDate(task.dueDate)}
                </div>
                <div className="text-gray-500">
                  {t('tasks.assignedTo')}: {task.assignedTo || 'N/A'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            {t('tasks.noTasks')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
