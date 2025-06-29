import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/use-auth';
import { TemporaryEmployee, UserRole, BloodType, InsertTemporaryEmployee, insertTemporaryEmployeeSchema } from '@shared/schema';
import { getDaysRemaining } from '@/hooks/use-temporary-employees';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, Plus, Calendar, Phone, MapPin, Droplet, Heart, User, AlertCircle, Upload } from 'lucide-react';

const formSchema = insertTemporaryEmployeeSchema.extend({
  birthDate: z.string().min(1, 'Birth date is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate > startDate;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

type FormData = z.infer<typeof formSchema>;

const countries = [
  { value: 'AO', label: 'Angola', flag: '🇦🇴' },
  { value: 'PT', label: 'Portugal', flag: '🇵🇹' },
  { value: 'BR', label: 'Brazil', flag: '🇧🇷' },
  { value: 'MZ', label: 'Mozambique', flag: '🇲🇿' },
  { value: 'CV', label: 'Cape Verde', flag: '🇨🇻' },
  { value: 'GW', label: 'Guinea-Bissau', flag: '🇬🇼' },
  { value: 'ST', label: 'São Tomé and Príncipe', flag: '🇸🇹' },
  { value: 'TL', label: 'East Timor', flag: '🇹🇱' },
  { value: 'OTHER', label: 'Other', flag: '🌍' },
];

const bloodTypes = [
  BloodType.A_POSITIVE,
  BloodType.A_NEGATIVE,
  BloodType.B_POSITIVE,
  BloodType.B_NEGATIVE,
  BloodType.AB_POSITIVE,
  BloodType.AB_NEGATIVE,
  BloodType.O_POSITIVE,
  BloodType.O_NEGATIVE,
];

// Photo optimization and fallback handling
const getOptimizedPhotoUrl = (photoUrl: string | null | undefined): string | undefined => {
  if (!photoUrl) return undefined;
  
  // If it's already a URL, return as is
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  
  // If it's a relative path, ensure it starts with /
  const normalizedPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
  
  return normalizedPath;
};

const getEmployeeInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name.split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2); // Limit to 2 characters
};

const getCountryFlag = (countryCode: string | null) => {
  const country = countries.find(c => c.value === countryCode);
  return country?.flag || '🌍';
};

const getCountryName = (countryCode: string | null) => {
  const country = countries.find(c => c.value === countryCode);
  return country?.label || 'Unknown';
};

export default function TemporaryEmployees() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<TemporaryEmployee | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Verificar se o usuário tem acesso (apenas Super Admin e Farm Admin)
  if (!user || (user.role !== 'super_admin' && user.role !== 'farm_admin')) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {t('common.accessDenied')}
                </h2>
                <p className="text-gray-600">
                  {t('common.insufficientPermissions')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Get the appropriate farm ID
  const farmId = user?.role === UserRole.SUPER_ADMIN ? 6 : user?.farmId;

  const { data: employees = [], isLoading } = useQuery<TemporaryEmployee[]>({
    queryKey: ['/api/temporary-employees', farmId],
    enabled: !!farmId,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contact: '',
      birthDate: '',
      workSector: '',
      startDate: '',
      endDate: '',
      photo: '',
      nationality: 'AO',
      preExistingDiseases: '',
      bloodType: '',
      farmId: farmId || 6,
      createdBy: user?.id || 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertTemporaryEmployee) => 
      apiRequest('/api/temporary-employees', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/temporary-employees'] });
      toast({
        title: t('temporaryEmployees.notifications.created'),
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: t('temporaryEmployees.notifications.error'),
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TemporaryEmployee> }) =>
      apiRequest(`/api/temporary-employees/${id}`, { method: 'PATCH', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/temporary-employees'] });
      toast({
        title: t('temporaryEmployees.notifications.updated'),
      });
      setIsDialogOpen(false);
      setEditingEmployee(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/temporary-employees/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/temporary-employees'] });
      toast({
        title: t('temporaryEmployees.notifications.deleted'),
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const employeeData = {
      ...data,
      farmId: farmId || 6,
      createdBy: user?.id || 0,
    };

    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data: employeeData });
    } else {
      createMutation.mutate(employeeData);
    }
  };

  const handleEdit = (employee: TemporaryEmployee) => {
    setEditingEmployee(employee);
    form.reset({
      name: employee.name,
      contact: employee.contact,
      birthDate: employee.birthDate,
      workSector: employee.workSector,
      startDate: employee.startDate,
      endDate: employee.endDate,
      photo: employee.photo || '',
      nationality: employee.nationality,
      preExistingDiseases: employee.preExistingDiseases || '',
      bloodType: employee.bloodType || '',
      farmId: employee.farmId,
      createdBy: employee.createdBy,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (employee: TemporaryEmployee) => {
    if (confirm(t('temporaryEmployees.confirmDelete'))) {
      deleteMutation.mutate(employee.id);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione apenas arquivos de imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho do arquivo (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer upload da foto');
      }

      const result = await response.json();
      
      // Atualizar o campo do formulário com o caminho da foto
      form.setValue('photo', result.photoPath);
      
      toast({
        title: 'Sucesso',
        description: 'Foto enviada com sucesso!',
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar a foto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getContractStatus = (endDate: string) => {
    const days = getDaysRemaining(endDate);
    if (days <= 0) return { status: 'expired', days: 0 };
    if (days <= 30) return { status: 'expiring', days };
    return { status: 'active', days };
  };



  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('temporaryEmployees.title')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('temporaryEmployees.subtitle')}
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingEmployee(null);
                form.reset();
              }}>
                <Plus className="mr-2 h-4 w-4" />
                {t('temporaryEmployees.register')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEmployee ? t('temporaryEmployees.edit') : t('temporaryEmployees.add')}
                </DialogTitle>
                <DialogDescription>
                  {editingEmployee ? 'Atualize as informações do funcionário' : 'Preencha os dados do funcionário'}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('temporaryEmployees.name')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('temporaryEmployees.placeholders.name')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('temporaryEmployees.contact')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('temporaryEmployees.placeholders.contact')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('temporaryEmployees.birthDate')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="workSector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('temporaryEmployees.workSector')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('temporaryEmployees.placeholders.workSector')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('temporaryEmployees.startDate')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('temporaryEmployees.endDate')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('temporaryEmployees.nationality')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('temporaryEmployees.placeholders.nationality')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                <span className="flex items-center gap-2">
                                  <span>{country.flag}</span>
                                  <span>{country.label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bloodType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('temporaryEmployees.bloodType')} {t('temporaryEmployees.optional')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('temporaryEmployees.placeholders.bloodType')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {bloodTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
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
                      name="photo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('temporaryEmployees.photo')} {t('temporaryEmployees.optional')}</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              {/* Upload de arquivo */}
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                  id="photo-upload"
                                />
                                <label
                                  htmlFor="photo-upload"
                                  className="cursor-pointer flex flex-col items-center space-y-2"
                                >
                                  <Upload className="h-8 w-8 text-gray-400" />
                                  <p className="text-sm text-gray-600">
                                    {t('temporaryEmployees.photoUpload.selectFile')}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {t('temporaryEmployees.photoUpload.formats')}
                                  </p>
                                </label>
                              </div>
                              
                              {isUploading && (
                                <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                  <p className="text-sm text-blue-600">{t('temporaryEmployees.photoUpload.uploading')}</p>
                                </div>
                              )}
                              
                              {/* Prévia da foto */}
                              {field.value && (
                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage 
                                      src={getOptimizedPhotoUrl(field.value)} 
                                      alt="Foto do funcionário"
                                      className="object-cover w-full h-full"
                                    />
                                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                      FOTO
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-green-700">{t('temporaryEmployees.photoUpload.loaded')}</p>
                                    <p className="text-xs text-gray-600 truncate">{field.value}</p>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="mt-2"
                                      onClick={() => field.onChange('')}
                                    >
                                      {t('temporaryEmployees.photoUpload.remove')}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="preExistingDiseases"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('temporaryEmployees.preExistingDiseases')} {t('temporaryEmployees.optional')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t('temporaryEmployees.placeholders.diseases')}
                            {...field}
                            value={field.value || ''}
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
                      onClick={() => setIsDialogOpen(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingEmployee ? t('common.update') : t('common.create')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p>{t('common.loading')}</p>
          </div>
        ) : employees.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">{t('temporaryEmployees.noEmployees')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {employees.map((employee) => {
              const contractStatus = getContractStatus(employee.endDate);
              return (
                <Card key={employee.id} className="relative">
                  {contractStatus.status === 'expiring' && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {contractStatus.days} {t('temporaryEmployees.days')}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12 ring-2 ring-gray-200 ring-offset-1">
                          <AvatarImage 
                            src={getOptimizedPhotoUrl(employee.photo)} 
                            alt={`${employee.name} photo`}
                            className="object-cover w-full h-full transition-opacity duration-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                            loading="lazy"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-semibold text-sm">
                            {getEmployeeInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        {employee.photo && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white" title="Foto disponível" />
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {employee.name}
                          {contractStatus.status === 'expiring' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </CardTitle>
                        <CardDescription>{employee.workSector}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {employee.contact}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{getCountryFlag(employee.nationality)}</span>
                      {getCountryName(employee.nationality)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {employee.startDate} → {employee.endDate}
                    </div>
                    
                    {employee.bloodType && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Droplet className="h-4 w-4" />
                        {employee.bloodType}
                      </div>
                    )}
                    
                    {employee.preExistingDiseases && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Heart className="h-4 w-4" />
                        <span className="truncate">{employee.preExistingDiseases}</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                        className="flex-1"
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(employee)}
                        className="flex-1"
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}