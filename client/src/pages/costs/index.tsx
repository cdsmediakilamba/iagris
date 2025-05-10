import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Link, useLocation } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Cost, CostCategory } from '@shared/schema';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const CostsPage = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  const farmId = 6; // Por padrão, usamos a fazenda com ID 6 para demonstração
  
  // Estado para o modal de criação de custo
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<string>(CostCategory.OTHER);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Estado para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Estado para filtragem
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // Carregar os custos da fazenda selecionada
  const { data: costs, isLoading, isError } = useQuery<Cost[]>({ 
    queryKey: ['/api/farms', farmId, 'costs', categoryFilter, dateFilter],
    queryFn: async () => {
      let url = `/api/farms/${farmId}/costs`;
      const params = new URLSearchParams();
      
      if (categoryFilter && categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      
      if (dateFilter) {
        const startOfMonth = new Date(dateFilter);
        startOfMonth.setDate(1);
        
        const endOfMonth = new Date(dateFilter);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        
        params.append('startDate', startOfMonth.toISOString());
        params.append('endDate', endOfMonth.toISOString());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      return fetch(url).then(res => res.json());
    }
  });
  
  // Calcular paginação
  const totalItems = costs?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCosts = costs?.slice(startIndex, endIndex) || [];
  
  // Função para formatar valores monetários
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: 'AOA'
    }).format(parseFloat(value));
  };
  
  // Função para formatar datas
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, 'PPP', { 
      locale: language === 'pt' ? ptBR : enUS 
    });
  };
  
  // Função para traduzir categorias
  const translateCategory = (category: string) => {
    const categories: Record<string, string> = {
      supplies: t('costs.categories.supplies') || 'Suprimentos',
      equipment: t('costs.categories.equipment') || 'Equipamentos',
      maintenance: t('costs.categories.maintenance') || 'Manutenção',
      labor: t('costs.categories.labor') || 'Mão de obra',
      feed: t('costs.categories.feed') || 'Alimentação animal',
      fertilizer: t('costs.categories.fertilizer') || 'Fertilizantes',
      seeds: t('costs.categories.seeds') || 'Sementes',
      pesticides: t('costs.categories.pesticides') || 'Pesticidas',
      fuel: t('costs.categories.fuel') || 'Combustível',
      utilities: t('costs.categories.utilities') || 'Serviços públicos',
      veterinary: t('costs.categories.veterinary') || 'Serviços veterinários',
      taxes: t('costs.categories.taxes') || 'Impostos e taxas',
      land: t('costs.categories.land') || 'Terreno/aluguel',
      transportation: t('costs.categories.transportation') || 'Transporte',
      marketing: t('costs.categories.marketing') || 'Marketing',
      insurance: t('costs.categories.insurance') || 'Seguros',
      other: t('costs.categories.other') || 'Outros'
    };
    
    return categories[category] || category;
  };
  
  // Mutation para criar um novo custo
  const createCost = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/farms/${farmId}/costs`, {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Custo adicionado com sucesso',
        description: 'O novo custo foi registrado no sistema.',
      });
      
      // Resetar os campos do formulário
      setDate(new Date());
      setCategory(CostCategory.OTHER);
      setAmount('');
      setDescription('');
      setSupplier('');
      setPaymentMethod('');
      setDocumentNumber('');
      setNotes('');
      
      // Fechar o modal
      setIsDialogOpen(false);
      
      // Invalidar a query de custos para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'costs'] });
    },
    onError: () => {
      toast({
        title: 'Erro ao adicionar custo',
        description: 'Ocorreu um erro ao registrar o custo. Tente novamente.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const data = {
      farmId: parseInt(farmId.toString()),
      date,
      category,
      amount,
      description,
      supplier,
      paymentMethod,
      documentNumber,
      notes,
      createdBy: 0, // Será substituído no backend pelo ID do usuário autenticado
    };
    
    createCost.mutate(data);
  };
  
  return (
    <DashboardLayout title={t('common.costs') || 'Custos'}>
      <div className="container mx-auto py-6">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">{t('common.costs') || 'Custos'}</h1>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsDialogOpen(true)}
            >
              {t('common.create') || 'Criar'} {t('common.new') || 'Novo'}
            </Button>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/4">
            <Select 
              value={categoryFilter} 
              onValueChange={(value) => setCategoryFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('costs.selectCategory') || 'Selecionar categoria'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all') || 'Todas'}</SelectItem>
                <SelectItem value="supplies">{t('costs.categories.supplies') || 'Suprimentos'}</SelectItem>
                <SelectItem value="equipment">{t('costs.categories.equipment') || 'Equipamentos'}</SelectItem>
                <SelectItem value="maintenance">{t('costs.categories.maintenance') || 'Manutenção'}</SelectItem>
                <SelectItem value="labor">{t('costs.categories.labor') || 'Mão de obra'}</SelectItem>
                <SelectItem value="feed">{t('costs.categories.feed') || 'Alimentação animal'}</SelectItem>
                <SelectItem value="fertilizer">{t('costs.categories.fertilizer') || 'Fertilizantes'}</SelectItem>
                <SelectItem value="seeds">{t('costs.categories.seeds') || 'Sementes'}</SelectItem>
                <SelectItem value="pesticides">{t('costs.categories.pesticides') || 'Pesticidas'}</SelectItem>
                <SelectItem value="fuel">{t('costs.categories.fuel') || 'Combustível'}</SelectItem>
                <SelectItem value="other">{t('costs.categories.other') || 'Outros'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/4">
            <Input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder={t('costs.selectMonth') || 'Selecionar mês'}
            />
          </div>
          
          <div className="w-full md:w-1/4">
            <Button variant="secondary" onClick={() => {
              setCategoryFilter('');
              setDateFilter('');
            }}>
              {t('common.clearFilters') || 'Limpar filtros'}
            </Button>
          </div>
        </div>
        
        {/* Tabela de custos */}
        {isLoading ? (
          <div className="text-center py-10">
            <p>{t('common.loading') || 'Carregando...'}</p>
          </div>
        ) : isError ? (
          <div className="text-center py-10 text-red-500">
            <p>{t('common.errorLoading') || 'Erro ao carregar dados'}</p>
          </div>
        ) : costs?.length === 0 ? (
          <div className="text-center py-10">
            <p>{t('costs.noCosts') || 'Nenhum custo encontrado'}</p>
          </div>
        ) : (
          <>
            <Table>
              <TableCaption>{t('costs.tableCaption') || 'Lista de custos registrados'}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.date') || 'Data'}</TableHead>
                  <TableHead>{t('common.description') || 'Descrição'}</TableHead>
                  <TableHead>{t('costs.category') || 'Categoria'}</TableHead>
                  <TableHead className="text-right">{t('costs.amount') || 'Valor'}</TableHead>
                  <TableHead>{t('costs.supplier') || 'Fornecedor'}</TableHead>
                  <TableHead>{t('common.actions') || 'Ações'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCosts.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell>{formatDate(cost.date)}</TableCell>
                    <TableCell>{cost.description}</TableCell>
                    <TableCell>{translateCategory(cost.category)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(cost.amount)}</TableCell>
                    <TableCell>{cost.supplier || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `/costs/${cost.id}?farmId=${farmId}`}
                        >
                          {t('common.view') || 'Ver'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `/costs/${cost.id}/edit?farmId=${farmId}`}
                        >
                          {t('common.edit') || 'Editar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      />
                    </PaginationItem>
                    
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      // Mostrar apenas algumas páginas para não sobrecarregar a UI
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CostsPage;