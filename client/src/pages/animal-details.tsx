import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Animal, 
  Species, 
  AnimalVaccination, 
  VaccinationStatus,
  insertAnimalVaccinationSchema 
} from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/i18n';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Edit, ArrowLeft } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Link } from 'wouter';

// Extend the vaccination schema with form validation
const vaccinationFormSchema = insertAnimalVaccinationSchema.extend({
  applicationDate: z.date({
    required_error: "Data de vacinação é obrigatória",
  }),
  nextApplicationDate: z.date().optional().nullable(),
});

type VaccinationFormValues = z.infer<typeof vaccinationFormSchema>;

const AnimalDetails: React.FC = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [, params] = useRoute('/animals/:id');
  const animalId = parseInt(params?.id || '0');
  const [isAddVaccinationOpen, setIsAddVaccinationOpen] = useState(false);
  const [isEditVaccinationOpen, setIsEditVaccinationOpen] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<AnimalVaccination | null>(null);

  // Fetch animal details
  const { data: animal, isLoading: animalLoading } = useQuery({
    queryKey: ['/api/animals', animalId],
    queryFn: () => apiRequest<Animal>(`/api/animals/${animalId}`),
    enabled: !!animalId,
  });

  // Fetch species list for display
  const { data: species } = useQuery({
    queryKey: ['/api/species'],
    queryFn: () => apiRequest<Species[]>('/api/species'),
  });

  // Fetch animal vaccinations
  const { data: vaccinations, isLoading: vaccinationsLoading } = useQuery({
    queryKey: ['/api/animals', animalId, 'vaccinations'],
    queryFn: () => apiRequest<AnimalVaccination[]>(`/api/animals/${animalId}/vaccinations`),
    enabled: !!animalId,
  });

  // Create a new vaccination record
  const createVaccinationMutation = useMutation({
    mutationFn: (data: VaccinationFormValues) => 
      apiRequest(`/api/animals/${animalId}/vaccinations`, {
        method: 'POST',
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/animals', animalId, 'vaccinations'] });
      toast({
        title: t("common.success"),
        description: t("vaccination.createSuccess"),
      });
      setIsAddVaccinationOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("vaccination.createError"),
        variant: "destructive",
      });
    },
  });

  // Update an existing vaccination record
  const updateVaccinationMutation = useMutation({
    mutationFn: (data: { id: number; values: Partial<VaccinationFormValues> }) => 
      apiRequest(`/api/vaccinations/${data.id}`, {
        method: 'PATCH',
        data: data.values,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/animals', animalId, 'vaccinations'] });
      toast({
        title: t("common.success"),
        description: t("vaccination.updateSuccess"),
      });
      setIsEditVaccinationOpen(false);
      setEditingVaccination(null);
      editForm.reset();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("vaccination.updateError"),
        variant: "destructive",
      });
    },
  });

  // Form for adding a new vaccination
  const form = useForm<VaccinationFormValues>({
    resolver: zodResolver(vaccinationFormSchema),
    defaultValues: {
      animalId: animalId,
      applicationDate: new Date(),
      vaccineName: '',
      status: VaccinationStatus.SCHEDULED,
      appliedBy: 0,
      batchNumber: '',
      doseNumber: null,
      notes: '',
      nextApplicationDate: null,
      farmId: animal?.farmId || 0,
    },
  });

  // Form for editing a vaccination
  const editForm = useForm<VaccinationFormValues>({
    resolver: zodResolver(vaccinationFormSchema),
    defaultValues: {
      animalId: animalId,
      applicationDate: new Date(),
      vaccineName: '',
      status: VaccinationStatus.SCHEDULED,
      appliedBy: 0,
      batchNumber: '',
      doseNumber: null,
      notes: '',
      nextApplicationDate: null,
      farmId: animal?.farmId || 0,
    },
  });

  // Handler for adding a new vaccination
  const onSubmitVaccination = (values: VaccinationFormValues) => {
    createVaccinationMutation.mutate(values);
  };

  // Handler for updating a vaccination
  const onSubmitEditVaccination = (values: VaccinationFormValues) => {
    if (!editingVaccination) return;
    
    updateVaccinationMutation.mutate({
      id: editingVaccination.id,
      values: values,
    });
  };

  // Handler for opening the edit vaccination dialog
  const handleEditVaccination = (vaccination: AnimalVaccination) => {
    setEditingVaccination(vaccination);
    
    // Pre-populate the form with existing values
    editForm.reset({
      animalId: vaccination.animalId,
      applicationDate: new Date(vaccination.applicationDate),
      vaccineName: vaccination.vaccineName,
      status: vaccination.status as VaccinationStatus,
      appliedBy: vaccination.appliedBy,
      batchNumber: vaccination.batchNumber || '',
      doseNumber: vaccination.doseNumber,
      notes: vaccination.notes || '',
      nextApplicationDate: vaccination.nextApplicationDate ? new Date(vaccination.nextApplicationDate) : null,
      farmId: vaccination.farmId,
    });
    
    setIsEditVaccinationOpen(true);
  };

  // Get species name by ID
  const getSpeciesName = (speciesId: number) => {
    const foundSpecies = species?.find(s => s.id === speciesId);
    return foundSpecies ? foundSpecies.name : '';
  };

  // Format vaccination status for display
  const getStatusBadge = (status: string) => {
    let color = '';

    switch(status) {
      case VaccinationStatus.SCHEDULED:
        color = 'bg-blue-100 text-blue-800';
        break;
      case VaccinationStatus.COMPLETED:
        color = 'bg-green-100 text-green-800';
        break;
      case VaccinationStatus.MISSED:
        color = 'bg-red-100 text-red-800';
        break;
      case VaccinationStatus.CANCELLED:
        color = 'bg-gray-100 text-gray-800';
        break;
      default:
        color = 'bg-gray-100 text-gray-800';
    }

    return (
      <Badge className={color}>
        {t(`vaccination.status.${status}`)}
      </Badge>
    );
  };

  if (animalLoading) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <p>{t("common.loading")}</p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!animal) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <p>{t("animal.notFound")}</p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center">
          <Link href="/animals">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
          </Link>
        </div>
        
        {/* Animal Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex justify-between items-center">
              <span>
                {animal.name || t("animal.unnamed")} 
                <span className="ml-2 text-sm opacity-75">
                  ({animal.registrationCode})
                </span>
              </span>
            </CardTitle>
            <CardDescription>
              {getSpeciesName(animal.speciesId)} • {animal.breed} • {t(`animal.gender.${animal.gender}`)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">{t("animal.status")}:</p>
                <p>{t(`animal.status.${animal.status}`)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">{t("animal.birthDate")}:</p>
                <p>{animal.birthDate ? formatDate(animal.birthDate, language) : t("common.notSpecified")}</p>
              </div>
              <div>
                <p className="text-sm font-medium">{t("animal.weight")}:</p>
                <p>{animal.weight ? `${animal.weight} kg` : t("common.notSpecified")}</p>
              </div>
              <div>
                <p className="text-sm font-medium">{t("animal.lastVaccineDate")}:</p>
                <p>{animal.lastVaccineDate ? formatDate(animal.lastVaccineDate, language) : t("common.notSpecified")}</p>
              </div>
              {animal.observations && (
                <div className="col-span-2">
                  <p className="text-sm font-medium">{t("animal.observations")}:</p>
                  <p>{animal.observations}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="vaccinations">
          <TabsList>
            <TabsTrigger value="vaccinations">{t("vaccination.vaccinations")}</TabsTrigger>
            <TabsTrigger value="details">{t("animal.details")}</TabsTrigger>
          </TabsList>
          
          {/* Vaccinations Tab */}
          <TabsContent value="vaccinations">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{t("vaccination.history")}</CardTitle>
                  <Dialog open={isAddVaccinationOpen} onOpenChange={setIsAddVaccinationOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        {t("vaccination.add")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("vaccination.add")}</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmitVaccination)} className="space-y-4">
                          {/* Vaccination date */}
                          <FormField
                            control={form.control}
                            name="applicationDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>{t("vaccination.date")}</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className="w-full pl-3 text-left font-normal"
                                      >
                                        {field.value ? (
                                          formatDate(field.value, language)
                                        ) : (
                                          <span>{t("common.selectDate")}</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) =>
                                        date > new Date() || date < new Date("1900-01-01")
                                      }
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Vaccine Name */}
                          <FormField
                            control={form.control}
                            name="vaccineName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("vaccination.type")}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Status */}
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("vaccination.status.label")}</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t("common.select")} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value={VaccinationStatus.SCHEDULED}>
                                      {t("vaccination.status.scheduled")}
                                    </SelectItem>
                                    <SelectItem value={VaccinationStatus.COMPLETED}>
                                      {t("vaccination.status.completed")}
                                    </SelectItem>
                                    <SelectItem value={VaccinationStatus.MISSED}>
                                      {t("vaccination.status.missed")}
                                    </SelectItem>
                                    <SelectItem value={VaccinationStatus.CANCELLED}>
                                      {t("vaccination.status.cancelled")}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Batch Number */}
                          <FormField
                            control={form.control}
                            name="batchNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("vaccination.batchNumber")}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Dose Number */}
                          <FormField
                            control={form.control}
                            name="doseNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("vaccination.doseNumber")}</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    value={field.value === null ? '' : field.value}
                                    onChange={(e) => {
                                      const value = e.target.value === '' ? null : parseInt(e.target.value);
                                      field.onChange(value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Next Scheduled Date */}
                          <FormField
                            control={form.control}
                            name="nextApplicationDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>{t("vaccination.nextDate")}</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className="w-full pl-3 text-left font-normal"
                                      >
                                        {field.value ? (
                                          formatDate(field.value, language)
                                        ) : (
                                          <span>{t("common.optional")}</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value || undefined}
                                      onSelect={field.onChange}
                                      disabled={(date) =>
                                        date < new Date() || date > new Date("2100-01-01")
                                      }
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Notes */}
                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("common.notes")}</FormLabel>
                                <FormControl>
                                  <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <DialogFooter>
                            <Button 
                              type="submit" 
                              disabled={createVaccinationMutation.isPending}
                            >
                              {createVaccinationMutation.isPending ? 
                                t("common.saving") : t("common.save")}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {vaccinationsLoading ? (
                  <div className="text-center py-4">{t("common.loading")}</div>
                ) : vaccinations && vaccinations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("vaccination.date")}</TableHead>
                        <TableHead>{t("vaccination.type")}</TableHead>
                        <TableHead>{t("vaccination.status.label")}</TableHead>
                        <TableHead>{t("vaccination.batchNumber")}</TableHead>
                        <TableHead>{t("vaccination.nextDate")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vaccinations.map((vaccination) => (
                        <TableRow key={vaccination.id}>
                          <TableCell>
                            {formatDate(vaccination.applicationDate, language)}
                          </TableCell>
                          <TableCell>{vaccination.vaccineName}</TableCell>
                          <TableCell>
                            {getStatusBadge(vaccination.status)}
                          </TableCell>
                          <TableCell>
                            {vaccination.batchNumber || t("common.notSpecified")}
                          </TableCell>
                          <TableCell>
                            {vaccination.nextApplicationDate 
                              ? formatDate(vaccination.nextApplicationDate, language) 
                              : t("common.notSpecified")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditVaccination(vaccination)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4">{t("vaccination.noRecords")}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Animal Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>{t("animal.detailedInfo")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">{t("animal.registrationCode")}:</p>
                    <p>{animal.registrationCode}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t("animal.createdAt")}:</p>
                    <p>{formatDate(animal.createdAt, language)}</p>
                  </div>
                  {animal.fatherId && (
                    <div>
                      <p className="text-sm font-medium">{t("animal.fatherId")}:</p>
                      <p>{animal.fatherId}</p>
                    </div>
                  )}
                  {animal.motherId && (
                    <div>
                      <p className="text-sm font-medium">{t("animal.motherId")}:</p>
                      <p>{animal.motherId}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Vaccination Dialog */}
      <Dialog open={isEditVaccinationOpen} onOpenChange={setIsEditVaccinationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("vaccination.edit")}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEditVaccination)} className="space-y-4">
              {/* Vaccination date */}
              <FormField
                control={editForm.control}
                name="applicationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("vaccination.date")}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              formatDate(field.value, language)
                            ) : (
                              <span>{t("common.selectDate")}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vaccine Name */}
              <FormField
                control={editForm.control}
                name="vaccineName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vaccination.type")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vaccination.status.label")}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("common.select")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={VaccinationStatus.SCHEDULED}>
                          {t("vaccination.status.scheduled")}
                        </SelectItem>
                        <SelectItem value={VaccinationStatus.COMPLETED}>
                          {t("vaccination.status.completed")}
                        </SelectItem>
                        <SelectItem value={VaccinationStatus.MISSED}>
                          {t("vaccination.status.missed")}
                        </SelectItem>
                        <SelectItem value={VaccinationStatus.CANCELLED}>
                          {t("vaccination.status.cancelled")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Batch Number */}
              <FormField
                control={editForm.control}
                name="batchNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vaccination.batchNumber")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dose Number */}
              <FormField
                control={editForm.control}
                name="doseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("vaccination.doseNumber")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        value={field.value === null ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? null : parseInt(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Next Scheduled Date */}
              <FormField
                control={editForm.control}
                name="nextApplicationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("vaccination.nextDate")}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              formatDate(field.value, language)
                            ) : (
                              <span>{t("common.optional")}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date > new Date("2100-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.notes")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateVaccinationMutation.isPending}
                >
                  {updateVaccinationMutation.isPending ? 
                    t("common.saving") : t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AnimalDetails;