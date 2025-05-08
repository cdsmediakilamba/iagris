import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertAnimalSchema, Animal, Species } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/i18n';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  FormDescription,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, MoreVertical, Loader2, Plus, Search } from 'lucide-react';

// Base form schema
const animalFormSchema = z.object({
  name: z.string().optional(),
  speciesId: z.coerce.number({
    required_error: "Espécie é obrigatória",
    invalid_type_error: "Espécie deve ser um número"
  }),
  breed: z.string().min(1, "Raça é obrigatória"),
  gender: z.string().min(1, "Gênero é obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  weight: z.coerce.number({
    required_error: "Peso é obrigatório",
    invalid_type_error: "Peso deve ser um número"
  }),
  status: z.string().default("healthy"),
  motherInfo: z.string().optional(),
  fatherInfo: z.string().optional(),
  lastVaccineDate: z.string().optional(),
  observations: z.string().optional()
});

type AnimalFormValues = z.infer<typeof animalFormSchema>;

export default function NewAnimalsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [animalToEdit, setAnimalToEdit] = useState<Animal | null>(null);
  const [animalToDelete, setAnimalToDelete] = useState<Animal | null>(null);

  // Load farms
  const { data: farms = [] } = useQuery({
    queryKey: ['/api/farms'],
  });

  // Ensure a farm is selected if available
  useEffect(() => {
    if (farms && farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  // Load animals for the selected farm
  const { data: animals = [], isLoading: isLoadingAnimals } = useQuery({
    queryKey: [`/api/farms/${selectedFarmId}/animals`],
    enabled: !!selectedFarmId,
  });

  // Load species
  const { data: speciesList = [], isLoading: isLoadingSpecies } = useQuery({
    queryKey: ['/api/species'],
  });

  // Filter animals based on search term
  const filteredAnimals = React.useMemo(() => {
    if (!animals) return [];
    
    if (!searchTerm.trim()) return animals;
    
    const search = searchTerm.toLowerCase();
    return animals.filter((animal) => 
      (animal.name && animal.name.toLowerCase().includes(search)) ||
      animal.registrationCode.toLowerCase().includes(search) ||
      animal.breed.toLowerCase().includes(search) ||
      animal.status.toLowerCase().includes(search)
    );
  }, [animals, searchTerm]);

  // Setup form
  const form = useForm<AnimalFormValues>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      name: '',
      speciesId: undefined,
      breed: '',
      gender: '',
      birthDate: '',
      weight: undefined,
      status: 'healthy',
      motherInfo: '',
      fatherInfo: '',
      lastVaccineDate: '',
      observations: '',
    },
  });

  // Setup edit form
  const editForm = useForm<AnimalFormValues>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      name: '',
      speciesId: undefined,
      breed: '',
      gender: '',
      birthDate: '',
      weight: undefined,
      status: 'healthy',
      motherInfo: '',
      fatherInfo: '',
      lastVaccineDate: '',
      observations: '',
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      form.reset();
    }
  }, [dialogOpen, form]);

  // Reset edit form when edit dialog closes
  useEffect(() => {
    if (!editDialogOpen) {
      editForm.reset();
      setAnimalToEdit(null);
    }
  }, [editDialogOpen, editForm]);

  // Process form data before sending to API
  const processFormData = (data: AnimalFormValues) => {
    // Create a new observations field that includes parent info
    let observationsText = data.observations || '';
    
    if (data.motherInfo) {
      observationsText = `Mãe: ${data.motherInfo}\n${observationsText}`;
    }
    
    if (data.fatherInfo) {
      observationsText = `Pai: ${data.fatherInfo}\n${observationsText}`;
    }
    
    // Format dates properly for API
    const formattedBirthDate = data.birthDate ? new Date(data.birthDate).toISOString() : null;
    const formattedLastVaccineDate = data.lastVaccineDate ? new Date(data.lastVaccineDate).toISOString() : null;
    
    // Ensure weight is a proper string with decimal places
    const formattedWeight = data.weight ? data.weight.toString() : null;
    
    // Return processed data for API
    return {
      name: data.name || null,
      speciesId: data.speciesId,
      breed: data.breed,
      gender: data.gender,
      birthDate: formattedBirthDate,
      weight: formattedWeight,
      status: data.status,
      observations: observationsText.trim() || null,
      lastVaccineDate: formattedLastVaccineDate,
      // These will be extracted from observations on the server
      motherId: null,
      fatherId: null,
    };
  };

  // Populate edit form when an animal is selected for editing
  useEffect(() => {
    if (animalToEdit) {
      // Extract potential parent info from observations
      let motherInfo = '';
      let fatherInfo = '';
      let observations = animalToEdit.observations || '';
      
      // Simple parsing of parent info from observations
      if (observations) {
        const motherMatch = /Mãe: ([^\\n]+)/.exec(observations);
        if (motherMatch) {
          motherInfo = motherMatch[1];
          observations = observations.replace(motherMatch[0], '').trim();
        }
        
        const fatherMatch = /Pai: ([^\\n]+)/.exec(observations);
        if (fatherMatch) {
          fatherInfo = fatherMatch[1];
          observations = observations.replace(fatherMatch[0], '').trim();
        }
      }
      
      editForm.reset({
        name: animalToEdit.name || '',
        speciesId: animalToEdit.speciesId,
        breed: animalToEdit.breed || '',
        gender: animalToEdit.gender || '',
        birthDate: animalToEdit.birthDate ? 
          new Date(animalToEdit.birthDate).toISOString().split('T')[0] : 
          '',
        weight: animalToEdit.weight ? parseFloat(animalToEdit.weight.toString()) : undefined,
        status: animalToEdit.status || 'healthy',
        motherInfo,
        fatherInfo,
        lastVaccineDate: animalToEdit.lastVaccineDate ? 
          new Date(animalToEdit.lastVaccineDate).toISOString().split('T')[0] : 
          '',
        observations: observations,
      });
    }
  }, [animalToEdit, editForm]);

  // Create animal mutation
  const createAnimal = useMutation({
    mutationFn: async (data: AnimalFormValues) => {
      if (!selectedFarmId) throw new Error("Nenhuma fazenda selecionada");
      
      const apiData = processFormData(data);
      
      console.log("Enviando dados do animal para API:", JSON.stringify(apiData, null, 2));
      
      try {
        const response = await apiRequest(
          'POST', 
          `/api/farms/${selectedFarmId}/animals`, 
          apiData
        );
        
        // Log da resposta completa para diagnóstico
        console.log("Resposta do servidor:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers.entries()])
        });
        
        if (!response.ok) {
          try {
            const errorData = await response.json();
            console.error("Dados de erro:", errorData);
            throw new Error(errorData.message || "Erro ao criar animal");
          } catch (parseError) {
            // Se não conseguir parsear como JSON, pega o texto bruto
            const errorText = await response.text();
            console.error("Resposta de erro bruta:", errorText);
            throw new Error(`Erro do servidor: ${response.status} - ${errorText.substring(0, 100)}...`);
          }
        }
        
        const responseData = await response.json();
        console.log("Dados de resposta:", responseData);
        return responseData;
      } catch (error) {
        console.error("Erro completo ao criar animal:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Animal criado com sucesso:", data);
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${selectedFarmId}/animals`] });
      toast({
        title: t('animals.animalAdded'),
        description: t('common.success'),
      });
      form.reset();
      setDialogOpen(false);
    },
    onError: (error) => {
      console.error("Erro ao criar animal:", error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update animal mutation
  const updateAnimal = useMutation({
    mutationFn: async (data: AnimalFormValues) => {
      if (!animalToEdit) throw new Error("Nenhum animal para editar");
      if (!selectedFarmId) throw new Error("Nenhuma fazenda selecionada");
      
      const apiData = processFormData(data);
      
      console.log("Atualizando dados do animal:", apiData);
      
      const response = await apiRequest(
        'PATCH', 
        `/api/farms/${selectedFarmId}/animals/${animalToEdit.id}`, 
        apiData
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar animal");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${selectedFarmId}/animals`] });
      toast({
        title: t('animals.animalUpdated'),
        description: t('common.success'),
      });
      editForm.reset();
      setEditDialogOpen(false);
      setAnimalToEdit(null);
    },
    onError: (error) => {
      console.error("Erro ao atualizar animal:", error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete animal mutation
  const deleteAnimal = useMutation({
    mutationFn: async () => {
      if (!animalToDelete) throw new Error("Nenhum animal para excluir");
      if (!selectedFarmId) throw new Error("Nenhuma fazenda selecionada");
      
      const response = await apiRequest(
        'DELETE', 
        `/api/farms/${selectedFarmId}/animals/${animalToDelete.id}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao excluir animal");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${selectedFarmId}/animals`] });
      toast({
        title: t('animals.animalDeleted'),
        description: t('common.success'),
      });
      setDeleteDialogOpen(false);
      setAnimalToDelete(null);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Submit handlers
  const onSubmit = (data: AnimalFormValues) => {
    createAnimal.mutate(data);
  };

  const onEditSubmit = (data: AnimalFormValues) => {
    updateAnimal.mutate(data);
  };

  // Handle edit animal
  const handleEditAnimal = (animal: Animal) => {
    setAnimalToEdit(animal);
    setEditDialogOpen(true);
  };

  // Handle delete animal
  const handleDeleteAnimal = (animal: Animal) => {
    setAnimalToDelete(animal);
    setDeleteDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('animals.title')} (Nova Interface)</h1>
          <div className="flex space-x-2">
            {farms && farms.length > 0 && (
              <Select 
                value={selectedFarmId?.toString()} 
                onValueChange={(value) => setSelectedFarmId(parseInt(value))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('common.selectFarm') || "Selecionar Fazenda"} />
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('animals.addAnimal')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('animals.addAnimal')}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.name')}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="speciesId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('animals.species')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value ? field.value.toString() : undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('animals.selectSpecies')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {speciesList.map((species) => (
                                <SelectItem key={species.id} value={species.id.toString()}>
                                  {species.name} ({species.abbreviation})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="breed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.breed')}</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.gender')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('animals.gender')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">{t('animals.genders.male')}</SelectItem>
                                <SelectItem value="female">{t('animals.genders.female')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.birthDate')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.weight')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                {...field}
                                value={field.value === undefined ? '' : field.value}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">{t('animals.weightUnit')}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="lastVaccineDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.lastVaccine')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.healthStatus')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('animals.healthStatus')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="healthy">{t('animals.status.healthy')}</SelectItem>
                                <SelectItem value="sick">{t('animals.status.sick')}</SelectItem>
                                <SelectItem value="treatment">{t('animals.status.treatment')}</SelectItem>
                                <SelectItem value="quarantine">{t('animals.status.quarantine')}</SelectItem>
                                <SelectItem value="pregnant">{t('animals.status.pregnant')}</SelectItem>
                                <SelectItem value="lactating">{t('animals.status.lactating')}</SelectItem>
                                <SelectItem value="needsAttention">{t('animals.status.needsAttention')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="motherInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.mother')}</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fatherInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.father')}</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="observations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.observations')}</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">{t('common.cancel')}</Button>
                      </DialogClose>
                      <Button type="submit" disabled={createAnimal.isPending}>
                        {createAnimal.isPending ? (
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

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('animals.title')}</CardTitle>
            <CardDescription>
              {t('common.total')}: {filteredAnimals.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAnimals ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredAnimals.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                {t('animals.noAnimals')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('animals.registrationCode')}</TableHead>
                      <TableHead>{t('common.name')}</TableHead>
                      <TableHead>{t('animals.species')}</TableHead>
                      <TableHead>{t('animals.breed')}</TableHead>
                      <TableHead>{t('animals.gender')}</TableHead>
                      <TableHead>{t('animals.birthDate')}</TableHead>
                      <TableHead>{t('animals.weight')}</TableHead>
                      <TableHead>{t('animals.healthStatus')}</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAnimals.map((animal) => {
                      const species = speciesList.find(s => s.id === animal.speciesId);
                      
                      return (
                        <TableRow key={animal.id}>
                          <TableCell className="font-medium">
                            {animal.registrationCode}
                          </TableCell>
                          <TableCell>{animal.name || '-'}</TableCell>
                          <TableCell>{species ? species.name : '-'}</TableCell>
                          <TableCell>{animal.breed}</TableCell>
                          <TableCell>
                            {animal.gender === 'male' 
                              ? t('animals.genders.male') 
                              : t('animals.genders.female')}
                          </TableCell>
                          <TableCell>
                            {animal.birthDate 
                              ? formatDate(new Date(animal.birthDate), language) 
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {animal.weight ? `${animal.weight} kg` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={animal.status === 'healthy' ? 'default' : 
                                      animal.status === 'sick' || animal.status === 'quarantine' ? 'destructive' : 
                                      animal.status === 'pregnant' || animal.status === 'lactating' ? 'secondary' : 
                                      'outline'}
                            >
                              {t(`animals.status.${animal.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditAnimal(animal)}>
                                  {t('common.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteAnimal(animal)}
                                >
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Animal Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('animals.editAnimal')}</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.name')}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="speciesId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('animals.species')}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('animals.selectSpecies')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {speciesList.map((species) => (
                            <SelectItem key={species.id} value={species.id.toString()}>
                              {species.name} ({species.abbreviation})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={editForm.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.breed')}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.gender')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('animals.gender')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">{t('animals.genders.male')}</SelectItem>
                            <SelectItem value="female">{t('animals.genders.female')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={editForm.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.birthDate')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.weight')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">{t('animals.weightUnit')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={editForm.control}
                    name="lastVaccineDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.lastVaccine')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.healthStatus')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('animals.healthStatus')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="healthy">{t('animals.status.healthy')}</SelectItem>
                            <SelectItem value="sick">{t('animals.status.sick')}</SelectItem>
                            <SelectItem value="treatment">{t('animals.status.treatment')}</SelectItem>
                            <SelectItem value="quarantine">{t('animals.status.quarantine')}</SelectItem>
                            <SelectItem value="pregnant">{t('animals.status.pregnant')}</SelectItem>
                            <SelectItem value="lactating">{t('animals.status.lactating')}</SelectItem>
                            <SelectItem value="needsAttention">{t('animals.status.needsAttention')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={editForm.control}
                    name="motherInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.mother')}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="fatherInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.father')}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.observations')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">{t('common.cancel')}</Button>
                  </DialogClose>
                  <Button type="submit" disabled={updateAnimal.isPending}>
                    {updateAnimal.isPending ? (
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('animals.confirmDelete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('animals.confirmDelete')}
                {animalToDelete && (
                  <span className="font-semibold block mt-2">
                    {animalToDelete.name || animalToDelete.registrationCode}
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteAnimal.mutate()}
                disabled={deleteAnimal.isPending}
              >
                {deleteAnimal.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('common.delete')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}