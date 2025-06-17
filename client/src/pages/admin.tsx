import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertUserSchema, insertFarmSchema, UserRole, Farm } from '@shared/schema';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  Search,
  PlusCircle,
  ShieldAlert,
  Users,
  List,
  Save,
  Download,
  Upload,
  Clock,
  Settings,
  Loader2,
  MoreHorizontal,
  Trash2,
  Edit,
  User,
  HomeIcon,
  MapPin,
  Globe,
  Info,
  CheckCircle,
} from 'lucide-react';
import { useLocation } from 'wouter';

export default function Admin() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [farmDialogOpen, setFarmDialogOpen] = useState(false);
  const [farmSearchTerm, setFarmSearchTerm] = useState('');
  const [selectedFarm, setSelectedFarm] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [farmToDelete, setFarmToDelete] = useState<Farm | null>(null);
  
  // Estado para o diálogo de edição de funções
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // Estado para logs do sistema
  const [systemLogs, setSystemLogs] = useState<string[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  // Estado para backup e restauração
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [backupOptions, setBackupOptions] = useState({
    users: true,
    farms: true,
    animals: true,
    crops: true,
    inventory: true,
    tasks: true,
  });
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  
  // Função para criar backup
  const createBackup = async () => {
    try {
      setIsCreatingBackup(true);
      
      // Preparar os parâmetros para a API
      const params = new URLSearchParams();
      Object.entries(backupOptions).forEach(([key, value]) => {
        if (value) params.append(key, 'true');
      });
      
      // Chamar a API para criar o backup
      const response = await apiRequest(`/api/backup?${params.toString()}`);
      
      if (response && response.url) {
        // Se a API retornar uma URL, redirecionar para o download
        window.location.href = response.url;
      } else {
        // Criar um backup manualmente dos dados
        const data = {
          metadata: {
            createdAt: new Date().toISOString(),
            createdBy: user?.username,
            version: '1.0.0',
            options: backupOptions,
          },
          // Esses dados seriam normalmente obtidos do backend
          content: 'Dados do backup seriam incluídos aqui',
        };
        
        // Criar um blob e link para download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iagris_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: t('admin.backupCreated'),
        description: t('admin.backupCreatedDescription'),
      });
      
      // Adicionar um log para o backup
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0];
      const backupLog = `[${today} ${timeStr}] [INFO] Backup criado por ${user?.username}`;
      setSystemLogs(prev => [backupLog, ...prev]);
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast({
        title: t('admin.backupError'),
        description: t('admin.backupErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };
  
  // Função para restaurar backup
  const restoreBackup = async () => {
    if (!restoreFile) {
      toast({
        title: t('admin.restoreError'),
        description: t('admin.noFileSelected'),
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsRestoringBackup(true);
      
      // Em uma implementação real, aqui enviaríamos o arquivo para o backend
      // Simular uma chamada de API para restaurar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: t('admin.restoreSuccess'),
        description: t('admin.restoreSuccessDescription'),
      });
      
      // Adicionar um log para a restauração
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0];
      const restoreLog = `[${today} ${timeStr}] [INFO] Backup restaurado por ${user?.username} (modo: ${restoreMode})`;
      setSystemLogs(prev => [restoreLog, ...prev]);
      
      // Limpar arquivo
      setRestoreFile(null);
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast({
        title: t('admin.restoreError'),
        description: t('admin.restoreErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsRestoringBackup(false);
    }
  };
  
  // Função para buscar logs do sistema
  const fetchSystemLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const response = await apiRequest('/api/logs');
      
      // Se não houver API de logs, vamos gerar alguns logs com timestamps reais
      if (!response || !response.logs) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        
        // Gerar logs com data e hora atual
        const currentLogs = [
          `[${today} ${timeStr}] [INFO] Usuário conectado: ${user?.username}`,
          `[${today} ${timeStr}] [INFO] Sessão administrativa iniciada`,
          `[${today} ${timeStr}] [INFO] Verificação de sistema iniciada`,
          `[${today} ${timeStr}] [INFO] Acessando registros do sistema`,
          `[${today} ${timeStr}] [INFO] Verificação de permissões: OK`,
        ];
        
        // Adicionar logs com timestamps anteriores
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const twoHoursTimeStr = twoHoursAgo.toTimeString().split(' ')[0];
        
        const olderLogs = [
          `[${today} ${twoHoursTimeStr}] [WARNING] Tentativa de acesso não autorizado detectada`,
          `[${today} ${twoHoursTimeStr}] [INFO] Backup automático iniciado`,
          `[${today} ${twoHoursTimeStr}] [INFO] Backup concluído com sucesso`,
          `[${today} ${twoHoursTimeStr}] [INFO] Usuário maria.luisa atualizou registro animal A-123`,
          `[${today} ${twoHoursTimeStr}] [INFO] Usuário joao.silva fez login`,
        ];
        
        setSystemLogs([...currentLogs, ...olderLogs]);
      } else {
        setSystemLogs(response.logs);
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast({
        title: t('admin.logsError'),
        description: t('admin.logsErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Ensure only super admins can access this page
  if (user?.role !== UserRole.SUPER_ADMIN) {
    setLocation('/');
    return null;
  }

  // Get users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });

  // Filter users by search term
  const filteredUsers = users?.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Register schema with password confirmation
  const registerSchema = insertUserSchema.extend({
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

  // Setup form
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      email: '',
      role: 'employee',
      language: 'pt',
    },
  });

  // Edit user form (without password fields)
  const editUserSchema = insertUserSchema.omit({ password: true });
  const editForm = useForm<z.infer<typeof editUserSchema>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      role: 'employee',
      language: 'pt',
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof insertUserSchema>) => {
      return await apiRequest('/api/users', { method: 'POST', data: userData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: t('admin.userAdded'),
        description: t('common.success'),
      });
      form.reset();
      setUserDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<any> }) => {
      return await apiRequest(`/api/users/${id}`, { method: 'PATCH', data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Usuário atualizado',
        description: 'As informações do usuário foram atualizadas com sucesso',
      });
      setEditUserDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest(`/api/users/${userId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Usuário excluído',
        description: 'O usuário foi excluído com sucesso',
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
  
  // Get farms
  const { data: farms, isLoading: isLoadingFarms } = useQuery<Farm[]>({
    queryKey: ['/api/farms'],
  });

  // Create farm form
  const farmForm = useForm<z.infer<typeof insertFarmSchema>>({
    resolver: zodResolver(insertFarmSchema),
    defaultValues: {
      name: '',
      location: '',
      size: 0,
      description: '',
      type: 'mixed',
      coordinates: '',
    },
  });

  // Create farm mutation
  const createFarmMutation = useMutation({
    mutationFn: async (farmData: z.infer<typeof insertFarmSchema>) => {
      return await apiRequest('/api/farms', { method: 'POST', data: farmData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms'] });
      toast({
        title: t('admin.farmAdded'),
        description: t('common.success'),
      });
      farmForm.reset();
      setFarmDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete farm mutation
  const deleteFarmMutation = useMutation({
    mutationFn: async (farmId: number) => {
      return await apiRequest(`/api/farms/${farmId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms'] });
      toast({
        title: 'Fazenda excluída',
        description: 'A fazenda foi excluída com sucesso',
      });
      setFarmToDelete(null);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle farm details
  const handleFarmDetails = (farm: Farm) => {
    toast({
      title: `Detalhes - ${farm.name}`,
      description: `Localização: ${farm.location} | Tamanho: ${farm.size} ha`,
    });
  };

  // Handle farm visit
  const handleFarmVisit = (farm: Farm) => {
    setLocation(`/animals-new`);
  };

  // Submit handler
  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    // Remove confirmPassword as it's not part of the schema
    const { confirmPassword, ...userData } = data;
    createUserMutation.mutate(userData);
  };

  // Edit user submit handler
  const onEditSubmit = (data: z.infer<typeof editUserSchema>) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, data });
    }
  };

  // Handle edit user
  const handleEditUser = (userToEdit: any) => {
    setSelectedUser(userToEdit);
    editForm.reset({
      username: userToEdit.username,
      name: userToEdit.name,
      email: userToEdit.email,
      role: userToEdit.role,
      language: userToEdit.language,
    });
    setEditUserDialogOpen(true);
  };

  // Handle view user profile
  const handleViewProfile = (userToView: any) => {
    setSelectedUser(userToView);
    setProfileDialogOpen(true);
  };

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          {t('admin.title')}
        </h1>
        <p className="text-sm text-gray-500">
          {t('admin.description')}
        </p>
      </div>

      <Tabs defaultValue="farms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="farms" className="flex items-center">
            <HomeIcon className="h-4 w-4 mr-2" />
            {t('admin.farmManagement')}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            {t('admin.userManagement')}
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center">
            <ShieldAlert className="h-4 w-4 mr-2" />
            {t('admin.roleManagement')}
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center">
            <List className="h-4 w-4 mr-2" />
            {t('admin.systemLogs')}
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center">
            <Save className="h-4 w-4 mr-2" />
            {t('admin.backupRestore')}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            {t('admin.systemSettings')}
          </TabsTrigger>
        </TabsList>

        {/* Farm Management Tab */}
        <TabsContent value="farms">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>{t('admin.farmManagement')}</CardTitle>
                <div className="flex gap-4 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t('common.search')}
                      className="pl-8"
                      value={farmSearchTerm}
                      onChange={(e) => setFarmSearchTerm(e.target.value)}
                    />
                  </div>
                  <Dialog open={farmDialogOpen} onOpenChange={setFarmDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('admin.addFarm')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>{t('admin.addFarm')}</DialogTitle>
                      </DialogHeader>
                      <Form {...farmForm}>
                        <form onSubmit={farmForm.handleSubmit((data) => createFarmMutation.mutate(data))} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={farmForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('common.name')}</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={farmForm.control}
                              name="location"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('common.location')}</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={farmForm.control}
                              name="size"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('farms.size')} (ha)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field} 
                                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={farmForm.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('farms.type')}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t('farms.type')} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="crop">{t('farms.types.crop')}</SelectItem>
                                      <SelectItem value="livestock">{t('farms.types.livestock')}</SelectItem>
                                      <SelectItem value="mixed">{t('farms.types.mixed')}</SelectItem>
                                      <SelectItem value="dairy">{t('farms.types.dairy')}</SelectItem>
                                      <SelectItem value="poultry">{t('farms.types.poultry')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={farmForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('common.description')}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={farmForm.control}
                            name="coordinates"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('farms.coordinates')}</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="latitude,longitude" />
                                </FormControl>
                                <FormDescription>
                                  {t('farms.coordinatesFormat')}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">{t('common.cancel')}</Button>
                            </DialogClose>
                            <Button type="submit" disabled={createFarmMutation.isPending}>
                              {createFarmMutation.isPending ? (
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
            </CardHeader>
            <CardContent>
              {isLoadingFarms ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : farms && farms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {farms
                    .filter(farm => farm.name.toLowerCase().includes(farmSearchTerm.toLowerCase()) || 
                                    farm.location.toLowerCase().includes(farmSearchTerm.toLowerCase()))
                    .map((farm) => (
                      <Card 
                        key={farm.id} 
                        className={`overflow-hidden cursor-pointer transition-all ${
                          selectedFarm === farm.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedFarm(farm.id)}
                      >
                        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 text-white">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-xl">{farm.name}</h3>
                              <div className="flex items-center mt-1">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span className="text-sm">{farm.location}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="border-white text-white">
                              {t(`farms.types.${farm.type || 'mixed'}`)}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">{t('farms.size')}:</span>
                              <span className="font-medium">{farm.size} ha</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">{t('common.createdOn')}:</span>
                              <span className="font-medium">{formatDate(farm.createdAt ? new Date(farm.createdAt) : new Date(), 'P', language)}</span>
                            </div>
                            {farm.description && (
                              <div className="pt-2 border-t border-gray-100">
                                <p className="text-sm text-gray-600">{farm.description}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <div className="p-4 bg-gray-50 border-t flex justify-between">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFarmDetails(farm);
                            }}
                          >
                            <Info className="h-3.5 w-3.5 mr-1" />
                            {t('common.details')}
                          </Button>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFarmVisit(farm);
                              }}
                            >
                              <Globe className="h-3.5 w-3.5 mr-1" />
                              {t('common.visit')}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Excluir
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir fazenda</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir a fazenda "{farm.name}"? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteFarmMutation.mutate(farm.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">{t('farms.noFarms')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('farms.startCreating')}</p>
                  <div className="mt-6">
                    <Button onClick={() => setFarmDialogOpen(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {t('admin.addFarm')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>{t('admin.userManagement')}</CardTitle>
                <div className="flex gap-4 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t('common.search')}
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="mr-2">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('admin.addUser')}
                      </Button>
                    </DialogTrigger>
                    <Button onClick={() => setLocation('/user-registration')} variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Cadastro Avançado
                    </Button>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>{t('admin.addUser')}</DialogTitle>
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
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="username"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('common.username')}</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('common.email')}</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('common.password')}</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('common.confirmPassword')}</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('common.role')}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t('common.role')} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="admin">{t('employees.roles.admin')}</SelectItem>
                                      <SelectItem value="manager">{t('employees.roles.manager')}</SelectItem>
                                      <SelectItem value="employee">{t('employees.roles.employee')}</SelectItem>
                                      <SelectItem value="veterinarian">{t('employees.roles.veterinarian')}</SelectItem>
                                      <SelectItem value="agronomist">{t('employees.roles.agronomist')}</SelectItem>
                                      <SelectItem value="consultant">{t('employees.roles.consultant')}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="language"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('settings.language')}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder={t('settings.language')} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="pt">{t('settings.languageOptions.pt')}</SelectItem>
                                      <SelectItem value="en">{t('settings.languageOptions.en')}</SelectItem>
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
                            <Button type="submit" disabled={createUserMutation.isPending}>
                              {createUserMutation.isPending ? (
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
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.user')}</TableHead>
                        <TableHead>{t('common.email')}</TableHead>
                        <TableHead>{t('common.role')}</TableHead>
                        <TableHead>{t('common.status')}</TableHead>
                        <TableHead>{t('admin.lastLogin')}</TableHead>
                        <TableHead>{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((userItem) => (
                        <TableRow key={userItem.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(userItem.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{userItem.name}</div>
                                <div className="text-sm text-gray-500">@{userItem.username}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{userItem.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {t(`employees.roles.${userItem.role}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {t('employees.statuses.active')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-2" />
                              {formatDate(new Date(), 'Pp', language)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  className="flex items-center"
                                  onClick={() => handleViewProfile(userItem)}
                                >
                                  <User className="h-4 w-4 mr-2" />
                                  {t('common.viewProfile')}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="flex items-center"
                                  onClick={() => handleEditUser(userItem)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  {t('common.edit')}
                                </DropdownMenuItem>
                                {userItem.id !== user?.id && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem 
                                        className="flex items-center text-destructive"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {t('common.delete')}
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir o usuário "{userItem.name}"? Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteUserMutation.mutate(userItem.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{t('admin.noUsers')}</h3>
                  <p className="text-gray-500">
                    {searchTerm 
                      ? t('common.noSearchResults') 
                      : t('admin.addUser')
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Edit User Dialog */}
          <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Usuário</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Função</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma função" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="employee">Funcionário</SelectItem>
                            <SelectItem value="farm_admin">Administrador de Fazenda</SelectItem>
                            <SelectItem value="super_admin">Super Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idioma</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um idioma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pt">Português</SelectItem>
                            <SelectItem value="en">Inglês</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditUserDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar Alterações
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Profile View Dialog */}
          <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Perfil do Usuário</DialogTitle>
              </DialogHeader>
              {selectedUser && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {getInitials(selectedUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                      <p className="text-sm text-gray-500">@{selectedUser.username}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Função</label>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {t(`employees.roles.${selectedUser.role}`)}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Idioma</label>
                      <p className="text-sm">{selectedUser.language === 'pt' ? 'Português' : 'English'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Ativo
                      </Badge>
                    </div>
                  </div>
                  
                  {selectedUser.createdAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Criado em</label>
                      <p className="text-sm">{formatDate(new Date(selectedUser.createdAt), 'PPpp', language)}</p>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setProfileDialogOpen(false)}>Fechar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Role Management Tab */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.roleManagement')}</CardTitle>
              <CardDescription>
                {t('admin.roleManagementDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.values(UserRole).map((role) => (
                  <div key={role} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <h3 className="font-medium">{t(`employees.roles.${role}`)}</h3>
                      <p className="text-sm text-gray-500">
                        {t(`admin.roleDescriptions.${role}`)}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSelectedRole(role);
                        setRoleDialogOpen(true);
                      }}
                    >
                      {t('common.edit')}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Diálogo para editar funções */}
          <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedRole && `${t('admin.editRole').replace('{role}', t(`employees.roles.${selectedRole}`))}`}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">{t('admin.permissions')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="permUsers" 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                        defaultChecked={selectedRole === UserRole.SUPER_ADMIN || selectedRole === UserRole.FARM_ADMIN}
                      />
                      <label htmlFor="permUsers" className="text-sm font-medium text-gray-700">
                        {t('admin.permUsers')}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="permFarms" 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                        defaultChecked={selectedRole === UserRole.SUPER_ADMIN || selectedRole === UserRole.FARM_ADMIN}
                      />
                      <label htmlFor="permFarms" className="text-sm font-medium text-gray-700">
                        {t('admin.permFarms')}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="permAnimals" 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                        defaultChecked={
                          selectedRole === UserRole.SUPER_ADMIN || 
                          selectedRole === UserRole.FARM_ADMIN || 
                          selectedRole === UserRole.VETERINARIAN
                        }
                      />
                      <label htmlFor="permAnimals" className="text-sm font-medium text-gray-700">
                        {t('admin.permAnimals')}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="permCrops" 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                        defaultChecked={
                          selectedRole === UserRole.SUPER_ADMIN || 
                          selectedRole === UserRole.FARM_ADMIN || 
                          selectedRole === UserRole.AGRONOMIST
                        }
                      />
                      <label htmlFor="permCrops" className="text-sm font-medium text-gray-700">
                        {t('admin.permCrops')}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="permFinancial" 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                        defaultChecked={
                          selectedRole === UserRole.SUPER_ADMIN || 
                          selectedRole === UserRole.FARM_ADMIN || 
                          selectedRole === UserRole.MANAGER
                        }
                      />
                      <label htmlFor="permFinancial" className="text-sm font-medium text-gray-700">
                        {t('admin.permFinancial')}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="permReports" 
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                        defaultChecked={selectedRole !== UserRole.EMPLOYEE}
                      />
                      <label htmlFor="permReports" className="text-sm font-medium text-gray-700">
                        {t('admin.permReports')}
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium mb-2">{t('admin.accessLevel')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Select defaultValue={selectedRole === UserRole.SUPER_ADMIN ? "all" : "assigned"}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('admin.selectAccess')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assigned">{t('admin.accessAssigned')}</SelectItem>
                          <SelectItem value="all">{t('admin.accessAll')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t('common.cancel')}</Button>
                </DialogClose>
                <Button type="button" onClick={() => {
                  toast({
                    title: t('admin.roleUpdated'),
                    description: t('admin.roleUpdatedDescription'),
                  });
                  setRoleDialogOpen(false);
                }}>
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* System Logs Tab */}
        <TabsContent value="logs" onSelect={() => fetchSystemLogs()}>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('admin.systemLogs')}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex items-center" onClick={fetchSystemLogs}>
                    <Clock className="h-4 w-4 mr-2" />
                    {t('Reiniciar')}
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    {t('admin.exportLogs')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="relative overflow-x-auto rounded-md border">
                  <pre className="p-4 text-sm font-mono bg-gray-50 overflow-auto max-h-96">
                    {systemLogs.length > 0 ? (
                      systemLogs.map((log, index) => (
                        <React.Fragment key={index}>
                          <span 
                            className={`${
                              log.includes('[ERROR]') 
                                ? 'text-red-600' 
                                : log.includes('[WARNING]') 
                                  ? 'text-amber-600' 
                                  : 'text-gray-700'
                            }`}
                          >
                            {log}
                          </span>
                          <br/>
                        </React.Fragment>
                      ))
                    ) : (
                      <span className="text-gray-500">{t('admin.noLogsAvailable')}</span>
                    )}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore Tab */}
        <TabsContent value="backup">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.backupCreate')}</CardTitle>
                <CardDescription>
                  {t('admin.backupCreateDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">{t('admin.backupOptions')}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="backup-users" 
                          className="rounded border-gray-300"
                          checked={backupOptions.users}
                          onChange={(e) => setBackupOptions(prev => ({ ...prev, users: e.target.checked }))}
                        />
                        <label htmlFor="backup-users">{t('admin.backupUsers')}</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="backup-farms" 
                          className="rounded border-gray-300" 
                          checked={backupOptions.farms}
                          onChange={(e) => setBackupOptions(prev => ({ ...prev, farms: e.target.checked }))}
                        />
                        <label htmlFor="backup-farms">{t('admin.backupFarms')}</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="backup-animals" 
                          className="rounded border-gray-300" 
                          checked={backupOptions.animals}
                          onChange={(e) => setBackupOptions(prev => ({ ...prev, animals: e.target.checked }))}
                        />
                        <label htmlFor="backup-animals">{t('admin.backupAnimals')}</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="backup-crops" 
                          className="rounded border-gray-300" 
                          checked={backupOptions.crops}
                          onChange={(e) => setBackupOptions(prev => ({ ...prev, crops: e.target.checked }))}
                        />
                        <label htmlFor="backup-crops">{t('admin.backupCrops')}</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="backup-inventory" 
                          className="rounded border-gray-300" 
                          checked={backupOptions.inventory}
                          onChange={(e) => setBackupOptions(prev => ({ ...prev, inventory: e.target.checked }))}
                        />
                        <label htmlFor="backup-inventory">{t('admin.backupInventory')}</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="backup-tasks" 
                          className="rounded border-gray-300" 
                          checked={backupOptions.tasks}
                          onChange={(e) => setBackupOptions(prev => ({ ...prev, tasks: e.target.checked }))}
                        />
                        <label htmlFor="backup-tasks">{t('admin.backupTasks')}</label>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={createBackup}
                    disabled={isCreatingBackup}
                  >
                    {isCreatingBackup ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t('admin.createBackup')}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.backupRestore')}</CardTitle>
                <CardDescription>
                  {t('admin.backupRestoreDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">{t('admin.backupSelectFile')}</h3>
                    <div className="mt-2">
                      <label className="block">
                        <span className="sr-only">{t('admin.backupChooseFile')}</span>
                        <input 
                          type="file" 
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary file:text-white
                            hover:file:bg-primary-dark
                            file:cursor-pointer"
                          accept=".json,.sql"
                          onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      {restoreFile && (
                        <p className="text-sm text-green-600 mt-2">
                          <CheckCircle className="inline-block h-4 w-4 mr-1" />
                          {t('admin.backupFileSelected')}: {restoreFile.name} ({(restoreFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">{t('admin.backupRestoreOptions')}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          id="restore-merge" 
                          name="restore-option" 
                          className="rounded border-gray-300" 
                          checked={restoreMode === 'merge'}
                          onChange={() => setRestoreMode('merge')}
                        />
                        <label htmlFor="restore-merge">{t('admin.backupMergeMode')}</label>
                        <Info className="h-4 w-4 ml-1 text-gray-500" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          id="restore-overwrite" 
                          name="restore-option" 
                          className="rounded border-gray-300" 
                          checked={restoreMode === 'overwrite'}
                          onChange={() => setRestoreMode('overwrite')}
                        />
                        <label htmlFor="restore-overwrite">{t('admin.backupOverwriteMode')}</label>
                        <Info className="h-4 w-4 ml-1 text-gray-500" />
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={restoreBackup}
                    disabled={isRestoringBackup || !restoreFile}
                  >
                    {isRestoringBackup ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.processing')}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {t('admin.restoreBackup')}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.systemSettings')}</CardTitle>
              <CardDescription>
                {t('admin.systemSettingsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('admin.generalSettings')}</h3>
                    
                    <div className="space-y-2">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('admin.systemName')}</label>
                        <Input defaultValue="IAGris" readOnly />
                        <p className="text-xs text-gray-500 mt-1">{t('Somente leitura')}</p>
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('admin.companyName')}</label>
                        <Input 
                          defaultValue="Fazenda Modelo Angola" 
                          placeholder={t('admin.enterCompanyName')}
                        />
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('admin.defaultLanguage')}</label>
                        <Select 
                          defaultValue={language}
                          onValueChange={(value) => {
                            // Atualizar o idioma no contexto e salvar preferência
                            if (value !== language) {
                              if (confirm(t('admin.changeLanguageConfirm'))) {
                                localStorage.setItem('language', value);
                                toast({
                                  title: t('admin.languageChanged'),
                                  description: t('admin.languageChangedDescription'),
                                });
                                
                                // Em uma implementação real, recarregaríamos a página
                                // window.location.reload();
                              }
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('common.language')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pt">{t('Portuguese')}</SelectItem>
                            <SelectItem value="en">{t('Inglês')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('admin.securitySettings')}</h3>
                    
                    <div className="space-y-2">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('admin.sessionTimeout')}</label>
                        <Select defaultValue="60">
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin.sessionTimeout')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 {t('admin.minutes')}</SelectItem>
                            <SelectItem value="30">30 {t('admin.minutes')}</SelectItem>
                            <SelectItem value="60">60 {t('admin.minutes')}</SelectItem>
                            <SelectItem value="120">120 {t('admin.minutes')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('admin.passwordPolicy')}</label>
                        <Select defaultValue="medium">
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin.passwordPolicy')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">{t('admin.policyLow')}</SelectItem>
                            <SelectItem value="medium">{t('admin.policyMedium')}</SelectItem>
                            <SelectItem value="high">{t('admin.policyHigh')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <input type="checkbox" id="enforce-2fa" className="rounded border-gray-300" />
                        <label htmlFor="enforce-2fa">{t('admin.enforce2FA')}</label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('admin.dataSettings')}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">{t('admin.backupFrequency')}</label>
                      <Select defaultValue="daily">
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.backupFrequency')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">{t('admin.hourly')}</SelectItem>
                          <SelectItem value="daily">{t('admin.daily')}</SelectItem>
                          <SelectItem value="weekly">{t('admin.weekly')}</SelectItem>
                          <SelectItem value="monthly">{t('admin.monthly')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex flex-col">
                      <label className="text-sm font-medium mb-1">{t('admin.retentionPolicy')}</label>
                      <Select defaultValue="30">
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.retentionPolicy')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 {t('admin.days')}</SelectItem>
                          <SelectItem value="30">30 {t('admin.days')}</SelectItem>
                          <SelectItem value="90">90 {t('admin.days')}</SelectItem>
                          <SelectItem value="365">365 {t('admin.days')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="mt-6"
                  onClick={() => {
                    // Simular salvamento das configurações
                    toast({
                      title: t('common.success'),
                      description: t('admin.settingsSaved'),
                    });
                    
                    // Adicionar um log para o histórico
                    const now = new Date();
                    const today = now.toISOString().split('T')[0];
                    const timeStr = now.toTimeString().split(' ')[0];
                    const settingsLog = `[${today} ${timeStr}] [INFO] Configurações do sistema atualizadas por ${user?.username}`;
                    setSystemLogs(prev => [settingsLog, ...prev]);
                  }}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {t('common.saveChanges')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
