import React, { useState } from 'react';
import { Calendar } from 'react-day-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, Edit, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CalendarEvent, Crop } from '@shared/schema';
import 'react-day-picker/dist/style.css';

interface CropsCalendarProps {
  farmId: number;
  crops: Crop[];
}

export default function CropsCalendar({ farmId, crops }: CropsCalendarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventType: 'general',
    cropId: ''
  });

  // Buscar eventos do calendário
  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/farms', farmId, 'calendar-events'],
    enabled: !!farmId,
  });

  // Mutação para criar evento
  const createEventMutation = useMutation({
    mutationFn: (eventData: any) => apiRequest(`/api/farms/${farmId}/calendar-events`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'calendar-events'] });
      setIsEventDialogOpen(false);
      resetForm();
      toast({
        title: 'Evento criado',
        description: 'O evento foi criado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o evento.',
        variant: 'destructive',
      });
    },
  });

  // Mutação para atualizar evento
  const updateEventMutation = useMutation({
    mutationFn: ({ id, ...eventData }: any) => apiRequest(`/api/calendar-events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(eventData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'calendar-events'] });
      setIsEventDialogOpen(false);
      setEditingEvent(null);
      resetForm();
      toast({
        title: 'Evento atualizado',
        description: 'O evento foi atualizado com sucesso.',
      });
    },
  });

  // Mutação para deletar evento
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: number) => apiRequest(`/api/calendar-events/${eventId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'calendar-events'] });
      toast({
        title: 'Evento removido',
        description: 'O evento foi removido com sucesso.',
      });
    },
  });

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      eventType: 'general',
      cropId: ''
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && !isEventDialogOpen) {
      setIsEventDialogOpen(true);
      setEditingEvent(null);
      resetForm();
    }
  };

  const handleCreateEvent = () => {
    if (!selectedDate || !eventForm.title.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha o título do evento.',
        variant: 'destructive',
      });
      return;
    }

    const eventData = {
      title: eventForm.title,
      description: eventForm.description,
      date: selectedDate.toISOString(),
      eventType: eventForm.eventType,
      cropId: eventForm.cropId ? parseInt(eventForm.cropId) : null,
    };

    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, ...eventData });
    } else {
      createEventMutation.mutate(eventData);
    }
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      eventType: event.eventType || 'general',
      cropId: event.cropId?.toString() || ''
    });
    setSelectedDate(new Date(event.date));
    setIsEventDialogOpen(true);
  };

  const handleDeleteEvent = (eventId: number) => {
    if (window.confirm('Tem certeza que deseja remover este evento?')) {
      deleteEventMutation.mutate(eventId);
    }
  };

  // Filtrar eventos para a data selecionada
  const eventsForSelectedDate = selectedDate 
    ? events.filter(event => isSameDay(new Date(event.date), selectedDate))
    : [];

  // Marcar dias com eventos
  const modifiers = {
    hasEvents: events.map(event => new Date(event.date))
  };

  const modifiersStyles = {
    hasEvents: {
      backgroundColor: '#3b82f6',
      color: 'white',
      borderRadius: '50%',
    }
  };

  const eventTypeColors = {
    plantio: 'bg-green-500',
    colheita: 'bg-orange-500',
    irrigacao: 'bg-blue-500',
    fertilizacao: 'bg-yellow-500',
    general: 'bg-gray-500'
  };

  const eventTypeLabels = {
    plantio: 'Plantio',
    colheita: 'Colheita',
    irrigacao: 'Irrigação',
    fertilizacao: 'Fertilização',
    general: 'Geral'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Calendário Agrícola</h3>
        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingEvent(null);
              resetForm();
              setSelectedDate(new Date());
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Editar Evento' : 'Novo Evento'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm(prev => ({...prev, title: e.target.value}))}
                  placeholder="Ex: Plantio de milho"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({...prev, description: e.target.value}))}
                  placeholder="Detalhes sobre o evento..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="eventType">Tipo de Evento</Label>
                <Select value={eventForm.eventType} onValueChange={(value) => setEventForm(prev => ({...prev, eventType: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="plantio">Plantio</SelectItem>
                    <SelectItem value="colheita">Colheita</SelectItem>
                    <SelectItem value="irrigacao">Irrigação</SelectItem>
                    <SelectItem value="fertilizacao">Fertilização</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="crop">Cultura (Opcional)</Label>
                <Select value={eventForm.cropId} onValueChange={(value) => setEventForm(prev => ({...prev, cropId: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cultura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma cultura específica</SelectItem>
                    {crops.map(crop => (
                      <SelectItem key={crop.id} value={crop.id.toString()}>
                        {crop.name} - {crop.sector}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data: {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Não selecionada'}</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateEvent} 
                  disabled={createEventMutation.isPending || updateEventMutation.isPending}
                  className="flex-1"
                >
                  {editingEvent ? 'Atualizar' : 'Criar'} Evento
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEventDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={ptBR}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Eventos do dia selecionado */}
        <Card>
          <CardHeader>
            <CardTitle>
              Eventos {selectedDate ? `- ${format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventsForSelectedDate.length > 0 ? (
                eventsForSelectedDate.map(event => (
                  <div key={event.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${eventTypeColors[event.eventType as keyof typeof eventTypeColors]} text-white`}>
                          {eventTypeLabels[event.eventType as keyof typeof eventTypeLabels]}
                        </Badge>
                        <span className="font-medium">{event.title}</span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      )}
                      {event.cropId && (
                        <p className="text-xs text-gray-500">
                          Cultura: {crops.find(c => c.id === event.cropId)?.name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhum evento para esta data.
                  {selectedDate && (
                    <Button
                      variant="link"
                      onClick={() => setIsEventDialogOpen(true)}
                      className="ml-2"
                    >
                      Criar evento
                    </Button>
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}