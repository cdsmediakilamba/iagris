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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  PlusCircle,
  PawPrint,
  Calendar,
  Weight,
  Tag,
  Edit,
  Trash2,
  Loader2,
  Users,
  Heart,
  Info,
  FileText,
} from 'lucide-react';

export default function Animals() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

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

  // Get species list for the dropdown
  const { data: speciesList, isLoading: isLoadingSpecies } = useQuery<Species[]>({
    queryKey: ['/api/species'],
  });

  // Get animals for selected farm
  const { data: animals, isLoading: isLoadingAnimals } = useQuery<Animal[]>({
    queryKey: ['/api/farms', selectedFarmId, 'animals'],
    enabled: !!selectedFarmId,
  });

  // Filter animals by search term
  const filteredAnimals = animals?.filter(animal => 
    (animal.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (animal.registrationCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (speciesList?.find(s => s.id === animal.speciesId)?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (animal.breed?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Get potential parent animals (for mother/father selection)
  const femaleAnimals = animals?.filter(animal => animal.gender === 'female') || [];
  const maleAnimals = animals?.filter(animal => animal.gender === 'male') || [];

  // Animal form schema
  const formSchema = insertAnimalSchema.omit({ 
    farmId: true 
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      speciesId: undefined,
      breed: '',
      gender: '',
      birthDate: undefined,
      weight: undefined,
      status: 'healthy',
      motherId: undefined,
      fatherId: undefined,
      lastVaccineDate: undefined,
      observations: '',
    },
  });

  // Create animal mutation
  const createAnimal = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!selectedFarmId) throw new Error("No farm selected");
      const response = await apiRequest(
        'POST', 
        `/api/farms/${selectedFarmId}/animals`, 
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'animals'] });
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

  // Submit handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createAnimal.mutate(data);
  };

  // Status badge renderer
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {t('animals.status.healthy')}
          </Badge>
        );
      case 'sick':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {t('animals.status.sick')}
          </Badge>
        );
      case 'treatment':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {t('animals.status.treatment')}
          </Badge>
        );
      case 'quarantine':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            {t('animals.status.quarantine')}
          </Badge>
        );
      case 'pregnant':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {t('animals.status.pregnant')}
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

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-4">{t('animals.title')}</h1>
        
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
          </div>
          
          {/* Add animal button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('animals.addAnimal')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{t('animals.addAnimal')}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.name')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            {t('animals.registrationCodeInfo')}
                          </FormDescription>
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
                            onValueChange={(value) => field.onChange(parseInt(value))}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="motherId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('animals.mother')}</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value && value !== "none" ? parseInt(value) : undefined)}
                            value={field.value?.toString() || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('animals.selectParent')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">{t('animals.noParent')}</SelectItem>
                              {femaleAnimals.map((animal) => (
                                <SelectItem key={animal.id} value={animal.id.toString()}>
                                  {animal.name || animal.registrationCode || animal.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fatherId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('animals.father')}</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value && value !== "none" ? parseInt(value) : undefined)}
                            value={field.value?.toString() || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('animals.selectParent')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">{t('animals.noParent')}</SelectItem>
                              {maleAnimals.map((animal) => (
                                <SelectItem key={animal.id} value={animal.id.toString()}>
                                  {animal.name || animal.registrationCode || animal.id}
                                </SelectItem>
                              ))}
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
                      name="breed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('animals.breed')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              value={field.value instanceof Date ? field.value.toISOString().substring(0, 10) : field.value || ''} 
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
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>{t('animals.weightUnit')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              value={field.value instanceof Date ? field.value.toISOString().substring(0, 10) : field.value || ''} 
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

      <Card>
        <CardHeader>
          <CardTitle>{t('animals.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAnimals || isLoadingFarms ? (
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
                      <TableCell>{t(`animals.genders.${animal.gender}`)}</TableCell>
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
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
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
