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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
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
} from 'lucide-react';
import { useLocation } from 'wouter';

export default function Admin() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [farmDialogOpen, setFarmDialogOpen] = useState(false);
  const [farmSearchTerm, setFarmSearchTerm] = useState('');
  const [selectedFarm, setSelectedFarm] = useState<number | null>(null);

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

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof insertUserSchema>) => {
      const response = await apiRequest('POST', '/api/users', userData);
      return response.json();
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
      const response = await apiRequest('POST', '/api/farms', farmData);
      return response.json();
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

  // Submit handler
  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    // Remove confirmPassword as it's not part of the schema
    const { confirmPassword, ...userData } = data;
    createUserMutation.mutate(userData);
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

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
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
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('admin.addUser')}
                      </Button>
                    </DialogTrigger>
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
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.username}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {t(`employees.roles.${user.role}`)}
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
                                <DropdownMenuItem className="flex items-center">
                                  <User className="h-4 w-4 mr-2" />
                                  {t('common.viewProfile')}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center">
                                  <Edit className="h-4 w-4 mr-2" />
                                  {t('common.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('common.delete')}
                                </DropdownMenuItem>
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
                    <Button variant="outline" size="sm">
                      {t('common.edit')}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('admin.systemLogs')}</CardTitle>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  {t('admin.exportLogs')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto rounded-md border">
                <pre className="p-4 text-sm font-mono bg-gray-50 overflow-auto max-h-96">
                  [2023-06-15 10:30:45] [INFO] User logged in: carlos.silva<br/>
                  [2023-06-15 10:45:12] [INFO] New animal added: A-105<br/>
                  [2023-06-15 11:15:30] [WARNING] Low inventory alert: Cattle Feed (200kg)<br/>
                  [2023-06-15 12:00:15] [INFO] User logged out: carlos.silva<br/>
                  [2023-06-15 14:20:10] [INFO] User logged in: maria.santos<br/>
                  [2023-06-15 14:45:22] [INFO] Animal health status updated: A-312<br/>
                  [2023-06-15 15:10:05] [ERROR] Failed to sync data: Network error<br/>
                  [2023-06-15 15:15:30] [INFO] Data sync retry successful<br/>
                  [2023-06-15 16:30:45] [INFO] User logged out: maria.santos<br/>
                  [2023-06-15 17:00:12] [INFO] System backup created: backup_20230615_1700.zip<br/>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Restore Tab */}
        <TabsContent value="backup">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.createBackup')}</CardTitle>
                <CardDescription>
                  {t('admin.createBackupDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">{t('admin.backupOptions')}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="backup-users" className="rounded border-gray-300" defaultChecked />
                        <label htmlFor="backup-users">{t('admin.backupUsers')}</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="backup-farms" className="rounded border-gray-300" defaultChecked />
                        <label htmlFor="backup-farms">{t('admin.backupFarms')}</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="backup-animals" className="rounded border-gray-300" defaultChecked />
                        <label htmlFor="backup-animals">{t('admin.backupAnimals')}</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="backup-crops" className="rounded border-gray-300" defaultChecked />
                        <label htmlFor="backup-crops">{t('admin.backupCrops')}</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="backup-inventory" className="rounded border-gray-300" defaultChecked />
                        <label htmlFor="backup-inventory">{t('admin.backupInventory')}</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="backup-tasks" className="rounded border-gray-300" defaultChecked />
                        <label htmlFor="backup-tasks">{t('admin.backupTasks')}</label>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    {t('admin.createBackup')}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.restoreBackup')}</CardTitle>
                <CardDescription>
                  {t('admin.restoreBackupDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">{t('admin.selectBackupFile')}</h3>
                    <div className="mt-2">
                      <label className="block">
                        <span className="sr-only">{t('admin.chooseFile')}</span>
                        <input type="file" className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary file:text-white
                          hover:file:bg-primary-dark
                          file:cursor-pointer" />
                      </label>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">{t('admin.restoreOptions')}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="radio" id="restore-merge" name="restore-option" className="rounded border-gray-300" defaultChecked />
                        <label htmlFor="restore-merge">{t('admin.restoreMerge')}</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="radio" id="restore-overwrite" name="restore-option" className="rounded border-gray-300" />
                        <label htmlFor="restore-overwrite">{t('admin.restoreOverwrite')}</label>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    {t('admin.restoreBackup')}
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
                        <Input defaultValue="FarmManager Pro" />
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('admin.companyName')}</label>
                        <Input defaultValue="Fazenda Bela Vista" />
                      </div>
                      
                      <div className="flex flex-col">
                        <label className="text-sm font-medium mb-1">{t('admin.defaultLanguage')}</label>
                        <Select defaultValue="pt">
                          <SelectTrigger>
                            <SelectValue placeholder={t('settings.language')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pt">{t('settings.languageOptions.pt')}</SelectItem>
                            <SelectItem value="en">{t('settings.languageOptions.en')}</SelectItem>
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
                
                <Button className="mt-6">
                  <Save className="mr-2 h-4 w-4" />
                  {t('settings.saveChanges')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
