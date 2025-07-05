import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertAnimalSchema, Animal, Species } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/i18n';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  FormDescription,
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CalendarComponent from '@/components/calendar/CalendarComponent';
import { HelpCircle, MoreVertical, Loader2, Plus, Search, ChevronLeft, ChevronRight, Edit, Trash2, Eye, Archive, Calendar, PawPrint, Settings } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';

// Base form schema
const animalFormSchema = z.object({
  name: z.string().optional(),
  speciesId: z.coerce.number({
    required_error: "Espécie é obrigatória",
    invalid_type_error: "Espécie deve ser um número"
  }),
  breed: z.string().min(1, "Raça é obrigatória"),
  gender: z.string().min(1, "Gênero é obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  weight: z.coerce.number({
    required_error: "Peso é obrigatório",
    invalid_type_error: "Peso deve ser um número"
  }),
  status: z.string().default("healthy"),
  motherInfo: z.string().optional(),
  fatherInfo: z.string().optional(),
  lastVaccineDate: z.string().optional(),
  observations: z.string().optional()
});

type AnimalFormValues = z.infer<typeof animalFormSchema>;

// Column configuration
type ColumnKey = 'registrationCode' | 'name' | 'species' | 'breed' | 'gender' | 'birthDate' | 'weight' | 'healthStatus';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  accessor: (animal: Animal, speciesList: Species[]) => React.ReactNode;
}

// Default visible columns
const DEFAULT_VISIBLE_COLUMNS: ColumnKey[] = ['registrationCode', 'name', 'species', 'breed', 'gender', 'birthDate', 'weight', 'healthStatus'];

// Local storage key for column preferences
const COLUMN_PREFERENCES_KEY = 'animal-table-columns';

export default function NewAnimalsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [animalToEdit, setAnimalToEdit] = useState<Animal | null>(null);
  const [animalToDelete, setAnimalToDelete] = useState<Animal | null>(null);
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    species: 'all',
    status: 'all',
    gender: 'all',
    searchTerm: '',
  });

  // Estado para gerenciar colunas visíveis
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => {
    try {
      const saved = localStorage.getItem(COLUMN_PREFERENCES_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_VISIBLE_COLUMNS;
    } catch {
      return DEFAULT_VISIBLE_COLUMNS;
    }
  });

  // Load farms
  const { data: farms = [] } = useQuery({
    queryKey: ['/api/farms'],
  });

  // Ensure a farm is selected if available
  useEffect(() => {
    if (farms && farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  // Load animals for the selected farm
  const { data: animals = [], isLoading: isLoadingAnimals } = useQuery({
    queryKey: [`/api/farms/${selectedFarmId}/animals`],
    enabled: !!selectedFarmId,
  });

  // Load species
  const { data: speciesList = [], isLoading: isLoadingSpecies } = useQuery({
    queryKey: ['/api/species'],
  });

  // Filter animals based on filters and search term
  const filteredAnimals = React.useMemo(() => {
    if (!animals) return [];
    
    return animals.filter(animal => {
      // Aplicar filtros
      if (filters.species && filters.species !== 'all') {
        // Make sure we're comparing numbers to numbers or strings to strings
        const animalSpeciesId = animal.speciesId.toString();
        const filterSpeciesId = filters.species.toString();
        
        if (animalSpeciesId !== filterSpeciesId) {
          return false;
        }
      }
      
      if (filters.status && filters.status !== 'all' && animal.status !== filters.status) {
        return false;
      }
      
      if (filters.gender && filters.gender !== 'all') {
        // Check if gender matches, handling possible format differences
        const animalGender = animal.gender.toLowerCase();
        const filterGender = filters.gender.toLowerCase();
        
        // Map Portuguese gender terms to match the filter values
        const genderMap: Record<string, string> = {
          'macho': 'male',
          'fêmea': 'female',
          'femea': 'female'
        };
        
        const normalizedAnimalGender = genderMap[animalGender] || animalGender;
        
        if (normalizedAnimalGender !== filterGender) {
          return false;
        }
      }
      
      // Aplicar termo de busca se houver
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        return (
          (animal.name && animal.name.toLowerCase().includes(search)) ||
          (animal.registrationCode && animal.registrationCode.toLowerCase().includes(search)) ||
          (animal.breed && animal.breed.toLowerCase().includes(search))
        );
      }
      
      return true;
    });
  }, [animals, filters]);

  // Setup form
  const form = useForm<AnimalFormValues>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      name: '',
      speciesId: undefined,
      breed: '',
      gender: '',
      birthDate: '',
      weight: undefined,
      status: 'healthy',
      motherInfo: '',
      fatherInfo: '',
      lastVaccineDate: '',
      observations: '',
    },
  });

  // Setup edit form
  const editForm = useForm<AnimalFormValues>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      name: '',
      speciesId: undefined,
      breed: '',
      gender: '',
      birthDate: '',
      weight: undefined,
      status: 'healthy',
      motherInfo: '',
      fatherInfo: '',
      lastVaccineDate: '',
      observations: '',
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      form.reset();
    }
  }, [dialogOpen, form]);

  // Reset edit form when edit dialog closes
  useEffect(() => {
    if (!editDialogOpen) {
      editForm.reset();
      setAnimalToEdit(null);
    }
  }, [editDialogOpen, editForm]);

  // Process form data before sending to API
  const processFormData = (data: AnimalFormValues) => {
    // Create a new observations field that includes parent info
    let observationsText = data.observations || '';
    
    if (data.motherInfo) {
      observationsText = `Mãe: ${data.motherInfo}\n${observationsText}`;
    }
    
    if (data.fatherInfo) {
      observationsText = `Pai: ${data.fatherInfo}\n${observationsText}`;
    }
    
    // Format dates properly for API, com tratamento de erros
    let formattedBirthDate = null;
    let formattedLastVaccineDate = null;
    
    try {
      if (data.birthDate) {
        const birthDate = new Date(data.birthDate);
        if (!isNaN(birthDate.getTime())) {
          formattedBirthDate = birthDate.toISOString();
        } else {
          console.error("Data de nascimento inválida:", data.birthDate);
        }
      }
    } catch (error) {
      console.error("Erro ao processar data de nascimento:", error);
    }
    
    try {
      if (data.lastVaccineDate) {
        const vaccineDate = new Date(data.lastVaccineDate);
        if (!isNaN(vaccineDate.getTime())) {
          formattedLastVaccineDate = vaccineDate.toISOString();
        } else {
          console.error("Data de vacinação inválida:", data.lastVaccineDate);
        }
      }
    } catch (error) {
      console.error("Erro ao processar data de vacinação:", error);
    }
    
    // Garantir que speciesId seja um número
    let speciesId: number;
    try {
      speciesId = typeof data.speciesId === 'string' 
        ? parseInt(data.speciesId) 
        : Number(data.speciesId);
      
      if (isNaN(speciesId)) {
        console.error("ID de espécie inválido:", data.speciesId);
        throw new Error("ID de espécie inválido");
      }
    } catch (error) {
      console.error("Erro ao processar ID de espécie:", error);
      throw new Error("Espécie inválida ou não selecionada");
    }
    
    // Ensure weight is a proper string with decimal places
    const formattedWeight = data.weight ? data.weight.toString() : null;
    
    // Return processed data for API
    return {
      name: data.name || null,
      speciesId: speciesId,
      breed: data.breed,
      gender: data.gender,
      birthDate: formattedBirthDate,
      weight: formattedWeight,
      status: data.status,
      observations: observationsText.trim() || null,
      lastVaccineDate: formattedLastVaccineDate,
      // These will be extracted from observations on the server
      motherId: null,
      fatherId: null,
    };
  };

  // Função para alternar visibilidade de uma coluna
  const toggleColumn = (columnKey: ColumnKey) => {
    setVisibleColumns(prev => {
      const newColumns = prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey];
      
      // Salvar no localStorage
      localStorage.setItem(COLUMN_PREFERENCES_KEY, JSON.stringify(newColumns));
      return newColumns;
    });
  };

  // Configuração das colunas
  const columnConfig: ColumnConfig[] = [
    {
      key: 'registrationCode',
      label: t('animals.registrationCode'),
      accessor: (animal) => animal.registrationCode
    },
    {
      key: 'name',
      label: t('common.name'),
      accessor: (animal) => animal.name || '-'
    },
    {
      key: 'species',
      label: t('animals.species'),
      accessor: (animal, speciesList) => {
        const species = speciesList.find(s => s.id === animal.speciesId);
        return species ? (t(`animals.speciesTypes.${species.name}`) || species.name) : '-';
      }
    },
    {
      key: 'breed',
      label: t('animals.breed'),
      accessor: (animal) => animal.breed
    },
    {
      key: 'gender',
      label: t('animals.gender'),
      accessor: (animal) => 
        animal.gender === 'male' 
          ? t('animals.genders.male') 
          : t('animals.genders.female')
    },
    {
      key: 'birthDate',
      label: t('animals.birthDate'),
      accessor: (animal) => 
        animal.birthDate 
          ? formatDate(new Date(animal.birthDate), 'dd/MM/yyyy', language) 
          : '-'
    },
    {
      key: 'weight',
      label: t('animals.weight'),
      accessor: (animal) => animal.weight ? `${animal.weight} kg` : '-'
    },
    {
      key: 'healthStatus',
      label: t('animals.healthStatus'),
      accessor: (animal) => (
        <Badge
          variant={animal.status === 'healthy' ? 'default' : 
                  animal.status === 'sick' || animal.status === 'quarantine' ? 'destructive' : 
                  animal.status === 'pregnant' || animal.status === 'lactating' ? 'secondary' : 
                  'outline'}
        >
          {t(`animals.statuses.${animal.status}`)}
        </Badge>
      )
    }
  ];

  // Populate edit form when an animal is selected for editing
  useEffect(() => {
    if (animalToEdit) {
      // Extract potential parent info from observations
      let motherInfo = '';
      let fatherInfo = '';
      let observations = animalToEdit.observations || '';
      
      // Simple parsing of parent info from observations
      if (observations) {
        const motherMatch = /Mãe: ([^\\n]+)/.exec(observations);
        if (motherMatch) {
          motherInfo = motherMatch[1];
          observations = observations.replace(motherMatch[0], '').trim();
        }
        
        const fatherMatch = /Pai: ([^\\n]+)/.exec(observations);
        if (fatherMatch) {
          fatherInfo = fatherMatch[1];
          observations = observations.replace(fatherMatch[0], '').trim();
        }
      }
      
      editForm.reset({
        name: animalToEdit.name || '',
        speciesId: animalToEdit.speciesId,
        breed: animalToEdit.breed || '',
        gender: animalToEdit.gender || '',
        birthDate: animalToEdit.birthDate ? 
          new Date(animalToEdit.birthDate).toISOString().split('T')[0] : 
          '',
        weight: animalToEdit.weight ? parseFloat(animalToEdit.weight.toString()) : undefined,
        status: animalToEdit.status || 'healthy',
        motherInfo,
        fatherInfo,
        lastVaccineDate: animalToEdit.lastVaccineDate ? 
          new Date(animalToEdit.lastVaccineDate).toISOString().split('T')[0] : 
          '',
        observations: observations,
      });
    }
  }, [animalToEdit, editForm]);

  // Create animal mutation
  const createAnimal = useMutation({
    mutationFn: async (data: AnimalFormValues) => {
      if (!selectedFarmId) throw new Error("Nenhuma fazenda selecionada");
      
      const apiData = processFormData(data);
      
      console.log("Enviando dados do animal para API:", JSON.stringify(apiData, null, 2));
      
      try {
        // Usar fetch diretamente em vez de apiRequest para ter mais controle
        const response = await fetch(`/api/farms/${selectedFarmId}/animals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
          credentials: 'include',
        });
        
        // Log da resposta completa para diagnóstico
        console.log("Resposta do servidor:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers.entries()])
        });
        
        // Se a resposta não for ok, tentar entender o erro
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          
          // Verifica se a resposta é JSON
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error("Dados de erro JSON:", errorData);
            throw new Error(errorData.message || `Erro ao criar animal (${response.status})`);
          } else {
            // Se não for JSON, trata como texto
            const errorText = await response.text();
            console.error("Resposta de erro (não-JSON):", errorText);
            throw new Error(`Erro do servidor: ${response.status} - Não é uma resposta JSON válida`);
          }
        }
        
        // Processar resposta bem-sucedida
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const responseData = await response.json();
          console.log("Dados de resposta:", responseData);
          return responseData;
        } else {
          // Se a resposta não for JSON, algo está errado
          const textResponse = await response.text();
          console.error("Resposta não é JSON:", textResponse);
          throw new Error("Resposta do servidor não é um JSON válido");
        }
      } catch (error: any) {
        console.error("Erro completo ao criar animal:", error);
        // Garantir que sempre retornamos um erro formatado
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error("Erro desconhecido ao criar animal");
        }
      }
    },
    onSuccess: (data) => {
      console.log("Animal criado com sucesso:", data);
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${selectedFarmId}/animals`] });
      toast({
        title: t('animals.animalAdded'),
        description: t('common.success'),
      });
      form.reset();
      setDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Erro ao criar animal:", error);
      toast({
        title: t('common.error'),
        description: error.message || "Erro ao tentar criar o animal",
        variant: 'destructive',
      });
    },
  });

  // Update animal mutation
  const updateAnimal = useMutation({
    mutationFn: async (data: AnimalFormValues) => {
      if (!animalToEdit) throw new Error("Nenhum animal para editar");
      if (!selectedFarmId) throw new Error("Nenhuma fazenda selecionada");
      
      const apiData = processFormData(data);
      
      console.log("Atualizando dados do animal:", JSON.stringify(apiData, null, 2));
      
      try {
        // Usar fetch diretamente em vez de apiRequest para ter mais controle
        const response = await fetch(`/api/farms/${selectedFarmId}/animals/${animalToEdit.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
          credentials: 'include',
        });
        
        // Log da resposta completa para diagnóstico
        console.log("Resposta do servidor (atualização):", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers.entries()])
        });
        
        // Se a resposta não for ok, tentar entender o erro
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          
          // Verifica se a resposta é JSON
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error("Dados de erro JSON (atualização):", errorData);
            throw new Error(errorData.message || `Erro ao atualizar animal (${response.status})`);
          } else {
            // Se não for JSON, trata como texto
            const errorText = await response.text();
            console.error("Resposta de erro (atualização, não-JSON):", errorText);
            throw new Error(`Erro do servidor: ${response.status} - Não é uma resposta JSON válida`);
          }
        }
        
        // Processar resposta bem-sucedida
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const responseData = await response.json();
          console.log("Dados de resposta (atualização):", responseData);
          return responseData;
        } else {
          // Se a resposta não for JSON, algo está errado
          const textResponse = await response.text();
          console.error("Resposta não é JSON (atualização):", textResponse);
          throw new Error("Resposta do servidor não é um JSON válido");
        }
      } catch (error: any) {
        console.error("Erro completo ao atualizar animal:", error);
        // Garantir que sempre retornamos um erro formatado
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error("Erro desconhecido ao atualizar animal");
        }
      }
    },
    onSuccess: (data) => {
      console.log("Animal atualizado com sucesso:", data);
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${selectedFarmId}/animals`] });
      toast({
        title: t('animals.animalUpdated'),
        description: t('common.success'),
      });
      editForm.reset();
      setEditDialogOpen(false);
      setAnimalToEdit(null);
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar animal:", error);
      toast({
        title: t('common.error'),
        description: error.message || "Erro ao tentar atualizar o animal",
        variant: 'destructive',
      });
    },
  });

  // Delete animal mutation
  const deleteAnimal = useMutation({
    mutationFn: async () => {
      if (!animalToDelete) throw new Error("Nenhum animal para excluir");
      if (!selectedFarmId) throw new Error("Nenhuma fazenda selecionada");
      
      try {
        // Usar fetch diretamente em vez de apiRequest para ter mais controle
        const response = await fetch(`/api/farms/${selectedFarmId}/animals/${animalToDelete.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        // Log da resposta completa para diagnóstico
        console.log("Resposta do servidor (exclusão):", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries([...response.headers.entries()])
        });
        
        // Se a resposta não for ok, tentar entender o erro
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          
          // Verifica se a resposta é JSON
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.error("Dados de erro JSON (exclusão):", errorData);
            throw new Error(errorData.message || `Erro ao excluir animal (${response.status})`);
          } else {
            // Se não for JSON, trata como texto
            const errorText = await response.text();
            console.error("Resposta de erro (exclusão, não-JSON):", errorText);
            throw new Error(`Erro do servidor: ${response.status} - Não é uma resposta JSON válida`);
          }
        }
        
        // Processar resposta bem-sucedida
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const responseData = await response.json();
          console.log("Dados de resposta (exclusão):", responseData);
          return responseData;
        } else {
          // Para métodos DELETE, é comum que a resposta seja vazia
          if (response.status === 204) {
            return { success: true };
          }
          
          // Se não for 204 e nem JSON, algo está errado
          const textResponse = await response.text();
          console.error("Resposta não é JSON (exclusão):", textResponse);
          throw new Error("Resposta do servidor não é um JSON válido");
        }
      } catch (error: any) {
        console.error("Erro completo ao excluir animal:", error);
        // Garantir que sempre retornamos um erro formatado
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error("Erro desconhecido ao excluir animal");
        }
      }
    },
    onSuccess: (data) => {
      console.log("Animal excluído com sucesso:", data);
      queryClient.invalidateQueries({ queryKey: [`/api/farms/${selectedFarmId}/animals`] });
      toast({
        title: t('animals.animalDeleted'),
        description: t('common.success'),
      });
      setDeleteDialogOpen(false);
      setAnimalToDelete(null);
    },
    onError: (error: any) => {
      console.error("Erro ao excluir animal:", error);
      toast({
        title: t('common.error'),
        description: error.message || "Erro ao tentar excluir o animal",
        variant: 'destructive',
      });
    },
  });

  // Submit handlers
  const onSubmit = (data: AnimalFormValues) => {
    createAnimal.mutate(data);
  };

  const onEditSubmit = (data: AnimalFormValues) => {
    updateAnimal.mutate(data);
  };

  // Handle edit animal
  const handleEditAnimal = (animal: Animal) => {
    setAnimalToEdit(animal);
    setEditDialogOpen(true);
  };

  // Handle delete animal
  const handleDeleteAnimal = (animal: Animal) => {
    setAnimalToDelete(animal);
    setDeleteDialogOpen(true);
  };
  
  // Funções para paginação
  const paginatedAnimals = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAnimals.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAnimals, currentPage, itemsPerPage]);
  
  const totalPages = React.useMemo(() => {
    return Math.ceil(filteredAnimals.length / itemsPerPage);
  }, [filteredAnimals, itemsPerPage]);
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Função para limpar filtros
  const handleClearFilters = () => {
    setFilters({
      species: 'all',
      status: 'all',
      gender: 'all',
      searchTerm: '',
    });
    setCurrentPage(1);
  };
  
  // Função para atualizar filtros
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters({
      ...filters,
      [filterName]: value,
    });
    setCurrentPage(1); // Reset to first page when changing filters
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('animals.title')}</h1>
          <div className="flex space-x-2">
            {farms && farms.length > 0 && (
              <Select 
                value={selectedFarmId?.toString()} 
                onValueChange={(value) => setSelectedFarmId(parseInt(value))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={t('common.selectFarm') || "Selecionar Fazenda"} />
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
            <Link href="/animals-removed">
              <Button variant="outline">
                <Archive className="mr-2 h-4 w-4" />
                Animais Removidos
              </Button>
            </Link>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('animals.addAnimal')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('animals.addAnimal')}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.name')}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="speciesId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('animals.species')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value ? field.value.toString() : undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('animals.selectSpecies')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {speciesList.map((species) => (
                                <SelectItem key={species.id} value={species.id.toString()}>
                                  {species.name} ({species.abbreviation})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="breed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.breed')}</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.gender')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('animals.gender')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">{t('animals.genders.male')}</SelectItem>
                                <SelectItem value="female">{t('animals.genders.female')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.birthDate')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="date" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.weight')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                {...field}
                                value={field.value === undefined ? '' : field.value}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">{t('animals.weightUnit')}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.healthStatus')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('animals.healthStatus')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="healthy">{t('animals.statuses.healthy')}</SelectItem>
                                <SelectItem value="sick">{t('animals.statuses.sick')}</SelectItem>
                                <SelectItem value="treatment">{t('animals.statuses.treatment')}</SelectItem>
                                <SelectItem value="quarantine">{t('animals.statuses.quarantine')}</SelectItem>
                                <SelectItem value="pregnant">{t('animals.statuses.pregnant')}</SelectItem>
                                <SelectItem value="lactating">{t('animals.statuses.lactating')}</SelectItem>
                                <SelectItem value="needsAttention">{t('animals.statuses.needsAttention')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="motherInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.mother')}</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="fatherInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('animals.father')}</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="observations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.observations')}</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">{t('common.cancel')}</Button>
                      </DialogClose>
                      <Button type="submit" disabled={createAnimal.isPending}>
                        {createAnimal.isPending ? (
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
          </div>
        </div>

        <div className="mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Barra de pesquisa */}
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="pl-8"
              />
            </div>
            
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              {/* Espécie */}
              <Select 
                value={filters.species} 
                onValueChange={(value) => handleFilterChange('species', value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={t('animals.species')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {speciesList.map((species) => (
                    <SelectItem key={species.id} value={species.id.toString()}>
                      {species.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Status */}
              <Select 
                value={filters.status} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={t('animals.healthStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="healthy">{t('animals.statuses.healthy')}</SelectItem>
                  <SelectItem value="sick">{t('animals.statuses.sick')}</SelectItem>
                  <SelectItem value="treatment">{t('animals.statuses.treatment')}</SelectItem>
                  <SelectItem value="quarantine">{t('animals.statuses.quarantine')}</SelectItem>
                  <SelectItem value="pregnant">{t('animals.statuses.pregnant')}</SelectItem>
                  <SelectItem value="lactating">{t('animals.statuses.lactating')}</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Gênero */}
              <Select 
                value={filters.gender} 
                onValueChange={(value) => handleFilterChange('gender', value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={t('animals.gender')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="male">{t('animals.genders.male')}</SelectItem>
                  <SelectItem value="female">{t('animals.genders.female')}</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Limpar filtros */}
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleClearFilters}
                title={t('common.clearFilters') || "Limpar filtros"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs for Animals and Calendar */}
        <Tabs defaultValue="animals" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted rounded-lg p-1">
            <TabsTrigger 
              value="animals" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <PawPrint className="h-4 w-4" />
              {t('animals.title')}
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Calendar className="h-4 w-4" />
              {t('calendar.title')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="animals" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('animals.title')}</CardTitle>
                <CardDescription>
                  {t('common.total')}: {filteredAnimals.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Botão de configuração das colunas */}
                <div className="flex justify-end mb-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar Colunas
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="end">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">
                          Selecionar Colunas
                        </h4>
                        <div className="space-y-2">
                          {columnConfig.map((column) => (
                            <div key={column.key} className="flex items-center space-x-2">
                              <Checkbox
                                id={column.key}
                                checked={visibleColumns.includes(column.key)}
                                onCheckedChange={() => toggleColumn(column.key)}
                              />
                              <label
                                htmlFor={column.key}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {column.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
            {isLoadingAnimals ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredAnimals.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                {t('animals.noAnimals')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {/* Renderizar cabeçalhos apenas para colunas visíveis */}
                      {columnConfig
                        .filter(column => visibleColumns.includes(column.key))
                        .map(column => (
                          <TableHead key={column.key}>{column.label}</TableHead>
                        ))}
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAnimals.map((animal) => {
                      return (
                        <TableRow key={animal.id}>
                          {/* Renderizar células apenas para colunas visíveis */}
                          {columnConfig
                            .filter(column => visibleColumns.includes(column.key))
                            .map(column => (
                              <TableCell 
                                key={column.key} 
                                className={column.key === 'registrationCode' ? 'font-medium' : ''}
                              >
                                {column.accessor(animal, speciesList)}
                              </TableCell>
                            ))}
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {/* Botão Ver Detalhes */}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                asChild
                                title={t('common.view') || "Ver detalhes"}
                              >
                                <Link href={`/animals-new/${animal.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              
                              {/* Botão Editar */}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditAnimal(animal)}
                                title={t('common.edit') || "Editar"}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              {/* Botão Excluir */}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteAnimal(animal)}
                                title={t('common.delete') || "Excluir"}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Controles de paginação */}
            {filteredAnimals.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  {t('common.showing') || "Mostrando"} {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAnimals.length)} {t('common.of') || "de"} {filteredAnimals.length}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Página anterior</span>
                  </Button>
                  <div className="text-sm font-medium">
                    {t('common.page') || "Página"} {currentPage} {t('common.of') || "de"} {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Próxima página</span>
                  </Button>
                  
                  <Select 
                    value={itemsPerPage.toString()} 
                    onValueChange={(value) => {
                      setItemsPerPage(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 {t('common.itemsPerPage') || "por página"}</SelectItem>
                      <SelectItem value="10">10 {t('common.itemsPerPage') || "por página"}</SelectItem>
                      <SelectItem value="20">20 {t('common.itemsPerPage') || "por página"}</SelectItem>
                      <SelectItem value="50">50 {t('common.itemsPerPage') || "por página"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            {selectedFarmId && <CalendarComponent farmId={selectedFarmId} />}
            {!selectedFarmId && (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {t('calendar.selectFarm')}
                    </h3>
                    <p className="text-gray-500">
                      {t('common.selectFarmToView')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Animal Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('animals.editAnimal')}</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.name')}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="speciesId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('animals.species')}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('animals.selectSpecies')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {speciesList.map((species) => (
                            <SelectItem key={species.id} value={species.id.toString()}>
                              {species.name} ({species.abbreviation})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={editForm.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.breed')}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.gender')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('animals.gender')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">{t('animals.genders.male')}</SelectItem>
                            <SelectItem value="female">{t('animals.genders.female')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={editForm.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.birthDate')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.weight')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            value={field.value === undefined ? '' : field.value}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">{t('animals.weightUnit')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={editForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.healthStatus')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('animals.healthStatus')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="healthy">{t('animals.statuses.healthy')}</SelectItem>
                            <SelectItem value="sick">{t('animals.statuses.sick')}</SelectItem>
                            <SelectItem value="treatment">{t('animals.statuses.treatment')}</SelectItem>
                            <SelectItem value="quarantine">{t('animals.statuses.quarantine')}</SelectItem>
                            <SelectItem value="pregnant">{t('animals.statuses.pregnant')}</SelectItem>
                            <SelectItem value="lactating">{t('animals.statuses.lactating')}</SelectItem>
                            <SelectItem value="needsAttention">{t('animals.statuses.needsAttention')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={editForm.control}
                    name="motherInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.mother')}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="fatherInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animals.father')}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.observations')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">{t('common.cancel')}</Button>
                  </DialogClose>
                  <Button type="submit" disabled={updateAnimal.isPending}>
                    {updateAnimal.isPending ? (
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('animals.confirmDelete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('animals.confirmDelete')}
                {animalToDelete && (
                  <span className="font-semibold block mt-2">
                    {animalToDelete.name || animalToDelete.registrationCode}
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteAnimal.mutate()}
                disabled={deleteAnimal.isPending}
              >
                {deleteAnimal.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('common.delete')
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}