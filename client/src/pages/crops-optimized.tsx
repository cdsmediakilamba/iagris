import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Plus, 
  Leaf, 
  DollarSign, 
  Search, 
  ChevronDown, 
  Filter,
  RefreshCw,
  Calendar,
  MapPin,
  Coins
} from "lucide-react";

// Types
interface Farm {
  id: number;
  name: string;
  location: string;
  size: number;
  type: string;
  description?: string;
}

interface Crop {
  id: number;
  name: string;
  sector: string;
  area: number;
  status: string;
  farmId: number;
  plantingDate?: string;
  expectedHarvestDate?: string;
  createdAt: string;
}

interface CropCost {
  id: number;
  cropId: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  farmId: number;
  createdBy: number;
  notes?: string;
}

// Status configurations
const CROP_STATUSES = [
  { value: "growing", label: "Em Crescimento", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "harvested", label: "Colhido", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "planting", label: "Plantando", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "ready", label: "Pronto", color: "bg-purple-100 text-purple-800 border-purple-200" }
];

export default function CropsOptimizedPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Estados
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [isAddCropDialogOpen, setIsAddCropDialogOpen] = useState(false);
  const [isAddCostDialogOpen, setIsAddCostDialogOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  
  // Estados do formulário de plantação
  const [cropForm, setCropForm] = useState({
    name: '',
    sector: '',
    area: '',
    plantingDate: '',
    expectedHarvestDate: '',
    status: 'growing'
  });
  
  // Estados do formulário de custo
  const [costForm, setCostForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'seeds',
    notes: ''
  });
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    sector: ''
  });
  
  // Carregar fazendas
  const { data: farms, isLoading: loadingFarms } = useQuery<Farm[]>({
    queryKey: ['/api/farms'],
  });
  
  // Usar a primeira fazenda por padrão
  useEffect(() => {
    if (farms && farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);
  
  // Carregar plantações da fazenda selecionada
  const { 
    data: crops, 
    isLoading: loadingCrops,
    refetch: refetchCrops
  } = useQuery<Crop[]>({
    queryKey: ['/api/farms', selectedFarmId, 'crops'],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      const result = await apiRequest(`/api/farms/${selectedFarmId}/crops`);
      return Array.isArray(result) ? result : [];
    },
    enabled: !!selectedFarmId,
  });
  
  // Carregar custos das plantações
  const { data: cropCosts } = useQuery<CropCost[]>({
    queryKey: ['/api/farms', selectedFarmId, 'crop-costs'],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      try {
        const result = await apiRequest(`/api/farms/${selectedFarmId}/crop-costs`);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Erro ao buscar custos das plantações:', error);
        return [];
      }
    },
    enabled: !!selectedFarmId,
  });
  
  // Mutação para criar plantação
  const createCrop = useMutation({
    mutationFn: async (cropData: any) => {
      if (!selectedFarmId) throw new Error('Nenhuma fazenda selecionada');
      
      return await apiRequest(`/api/farms/${selectedFarmId}/crops`, {
        method: 'POST',
        data: { ...cropData, farmId: selectedFarmId }
      });
    },
    onSuccess: () => {
      setCropForm({
        name: '',
        sector: '',
        area: '',
        plantingDate: '',
        expectedHarvestDate: '',
        status: 'growing'
      });
      setIsAddCropDialogOpen(false);
      refetchCrops();
      toast({
        title: "Sucesso",
        description: "Plantação adicionada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao adicionar plantação: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Mutação para adicionar custo
  const addCost = useMutation({
    mutationFn: async (costData: any) => {
      if (!selectedCrop) throw new Error('Nenhuma plantação selecionada');
      
      console.log('Enviando custo:', costData);
      
      // Usar rota funcional que contorna problema do Vite
      const response = await fetch('/working/crop-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cropId: selectedCrop.id,
          description: costData.description,
          amount: parseFloat(costData.amount),
          date: costData.date,
          category: costData.category,
          notes: costData.notes,
          farmId: selectedCrop.farmId,
          createdBy: 10 // Admin user ID
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Erro ao salvar custo');
      }
      
      const result = await response.json();
      console.log('Resposta do servidor:', result);
      return result;
    },
    onSuccess: () => {
      setCostForm({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'seeds',
        notes: ''
      });
      setIsAddCostDialogOpen(false);
      setSelectedCrop(null);
      
      // Invalidar cache dos custos para recarregar
      queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'crop-costs'] });
      
      toast({
        title: "Sucesso",
        description: "Custo adicionado com sucesso",
      });
    },
    onError: (error: any) => {
      console.error('Erro ao adicionar custo:', error);
      toast({
        title: "Erro",
        description: `Erro ao adicionar custo: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Funções auxiliares
  const handleCreateCrop = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cropForm.name || !cropForm.sector || !cropForm.area) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    const cropData = {
      name: cropForm.name,
      sector: cropForm.sector,
      area: parseInt(cropForm.area),
      status: cropForm.status,
      plantingDate: cropForm.plantingDate ? new Date(cropForm.plantingDate) : null,
      expectedHarvestDate: cropForm.expectedHarvestDate ? new Date(cropForm.expectedHarvestDate) : null,
    };
    
    createCrop.mutate(cropData);
  };
  
  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!costForm.description || !costForm.amount || !selectedCrop) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    const costData = {
      cropId: selectedCrop.id,
      description: costForm.description,
      amount: parseFloat(costForm.amount),
      date: new Date(costForm.date),
      category: costForm.category,
      notes: costForm.notes,
      farmId: selectedFarmId,
    };
    
    addCost.mutate(costData);
  };
  
  const getStatusInfo = (status: string) => {
    return CROP_STATUSES.find(s => s.value === status) || CROP_STATUSES[0];
  };
  
  const getCropCosts = (cropId: number) => {
    return cropCosts?.filter(cost => cost.cropId === cropId) || [];
  };
  
  const getTotalCropCost = (cropId: number): number => {
    const costs = getCropCosts(cropId);
    if (!costs || costs.length === 0) return 0;
    
    return costs.reduce((total, cost) => {
      const amount = typeof cost.amount === 'string' ? parseFloat(cost.amount) : cost.amount;
      return total + (isNaN(amount) ? 0 : amount);
    }, 0);
  };
  
  // Filtrar e ordenar plantações
  const getFilteredCrops = () => {
    if (!crops) return [];
    
    return crops.filter(crop => {
      const matchesSearch = !filters.search || 
        crop.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        crop.sector.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || crop.status === filters.status;
      const matchesSector = !filters.sector || crop.sector === filters.sector;
      
      return matchesSearch && matchesStatus && matchesSector;
    });
  };
  
  const getUniqueSectors = () => {
    if (!crops) return [];
    return Array.from(new Set(crops.map(crop => crop.sector)));
  };
  
  if (loadingFarms || !farms) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  const currentFarm = farms.find(farm => farm.id === selectedFarmId);
  const filteredCrops = getFilteredCrops();
  const uniqueSectors = getUniqueSectors();
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Plantações</h1>
          
          {/* Seletor de fazenda */}
          <div className="flex items-center gap-4">
            <Select
              value={selectedFarmId?.toString() || ''}
              onValueChange={(value) => setSelectedFarmId(Number(value))}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Selecionar fazenda" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fazendas</SelectLabel>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.name} - {farm.location}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchCrops()}
              title="Atualizar dados"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Informações da fazenda atual */}
        {currentFarm && (
          <Alert>
            <AlertTitle className="text-md font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {currentFarm.name}
              <Badge variant="outline" className="ml-2">
                {currentFarm.type === 'crop' ? 'Agrícola' : 
                 currentFarm.type === 'livestock' ? 'Pecuária' : 'Mista'}
              </Badge>
            </AlertTitle>
            <AlertDescription className="text-sm flex justify-between items-center mt-1">
              <span>{currentFarm.location} • {currentFarm.size} hectares</span>
              {crops && (
                <span className="text-muted-foreground">
                  {crops.length} plantações registradas
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Barra de ações */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Busca */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar plantações..."
              className="pl-8"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          
          {/* Filtros avançados */}
          <div className="flex items-center gap-2">
            <Collapsible open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros avançados
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
            
            {/* Botão adicionar plantação */}
            {selectedFarmId && (
              <Dialog open={isAddCropDialogOpen} onOpenChange={setIsAddCropDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Plantação
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}
          </div>
        </div>
        
        {/* Filtros avançados - conteúdo colapsível */}
        <Collapsible open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
          <CollapsibleContent className="space-y-2">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="all-status" value="">Todos os status</SelectItem>
                        {CROP_STATUSES.map(status => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Setor</label>
                    <Select value={filters.sector} onValueChange={(value) => setFilters({...filters, sector: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os setores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="all-sectors" value="">Todos os setores</SelectItem>
                        {uniqueSectors.map(sector => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setFilters({search: '', status: '', sector: ''})}
                      className="w-full"
                    >
                      Limpar filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Cards das plantações */}
        {loadingCrops ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredCrops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCrops.map((crop) => {
              const statusInfo = getStatusInfo(crop.status);
              const totalCost = getTotalCropCost(crop.id);
              
              return (
                <Card key={crop.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Leaf className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-lg">{crop.name}</CardTitle>
                      </div>
                      <Badge className={`${statusInfo.color} border-0`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <CardDescription>
                      {crop.sector} | {crop.area}m²
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Informações da plantação */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Área:</span>
                        <div className="font-medium">{crop.area} m²</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Data plantio:</span>
                        <div className="font-medium">
                          {crop.plantingDate ? 
                            new Date(crop.plantingDate).toLocaleDateString('pt-BR') : 
                            'Não informada'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* Custos totais */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium">Custos totais:</span>
                      </div>
                      <div className="font-semibold text-amber-600">
                        Kz {(totalCost || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      </div>
                    </div>
                    
                    {/* Botão de ação */}
                    <div className="pt-2">
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setSelectedCrop(crop);
                          setIsAddCostDialogOpen(true);
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Lançar Custo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Leaf className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {crops?.length ? 'Nenhuma plantação encontrada com os filtros aplicados' : 'Nenhuma plantação cadastrada'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {crops?.length ? 'Ajuste os filtros ou limpe-os para ver todas as plantações' : 'Use o botão "Adicionar Plantação" para começar'}
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Resultados encontrados */}
        {filteredCrops.length > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            {filteredCrops.length} plantações encontradas
          </div>
        )}
      </div>
      
      {/* Modal de adicionar plantação */}
      <Dialog open={isAddCropDialogOpen} onOpenChange={setIsAddCropDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Plantação</DialogTitle>
            <DialogDescription>
              Preencha os dados da nova plantação para a fazenda selecionada
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCrop} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da plantação *</label>
              <Input 
                value={cropForm.name} 
                onChange={(e) => setCropForm({...cropForm, name: e.target.value})}
                placeholder="Ex: Milho, Feijão, etc."
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Setor *</label>
              <Input 
                value={cropForm.sector} 
                onChange={(e) => setCropForm({...cropForm, sector: e.target.value})}
                placeholder="Ex: A1, Setor Norte, etc."
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Área (m²) *</label>
              <Input 
                type="number" 
                value={cropForm.area} 
                onChange={(e) => setCropForm({...cropForm, area: e.target.value})}
                placeholder="Ex: 1000"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de plantio</label>
              <Input 
                type="date" 
                value={cropForm.plantingDate} 
                onChange={(e) => setCropForm({...cropForm, plantingDate: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Data esperada de colheita</label>
              <Input 
                type="date" 
                value={cropForm.expectedHarvestDate} 
                onChange={(e) => setCropForm({...cropForm, expectedHarvestDate: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status inicial</label>
              <Select value={cropForm.status} onValueChange={(value) => setCropForm({...cropForm, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CROP_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Fazenda vinculada */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fazenda vinculada</label>
              <div className="p-2 bg-gray-50 rounded border text-sm">
                {currentFarm?.name} - {currentFarm?.location}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddCropDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createCrop.isPending}>
                {createCrop.isPending ? 'Adicionando...' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Modal de adicionar custo */}
      <Dialog open={isAddCostDialogOpen} onOpenChange={setIsAddCostDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Lançar Custo para Plantação</DialogTitle>
            <DialogDescription>
              {selectedCrop && `Adicionar custo para: ${selectedCrop.name} (${selectedCrop.sector})`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCost} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do custo *</label>
              <Input 
                value={costForm.description} 
                onChange={(e) => setCostForm({...costForm, description: e.target.value})}
                placeholder="Ex: Adubo, Sementes, etc."
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor (Kz) *</label>
              <Input 
                type="number" 
                step="0.01"
                value={costForm.amount} 
                onChange={(e) => setCostForm({...costForm, amount: e.target.value})}
                placeholder="Ex: 100000"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Data *</label>
              <Input 
                type="date" 
                value={costForm.date} 
                onChange={(e) => setCostForm({...costForm, date: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={costForm.category} onValueChange={(value) => setCostForm({...costForm, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="seeds" value="seeds">Sementes</SelectItem>
                  <SelectItem key="fertilizer" value="fertilizer">Fertilizantes</SelectItem>
                  <SelectItem key="pesticides" value="pesticides">Pesticidas</SelectItem>
                  <SelectItem key="labor" value="labor">Mão de obra</SelectItem>
                  <SelectItem key="equipment" value="equipment">Equipamentos</SelectItem>
                  <SelectItem key="other" value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Observação</label>
              <Input 
                value={costForm.notes} 
                onChange={(e) => setCostForm({...costForm, notes: e.target.value})}
                placeholder="Observações opcionais..."
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddCostDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addCost.isPending}>
                {addCost.isPending ? 'Adicionando...' : 'Adicionar Custo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      

    </DashboardLayout>
  );
}