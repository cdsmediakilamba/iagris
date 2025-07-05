import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimalVaccination, insertAnimalVaccinationSchema } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/i18n';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calendar, Syringe, Loader2 } from 'lucide-react';

// Schema para validação do formulário
const vaccinationFormSchema = insertAnimalVaccinationSchema.extend({
  applicationDate: z.string().min(1, 'Data de aplicação é obrigatória'),
  nextApplicationDate: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  farmId: true,
  animalId: true,
  appliedBy: true,
});

type VaccinationFormData = z.infer<typeof vaccinationFormSchema>;

interface AnimalVaccinationsProps {
  animalId: number;
  farmId: number;
}

export default function AnimalVaccinations({ animalId, farmId }: AnimalVaccinationsProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVaccination, setSelectedVaccination] = useState<AnimalVaccination | null>(null);

  // Buscar vacinações do animal
  const { data: vaccinations = [], isLoading } = useQuery({
    queryKey: [`/api/animals/${animalId}/vaccinations`],
    queryFn: () => apiRequest(`/api/animals/${animalId}/vaccinations`),
  });

  // Formulário para adicionar vacinação
  const addForm = useForm<VaccinationFormData>({
    resolver: zodResolver(vaccinationFormSchema),
    defaultValues: {
      vaccineName: '',
      applicationDate: '',
      nextApplicationDate: '',
      doseNumber: 1,
      batchNumber: '',
      status: 'completed',
      notes: '',
    },
  });

  // Formulário para editar vacinação
  const editForm = useForm<VaccinationFormData>({
    resolver: zodResolver(vaccinationFormSchema),
  });

  // Mutação para adicionar vacinação
  const addVaccination = useMutation({
    mutationFn: (data: VaccinationFormData) => {
      const vaccinationData = {
        ...data,
        animalId,
        farmId,
        applicationDate: new Date(data.applicationDate),
        nextApplicationDate: data.nextApplicationDate ? new Date(data.nextApplicationDate) : null,
      };
      return apiRequest(`/api/animals/${animalId}/vaccinations`, {
        method: 'POST',
        data: vaccinationData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/vaccinations`] });
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${farmId}/animals`] });
      toast({
        title: 'Sucesso',
        description: 'Vacinação adicionada com sucesso',
      });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar vacinação',
        variant: 'destructive',
      });
    },
  });

  // Mutação para editar vacinação
  const updateVaccination = useMutation({
    mutationFn: (data: VaccinationFormData) => {
      if (!selectedVaccination) return Promise.reject('Nenhuma vacinação selecionada');
      
      const vaccinationData = {
        ...data,
        applicationDate: new Date(data.applicationDate),
        nextApplicationDate: data.nextApplicationDate ? new Date(data.nextApplicationDate) : null,
      };
      
      return apiRequest(`/api/vaccinations/${selectedVaccination.id}`, {
        method: 'PATCH',
        data: vaccinationData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/vaccinations`] });
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${farmId}/animals`] });
      toast({
        title: 'Sucesso',
        description: 'Vacinação atualizada com sucesso',
      });
      setIsEditDialogOpen(false);
      setSelectedVaccination(null);
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar vacinação',
        variant: 'destructive',
      });
    },
  });

  // Mutação para deletar vacinação
  const deleteVaccination = useMutation({
    mutationFn: (vaccinationId: number) => {
      return apiRequest(`/api/vaccinations/${vaccinationId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/animals/${animalId}/vaccinations`] });
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${farmId}/animals`] });
      toast({
        title: 'Sucesso',
        description: 'Vacinação excluída com sucesso',
      });
      setIsDeleteDialogOpen(false);
      setSelectedVaccination(null);
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao excluir vacinação',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (vaccination: AnimalVaccination) => {
    setSelectedVaccination(vaccination);
    editForm.reset({
      vaccineName: vaccination.vaccineName,
      applicationDate: vaccination.applicationDate ? 
        new Date(vaccination.applicationDate).toISOString().split('T')[0] : '',
      nextApplicationDate: vaccination.nextApplicationDate ? 
        new Date(vaccination.nextApplicationDate).toISOString().split('T')[0] : '',
      doseNumber: vaccination.doseNumber || 1,
      batchNumber: vaccination.batchNumber || '',
      status: vaccination.status,
      notes: vaccination.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (vaccination: AnimalVaccination) => {
    setSelectedVaccination(vaccination);
    setIsDeleteDialogOpen(true);
  };

  const onAddSubmit = (data: VaccinationFormData) => {
    addVaccination.mutate(data);
  };

  const onEditSubmit = (data: VaccinationFormData) => {
    updateVaccination.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Concluída</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Agendada</Badge>;
      case 'missed':
        return <Badge variant="destructive">Não realizada</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Syringe className="h-5 w-5" />
            <CardTitle>Vacinações</CardTitle>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Vacinação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Vacinação</DialogTitle>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="vaccineName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Vacina</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Febre Aftosa" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="applicationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Aplicação</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addForm.control}
                      name="nextApplicationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Próxima Dose</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="doseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número da Dose</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              value={field.value || 1}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addForm.control}
                      name="batchNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lote</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Número do lote" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={addForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={addVaccination.isPending}>
                      {addVaccination.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : vaccinations.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            <Syringe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma vacinação registrada para este animal.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vacina</TableHead>
                  <TableHead>Data Aplicação</TableHead>
                  <TableHead>Próxima Dose</TableHead>
                  <TableHead>Dose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vaccinations.map((vaccination: AnimalVaccination) => (
                  <TableRow key={vaccination.id}>
                    <TableCell className="font-medium">
                      {vaccination.vaccineName}
                    </TableCell>
                    <TableCell>
                      {vaccination.applicationDate 
                        ? formatDate(new Date(vaccination.applicationDate), 'dd/MM/yyyy', language)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {vaccination.nextApplicationDate 
                        ? formatDate(new Date(vaccination.nextApplicationDate), 'dd/MM/yyyy', language)
                        : '-'}
                    </TableCell>
                    <TableCell>{vaccination.doseNumber || 1}ª</TableCell>
                    <TableCell>
                      {getStatusBadge(vaccination.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(vaccination)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(vaccination)}
                          title="Excluir"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Dialog para editar vacinação */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Vacinação</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="vaccineName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Vacina</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Febre Aftosa" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="applicationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Aplicação</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="nextApplicationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Próxima Dose</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="doseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Dose</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          value={field.value || 1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="batchNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lote</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Número do lote" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={updateVaccination.isPending}>
                  {updateVaccination.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta vacinação?
              {selectedVaccination && (
                <span className="font-semibold block mt-2">
                  {selectedVaccination.vaccineName}
                </span>
              )}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedVaccination && deleteVaccination.mutate(selectedVaccination.id)}
              disabled={deleteVaccination.isPending}
            >
              {deleteVaccination.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}