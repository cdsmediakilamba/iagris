import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit, AlertTriangle, CheckCircle, Clock, Trash2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { insertPurchaseRequestSchema, PurchaseRequestStatus } from "@shared/schema";
import type { PurchaseRequest } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

// Formulário para criar/editar solicitação
const purchaseRequestFormSchema = insertPurchaseRequestSchema.extend({
  data: z.string().min(1, "Data é obrigatória"),
  farmId: z.number().min(1, "Selecione uma fazenda"),
}).omit({
  createdBy: true,
});

type PurchaseRequestFormData = z.infer<typeof purchaseRequestFormSchema>;

export default function PurchaseRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAndamentoDialogOpen, setIsAndamentoDialogOpen] = useState(false);
  const [isFinalizarDialogOpen, setIsFinalizarDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [andamentoText, setAndamentoText] = useState("");
  const [finalizadoPorText, setFinalizadoPorText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterUrgent, setFilterUrgent] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(user?.farmId || null);

  // Query para buscar fazendas (todos os usuários precisam ver as fazendas para fazer solicitações)
  const { data: farms = [] } = useQuery<any[]>({
    queryKey: ["/api/farms"],
  });

  // Formulário para criar/editar
  const form = useForm<PurchaseRequestFormData>({
    resolver: zodResolver(purchaseRequestFormSchema),
    defaultValues: {
      produto: "",
      quantidade: "",
      observacao: "",
      responsavel: "",
      data: "",
      urgente: false,
      status: PurchaseRequestStatus.NOVA,
      farmId: selectedFarmId || 0,
    },
  });

  // Efeito para definir a primeira fazenda automaticamente para Super Admin
  useEffect(() => {
    if (user?.role === "super_admin" && farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [user?.role, farms, selectedFarmId]);

  // Efeito para atualizar o farmId no formulário quando selectedFarmId muda
  useEffect(() => {
    if (selectedFarmId && form) {
      form.setValue("farmId", selectedFarmId);
    }
  }, [selectedFarmId, form]);



  // Query para buscar solicitações
  const { data: requests = [], isLoading } = useQuery<PurchaseRequest[]>({
    queryKey: [`/api/farms/${selectedFarmId}/purchase-requests`],
    enabled: !!selectedFarmId,
  });

  // Debug logging
  console.log("Selected Farm ID:", selectedFarmId);
  console.log("Requests Data:", requests);
  console.log("Is Loading:", isLoading);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: PurchaseRequestFormData) =>
      apiRequest(`/api/farms/${data.farmId}/purchase-requests`, {
        method: "POST",
        data: data,
      }),
    onSuccess: (newRequest) => {
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${selectedFarmId}/purchase-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${newRequest.farmId}/purchase-requests`] });
      
      // Automaticamente mudar para a fazenda da nova solicitação se for diferente
      if (newRequest.farmId !== selectedFarmId) {
        setSelectedFarmId(newRequest.farmId);
      }
      
      setIsCreateDialogOpen(false);
      form.reset({
        produto: "",
        quantidade: "",
        observacao: "",
        responsavel: "",
        data: "",
        urgente: false,
        status: PurchaseRequestStatus.NOVA,
        farmId: selectedFarmId || 0,
      });
      toast({ title: "Solicitação criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar solicitação", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PurchaseRequest> }) =>
      apiRequest(`/api/purchase-requests/${id}`, {
        method: "PATCH",
        data: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${selectedFarmId}/purchase-requests`] });
      setIsEditDialogOpen(false);
      setIsAndamentoDialogOpen(false);
      setIsFinalizarDialogOpen(false);
      toast({ title: "Solicitação atualizada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar solicitação", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/purchase-requests/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${selectedFarmId}/purchase-requests`] });
      toast({ title: "Solicitação excluída com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir solicitação", variant: "destructive" });
    },
  });

  // Filtrar solicitações
  const filteredRequests = requests.filter((request: PurchaseRequest) => {
    const matchesStatus = filterStatus === "all" || request.status === filterStatus;
    const matchesUrgent = !filterUrgent || request.urgente;
    const matchesSearch = searchTerm === "" || 
      request.produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.responsavel.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesUrgent && matchesSearch;
  });

  const handleCreate = (data: PurchaseRequestFormData) => {
    createMutation.mutate(data);
  };

  const handleEdit = (data: PurchaseRequestFormData) => {
    if (selectedRequest) {
      updateMutation.mutate({
        id: selectedRequest.id,
        data: data,
      });
    }
  };

  const handleAndamento = () => {
    if (selectedRequest) {
      updateMutation.mutate({
        id: selectedRequest.id,
        data: {
          andamento: andamentoText,
          status: PurchaseRequestStatus.EM_ANDAMENTO,
        },
      });
    }
  };

  const handleFinalizar = () => {
    if (selectedRequest) {
      updateMutation.mutate({
        id: selectedRequest.id,
        data: {
          finalizadoPor: finalizadoPorText,
          status: PurchaseRequestStatus.FINALIZADA,
        },
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case PurchaseRequestStatus.NOVA:
        return <Badge variant="secondary">Nova</Badge>;
      case PurchaseRequestStatus.EM_ANDAMENTO:
        return <Badge variant="default">Em Andamento</Badge>;
      case PurchaseRequestStatus.FINALIZADA:
        return <Badge variant="outline">Finalizada</Badge>;
      default:
        return <Badge variant="secondary">Nova</Badge>;
    }
  };

  const openEditDialog = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    form.reset({
      produto: request.produto,
      quantidade: request.quantidade,
      observacao: request.observacao || "",
      responsavel: request.responsavel,
      data: request.data,
      urgente: request.urgente,
      status: request.status,
    });
    setIsEditDialogOpen(true);
  };

  const openAndamentoDialog = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setAndamentoText(request.andamento || "");
    setIsAndamentoDialogOpen(true);
  };

  const openFinalizarDialog = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setFinalizadoPorText(request.finalizadoPor || "");
    setIsFinalizarDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Solicitações de Compras</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Solicitação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nova Solicitação de Compra</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="produto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do produto" {...field} />
                        </FormControl>
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
                        <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma fazenda" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {farms.map((farm: any) => (
                              <SelectItem key={farm.id} value={farm.id.toString()}>
                                {farm.name} - {farm.location}
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
                    name="quantidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 10 kg, 5 unidades" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="responsavel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do responsável" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="data"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="observacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Observações adicionais" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="urgente"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Urgente</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Criando..." : "Criar"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Seletor de Fazenda (para Super Admin) */}
        {user?.role === "super_admin" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Selecionar Fazenda</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedFarmId?.toString()} onValueChange={(value) => setSelectedFarmId(Number(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma fazenda" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm: any) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.name} - {farm.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Pesquisar</Label>
                <Input
                  id="search"
                  placeholder="Produto ou responsável"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value={PurchaseRequestStatus.NOVA}>Nova</SelectItem>
                    <SelectItem value={PurchaseRequestStatus.EM_ANDAMENTO}>Em Andamento</SelectItem>
                    <SelectItem value={PurchaseRequestStatus.FINALIZADA}>Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="urgent"
                  checked={filterUrgent}
                  onCheckedChange={(checked) => setFilterUrgent(checked === true)}
                />
                <Label htmlFor="urgent">Apenas urgentes</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de solicitações */}
        <div className="grid gap-4">
          {isLoading ? (
            <div>Carregando...</div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground mb-2">Nenhuma solicitação encontrada</p>
                {user?.role === "super_admin" && (
                  <p className="text-sm text-muted-foreground">
                    Verifique se você selecionou a fazenda correta acima
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request: PurchaseRequest) => (
              <Card key={request.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{request.produto}</h3>
                        {request.urgente && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        {getStatusBadge(request.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Quantidade:</strong> {request.quantidade}
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Responsável:</strong> {request.responsavel}
                      </p>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Data:</strong> {new Date(request.data).toLocaleDateString("pt-BR")}
                      </p>
                      {request.observacao && (
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Observações:</strong> {request.observacao}
                        </p>
                      )}
                      {request.andamento && (
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Andamento:</strong> {request.andamento}
                        </p>
                      )}
                      {request.finalizadoPor && (
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Finalizada por:</strong> {request.finalizadoPor}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(request)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {request.status !== PurchaseRequestStatus.FINALIZADA && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAndamentoDialog(request)}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openFinalizarDialog(request)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(request.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Solicitação</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="produto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do produto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="quantidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 10 kg, 5 unidades" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="observacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observações adicionais" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="urgente"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Urgente</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Andamento */}
        <Dialog open={isAndamentoDialogOpen} onOpenChange={setIsAndamentoDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Atualizar Andamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="andamento">Informações sobre o andamento</Label>
                <Textarea
                  id="andamento"
                  placeholder="Descreva o andamento da solicitação"
                  value={andamentoText}
                  onChange={(e) => setAndamentoText(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAndamento} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
                <Button variant="outline" onClick={() => setIsAndamentoDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Finalizar */}
        <Dialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Finalizar Solicitação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="finalizadoPor">Finalizado por</Label>
                <Input
                  id="finalizadoPor"
                  placeholder="Nome de quem finalizou"
                  value={finalizadoPorText}
                  onChange={(e) => setFinalizadoPorText(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleFinalizar} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Finalizando..." : "Finalizar"}
                </Button>
                <Button variant="outline" onClick={() => setIsFinalizarDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}