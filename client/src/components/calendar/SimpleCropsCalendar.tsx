import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CalendarDays, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLanguage } from '@/context/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CalendarEvent {
  id?: number;
  title: string;
  description: string;
  date: string;
  farmId: number;
  cropId?: number;
  eventType: string;
}

interface SimpleCropsCalendarProps {
  selectedFarmId: number | null;
}

export function SimpleCropsCalendar({ selectedFarmId }: SimpleCropsCalendarProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [eventForm, setEventForm] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    eventType: 'general'
  });
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isEventsListDialogOpen, setIsEventsListDialogOpen] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState<CalendarEvent[]>([]);

  // Carregar eventos do calendário
  const { data: events = [], refetch: refetchEvents } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/farms', selectedFarmId, 'calendar-events'],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      return await apiRequest(`/api/farms/${selectedFarmId}/calendar-events`);
    },
    enabled: !!selectedFarmId,
  });

  // Mutação para criar evento
  const createEvent = useMutation({
    mutationFn: async (eventData: Partial<CalendarEvent>) => {
      if (!selectedFarmId) throw new Error('No farm selected');
      return await apiRequest(`/api/farms/${selectedFarmId}/calendar-events`, {
        method: 'POST',
        data: { ...eventData, farmId: selectedFarmId }
      });
    },
    onSuccess: () => {
      refetchEvents();
      setIsEventDialogOpen(false);
      setEventForm({ title: '', description: '', eventType: 'general' });
      toast({
        title: t('calendar.success'),
        description: 'Evento criado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: t('calendar.error'),
        description: 'Erro ao criar evento: ' + error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar evento
  const updateEvent = useMutation({
    mutationFn: async ({ eventId, data }: { eventId: number, data: Partial<CalendarEvent> }) => {
      if (!selectedFarmId) throw new Error('No farm selected');
      return await apiRequest(`/api/farms/${selectedFarmId}/calendar-events/${eventId}`, {
        method: 'PATCH',
        data
      });
    },
    onSuccess: () => {
      refetchEvents();
      setIsEventDialogOpen(false);
      setEditingEvent(null);
      setEventForm({ title: '', description: '', eventType: 'general' });
      toast({
        title: t('calendar.success'),
        description: 'Evento atualizado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: t('calendar.error'),
        description: 'Erro ao atualizar evento: ' + error.message,
        variant: "destructive",
      });
    }
  });

  // Mutação para deletar evento
  const deleteEvent = useMutation({
    mutationFn: async (eventId: number) => {
      if (!selectedFarmId) throw new Error('No farm selected');
      return await apiRequest(`/api/farms/${selectedFarmId}/calendar-events/${eventId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      refetchEvents();
      toast({
        title: t('calendar.success'),
        description: 'Evento deletado com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: t('calendar.error'),
        description: 'Erro ao deletar evento: ' + error.message,
        variant: "destructive",
      });
    }
  });

  // Gerar calendário do mês
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendar = [];
    let date = 1;

    // Criar linhas do calendário
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      
      for (let day = 0; day < 7; day++) {
        if (week === 0 && day < startingDayOfWeek) {
          weekDays.push(null);
        } else if (date > daysInMonth) {
          weekDays.push(null);
        } else {
          weekDays.push(date);
          date++;
        }
      }
      
      calendar.push(weekDays);
      if (date > daysInMonth) break;
    }

    return calendar;
  };

  // Obter eventos para uma data específica
  const getEventsForDate = (date: number) => {
    if (!date) return [];
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return events.filter(event => event.date.startsWith(dateString));
  };

  // Navegar meses
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Clique em uma data
  const handleDateClick = (date: number) => {
    if (!date) return;
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    setSelectedDate(dateString);
    setEventForm({ ...eventForm, date: dateString });
    setIsEventDialogOpen(true);
  };

  // Editar evento
  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      date: event.date
    });
    setIsEventDialogOpen(true);
  };

  // Mostrar todos os eventos de uma data
  const handleShowAllEvents = (dateStr: string) => {
    const eventsForDate = events.filter(event => {
      const eventDate = format(new Date(event.date), 'yyyy-MM-dd');
      return eventDate === dateStr;
    });
    setSelectedDateEvents(eventsForDate);
    setIsEventsListDialogOpen(true);
  };

  // Submeter formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventForm.title || !eventForm.date) {
      toast({
        title: t('calendar.error'),
        description: 'Por favor, preencha todos os campos obrigatórios',
        variant: "destructive",
      });
      return;
    }

    if (editingEvent) {
      updateEvent.mutate({
        eventId: editingEvent.id!,
        data: eventForm
      });
    } else {
      createEvent.mutate(eventForm);
    }
  };

  if (!selectedFarmId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {t('calendar.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">{t('calendar.selectFarm')}</p>
        </CardContent>
      </Card>
    );
  }

  const calendar = generateCalendar();
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          {t('calendar.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Header do calendário */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <h3 className="text-lg font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendário */}
        <div className="grid grid-cols-7 gap-1">
          {calendar.map((week, weekIndex) =>
            week.map((date, dayIndex) => {
              const eventsForDate = getEventsForDate(date);
              const isToday = date && 
                new Date().getDate() === date && 
                new Date().getMonth() === currentDate.getMonth() && 
                new Date().getFullYear() === currentDate.getFullYear();

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`
                    min-h-[80px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50
                    ${isToday ? 'bg-blue-50 border-blue-300' : ''}
                    ${!date ? 'cursor-default' : ''}
                  `}
                  onClick={() => date && handleDateClick(date)}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                        {date}
                      </div>
                      <div className="mt-1 space-y-1">
                        {eventsForDate.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded cursor-pointer hover:bg-blue-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {eventsForDate.length > 2 && (
                          <div 
                            className="text-xs text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowAllEvents(format(new Date(currentDate.getFullYear(), currentDate.getMonth(), date), 'yyyy-MM-dd'));
                            }}
                          >
                            +{eventsForDate.length - 2} mais
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Dialog para criar/editar evento */}
        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? t('calendar.edit') : t('calendar.addEvent')}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">{t('calendar.eventTitle')} *</Label>
                <Input
                  id="title"
                  value={eventForm.title || ''}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Digite o título do evento"
                />
              </div>

              <div>
                <Label htmlFor="description">{t('calendar.eventDescription')}</Label>
                <Textarea
                  id="description"
                  value={eventForm.description || ''}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Digite a descrição do evento"
                />
              </div>

              <div>
                <Label htmlFor="date">{t('calendar.eventDate')} *</Label>
                <Input
                  id="date"
                  type="date"
                  value={eventForm.date || ''}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                />
              </div>

              <div className="flex justify-between gap-2">
                {editingEvent && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (editingEvent.id) {
                        deleteEvent.mutate(editingEvent.id);
                        setIsEventDialogOpen(false);
                        setEditingEvent(null);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('calendar.delete')}
                  </Button>
                )}
                
                <div className="flex gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEventDialogOpen(false);
                      setEditingEvent(null);
                      setEventForm({ title: '', description: '', eventType: 'general' });
                    }}
                  >
                    {t('calendar.cancel')}
                  </Button>
                  <Button type="submit">
                    {t('calendar.save')}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog para listar todos os eventos de uma data */}
        <Dialog open={isEventsListDialogOpen} onOpenChange={setIsEventsListDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Eventos de {selectedDateEvents.length > 0 ? 
                  format(new Date(selectedDateEvents[0].date), 'dd/MM/yyyy', { locale: ptBR }) : 
                  'Data selecionada'
                }
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedDateEvents.map(event => (
                <div 
                  key={event.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setIsEventsListDialogOpen(false);
                    handleEditEvent(event);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {t(`calendar.eventTypes.${event.eventType}`) || event.eventType}
                    </span>
                  </div>
                </div>
              ))}
              
              {selectedDateEvents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>{t('calendar.noEvents')}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setIsEventsListDialogOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}