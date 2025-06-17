import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Leaf, 
  Filter, 
  RefreshCw,
  ArrowDown,
  ArrowUp,
  Calendar,
  Search,
  X,
  Edit,
  Info,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
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
  Badge
} from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Tipos básicos para o plantação
interface Crop {
  id: number;
  name: string;
  sector: string;
  area: number;
  farmId: number;
  status: string;
  createdAt: string;
  plantingDate?: string;
  expectedHarvestDate?: string;
}

// Interface para fazendas
interface Farm {
  id: number;
  name: string;
  location: string;
  size: number;
  type: string;
}

// Tipo para filtros de busca
interface FilterOptions {
  search: string;
  status: string | null;
  sector: string | null;
}

// Status possíveis para uma plantação
const CROP_STATUSES = [
  { value: "growing", label: "Em Crescimento", color: "bg-green-100 text-green-800" },
  { value: "harvested", label: "Colhido", color: "bg-amber-100 text-amber-800" },
  { value: "waiting", label: "Aguardando", color: "bg-blue-100 text-blue-800" },
  { value: "finished", label: "Finalizada", color: "bg-purple-100 text-purple-800" }
];

export default function CropsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Estados para o formulário básico
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [area, setArea] = useState<number>(0);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  
  // Estado para os filtros
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: null,
    sector: null
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
      console.log("Crops fetched:", result);
      return result;
    },
    enabled: !!selectedFarmId,
  });
  
  // Mutação para criar plantação
  const createCrop = useMutation({
    mutationFn: async (cropData: any) => {
      if (!selectedFarmId) throw new Error(t('crops.noFarmSelected'));
      
      return await apiRequest(
        `/api/farms/${selectedFarmId}/crops`,
        {
          method: 'POST',
          data: cropData
        }
      );
    },
    onSuccess: () => {
      // Limpar formulário e atualizar dados
      setName('');
      setSector('');
      setArea(0);
      
      // Atualizar a lista de plantações
      refetchCrops();
      
      // Mostrar mensagem de sucesso
      toast({
        title: t('crops.success'),
        description: t('crops.cropAddedSuccess'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('crops.error'),
        description: t('crops.couldNotAdd') + error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutação para atualizar uma plantação
  const updateCrop = useMutation({
    mutationFn: async ({ cropId, data }: { cropId: number, data: any }) => {
      if (!selectedFarmId) throw new Error(t('crops.noFarmSelected'));
      
      return await apiRequest(
        `/api/farms/${selectedFarmId}/crops/${cropId}`,
        {
          method: 'PATCH',
          data
        }
      );
    },
    onSuccess: () => {
      // Atualizar a lista de plantações
      refetchCrops();
      
      // Mostrar mensagem de sucesso
      toast({
        title: t('crops.success'),
        description: t('crops.cropUpdatedSuccess'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('crops.error'),
        description: t('crops.couldNotUpdate') + error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !sector || area <= 0) {
      toast({
        title: t('crops.error'),
        description: t('crops.fillAllFields'),
        variant: "destructive",
      });
      return;
    }
    
    // Garantir que area seja um número, mesmo que venha de um input
    const areaValue = Number(area);
    
    const cropData = {
      name,
      sector,
      area: areaValue,
      status: "growing",
      farmId: selectedFarmId
    };
    
    createCrop.mutate(cropData);
  };
  
  // Função para trocar a fazenda selecionada
  const handleFarmChange = (farmId: string) => {
    setSelectedFarmId(Number(farmId));
  };
  
  // Função para abrir a visualização detalhada de uma plantação
  const handleCropClick = (crop: Crop) => {
    setSelectedCrop(crop);
  };
  
  // Função para atualizar o status de uma plantação
  const handleStatusChange = (newStatus: string) => {
    if (!selectedCrop) return;
    
    updateCrop.mutate({
      cropId: selectedCrop.id,
      data: { status: newStatus }
    });
    
    // Atualizar o estado local para mostrar a mudança imediatamente
    setSelectedCrop({
      ...selectedCrop,
      status: newStatus
    });
  };
  
  // Função de busca e filtragem
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      search: e.target.value
    });
  };
  
  const handleStatusFilterChange = (value: string) => {
    setFilters({
      ...filters,
      status: value === "all" ? null : value
    });
  };
  
  const handleSectorFilterChange = (value: string) => {
    setFilters({
      ...filters,
      sector: value === "all" ? null : value
    });
  };
  
  const clearFilters = () => {
    setFilters({
      search: '',
      status: null,
      sector: null
    });
  };
  
  // Função para ordenar a lista de plantações
  const getSortedAndFilteredCrops = () => {
    // Verificação de segurança para o crops
    if (!crops || !Array.isArray(crops) || crops.length === 0) {
      console.log("Crops data is empty or not an array:", crops);
      return [];
    }
    
    console.log("Original crops array:", crops);
    
    // Primeiro filtrar
    let filtered = [...crops];
    
    // Filtrar por texto de busca
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(crop => 
        crop.name.toLowerCase().includes(searchTerm) || 
        crop.sector.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filtrar por status
    if (filters.status) {
      filtered = filtered.filter(crop => crop.status === filters.status);
    }
    
    // Filtrar por setor
    if (filters.sector) {
      filtered = filtered.filter(crop => crop.sector === filters.sector);
    }
    
    // Depois ordenar
    return filtered.sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === 'sector') {
        return sortDirection === 'asc'
          ? a.sector.localeCompare(b.sector)
          : b.sector.localeCompare(a.sector);
      } else if (sortField === 'area') {
        return sortDirection === 'asc'
          ? a.area - b.area
          : b.area - a.area;
      }
      return 0;
    });
  };
  
  // Função para alternar o sentido da ordenação
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Extrair setores únicos para filtro
  const getUniqueSectors = () => {
    if (!crops) return [];
    const sectors = new Set(crops.map(crop => crop.sector));
    return Array.from(sectors);
  };
  
  if (loadingFarms || !farms) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }
  
  const filteredAndSortedCrops = getSortedAndFilteredCrops();
  const currentFarm = farms.find(farm => farm.id === selectedFarmId);
  const uniqueSectors = getUniqueSectors();
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium">{t('crops.title')}</h1>
        
        {/* Seletor de fazenda */}
        <div className="flex items-center gap-4">
          <Select
            value={selectedFarmId?.toString() || ''}
            onValueChange={handleFarmChange}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder={t('crops.selectFarm')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t('crops.farms')}</SelectLabel>
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
            title={t('crops.refreshData')}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Informações sobre a fazenda atual */}
      {currentFarm && (
        <Alert className="mb-6">
          <AlertTitle className="text-md font-semibold">
            {currentFarm.name}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({currentFarm.type === 'crop' ? t('crops.agricultural') : 
                currentFarm.type === 'livestock' ? t('crops.livestock') : t('crops.mixed')})
            </span>
          </AlertTitle>
          <AlertDescription className="text-sm flex justify-between items-center">
            <span>{currentFarm.location} • {currentFarm.size} hectares</span>
            {crops && (
              <span className="text-muted-foreground">
                {crops.length} {t('crops.cropsRegistered')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Formulário simples */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('crops.addNewCrop')}</CardTitle>
          <CardDescription>
            {t('crops.addNewCropDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('crops.cropName')}</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder={t('crops.cropNamePlaceholder')}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('crops.sector')}</label>
              <Input 
                value={sector} 
                onChange={(e) => setSector(e.target.value)}
                placeholder={t('crops.sectorPlaceholder')}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('crops.area')}</label>
              <Input 
                type="number" 
                value={area === 0 ? '' : area} 
                onChange={(e) => setArea(Number(e.target.value))}
                placeholder={t('crops.areaPlaceholder')}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={createCrop.isPending}
            >
              {createCrop.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('crops.processing')}
                </>
              ) : (
                t('crops.addCrop')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Filtros avançados */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{t('crops.filters')}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              disabled={!filters.search && !filters.status && !filters.sector}
            >
              <X className="h-4 w-4 mr-1" /> {t('crops.clear')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">{t('crops.search')}</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('crops.searchPlaceholder')}
                  className="pl-8"
                  value={filters.search}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            <div className="w-full md:w-[180px]">
              <label className="text-sm font-medium mb-2 block">{t('crops.status')}</label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) => handleStatusFilterChange(value === "" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('crops.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('crops.all')}</SelectItem>
                  {CROP_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-[180px]">
              <label className="text-sm font-medium mb-2 block">{t('crops.sector')}</label>
              <Select
                value={filters.sector || ""}
                onValueChange={(value) => handleSectorFilterChange(value === "" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('crops.allSectors')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('crops.all')}</SelectItem>
                  {uniqueSectors.map(sector => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Contador de resultados */}
          <div className="mt-4 text-sm text-muted-foreground">
            {filteredAndSortedCrops.length} {t('crops.resultsFound')}
          </div>
        </CardContent>
      </Card>
      
      {/* Tabela de plantações */}
      <Card>
        <CardHeader>
          <CardTitle>{t('crops.cropsList')}</CardTitle>
          <CardDescription>
            {t('crops.showingCropsFor')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCrops ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAndSortedCrops.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('name')}>
                      <div className="flex items-center gap-1">
                        Nome
                        {sortField === 'name' && (
                          sortDirection === 'asc' ? 
                          <ArrowUp className="h-3 w-3" /> : 
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('sector')}>
                      <div className="flex items-center gap-1">
                        Setor
                        {sortField === 'sector' && (
                          sortDirection === 'asc' ? 
                          <ArrowUp className="h-3 w-3" /> : 
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort('area')}>
                      <div className="flex items-center gap-1">
                        Área (m²)
                        {sortField === 'area' && (
                          sortDirection === 'asc' ? 
                          <ArrowUp className="h-3 w-3" /> : 
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedCrops.map((crop) => {
                    const statusInfo = CROP_STATUSES.find(s => s.value === crop.status) || CROP_STATUSES[0];
                    return (
                      <TableRow key={crop.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleCropClick(crop)}>
                        <TableCell className="font-medium">{crop.name}</TableCell>
                        <TableCell>{crop.sector}</TableCell>
                        <TableCell>{crop.area}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Ver detalhes"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCropClick(crop);
                            }}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Leaf className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('crops.noCropsCurrentFilters')}</p>
              <p className="text-sm text-gray-400 mt-1">
                {crops?.length ? t('crops.adjustFilters') : t('crops.useFormAbove')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Detalhes da plantação (Dialog) */}
      {selectedCrop && (
        <Dialog open={!!selectedCrop} onOpenChange={(open) => !open && setSelectedCrop(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('crops.cropDetails')}</DialogTitle>
              <DialogDescription>
                {t('crops.viewEditSelected')}
              </DialogDescription>
            </DialogHeader>
              
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">{t('crops.details')}</TabsTrigger>
                <TabsTrigger value="status">{t('crops.status')}</TabsTrigger>
              </TabsList>
                
              <TabsContent value="details" className="space-y-6 py-4">
                <div className="grid gap-4">
                  <div>
                    <h3 className="text-md font-semibold">{selectedCrop.name}</h3>
                    <p className="text-sm text-muted-foreground">{t('crops.cropId')}{selectedCrop.id}</p>
                  </div>
                    
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-1">{t('crops.sector')}</div>
                      <div className="text-sm">{selectedCrop.sector}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('crops.area')}</div>
                      <div className="text-sm">{selectedCrop.area} m²</div>
                    </div>
                  </div>
                    
                  <div>
                    <div className="text-sm font-medium mb-1">{t('crops.currentStatus')}</div>
                    <div>
                      {(() => {
                        const statusInfo = CROP_STATUSES.find(s => s.value === selectedCrop.status) || CROP_STATUSES[0];
                        return (
                          <Badge className={`${statusInfo.color} border-0`}>{statusInfo.label}</Badge>
                        );
                      })()}
                    </div>
                  </div>
                    
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-1">{t('crops.creationDate')}</div>
                      <div className="text-sm">
                        {new Date(selectedCrop.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">{t('crops.plantingDate')}</div>
                      <div className="text-sm">
                        {selectedCrop.plantingDate ? 
                          new Date(selectedCrop.plantingDate).toLocaleDateString('pt-BR') : 
                          t('crops.notSpecified')}
                      </div>
                    </div>
                  </div>
                    
                  <div>
                    <div className="text-sm font-medium mb-1">{t('crops.expectedHarvestDate')}</div>
                    <div className="text-sm">
                      {selectedCrop.expectedHarvestDate ? 
                        new Date(selectedCrop.expectedHarvestDate).toLocaleDateString('pt-BR') : 
                        t('crops.notSpecified')}
                    </div>
                  </div>
                </div>
              </TabsContent>
                
              <TabsContent value="status" className="space-y-6 py-4">
                <div className="space-y-4">
                  <div className="text-sm font-medium mb-1">{t('crops.currentStatus')}</div>
                  <div>
                    {(() => {
                      const statusInfo = CROP_STATUSES.find(s => s.value === selectedCrop.status) || CROP_STATUSES[0];
                      return (
                        <Badge className={`${statusInfo.color} border-0`}>{statusInfo.label}</Badge>
                      );
                    })()}
                  </div>
                    
                  <div className="text-sm font-medium mb-1">{t('crops.updateStatus')}</div>
                  <div className="grid grid-cols-2 gap-3">
                    {CROP_STATUSES.filter(s => s.value !== selectedCrop.status).map(status => (
                      <Button 
                        key={status.value}
                        variant="outline"
                        className={`justify-start ${status.color.replace('bg-', 'hover:bg-')}`}
                        disabled={updateCrop.isPending}
                        onClick={() => handleStatusChange(status.value)}
                      >
                        {status.value === 'growing' && <AlertCircle className="h-4 w-4 mr-2" />}
                        {status.value === 'harvested' && <CheckCircle2 className="h-4 w-4 mr-2" />}
                        {status.value === 'waiting' && <Loader2 className="h-4 w-4 mr-2" />}
                        {status.value === 'finished' && <CheckCircle2 className="h-4 w-4 mr-2" />}
                        {status.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
              
            <DialogFooter className="mt-6">
              <Button 
                variant="outline" 
                onClick={() => setSelectedCrop(null)}
              >
                {t('crops.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}