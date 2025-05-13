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
    enabled: !!selectedFarmId,
  });
  
  // Mutação para criar plantação
  const createCrop = useMutation({
    mutationFn: async (cropData: any) => {
      if (!selectedFarmId) throw new Error("Nenhuma fazenda selecionada");
      
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
        title: "Sucesso",
        description: "Plantação adicionada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a plantação: " + error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !sector || area <= 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos do formulário",
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
      // Remove plantingDate por enquanto para simplificar
    };
    
    createCrop.mutate(cropData);
  };
  
  // Função para trocar a fazenda selecionada
  const handleFarmChange = (farmId: string) => {
    setSelectedFarmId(Number(farmId));
  };
  
  // Função para ordenar a lista de plantações
  const getSortedCrops = () => {
    if (!crops) return [];
    
    return [...crops].sort((a, b) => {
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
  
  if (loadingFarms || !farms) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }
  
  const sortedCrops = getSortedCrops();
  const currentFarm = farms.find(farm => farm.id === selectedFarmId);
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium">Plantações</h1>
        
        {/* Seletor de fazenda */}
        <div className="flex items-center gap-4">
          <Select
            value={selectedFarmId?.toString() || ''}
            onValueChange={handleFarmChange}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecione uma fazenda" />
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
      
      {/* Informações sobre a fazenda atual */}
      {currentFarm && (
        <Alert className="mb-6">
          <AlertTitle className="text-md font-semibold">
            {currentFarm.name}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({currentFarm.type === 'crop' ? 'Agrícola' : 
                currentFarm.type === 'livestock' ? 'Pecuária' : 'Mista'})
            </span>
          </AlertTitle>
          <AlertDescription className="text-sm flex justify-between items-center">
            <span>{currentFarm.location} • {currentFarm.size} hectares</span>
            {crops && (
              <span className="text-muted-foreground">
                {crops.length} plantações cadastradas
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Formulário simples */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Adicionar Nova Plantação</CardTitle>
          <CardDescription>
            Preencha os campos abaixo para adicionar uma nova plantação à fazenda selecionada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Plantação</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Milho, Feijão, etc."
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Setor</label>
              <Input 
                value={sector} 
                onChange={(e) => setSector(e.target.value)}
                placeholder="Ex: Setor A, Campo Norte, etc."
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Área (m²)</label>
              <Input 
                type="number" 
                value={area === 0 ? '' : area} 
                onChange={(e) => setArea(Number(e.target.value))}
                placeholder="Área em metros quadrados"
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
                  Processando...
                </>
              ) : (
                'Adicionar Plantação'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Tabela de plantações */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Plantações</CardTitle>
          <CardDescription>
            Mostrando plantações para a fazenda selecionada. Clique nos títulos das colunas para ordenar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCrops ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedCrops.length > 0 ? (
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCrops.map((crop) => (
                    <TableRow key={crop.id}>
                      <TableCell className="font-medium">{crop.name}</TableCell>
                      <TableCell>{crop.sector}</TableCell>
                      <TableCell>{crop.area}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs 
                          ${crop.status === 'growing' ? 'bg-green-100 text-green-800' : 
                            crop.status === 'harvested' ? 'bg-amber-100 text-amber-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {crop.status === 'growing' ? 'Em Crescimento' : 
                           crop.status === 'harvested' ? 'Colhido' : 'Preparado'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Leaf className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma plantação cadastrada para esta fazenda</p>
              <p className="text-sm text-gray-400 mt-1">
                Utilize o formulário acima para adicionar uma nova plantação
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}