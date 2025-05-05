import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
// Usar o Loader2 diretamente, pois o Spinner pode não estar disponível
import { Loader2 } from "lucide-react";
import { CalendarIcon, Plus, RefreshCw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Basic typings
interface Farm {
  id: number;
  name: string;
  // Other farm properties...
}

interface User {
  userId: number;
  username?: string;
  name?: string;
  // Other user properties...
}

interface Crop {
  id: number;
  name: string;
  // Other crop properties...
}

interface Goal {
  id: number;
  name: string;
  description: string | null;
  farmId: number;
  assignedTo: number;
  startDate: string;
  endDate: string;
  targetValue: string;
  actualValue: string;
  unit: string;
  status: string;
  cropId: number | null;
  notes: string | null;
  createdBy: number;
  completionDate: string | null;
  createdAt: string;
}

// Status badge colors
const statusColors = {
  pending: "bg-yellow-500",
  in_progress: "bg-blue-500",
  partial: "bg-orange-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500"
};

// Unit display mapping
const unitDisplay = {
  hectares: "hectares",
  meters: "metros",
  units: "unidades",
  kilograms: "kg",
  liters: "litros",
  percentage: "%"
};

// Goal form schema with validation
const goalFormSchema = z.object({
  name: z.string().min(3, "Nome é obrigatório e deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  assignedTo: z.string().min(1, "Responsável é obrigatório"),
  startDate: z.date({
    required_error: "Data de início é obrigatória",
  }),
  endDate: z.date({
    required_error: "Data de término é obrigatória",
  }),
  targetValue: z.string().min(1, "Valor alvo é obrigatório"),
  unit: z.string().min(1, "Unidade de medida é obrigatória"),
  cropId: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("pending")
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
  message: "Data de término deve ser depois da data de início",
  path: ["endDate"]
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

export default function GoalsPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/farms/:farmId/goals");
  const farmId = match ? params.farmId : null;
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("all");
  const [openCreateGoal, setOpenCreateGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const queryClient = useQueryClient();

  // Redirect if farmId is not provided
  useEffect(() => {
    if (!farmId) {
      setLocation("/farms");
    }
  }, [farmId, setLocation]);

  // Query farm information
  const { data: farmData } = useQuery<Farm>({
    queryKey: ['/api/farms', farmId],
    enabled: !!farmId
  });

  // Query users for the farm
  const { data: farmUsers } = useQuery<User[]>({
    queryKey: ['/api/farms', farmId, 'users'],
    enabled: !!farmId
  });

  // Query crops for the farm
  const { data: crops } = useQuery<Crop[]>({
    queryKey: ['/api/farms', farmId, 'crops'],
    enabled: !!farmId
  });

  // Query goals based on selected tab
  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ['/api/farms', farmId, 'goals', selectedTab],
    queryFn: async () => {
      if (selectedTab === "all") {
        return await apiRequest<Goal[]>(`/api/farms/${farmId}/goals`);
      } else {
        return await apiRequest<Goal[]>(`/api/farms/${farmId}/goals/status/${selectedTab}`);
      }
    },
    enabled: !!farmId
  });

  // Create goal mutation
  const createGoal = useMutation({
    mutationFn: async (goalData: Omit<Partial<Goal>, 'id' | 'createdAt' | 'completionDate' | 'actualValue'>) => {
      return await apiRequest<Goal>(`/api/farms/${farmId}/goals`, {
        method: "POST",
        data: goalData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'goals'] });
      setOpenCreateGoal(false);
      toast({
        title: "Meta criada",
        description: "A meta foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar meta",
        description: "Ocorreu um erro ao criar a meta. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Update goal mutation
  const updateGoal = useMutation({
    mutationFn: async ({ goalId, goalData }: { 
      goalId: number, 
      goalData: Partial<Goal>
    }) => {
      return await apiRequest<Goal>(`/api/goals/${goalId}`, {
        method: "PATCH",
        data: goalData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'goals'] });
      setEditingGoal(null);
      toast({
        title: "Meta atualizada",
        description: "A meta foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar meta",
        description: "Ocorreu um erro ao atualizar a meta. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Form for creating/editing goals
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: "",
      description: "",
      assignedTo: farmUsers && farmUsers.length > 0 ? String(farmUsers[0].userId) : "0",
      targetValue: "",
      unit: "units",
      status: "pending",
      notes: ""
    }
  });

  // Reset form when opening the create goal form
  useEffect(() => {
    if (openCreateGoal) {
      form.reset({
        name: "",
        description: "",
        assignedTo: farmUsers && farmUsers.length > 0 ? String(farmUsers[0].userId) : "0",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        targetValue: "",
        unit: "units",
        cropId: crops && crops.length > 0 ? String(crops[0].id) : "0",
        notes: "",
        status: "pending"
      });
    }
  }, [openCreateGoal, form, farmUsers, crops]);

  // Fill form with goal data when editing
  useEffect(() => {
    if (editingGoal) {
      form.reset({
        name: editingGoal.name,
        description: editingGoal.description || "",
        assignedTo: String(editingGoal.assignedTo),
        startDate: new Date(editingGoal.startDate),
        endDate: new Date(editingGoal.endDate),
        targetValue: editingGoal.targetValue,
        unit: editingGoal.unit,
        cropId: editingGoal.cropId ? String(editingGoal.cropId) : "0",
        notes: editingGoal.notes || "",
        status: editingGoal.status
      });
    }
  }, [editingGoal, form]);

  // Handle form submission
  const onSubmit = (data: GoalFormValues) => {
    // Format the data for API
    const goalData = {
      ...data,
      assignedTo: parseInt(data.assignedTo),
      cropId: data.cropId ? parseInt(data.cropId) : null,
      startDate: data.startDate ? format(data.startDate, "yyyy-MM-dd") : "",
      endDate: data.endDate ? format(data.endDate, "yyyy-MM-dd") : "",
    };
    
    if (editingGoal) {
      updateGoal.mutate({ goalId: editingGoal.id, goalData });
    } else {
      createGoal.mutate(goalData);
    }
  };

  // Find user name by ID
  const getUserName = (userId: number) => {
    if (!farmUsers) return "Usuário desconhecido";
    const user = farmUsers.find((user: any) => user.userId === userId);
    if (!user) return "Usuário desconhecido";
    // We would need to get user details from another API call in a real app
    return `ID: ${userId}`;
  };

  // Calculate progress for a goal
  const calculateProgress = (goal: any) => {
    if (!goal.targetValue || !goal.actualValue) return 0;
    const target = parseFloat(goal.targetValue);
    const actual = parseFloat(goal.actualValue);
    if (isNaN(target) || isNaN(actual) || target === 0) return 0;
    return Math.min(100, Math.round((actual / target) * 100));
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Check if a goal is overdue
  const isOverdue = (goal: any) => {
    if (goal.status === 'completed' || goal.status === 'cancelled') return false;
    const now = new Date();
    const endDate = new Date(goal.endDate);
    return now > endDate;
  };

  // Get status label in Portuguese
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Progresso';
      case 'partial': return 'Parcial';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  if (!farmId) return null;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Metas e Objetivos</h1>
          <p className="text-muted-foreground">
            {farmData ? `Fazenda: ${farmData.name}` : 'Carregando...'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'goals'] })}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Sheet open={openCreateGoal} onOpenChange={setOpenCreateGoal}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Meta
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Nova Meta</SheetTitle>
                <SheetDescription>
                  Crie uma nova meta ou objetivo para a fazenda.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Meta</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Aumentar produção de milho" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o objetivo em detalhes" 
                              className="resize-none"
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
                        name="assignedTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsável</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um usuário" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {farmUsers?.map((user: any) => (
                                  <SelectItem key={user.userId} value={String(user.userId)}>
                                    {getUserName(user.userId)}
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
                        name="cropId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plantação (opcional)</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">Nenhuma</SelectItem>
                                {crops?.map((crop: any) => (
                                  <SelectItem key={crop.id} value={String(crop.id)}>
                                    {crop.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                          <FormItem className="flex flex-col">
                            <FormLabel>Data de Início</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy")
                                    ) : (
                                      <span>Selecione a data</span>
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
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data de Término</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy")
                                    ) : (
                                      <span>Selecione a data</span>
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
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="targetValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Alvo</FormLabel>
                            <FormControl>
                              <Input type="text" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unidade</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma unidade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="hectares">Hectares</SelectItem>
                                <SelectItem value="meters">Metros</SelectItem>
                                <SelectItem value="units">Unidades</SelectItem>
                                <SelectItem value="kilograms">Quilogramas</SelectItem>
                                <SelectItem value="liters">Litros</SelectItem>
                                <SelectItem value="percentage">Porcentagem</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {editingGoal && (
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="in_progress">Em Progresso</SelectItem>
                                <SelectItem value="partial">Parcial</SelectItem>
                                <SelectItem value="completed">Concluída</SelectItem>
                                <SelectItem value="cancelled">Cancelada</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas (opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Notas adicionais sobre a meta" 
                              className="resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <SheetFooter className="pt-4">
                      <SheetClose asChild>
                        <Button variant="outline" type="button">Cancelar</Button>
                      </SheetClose>
                      <Button 
                        type="submit" 
                        disabled={createGoal.isPending || updateGoal.isPending}
                      >
                        {(createGoal.isPending || updateGoal.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {editingGoal ? "Atualizar Meta" : "Criar Meta"}
                      </Button>
                    </SheetFooter>
                  </form>
                </Form>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Tabs 
        defaultValue="all" 
        className="w-full" 
        value={selectedTab}
        onValueChange={setSelectedTab}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="in_progress">Em Progresso</TabsTrigger>
          <TabsTrigger value="partial">Parciais</TabsTrigger>
          <TabsTrigger value="completed">Concluídas</TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedTab}>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTab === "all" ? "Todas as Metas" : `Metas ${getStatusLabel(selectedTab)}`}
              </CardTitle>
              <CardDescription>
                Gerencie as metas e objetivos da fazenda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : goals?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma meta encontrada nesta categoria
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Meta</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goals?.map((goal: any) => (
                      <TableRow key={goal.id} className={isOverdue(goal) ? "bg-red-50" : ""}>
                        <TableCell className="font-medium">
                          {goal.name}
                          {isOverdue(goal) && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Atrasada
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{getUserName(goal.assignedTo)}</TableCell>
                        <TableCell>
                          {formatDate(goal.startDate)} - {formatDate(goal.endDate)}
                        </TableCell>
                        <TableCell>
                          {goal.targetValue} {unitDisplay[goal.unit as keyof typeof unitDisplay]}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-white", statusColors[goal.status as keyof typeof statusColors])}>
                            {getStatusLabel(goal.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-primary h-2.5 rounded-full" 
                              style={{ width: `${calculateProgress(goal)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {goal.actualValue || "0"}/{goal.targetValue} ({calculateProgress(goal)}%)
                          </div>
                        </TableCell>
                        <TableCell>
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setEditingGoal(goal)}
                              >
                                Editar
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                              <SheetHeader>
                                <SheetTitle>Editar Meta</SheetTitle>
                                <SheetDescription>
                                  Atualize as informações da meta.
                                </SheetDescription>
                              </SheetHeader>
                              {editingGoal?.id === goal.id && (
                                <div className="py-4">
                                  <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                      {/* Form fields - same as create form */}
                                      <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Nome da Meta</FormLabel>
                                            <FormControl>
                                              <Input placeholder="Ex: Aumentar produção de milho" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Descrição</FormLabel>
                                            <FormControl>
                                              <Textarea 
                                                placeholder="Descreva o objetivo em detalhes" 
                                                className="resize-none"
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
                                          name="assignedTo"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Responsável</FormLabel>
                                              <Select 
                                                onValueChange={field.onChange} 
                                                defaultValue={field.value}
                                                value={field.value}
                                              >
                                                <FormControl>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um usuário" />
                                                  </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                  {farmUsers?.map((user: any) => (
                                                    <SelectItem key={user.userId} value={String(user.userId)}>
                                                      {getUserName(user.userId)}
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
                                          name="cropId"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Plantação (opcional)</FormLabel>
                                              <Select 
                                                onValueChange={field.onChange} 
                                                defaultValue={field.value}
                                                value={field.value}
                                              >
                                                <FormControl>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                  </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                  <SelectItem value="0">Nenhuma</SelectItem>
                                                  {crops?.map((crop: any) => (
                                                    <SelectItem key={crop.id} value={String(crop.id)}>
                                                      {crop.name}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
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
                                            <FormItem className="flex flex-col">
                                              <FormLabel>Data de Início</FormLabel>
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <FormControl>
                                                    <Button
                                                      variant={"outline"}
                                                      className={cn(
                                                        "pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                      )}
                                                    >
                                                      {field.value ? (
                                                        format(field.value, "dd/MM/yyyy")
                                                      ) : (
                                                        <span>Selecione a data</span>
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
                                                    initialFocus
                                                  />
                                                </PopoverContent>
                                              </Popover>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <FormField
                                          control={form.control}
                                          name="endDate"
                                          render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                              <FormLabel>Data de Término</FormLabel>
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <FormControl>
                                                    <Button
                                                      variant={"outline"}
                                                      className={cn(
                                                        "pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                      )}
                                                    >
                                                      {field.value ? (
                                                        format(field.value, "dd/MM/yyyy")
                                                      ) : (
                                                        <span>Selecione a data</span>
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
                                                    initialFocus
                                                  />
                                                </PopoverContent>
                                              </Popover>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                          control={form.control}
                                          name="targetValue"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Valor Alvo</FormLabel>
                                              <FormControl>
                                                <Input type="text" {...field} />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <FormField
                                          control={form.control}
                                          name="unit"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Unidade</FormLabel>
                                              <Select 
                                                onValueChange={field.onChange} 
                                                defaultValue={field.value}
                                                value={field.value}
                                              >
                                                <FormControl>
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Selecione uma unidade" />
                                                  </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                  <SelectItem value="hectares">Hectares</SelectItem>
                                                  <SelectItem value="meters">Metros</SelectItem>
                                                  <SelectItem value="units">Unidades</SelectItem>
                                                  <SelectItem value="kilograms">Quilogramas</SelectItem>
                                                  <SelectItem value="liters">Litros</SelectItem>
                                                  <SelectItem value="percentage">Porcentagem</SelectItem>
                                                </SelectContent>
                                              </Select>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                      
                                      <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select 
                                              onValueChange={field.onChange} 
                                              defaultValue={field.value}
                                              value={field.value}
                                            >
                                              <FormControl>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Selecione o status" />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                <SelectItem value="pending">Pendente</SelectItem>
                                                <SelectItem value="in_progress">Em Progresso</SelectItem>
                                                <SelectItem value="partial">Parcial</SelectItem>
                                                <SelectItem value="completed">Concluída</SelectItem>
                                                <SelectItem value="cancelled">Cancelada</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Notas (opcional)</FormLabel>
                                            <FormControl>
                                              <Textarea 
                                                placeholder="Notas adicionais sobre a meta" 
                                                className="resize-none"
                                                {...field} 
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <SheetFooter className="pt-4">
                                        <SheetClose asChild>
                                          <Button 
                                            variant="outline" 
                                            type="button"
                                            onClick={() => setEditingGoal(null)}
                                          >
                                            Cancelar
                                          </Button>
                                        </SheetClose>
                                        <Button 
                                          type="submit" 
                                          disabled={updateGoal.isPending}
                                        >
                                          {updateGoal.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          )}
                                          Atualizar Meta
                                        </Button>
                                      </SheetFooter>
                                    </form>
                                  </Form>
                                </div>
                              )}
                            </SheetContent>
                          </Sheet>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}