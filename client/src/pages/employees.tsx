import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
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
  DialogDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  Building2,
  Users
} from 'lucide-react';

// User interface based on schema
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  farmId: number | null;
  createdAt: string;
  farmAssignments?: {
    id: number;
    userId: number;
    farmId: number;
    role: string;
    createdAt: string;
  }[];
}

// Farm interface
interface Farm {
  id: number;
  name: string;
  location: string;
  size: number | null;
  type: string | null;
  description: string | null;
}

// Form schema for creating/editing users
const userFormSchema = z.object({
  username: z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.string().min(1, 'Função é obrigatória'),
  farmId: z.number().nullable(),
});

type UserFormData = z.infer<typeof userFormSchema>;

export default function Employees() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Get users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Get farms for the dropdown
  const { data: farms = [], isLoading: isLoadingFarms } = useQuery<Farm[]>({
    queryKey: ['/api/farms'],
  });

  // Form setup
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      name: '',
      email: '',
      password: '',
      role: 'employee',
      farmId: null,
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      return apiRequest('/api/users', {
        method: 'POST',
        data: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.refetchQueries({ queryKey: ['/api/users'] });
      toast({
        title: t('employees.employeeAdded'),
        description: 'Funcionário criado com sucesso',
      });
      setDialogOpen(false);
      form.reset();
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar funcionário',
        variant: 'destructive',
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: Partial<UserFormData> }) => {
      return apiRequest(`/api/users/${data.id}`, {
        method: 'PATCH',
        data: data.userData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.refetchQueries({ queryKey: ['/api/users'] });
      toast({
        title: t('employees.employeeUpdated'),
        description: 'Funcionário atualizado com sucesso',
      });
      setDialogOpen(false);
      form.reset();
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar funcionário',
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/users/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: t('employees.employeeDeleted'),
        description: 'Funcionário excluído com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir funcionário',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: UserFormData) => {
    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        userData: data,
      });
    } else {
      createUserMutation.mutate(data);
    }
  };

  // Handle edit user
  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit);
    form.reset({
      username: userToEdit.username,
      name: userToEdit.name,
      email: userToEdit.email,
      password: '', // Don't populate password for security
      role: userToEdit.role,
      farmId: userToEdit.farmId,
    });
    setDialogOpen(true);
  };

  // Handle add new user
  const handleAddUser = () => {
    setEditingUser(null);
    form.reset();
    setDialogOpen(true);
  };

  // Filter users
  const filteredUsers = users.filter((userItem) => {
    const matchesSearch = 
      userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userItem.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || userItem.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  // Get role display name
  const getRoleDisplay = (role: string) => {
    return t(`employees.roles.${role}`) || role;
  };

  // Get farm assignments for a user
  const getFarmAssignments = (user: User) => {
    if (!user.farmAssignments || user.farmAssignments.length === 0) {
      return t('common.notSpecified');
    }
    
    const farmNames = user.farmAssignments.map(assignment => {
      const farm = farms.find(f => f.id === assignment.farmId);
      return farm?.name || `Fazenda ${assignment.farmId}`;
    });
    
    return farmNames.join(', ');
  };

  // Check permissions
  const canManageUsers = user?.role === 'super_admin' || user?.role === 'farm_admin';

  if (isLoadingUsers) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando funcionários...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('employees.title')}</h1>
            <p className="text-muted-foreground">
              Gerencie funcionários e suas permissões no sistema
            </p>
          </div>
          
          {canManageUsers && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddUser}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('employees.addEmployee')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? t('employees.editEmployee') : t('employees.addEmployee')}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser 
                      ? 'Edite as informações do funcionário'
                      : 'Preencha os dados para criar um novo funcionário'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('employees.username')}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t('employees.usernamePlaceholder')}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('employees.name')}</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo" {...field} />
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
                          <FormLabel>{t('employees.email')}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employees.password')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder={t('employees.passwordPlaceholder')}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('employees.role')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a função" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="employee">{t('employees.roles.employee')}</SelectItem>
                                <SelectItem value="manager">{t('employees.roles.manager')}</SelectItem>
                                <SelectItem value="agronomist">{t('employees.roles.agronomist')}</SelectItem>
                                <SelectItem value="veterinarian">{t('employees.roles.veterinarian')}</SelectItem>
                                {user?.role === 'super_admin' && (
                                  <>
                                    <SelectItem value="farm_admin">{t('employees.roles.farm_admin')}</SelectItem>
                                    <SelectItem value="super_admin">{t('employees.roles.super_admin')}</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />


                    </div>

                    <FormField
                      control={form.control}
                      name="farmId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employees.farm')}</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value === 'null' ? null : parseInt(value))} 
                            defaultValue={field.value?.toString() || 'null'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('employees.selectFarm')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">Nenhuma fazenda</SelectItem>
                              {farms.map((farm) => (
                                <SelectItem key={farm.id} value={farm.id.toString()}>
                                  {farm.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createUserMutation.isPending || updateUserMutation.isPending}
                      >
                        {editingUser ? t('employees.updateUser') : t('employees.createUser')}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t('employees.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('employees.all')}</SelectItem>
                  <SelectItem value="employee">{t('employees.roles.employee')}</SelectItem>
                  <SelectItem value="manager">{t('employees.roles.manager')}</SelectItem>
                  <SelectItem value="agronomist">{t('employees.roles.agronomist')}</SelectItem>
                  <SelectItem value="veterinarian">{t('employees.roles.veterinarian')}</SelectItem>
                  <SelectItem value="farm_admin">{t('employees.roles.farm_admin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Funcionários ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">{t('employees.noEmployees')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('employees.name')}</TableHead>
                      <TableHead>{t('employees.username')}</TableHead>
                      <TableHead>{t('employees.email')}</TableHead>
                      <TableHead>{t('employees.role')}</TableHead>
                      <TableHead>{t('employees.farm')}</TableHead>

                      {canManageUsers && <TableHead>Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userItem) => (
                        <TableRow key={userItem.id}>
                          <TableCell className="font-medium">{userItem.name}</TableCell>
                          <TableCell>{userItem.username}</TableCell>
                          <TableCell>{userItem.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {getRoleDisplay(userItem.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              {getFarmAssignments(userItem)}
                            </div>
                          </TableCell>

                          {canManageUsers && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUser(userItem)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {userItem.id !== user?.id && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir funcionário</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {t('employees.confirmDelete')}
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
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}