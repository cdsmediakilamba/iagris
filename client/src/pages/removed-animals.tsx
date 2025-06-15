import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Search, Filter, Eye, ArrowLeft, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLanguage } from '@/context/LanguageContext';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

// Tipos para animais removidos
interface RemovedAnimal {
  id: number;
  originalAnimalId: number;
  registrationCode: string;
  name: string | null;
  speciesId: number;
  breed: string;
  gender: string;
  birthDate: string | null;
  weight: string | null;
  farmId: number;
  originalStatus: string;
  originalObservations: string | null;
  fatherId: number | null;
  motherId: number | null;
  lastVaccineDate: string | null;
  originalCreatedAt: string;
  removalReason: string;
  removalDate: string;
  removalObservations: string | null;
  removedBy: number;
  salePrice: string | null;
  buyer: string | null;
  transferDestination: string | null;
  createdAt: string;
}

interface Species {
  id: number;
  name: string;
  abbreviation: string;
}

interface Farm {
  id: number;
  name: string;
  location: string;
}

export default function RemovedAnimals() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [selectedReason, setSelectedReason] = useState<string>('all');
  const [selectedAnimal, setSelectedAnimal] = useState<RemovedAnimal | null>(null);

  // Buscar fazendas
  const { data: farms = [] } = useQuery<Farm[]>({
    queryKey: ['/api/farms'],
    enabled: !!user
  });

  // Buscar espécies
  const { data: species = [] } = useQuery<Species[]>({
    queryKey: ['/api/species'],
    enabled: !!user
  });

  // Buscar animais removidos
  const { data: removedAnimals = [], isLoading } = useQuery<RemovedAnimal[]>({
    queryKey: ['/api/removed-animals'],
    enabled: !!user
  });

  // Filtrar animais removidos
  const filteredAnimals = removedAnimals.filter(animal => {
    const matchesSearch = 
      animal.registrationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (animal.name && animal.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      animal.breed.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFarm = selectedFarm === 'all' || animal.farmId.toString() === selectedFarm;
    const matchesReason = selectedReason === 'all' || animal.removalReason === selectedReason;
    
    return matchesSearch && matchesFarm && matchesReason;
  });

  // Função para obter nome da espécie
  const getSpeciesName = (speciesId: number) => {
    const animalSpecies = species.find(s => s.id === speciesId);
    return animalSpecies ? animalSpecies.name : 'Desconhecida';
  };

  // Função para obter nome da fazenda
  const getFarmName = (farmId: number) => {
    const farm = farms.find(f => f.id === farmId);
    return farm ? farm.name : 'Fazenda Desconhecida';
  };

  // Função para obter texto do motivo de remoção
  const getRemovalReasonText = (reason: string) => {
    const reasons: { [key: string]: string } = {
      'sold': 'Vendido',
      'died': 'Morreu',
      'lost': 'Perdido',
      'transferred': 'Transferido',
      'slaughtered': 'Abatido',
      'other': 'Outro'
    };
    return reasons[reason] || reason;
  };

  // Função para obter cor do badge do motivo
  const getRemovalReasonColor = (reason: string) => {
    const colors: { [key: string]: string } = {
      'sold': 'bg-green-100 text-green-800',
      'died': 'bg-red-100 text-red-800',
      'lost': 'bg-yellow-100 text-yellow-800',
      'transferred': 'bg-blue-100 text-blue-800',
      'slaughtered': 'bg-purple-100 text-purple-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[reason] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando animais removidos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/animals-new">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Animais
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Animais Removidos</h1>
            <p className="text-gray-600">
              Histórico completo de animais removidos do sistema
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Removidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{removedAnimals.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {removedAnimals.filter(a => a.removalReason === 'sold').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Mortes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {removedAnimals.filter(a => a.removalReason === 'died').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Transferidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {removedAnimals.filter(a => a.removalReason === 'transferred').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar por código, nome ou raça..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedFarm} onValueChange={setSelectedFarm}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por fazenda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fazendas</SelectItem>
                {farms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id.toString()}>
                    {farm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os motivos</SelectItem>
                <SelectItem value="sold">Vendido</SelectItem>
                <SelectItem value="died">Morreu</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
                <SelectItem value="transferred">Transferido</SelectItem>
                <SelectItem value="slaughtered">Abatido</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedFarm('all');
                setSelectedReason('all');
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Animais Removidos */}
      <Card>
        <CardHeader>
          <CardTitle>Animais Removidos ({filteredAnimals.length})</CardTitle>
          <CardDescription>
            Lista completa de animais removidos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Espécie</TableHead>
                  <TableHead>Raça</TableHead>
                  <TableHead>Fazenda</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Data Remoção</TableHead>
                  <TableHead>Valor Venda</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnimals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Nenhum animal removido encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAnimals.map((animal) => (
                    <TableRow key={animal.id}>
                      <TableCell className="font-medium">
                        {animal.registrationCode}
                      </TableCell>
                      <TableCell>
                        {animal.name || '-'}
                      </TableCell>
                      <TableCell>
                        {getSpeciesName(animal.speciesId)}
                      </TableCell>
                      <TableCell>{animal.breed}</TableCell>
                      <TableCell>{getFarmName(animal.farmId)}</TableCell>
                      <TableCell>
                        <Badge className={getRemovalReasonColor(animal.removalReason)}>
                          {getRemovalReasonText(animal.removalReason)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(animal.removalDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {animal.salePrice ? 
                          `AOA ${parseFloat(animal.salePrice).toLocaleString('pt-AO')}` : 
                          '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedAnimal(animal)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                Detalhes do Animal Removido - {animal.registrationCode}
                              </DialogTitle>
                              <DialogDescription>
                                Informações completas sobre o animal removido
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedAnimal && (
                              <div className="space-y-6">
                                {/* Informações Básicas */}
                                <div>
                                  <h3 className="font-semibold mb-3">Informações Básicas</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <strong>Código:</strong> {selectedAnimal.registrationCode}
                                    </div>
                                    <div>
                                      <strong>Nome:</strong> {selectedAnimal.name || 'Sem nome'}
                                    </div>
                                    <div>
                                      <strong>Espécie:</strong> {getSpeciesName(selectedAnimal.speciesId)}
                                    </div>
                                    <div>
                                      <strong>Raça:</strong> {selectedAnimal.breed}
                                    </div>
                                    <div>
                                      <strong>Gênero:</strong> {selectedAnimal.gender}
                                    </div>
                                    <div>
                                      <strong>Peso:</strong> {selectedAnimal.weight ? `${selectedAnimal.weight} kg` : 'N/A'}
                                    </div>
                                    <div>
                                      <strong>Data Nascimento:</strong> {
                                        selectedAnimal.birthDate ? 
                                        format(new Date(selectedAnimal.birthDate), 'dd/MM/yyyy', { locale: ptBR }) : 
                                        'N/A'
                                      }
                                    </div>
                                    <div>
                                      <strong>Status Original:</strong> {selectedAnimal.originalStatus}
                                    </div>
                                  </div>
                                </div>

                                {/* Informações da Remoção */}
                                <div>
                                  <h3 className="font-semibold mb-3">Informações da Remoção</h3>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <strong>Motivo:</strong> 
                                      <Badge className={`ml-2 ${getRemovalReasonColor(selectedAnimal.removalReason)}`}>
                                        {getRemovalReasonText(selectedAnimal.removalReason)}
                                      </Badge>
                                    </div>
                                    <div>
                                      <strong>Data Remoção:</strong> {
                                        format(new Date(selectedAnimal.removalDate), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                                      }
                                    </div>
                                    {selectedAnimal.salePrice && (
                                      <div>
                                        <strong>Valor da Venda:</strong> AOA {parseFloat(selectedAnimal.salePrice).toLocaleString('pt-AO')}
                                      </div>
                                    )}
                                    {selectedAnimal.buyer && (
                                      <div>
                                        <strong>Comprador:</strong> {selectedAnimal.buyer}
                                      </div>
                                    )}
                                    {selectedAnimal.transferDestination && (
                                      <div>
                                        <strong>Destino Transferência:</strong> {selectedAnimal.transferDestination}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {selectedAnimal.removalObservations && (
                                    <div className="mt-4">
                                      <strong>Observações:</strong>
                                      <p className="mt-1 text-gray-600">{selectedAnimal.removalObservations}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Observações Originais */}
                                {selectedAnimal.originalObservations && (
                                  <div>
                                    <h3 className="font-semibold mb-3">Observações Originais</h3>
                                    <p className="text-sm text-gray-600">{selectedAnimal.originalObservations}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}