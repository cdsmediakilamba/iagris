import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertAnimalSchema, Animal, Species } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Loader2, PlusCircle, Search, FileText, Tag, Calendar, Weight, PawPrint, Edit, Trash2, ChevronDown } from 'lucide-react';

const formSchema = insertAnimalSchema;

export default function AnimalsPage() {
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
  React.useEffect(() => {
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

  // Extended form schema to include parent info text fields
  const extendedFormSchema = formSchema
    .omit({ motherId: true, fatherId: true })
    .extend({
      motherInfo: z.string().optional(),
      fatherInfo: z.string().optional(),
    });

  // Setup form
  const form = useForm<z.infer<typeof extendedFormSchema>>({
    resolver: zodResolver(extendedFormSchema),
    defaultValues: {
      name: '',
      speciesId: undefined,
      breed: '',
      gender: '',
      birthDate: undefined,
      weight: undefined,
      status: 'healthy',
      motherInfo: '',
      fatherInfo: '',
      lastVaccineDate: undefined,
      observations: '',
    },
  });

  // Setup edit form
  const editForm = useForm<z.infer<typeof extendedFormSchema>>({
    resolver: zodResolver(extendedFormSchema),
    defaultValues: {
      name: '',
      speciesId: undefined,
      breed: '',
      gender: '',
      birthDate: undefined,
      weight: undefined,
      status: 'healthy',
      motherInfo: '',
      fatherInfo: '',
      lastVaccineDate: undefined,
      observations: '',
    },
  });

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!dialogOpen) {
      form.reset();
    }
  }, [dialogOpen, form]);

  // Reset edit form when edit dialog closes
  React.useEffect(() => {
    if (!editDialogOpen) {
      editForm.reset();
      setAnimalToEdit(null);
    }
  }, [editDialogOpen, editForm]);

  // Populate edit form when an animal is selected for editing
  React.useEffect(() => {
    if (animalToEdit) {
      // Extract potential parent info from observations
      let motherInfo = '';
      let fatherInfo = '';
      let observations = animalToEdit.observations || '';
      
      // Simple parsing of parent info from observations
      if (observations) {
        const motherMatch = /Mãe: ([^\n]+)/.exec(observations);
        if (motherMatch) {
          motherInfo = motherMatch[1];
          observations = observations.replace(motherMatch[0], '').trim();
        }
        
        const fatherMatch = /Pai: ([^\n]+)/.exec(observations);
        if (fatherMatch) {
          fatherInfo = fatherMatch[1];
          observations = observations.replace(fatherMatch[0], '').trim();
        }
      }
      
      editForm.reset({
        name: animalToEdit.name || '',
        speciesId: animalToEdit.speciesId?.toString(),
        breed: animalToEdit.breed || '',
        gender: animalToEdit.gender || '',
        birthDate: animalToEdit.birthDate ? 
          new Date(animalToEdit.birthDate).toISOString().split('T')[0] : 
          undefined,
        weight: animalToEdit.weight ? parseFloat(animalToEdit.weight) : undefined,
        status: animalToEdit.status || 'healthy',
        motherInfo,
        fatherInfo,
        lastVaccineDate: animalToEdit.lastVaccineDate ? 
          new Date(animalToEdit.lastVaccineDate).toISOString().split('T')[0] : 
          undefined,
        observations: observations,
      });
      
      setEditDialogOpen(true);
    }
  }, [animalToEdit, editForm]);

  // Process form data for API
  const processFormData = (data: z.infer<typeof extendedFormSchema>) => {
    if (!selectedFarmId) throw new Error("No farm selected");
    
    // Convert the extended form data back to the format expected by the API
    const { motherInfo, fatherInfo, ...restData } = data;
    
    // Add parent information to observations field if provided
    let observations = data.observations || '';
    if (motherInfo) {
      observations += observations ? `\nMãe: ${motherInfo}` : `Mãe: ${motherInfo}`;
    }
    if (fatherInfo) {
      observations += observations ? `\nPai: ${fatherInfo}` : `Pai: ${fatherInfo}`;
    }
    
    // Process dates - convert string to Date objects for the API
    const birthDate = restData.birthDate ? new Date(restData.birthDate) : null;
    const lastVaccineDate = restData.lastVaccineDate ? new Date(restData.lastVaccineDate) : null;
    
    // Ensure weight is a string representation of decimal number as expected by the server
    const weight = restData.weight ? String(restData.weight) : null;
    
    // The API data with proper type conversions
    return {
      ...restData,
      birthDate,
      lastVaccineDate,
      weight,
      observations: observations.trim(),
      farmId: selectedFarmId,
      // Parse speciesId to number if it's a string
      speciesId: typeof restData.speciesId === 'string' ? parseInt(restData.speciesId) : restData.speciesId
    };
  };

  // Create animal mutation
  const createAnimal = useMutation({
    mutationFn: async (data: z.infer<typeof extendedFormSchema>) => {
      const apiData = processFormData(data);
      
      console.log("Sending animal data to API:", apiData);
      
      const response = await apiRequest(
        'POST', 
        `/api/farms/${selectedFarmId}/animals`, 
        apiData
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${selectedFarmId}/animals`] });
      toast({
        title: t('animals.animalAdded'),
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

  // Update animal mutation
  const updateAnimal = useMutation({
    mutationFn: async (data: z.infer<typeof extendedFormSchema>) => {
      if (!animalToEdit) throw new Error("No animal to edit");
      
      const apiData = processFormData(data);
      
      console.log("Updating animal data:", apiData);
      
      const response = await apiRequest(
        'PATCH', 
        `/api/farms/${selectedFarmId}/animals/${animalToEdit.id}`, 
        apiData
      );
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
      if (!animalToDelete) throw new Error("No animal to delete");
      
      const response = await apiRequest(
        'DELETE', 
        `/api/farms/${selectedFarmId}/animals/${animalToDelete.id}`
      );
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
  const onSubmit = (data: z.infer<typeof extendedFormSchema>) => {
    createAnimal.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof extendedFormSchema>) => {
    updateAnimal.mutate(data);
  };

  // Handle edit animal
  const handleEditAnimal = (animal: Animal) => {
    setAnimalToEdit(animal);
  };

  // Handle delete animal
  const handleDeleteAnimal = (animal: Animal) => {
    setAnimalToDelete(animal);
    setDeleteDialogOpen(true);
  };

  // Status badge renderer
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {t('animals.statuses.healthy')}
          </Badge>
        );
      case 'sick':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {t('animals.statuses.sick')}
          </Badge>
        );
      case 'treatment':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {t('animals.statuses.treatment')}
          </Badge>
        );
      case 'quarantine':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            {t('animals.statuses.quarantine')}
          </Badge>
        );
      case 'pregnant':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            {t('animals.statuses.pregnant')}
          </Badge>
        );
      case 'needsAttention':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            {t('animals.statuses.needsAttention')}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t('animals.title')}</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('common.search')}
              className="w-[200px] pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                {selectedFarmId
                  ? farms.find(farm => farm.id === selectedFarmId)?.name
                  : t('common.selectFarm')}
                <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {farms.map((farm) => (
                <DropdownMenuItem 
                  key={farm.id} 
                  onClick={() => setSelectedFarmId(farm.id)}
                  className={selectedFarmId === farm.id ? "bg-accent text-accent-foreground" : ""}
                >
                  {farm.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('animals.addAnimal')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto compact-form">
              <DialogHeader>
                <DialogTitle>{t('animals.addAnimal')}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('animals.selectSpecies')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingSpecies ? (
                                <SelectItem value="loading" disabled>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                  {t('common.loading')}
                                </SelectItem>
                              ) : speciesList && speciesList.length > 0 ? (
                                speciesList.map((species) => (
                                  <SelectItem key={species.id} value={species.id.toString()}>
                                    {species.name} ({species.abbreviation})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-species" disabled>
                                  {t('animals.noSpecies')}
                                </SelectItem>
                              )}
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
                            <Input 
                              {...field} 
                              placeholder={t('animals.enterParentInfo')}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('animals.parentInfoOptional')}
                          </FormDescription>
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
                            <Input 
                              {...field} 
                              placeholder={t('animals.enterParentInfo')}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('animals.parentInfoOptional')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                              value={field.value instanceof Date 
                                ? field.value.toISOString().substring(0, 10) 
                                : typeof field.value === 'string' ? field.value : ''
                              } 
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
                              value={field.value ? field.value : ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                              value={field.value instanceof Date 
                                ? field.value.toISOString().substring(0, 10) 
                                : typeof field.value === 'string' ? field.value : ''
                              } 
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
                              <SelectItem value="needsAttention">{t('animals.status.needsAttention')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Observations field */}
                  <div>
                    <FormField
                      control={form.control}
                      name="observations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('animals.observations')}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t('animals.observationsPlaceholder')}
                              className="resize-none"
                              rows={1}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

          {/* Edit Animal Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto compact-form">
              <DialogHeader>
                <DialogTitle>{t('animals.editAnimal')}</DialogTitle>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            onValueChange={field.onChange}
                            defaultValue={field.value?.toString()}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('animals.selectSpecies')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingSpecies ? (
                                <SelectItem value="loading" disabled>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                                  {t('common.loading')}
                                </SelectItem>
                              ) : speciesList && speciesList.length > 0 ? (
                                speciesList.map((species) => (
                                  <SelectItem key={species.id} value={species.id.toString()}>
                                    {species.name} ({species.abbreviation})
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-species" disabled>
                                  {t('animals.noSpecies')}
                                </SelectItem>
                              )}
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
                            <Input 
                              {...field} 
                              placeholder={t('animals.enterParentInfo')}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('animals.parentInfoOptional')}
                          </FormDescription>
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
                            <Input 
                              {...field} 
                              placeholder={t('animals.enterParentInfo')}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('animals.parentInfoOptional')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                            value={field.value}
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
                              value={field.value instanceof Date 
                                ? field.value.toISOString().substring(0, 10) 
                                : typeof field.value === 'string' ? field.value : ''
                              } 
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
                              value={field.value ? field.value : ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
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
                              value={field.value instanceof Date 
                                ? field.value.toISOString().substring(0, 10) 
                                : typeof field.value === 'string' ? field.value : ''
                              } 
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
                            value={field.value}
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
                              <SelectItem value="needsAttention">{t('animals.status.needsAttention')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Observations field */}
                  <div>
                    <FormField
                      control={editForm.control}
                      name="observations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('animals.observations')}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t('animals.observationsPlaceholder')}
                              className="resize-none"
                              rows={1}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('animals.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAnimals ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAnimals && filteredAnimals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('animals.registrationCode')}</TableHead>
                    <TableHead>{t('animals.identificationCode')}</TableHead>
                    <TableHead>{t('animals.species')}</TableHead>
                    <TableHead>{t('animals.breed')}</TableHead>
                    <TableHead>{t('animals.gender')}</TableHead>
                    <TableHead>{t('animals.birthDate')}</TableHead>
                    <TableHead>{t('animals.weight')}</TableHead>
                    <TableHead>{t('animals.healthStatus')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnimals.map((animal) => (
                    <TableRow key={animal.id}>
                      <TableCell className="font-medium flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        <span className="font-mono text-sm">{animal.registrationCode}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-gray-500" />
                          {animal.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <PawPrint className="h-4 w-4 mr-2 text-gray-500" />
                          {speciesList?.find(s => s.id === animal.speciesId)?.name || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{animal.breed}</TableCell>
                      <TableCell>{animal.gender ? animal.gender === 'male' ? t('animals.genders.male') : t('animals.genders.female') : '-'}</TableCell>
                      <TableCell>
                        {animal.birthDate ? (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            {formatDate(new Date(animal.birthDate), 'P', language)}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {animal.weight ? (
                          <div className="flex items-center">
                            <Weight className="h-4 w-4 mr-2 text-gray-500" />
                            {animal.weight} {t('animals.weightUnit')}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(animal.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                              variant="ghost"
                              size="icon"
                              className="text-blue-600"
                              onClick={() => setLocation(`/animals/${animal.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditAnimal(animal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => handleDeleteAnimal(animal)}
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
          ) : (
            <div className="text-center py-10">
              <PawPrint className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">{t('animals.noAnimals')}</h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? t('common.noSearchResults') 
                  : t('animals.addAnimal')
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}