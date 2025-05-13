import React, { useState } from 'react';
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
import { Loader2, Leaf } from 'lucide-react';

// Tipos básicos para o plantação
interface Crop {
  id: number;
  name: string;
  sector: string;
  area: number;
  farmId: number;
  status: string;
  createdAt: string;
}

export default function CropsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Estados para o formulário básico
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [area, setArea] = useState<number>(0);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  
  // Carregar fazendas
  const { data: farms } = useQuery({
    queryKey: ['/api/farms'],
  });
  
  // Usar a primeira fazenda por padrão
  React.useEffect(() => {
    if (farms && farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);
  
  // Carregar plantações da fazenda selecionada
  const { data: crops, isLoading } = useQuery<Crop[]>({
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
      queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'crops'] });
      
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
  
  if (!farms || !selectedFarmId) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-medium mb-6">Plantações</h1>
      
      {/* Formulário simples */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Adicionar Nova Plantação</CardTitle>
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
      
      {/* Tabela simples */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Plantações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : crops && crops.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Área (m²)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crops.map((crop) => (
                    <TableRow key={crop.id}>
                      <TableCell className="font-medium">{crop.name}</TableCell>
                      <TableCell>{crop.sector}</TableCell>
                      <TableCell>{crop.area}</TableCell>
                      <TableCell>{crop.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Leaf className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma plantação cadastrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}