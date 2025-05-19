import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserRole } from '@shared/schema';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  PlusCircle,
  Users,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  User,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  ChartBar,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Employee schema for form validation
const employeeSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  position: z.string().min(1, { message: "Position is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(9, { message: "Phone number is required" }),
  address: z.string().optional(),
  hireDate: z.date(),
  status: z.enum(["active", "onLeave", "inactive"]),
  role: z.enum(["admin", "manager", "employee", "veterinarian", "agronomist", "consultant"]),
  farmId: z.number()
});

type Employee = {
  id: number;
  name: string;
  position: string;
  email: string;
  phone: string;
  address?: string;
  hireDate: Date;
  status: "active" | "onLeave" | "inactive";
  role: UserRole;
  farmId: number;
  createdAt: Date;
};

// Sample employees data - in a real app this would come from the API
const mockEmployees: Employee[] = [
  {
    id: 1,
    name: "Carlos Silva",
    position: "Farm Manager",
    email: "carlos.silva@farmmanager.com",
    phone: "+244 923 456 789",
    address: "Fazenda Bela Vista, Huambo, Angola",
    hireDate: new Date(2021, 3, 15),
    status: "active",
    role: UserRole.MANAGER,
    farmId: 1,
    createdAt: new Date(2021, 3, 15)
  },
  {
    id: 2,
    name: "Maria Santos",
    position: "Veterinarian",
    email: "maria.santos@farmmanager.com",
    phone: "+244 912 345 678",
    address: "Huambo, Angola",
    hireDate: new Date(2021, 6, 10),
    status: "active",
    role: UserRole.VETERINARIAN,
    farmId: 1,
    createdAt: new Date(2021, 6, 10)
  },
  {
    id: 3,
    name: "João Pereira",
    position: "Field Worker",
    email: "joao.pereira@farmmanager.com",
    phone: "+244 934 567 890",
    hireDate: new Date(2022, 1, 5),
    status: "active",
    role: UserRole.EMPLOYEE,
    farmId: 1,
    createdAt: new Date(2022, 1, 5)
  },
  {
    id: 4,
    name: "Ana Rodrigues",
    position: "Agronomist",
    email: "ana.rodrigues@farmmanager.com",
    phone: "+244 955 678 901",
    address: "Lubango, Angola",
    hireDate: new Date(2022, 3, 20),
    status: "onLeave",
    role: UserRole.AGRONOMIST,
    farmId: 1,
    createdAt: new Date(2022, 3, 20)
  },
  {
    id: 5,
    name: "Paulo Costa",
    position: "Inventory Manager",
    email: "paulo.costa@farmmanager.com",
    phone: "+244 923 789 012",
    hireDate: new Date(2022, 5, 15),
    status: "inactive",
    role: UserRole.EMPLOYEE,
    farmId: 1,
    createdAt: new Date(2022, 5, 15)
  }
];

export default function Employees() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Check if user has permission to manage employees
  const canManageEmployees = user?.role === 'farm_admin' || user?.role === 'manager' || user?.role === 'super_admin';

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

  // Get employees from the API
  const { data: employees, isLoading: isLoadingEmployees } = useQuery<Employee[]>({
    queryKey: ['/api/users'],
    // If user is not a SUPER_ADMIN, we only want employees for the selected farm
    enabled: true,
  });

  // Filter employees based on tab, search term, and selected farm
  const getFilteredEmployees = () => {
    if (!employees) return [];
    
    let filteredList = employees;
    
    // If not super admin and farm is selected, filter by farm
    if (user?.role !== UserRole.SUPER_ADMIN && selectedFarmId) {
      filteredList = filteredList.filter(employee => employee.farmId === selectedFarmId);
    }
    
    // Filter by status if not showing all
    if (activeTab !== 'all') {
      filteredList = filteredList.filter(employee => employee.status === activeTab);
    }
    
    // Apply search filter
    if (searchTerm) {
      filteredList = filteredList.filter(employee => 
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.position && employee.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filteredList;
  };

  const filteredEmployees = getFilteredEmployees();

  // Form schema for adding/editing employees
  const formSchema = employeeSchema.omit({ 
    farmId: true 
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      position: '',
      email: '',
      phone: '',
      address: '',
      hireDate: new Date(),
      status: 'active',
      role: 'employee',
    },
  });

  // Create employee mutation (would connect to API in real app)
  const createEmployee = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!selectedFarmId) throw new Error("No farm selected");
      
      // In a real app, this would call the API
      // const response = await apiRequest('POST', `/api/farms/${selectedFarmId}/employees`, {
      //   ...data,
      //   farmId: selectedFarmId
      // });
      // return response.json();
      
      // For now, just return a mock success after a delay
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    },
    onSuccess: () => {
      // In a real app, invalidate the queries
      // queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'employees'] });
      
      toast({
        title: t('employees.employeeAdded'),
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
    createEmployee.mutate(data);
  };

  // Status badge renderer
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {t('employees.statuses.active')}
          </Badge>
        );
      case 'onLeave':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {t('employees.statuses.onLeave')}
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
            {t('employees.statuses.inactive')}
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

  // Function to get avatar initials from name
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
        <h1 className="text-2xl font-medium text-gray-900 mb-4">{t('employees.title')}</h1>
        
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
          
          {/* Add employee button - only visible to admins and managers */}
          {canManageEmployees && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('employees.addEmployee')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{t('employees.addEmployee')}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('employees.name')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('employees.position')}</FormLabel>
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
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('employees.email')}</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('employees.phone')}</FormLabel>
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
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employees.address')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="hireDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('employees.hireDate')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                value={field.value instanceof Date ? field.value.toISOString().substring(0, 10) : ''}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
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
                            <FormLabel>{t('employees.status')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('employees.status')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">{t('employees.statuses.active')}</SelectItem>
                                <SelectItem value="onLeave">{t('employees.statuses.onLeave')}</SelectItem>
                                <SelectItem value="inactive">{t('employees.statuses.inactive')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employees.role')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('employees.role')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {user?.role === UserRole.ADMIN && (
                                <SelectItem value="admin">{t('employees.roles.admin')}</SelectItem>
                              )}
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
                    
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">{t('common.cancel')}</Button>
                      </DialogClose>
                      <Button type="submit" disabled={createEmployee.isPending}>
                        {createEmployee.isPending ? (
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
          )}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center">
              <CardTitle>{t('employees.title')}</CardTitle>
              <TabsList>
                <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
                <TabsTrigger value="active">{t('employees.statuses.active')}</TabsTrigger>
                <TabsTrigger value="onLeave">{t('employees.statuses.onLeave')}</TabsTrigger>
                <TabsTrigger value="inactive">{t('employees.statuses.inactive')}</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoadingEmployees ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEmployees.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('employees.name')}</TableHead>
                    <TableHead>{t('employees.position')}</TableHead>
                    <TableHead>{t('employees.contact')}</TableHead>
                    <TableHead>{t('employees.hireDate')}</TableHead>
                    <TableHead>{t('employees.status')}</TableHead>
                    <TableHead>{t('employees.role')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                          {employee.position}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 mr-2 text-gray-500" />
                            {employee.email}
                          </div>
                          <div className="flex items-center text-sm mt-1">
                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                            {employee.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {formatDate(employee.hireDate, 'P', language)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(employee.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {t(`employees.roles.${employee.role}`)}
                        </Badge>
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
                              <FileText className="h-4 w-4 mr-2" />
                              {t('employees.taskHistory')}
                            </DropdownMenuItem>
                            {canManageEmployees && (
                              <>
                                <DropdownMenuItem className="flex items-center">
                                  <Edit className="h-4 w-4 mr-2" />
                                  {t('common.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('common.delete')}
                                </DropdownMenuItem>
                              </>
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
              <h3 className="text-lg font-medium text-gray-900 mb-1">{t('employees.noEmployees')}</h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? t('common.noSearchResults') 
                  : canManageEmployees ? t('employees.addEmployee') : t('employees.noEmployeesMessage')
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
