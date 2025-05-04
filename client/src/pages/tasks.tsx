import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertTaskSchema, Task, UserRole } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { formatDate, formatDistanceToNow } from '@/lib/i18n';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  PlusCircle,
  CheckSquare,
  Calendar,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Filter,
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export default function Tasks() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Get user's farms
  const { data: farms, isLoading: isLoadingFarms } = useQuery({
    queryKey: ['/api/farms'],
  });

  // Use first farm by default
  React.useEffect(() => {
    if (farms && farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  // Get all tasks for selected farm
  const { data: tasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['/api/farms', selectedFarmId, 'tasks'],
    enabled: !!selectedFarmId,
  });

  // Get pending tasks for selected farm
  const { data: pendingTasks, isLoading: isLoadingPending } = useQuery<Task[]>({
    queryKey: ['/api/farms', selectedFarmId, 'tasks/pending'],
    enabled: !!selectedFarmId,
  });

  // Determine which tasks to display based on tab and filters
  const getFilteredTasks = () => {
    let displayTasks = activeTab === 'pending' ? pendingTasks : tasks;
    
    if (!displayTasks) return [];
    
    // Apply status filter if not 'all'
    if (statusFilter !== 'all') {
      displayTasks = displayTasks.filter(task => task.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      displayTasks = displayTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort by due date (ascending)
    return [...displayTasks].sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  };

  const filteredTasks = getFilteredTasks();

  // Get all users for assigning tasks
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    enabled: user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.FARM_ADMIN || user?.role === UserRole.MANAGER,
  });

  // Task form schema
  const formSchema = insertTaskSchema.omit({ 
    farmId: true,
    createdAt: true
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: undefined,
      status: 'pending',
      priority: 'medium',
      assignedTo: undefined,
      category: 'general',
      relatedId: undefined,
    },
  });

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!selectedFarmId) throw new Error("No farm selected");
      const response = await apiRequest(
        'POST', 
        `/api/farms/${selectedFarmId}/tasks`, 
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'tasks/pending'] });
      toast({
        title: t('tasks.taskAdded'),
        description: t('common.success'),
      });
      form.reset();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update task mutation
  const updateTask = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await apiRequest(
        'PATCH', 
        `/api/tasks/${id}`, 
        { status }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'tasks/pending'] });
      toast({
        title: t('tasks.taskUpdated'),
        description: t('common.success'),
      });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Submit handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createTask.mutate(data);
  };

  // Mark task as completed handler
  const handleMarkAsCompleted = (id: number) => {
    updateTask.mutate({ id, status: 'completed' });
  };

  // Mark task as in progress handler
  const handleMarkAsInProgress = (id: number) => {
    updateTask.mutate({ id, status: 'inProgress' });
  };

  // Status badge renderer
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {t('tasks.statuses.pending')}
          </Badge>
        );
      case 'inProgress':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {t('tasks.statuses.inProgress')}
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t('tasks.statuses.completed')}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center">
            {t('tasks.statuses.cancelled')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  // Priority badge renderer
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {t('tasks.priorities.low')}
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {t('tasks.priorities.medium')}
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            {t('tasks.priorities.high')}
          </Badge>
        );
      case 'urgent':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {t('tasks.priorities.urgent')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {priority}
          </Badge>
        );
    }
  };

  // Category icon renderer
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'animal':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'crop':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'inventory':
        return <AlertCircle className="h-5 w-5 text-primary" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Due date formatter
  const formatDueDate = (dueDate: Date | string | undefined | null) => {
    if (!dueDate) {
      return <span className="text-gray-400">{t('common.notSet')}</span>;
    }
    
    try {
      const dueDateObj = new Date(dueDate);
      // Check if date is valid
      if (isNaN(dueDateObj.getTime())) {
        return <span className="text-gray-400">{t('common.invalidDate')}</span>;
      }
      
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      
      const dueDateTime = dueDateObj.setHours(0, 0, 0, 0);
      const todayTime = today.setHours(0, 0, 0, 0);
      const tomorrowTime = tomorrow.setHours(0, 0, 0, 0);
      
      if (dueDateTime === todayTime) {
        return (
          <span className="text-red-500 font-medium">
            {t('common.today')}
          </span>
        );
      } else if (dueDateTime === tomorrowTime) {
        return (
          <span className="text-amber-500 font-medium">
            {t('common.tomorrow')}
          </span>
        );
      } else if (dueDateTime < todayTime) {
        return (
          <span className="text-red-500 font-medium">
            {formatDistanceToNow(dueDateObj, language, true)}
          </span>
        );
      } else {
        return formatDate(dueDateObj, 'P', language);
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return <span className="text-gray-400">{t('common.invalidDate')}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-4">{t('tasks.pageTitle')}</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Search and farm select */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('common.search')}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {farms && farms.length > 0 && (
              <Select
                value={selectedFarmId?.toString()}
                onValueChange={(value) => setSelectedFarmId(parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('dashboard.farm')} />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  {t('common.filter')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  {t('common.all')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                  {t('tasks.statuses.pending')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('inProgress')}>
                  {t('tasks.statuses.inProgress')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                  {t('tasks.statuses.completed')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Add task button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('tasks.addTask')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{t('tasks.addTask')}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tasks.title')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tasks.description')}</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tasks.dueDate')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value instanceof Date ? field.value.toISOString().substring(0, 10) : field.value || ''} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tasks.priority')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('tasks.priority')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">{t('tasks.priorities.low')}</SelectItem>
                              <SelectItem value="medium">{t('tasks.priorities.medium')}</SelectItem>
                              <SelectItem value="high">{t('tasks.priorities.high')}</SelectItem>
                              <SelectItem value="urgent">{t('tasks.priorities.urgent')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tasks.category')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('tasks.category')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general">{t('tasks.categories.general')}</SelectItem>
                              <SelectItem value="animal">{t('tasks.categories.animal')}</SelectItem>
                              <SelectItem value="crop">{t('tasks.categories.crop')}</SelectItem>
                              <SelectItem value="inventory">{t('tasks.categories.inventory')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tasks.assignedTo')}</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                            value={field.value?.toString() || ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('tasks.assignedTo')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users?.map((user: any) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">{t('common.cancel')}</Button>
                    </DialogClose>
                    <Button type="submit" disabled={createTask.isPending}>
                      {createTask.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('common.loading')}
                        </>
                      ) : (
                        t('common.save')
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center">
              <CardTitle>{t('tasks.pageTitle')}</CardTitle>
              <TabsList>
                <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
                <TabsTrigger value="pending">{t('tasks.statuses.pending')}</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoadingTasks || isLoadingPending || isLoadingFarms ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="flex flex-col sm:flex-row gap-4 bg-gray-50 p-4 rounded-md">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getCategoryIcon(task.category)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{task.title}</h3>
                        {task.description && (
                          <p className="text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                          <Badge variant="outline" className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDueDate(task.dueDate)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    {task.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleMarkAsInProgress(task.id)}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        {t('tasks.markAsInProgress')}
                      </Button>
                    )}
                    
                    {(task.status === 'pending' || task.status === 'inProgress') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                        onClick={() => handleMarkAsCompleted(task.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {t('tasks.markAsCompleted')}
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">{t('tasks.noTasks')}</h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? t('common.noSearchResults') 
                  : t('tasks.addTask')
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
