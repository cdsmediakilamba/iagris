import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CalendarEvent, insertCalendarEventSchema } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Edit, 
  Trash2,
  Clock
} from 'lucide-react';

interface CalendarComponentProps {
  farmId: number;
}

const eventFormSchema = insertCalendarEventSchema.omit({
  farmId: true,
  createdBy: true,
  createdAt: true,
});

export default function CalendarComponent({ farmId }: CalendarComponentProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventsPopoverOpen, setEventsPopoverOpen] = useState(false);

  // Get calendar events for the selected farm
  const { data: events = [], isLoading } = useQuery({
    queryKey: [`/api/farms/${farmId}/calendar-events`],
    enabled: !!farmId,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (eventData: z.infer<typeof eventFormSchema>) =>
      apiRequest(`/api/farms/${farmId}/calendar-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${farmId}/calendar-events`] });
      toast({
        title: t('success'),
        description: t('calendar.eventCreated'),
      });
      setIsEventDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('calendar.eventCreationFailed'),
        variant: 'destructive',
      });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CalendarEvent> }) =>
      apiRequest(`/api/farms/${farmId}/calendar-events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${farmId}/calendar-events`] });
      toast({
        title: t('success'),
        description: t('calendar.eventUpdated'),
      });
      setIsEditDialogOpen(false);
      setEditingEvent(null);
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('calendar.eventUpdateFailed'),
        variant: 'destructive',
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: number) =>
      apiRequest(`/api/farms/${farmId}/calendar-events/${eventId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${farmId}/calendar-events`] });
      toast({
        title: t('success'),
        description: t('calendar.eventDeleted'),
      });
      setEventsPopoverOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('calendar.eventDeletionFailed'),
        variant: 'destructive',
      });
    },
  });

  // Form setup
  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      date: new Date(),
      eventType: 'general',
    },
  });

  const editForm = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      date: new Date(),
      eventType: 'general',
    },
  });

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [currentDate]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      return eventDate === dateString;
    });
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateEvents = getEventsForDate(date);
    if (dateEvents.length > 0) {
      setEventsPopoverOpen(true);
    } else {
      // Set form date and open dialog
      form.setValue('date', date);
      setIsEventDialogOpen(true);
    }
  };

  // Handle event creation
  const handleCreateEvent = (data: z.infer<typeof eventFormSchema>) => {
    createEventMutation.mutate(data);
  };

  // Handle event edit
  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    editForm.reset({
      title: event.title,
      description: event.description || '',
      date: new Date(event.date),
      eventType: event.eventType || 'general',
    });
    setIsEditDialogOpen(true);
    setEventsPopoverOpen(false);
  };

  // Handle event update
  const handleUpdateEvent = (data: z.infer<typeof eventFormSchema>) => {
    if (editingEvent) {
      updateEventMutation.mutate({
        id: editingEvent.id,
        data: data,
      });
    }
  };

  // Handle event deletion
  const handleDeleteEvent = (eventId: number) => {
    deleteEventMutation.mutate(eventId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={() => {
            form.setValue('date', new Date());
            setIsEventDialogOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('calendar.addEvent')}
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <Popover key={index} open={eventsPopoverOpen && selectedDate?.toDateString() === date.toDateString()}>
                  <PopoverTrigger asChild>
                    <div
                      className={`
                        relative p-2 h-16 border rounded-lg cursor-pointer transition-colors
                        ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
                        ${isToday ? 'border-primary bg-primary/5' : 'border-gray-200'}
                        ${dayEvents.length > 0 ? 'border-blue-300 bg-blue-50' : ''}
                      `}
                      onClick={() => handleDateClick(date)}
                    >
                      <div className="text-sm font-medium">{date.getDate()}</div>
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 right-1">
                          <Badge variant="secondary" className="text-xs px-1">
                            {dayEvents.length}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" onOpenChange={setEventsPopoverOpen}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US')}
                        </h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            form.setValue('date', date);
                            setIsEventDialogOpen(true);
                            setEventsPopoverOpen(false);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {t('calendar.addEvent')}
                        </Button>
                      </div>
                      
                      {dayEvents.length > 0 ? (
                        <div className="space-y-2">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className="flex items-start justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">{event.title}</div>
                                {event.description && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {event.description}
                                  </div>
                                )}
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    {new Date(event.date).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditEvent(event)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteEvent(event.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          {t('calendar.noEvents')}
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create Event Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('calendar.createEvent')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateEvent)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.title')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('calendar.titlePlaceholder')} {...field} />
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
                    <FormLabel>{t('calendar.description')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('calendar.descriptionPlaceholder')} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.date')}</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value instanceof Date ? 
                          field.value.toISOString().slice(0, 16) : 
                          field.value
                        }
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEventDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createEventMutation.isPending}>
                  {createEventMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    t('common.create')
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('calendar.editEvent')}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdateEvent)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.title')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('calendar.titlePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.description')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('calendar.descriptionPlaceholder')} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calendar.date')}</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value instanceof Date ? 
                          field.value.toISOString().slice(0, 16) : 
                          field.value
                        }
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={updateEventMutation.isPending}>
                  {updateEventMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    t('common.update')
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}