import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserRole, SystemModule, AccessLevel, insertUserSchema } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, User, Lock, Mail, ShieldCheck } from 'lucide-react';

// Schema estendido para incluir confirmação de senha
const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas devem coincidir",
  path: ["confirmPassword"],
});

// Estrutura para permissões de módulo
interface ModulePermission {
  module: SystemModule;
  accessLevel: AccessLevel;
  enabled: boolean;
}

// Interface para os dados do formulário
interface FormData extends z.infer<typeof registerSchema> {
  permissions?: ModulePermission[];
}

export default function UserRegistration() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isFarmAdmin = user?.role === UserRole.FARM_ADMIN;

  // Verificar se o usuário pode acessar esta página
  if (!isSuperAdmin && !isFarmAdmin) {
    return (
      <DashboardLayout>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta página. Somente administradores podem registrar novos usuários.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  // Buscar fazendas disponíveis
  const { data: farms, isLoading: isLoadingFarms } = useQuery({
    queryKey: ['/api/farms'],
  });

  // Setup form
  const form = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      email: '',
      role: 'employee',
      language: 'pt',
      farmId: undefined,
    },
  });

  // Observar mudanças na função selecionada
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'role') {
        const role = value.role as UserRole;
        initializePermissionsByRole(role);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);
  
  // Inicializar permissões quando o componente carregar com o valor padrão
  React.useEffect(() => {
    const defaultRole = form.getValues().role as UserRole;
    initializePermissionsByRole(defaultRole);
  }, []);

  // Inicializar permissões com base na função selecionada
  const initializePermissionsByRole = (role: UserRole) => {
    const modules = Object.values(SystemModule);
    let initialPermissions: ModulePermission[] = [];

    // Configurar permissões padrão com base na função
    if (role === UserRole.FARM_ADMIN) {
      // Administradores de fazenda têm acesso total a todos os módulos
      initialPermissions = modules.map(module => ({
        module,
        accessLevel: AccessLevel.FULL,
        enabled: true
      }));
    } else if (role === UserRole.MANAGER) {
      // Gerentes têm acesso total a alguns módulos e somente leitura a outros
      initialPermissions = modules.map(module => ({
        module,
        accessLevel: [SystemModule.FINANCIAL, SystemModule.TASKS, SystemModule.EMPLOYEES].includes(module) 
          ? AccessLevel.FULL 
          : AccessLevel.READ_ONLY,
        enabled: true
      }));
    } else if (role === UserRole.VETERINARIAN) {
      // Veterinários têm acesso total a animais e somente leitura a tarefas
      initialPermissions = modules.map(module => ({
        module,
        accessLevel: module === SystemModule.ANIMALS ? AccessLevel.FULL : AccessLevel.READ_ONLY,
        enabled: [SystemModule.ANIMALS, SystemModule.TASKS].includes(module)
      }));
    } else if (role === UserRole.AGRONOMIST) {
      // Agrônomos têm acesso total a culturas e somente leitura a tarefas
      initialPermissions = modules.map(module => ({
        module,
        accessLevel: module === SystemModule.CROPS ? AccessLevel.FULL : AccessLevel.READ_ONLY,
        enabled: [SystemModule.CROPS, SystemModule.TASKS].includes(module)
      }));
    } else {
      // Funcionários regulares têm acesso de leitura à maioria dos módulos
      initialPermissions = modules.map(module => ({
        module,
        accessLevel: module === SystemModule.TASKS ? AccessLevel.FULL : AccessLevel.READ_ONLY,
        enabled: [SystemModule.ANIMALS, SystemModule.CROPS, SystemModule.INVENTORY, SystemModule.TASKS].includes(module)
      }));
    }

    setPermissions(initialPermissions);
  };

  // Manipular a alteração de permissão
  const handlePermissionChange = (moduleIndex: number, enabled: boolean) => {
    setPermissions(prev => {
      const updated = [...prev];
      updated[moduleIndex] = { ...updated[moduleIndex], enabled };
      return updated;
    });
  };

  // Manipular a alteração do nível de acesso
  const handleAccessLevelChange = (moduleIndex: number, accessLevel: AccessLevel) => {
    setPermissions(prev => {
      const updated = [...prev];
      updated[moduleIndex] = { ...updated[moduleIndex], accessLevel };
      return updated;
    });
  };

  // Buscar o título do módulo traduzido
  const getModuleTitle = (module: SystemModule): string => {
    switch (module) {
      case SystemModule.ANIMALS:
        return t('modules.animals');
      case SystemModule.CROPS:
        return t('modules.crops');
      case SystemModule.INVENTORY:
        return t('modules.inventory');
      case SystemModule.TASKS:
        return t('modules.tasks');
      case SystemModule.EMPLOYEES:
        return t('modules.employees');
      case SystemModule.FINANCIAL:
        return t('modules.financial');
      case SystemModule.REPORTS:
        return t('modules.reports');
      case SystemModule.GOALS:
        return t('modules.goals');
      case SystemModule.ADMINISTRATION:
        return t('modules.administration');
      default:
        return module;
    }
  };

  // Criação de usuário com permissões
  const createUserMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // 1. Criar o usuário
      const userData = {
        username: data.username,
        password: data.password,
        name: data.name,
        email: data.email,
        role: data.role,
        language: data.language,
        farmId: data.farmId,
      };

      const userResponse = await apiRequest('POST', '/api/users', userData);
      const newUser = userResponse;
      
      // 2. Definir permissões para o usuário se uma fazenda foi selecionada
      if (data.farmId && permissions.some(p => p.enabled)) {
        const enabledPermissions = permissions.filter(p => p.enabled);
        
        for (const perm of enabledPermissions) {
          const permissionData = {
            userId: newUser.id,
            farmId: data.farmId,
            module: perm.module,
            accessLevel: perm.accessLevel
          };
          
          const permResponse = await apiRequest('POST', '/api/permissions', permissionData);
        }
      }
      
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Usuário Registrado',
        description: 'Novo usuário foi criado com sucesso.',
      });
      form.reset();
      // Resetar permissões
      setPermissions([]);
    },
    onError: (error) => {
      toast({
        title: 'Erro de Registro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Submit handler
  const onSubmit = (data: FormData) => {
    // Adicionar as permissões aos dados
    const formData = {
      ...data,
      permissions: permissions.filter(p => p.enabled),
    };

    createUserMutation.mutate(formData);
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Cadastro de Usuários</h1>
          <p className="text-gray-500">Registre novos usuários e defina suas permissões de acesso.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
          <CardDescription>
            Preencha os dados básicos do usuário e selecione as permissões apropriadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados Básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados Pessoais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2.5">
                              <User className="h-4 w-4 text-gray-400" />
                            </span>
                            <Input 
                              {...field} 
                              placeholder="Digite o nome completo" 
                              className="pl-8"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2.5">
                              <Mail className="h-4 w-4 text-gray-400" />
                            </span>
                            <Input 
                              {...field} 
                              type="email" 
                              placeholder="email@exemplo.com"
                              className="pl-8"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Usuário</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Digite o nome de usuário" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idioma</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o idioma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pt">Português</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2.5">
                              <Lock className="h-4 w-4 text-gray-400" />
                            </span>
                            <Input 
                              {...field} 
                              type="password" 
                              placeholder="Digite a senha"
                              className="pl-8"
                            />
                          </div>
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
                        <FormLabel>Confirmar Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2.5">
                              <Lock className="h-4 w-4 text-gray-400" />
                            </span>
                            <Input 
                              {...field} 
                              type="password" 
                              placeholder="Confirme a senha"
                              className="pl-8"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Função e Fazenda */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Função e Alocação</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Função</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a função" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isSuperAdmin && (
                              <SelectItem value={UserRole.FARM_ADMIN}>Administrador de Fazenda</SelectItem>
                            )}
                            <SelectItem value={UserRole.MANAGER}>Gerente</SelectItem>
                            <SelectItem value={UserRole.EMPLOYEE}>Funcionário</SelectItem>
                            <SelectItem value={UserRole.VETERINARIAN}>Veterinário</SelectItem>
                            <SelectItem value={UserRole.AGRONOMIST}>Agrônomo</SelectItem>
                            <SelectItem value={UserRole.CONSULTANT}>Consultor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          A função determina as permissões padrão do usuário.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="farmId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fazenda</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(Number(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a fazenda" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingFarms ? (
                              <SelectItem value="loading" disabled>Carregando...</SelectItem>
                            ) : (
                              Array.isArray(farms) ? farms.map((farm: any) => (
                                <SelectItem key={farm.id} value={farm.id.toString()}>
                                  {farm.name}
                                </SelectItem>
                              )) : <SelectItem value="no-farms">Nenhuma fazenda disponível</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          A fazenda à qual o usuário será associado.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Permissões */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Permissões de Acesso</h3>
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                
                <p className="text-sm text-gray-500">
                  Configure as permissões específicas de acesso a cada funcionalidade do sistema.
                </p>
                
                <div className="border rounded-md p-4">
                  <div className="grid grid-cols-12 gap-4 mb-2 font-medium">
                    <div className="col-span-6 sm:col-span-5">Funcionalidade</div>
                    <div className="col-span-2 sm:col-span-3">Acesso</div>
                    <div className="col-span-4">Permitir</div>
                  </div>
                  
                  <Separator className="mb-4" />
                  
                  {permissions.map((permission, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 py-2">
                      <div className="col-span-6 sm:col-span-5 flex items-center">
                        {getModuleTitle(permission.module)}
                      </div>
                      
                      <div className="col-span-2 sm:col-span-3">
                        <Select
                          value={permission.accessLevel}
                          onValueChange={(value) => handleAccessLevelChange(index, value as AccessLevel)}
                          disabled={!permission.enabled}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={AccessLevel.FULL}>Acesso Total</SelectItem>
                            <SelectItem value={AccessLevel.READ_ONLY}>Somente Leitura</SelectItem>
                            <SelectItem value={AccessLevel.EDIT}>Editar</SelectItem>
                            <SelectItem value={AccessLevel.MANAGE}>Gerenciar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="col-span-4 flex items-center">
                        <Checkbox
                          checked={permission.enabled}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(index, checked as boolean)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Botões de Ação */}
              <div className="flex items-center justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={createUserMutation.isPending}
                >
                  Limpar Formulário
                </Button>
                <Button 
                  type="submit" 
                  className="w-auto"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cadastrando...
                    </>
                  ) : (
                    <>Cadastrar Usuário</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}