import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import { useLocation, useRoute } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CostCategory } from '@shared/schema';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';

const EditCostPage = () => {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const [, params] = useRoute<{ id: string }>('/costs/edit/:id');
  const { toast } = useToast();
  
  // Get farmId from URL query param
  const searchParams = new URLSearchParams(window.location.search);
  const farmId = searchParams.get('farmId');
  
  const costId = params?.id;
  
  // Redirect if no farmId or costId
  useEffect(() => {
    if (!farmId || !costId) {
      setLocation('/costs');
    }
  }, [farmId, costId, setLocation]);
  
  // State for form fields
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(CostCategory.OTHER);
  const [supplier, setSupplier] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  // Fetch cost details
  const { data: cost, isLoading, error } = useQuery({
    queryKey: ['/api/farms', farmId, 'costs', costId],
    queryFn: () => 
      fetch(`/api/farms/${farmId}/costs/${costId}`).then(res => {
        if (!res.ok) {
          throw new Error('Cost not found');
        }
        return res.json();
      }),
    enabled: !!farmId && !!costId
  });
  
  // Set form values when cost data is loaded
  useEffect(() => {
    if (cost) {
      setDate(cost.date ? new Date(cost.date) : undefined);
      setAmount(cost.amount.toString());
      setDescription(cost.description || '');
      setCategory(cost.category || CostCategory.OTHER);
      setSupplier(cost.supplier || '');
      setPaymentMethod(cost.paymentMethod || '');
      setDocumentNumber(cost.documentNumber || '');
      setNotes(cost.notes || '');
    }
  }, [cost]);
  
  const updateCost = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/farms/${farmId}/costs/${costId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: t('common.success') || 'Sucesso',
        description: t('costs.updateSuccess') || 'Custo atualizado com sucesso',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'costs'] });
      setLocation(`/costs/${costId}?farmId=${farmId}`);
    },
    onError: (error) => {
      console.error('Error updating cost:', error);
      toast({
        title: t('common.error') || 'Erro',
        description: t('costs.updateError') || 'Erro ao atualizar o custo',
        variant: 'destructive',
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !amount || !description || !category) {
      toast({
        title: t('common.error') || 'Erro',
        description: t('errors.requiredFields') || 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }
    
    const data = {
      date: date.toISOString(),
      amount: parseFloat(amount),
      description,
      category,
      supplier,
      paymentMethod,
      documentNumber,
      notes
    };
    
    updateCost.mutate(data);
  };
  
  // Translate cost category
  const translateCategory = (category: string) => {
    return t(`costs.categories.${category.toLowerCase()}`) || category;
  };
  
  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <h2 className="text-xl font-medium mb-2">{t('costs.notFound') || 'Custo não encontrado'}</h2>
            <p className="text-muted-foreground mb-4">
              {t('costs.notFoundDescription') || 'O custo solicitado não foi encontrado ou você não tem permissão para editá-lo.'}
            </p>
            <Button onClick={() => setLocation('/costs')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back') || 'Voltar'}
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6 flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation(`/costs/${costId}?farmId=${farmId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('common.back') || 'Voltar'}
          </Button>
          <h1 className="text-2xl font-bold">{t('costs.edit') || 'Editar Custo'}</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('costs.editDescription') || 'Editar informações do custo'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="date">
                    {t('common.date') || 'Data'} <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {date ? (
                          format(date, "PPP", { locale: language === 'pt' ? ptBR : enUS })
                        ) : (
                          <span>{t('common.pickDate') || 'Selecione uma data'}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={(date) => date && setDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Categoria */}
                <div className="space-y-2">
                  <Label htmlFor="category">
                    {t('costs.category') || 'Categoria'} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={category}
                    onValueChange={setCategory}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder={t('costs.selectCategory') || 'Selecione a categoria'} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(CostCategory).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {translateCategory(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Valor */}
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    {t('costs.amount') || 'Valor (AOA)'} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                
                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t('common.description') || 'Descrição'} <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder={t('costs.descriptionPlaceholder') || 'Descreva o custo...'}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                
                {/* Fornecedor */}
                <div className="space-y-2">
                  <Label htmlFor="supplier">
                    {t('costs.supplier') || 'Fornecedor'}
                  </Label>
                  <Input
                    id="supplier"
                    placeholder={t('costs.supplierPlaceholder') || 'Nome do fornecedor'}
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                  />
                </div>
                
                {/* Método de pagamento */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">
                    {t('costs.paymentMethod') || 'Método de Pagamento'}
                  </Label>
                  <Input
                    id="paymentMethod"
                    placeholder={t('costs.paymentMethodPlaceholder') || 'Ex: Dinheiro, Transferência, Cartão'}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                </div>
                
                {/* Número do documento */}
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">
                    {t('costs.documentNumber') || 'Número do Documento'}
                  </Label>
                  <Input
                    id="documentNumber"
                    placeholder={t('costs.documentNumberPlaceholder') || 'Número da fatura ou recibo'}
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                  />
                </div>
                
                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="notes">
                    {t('common.notes') || 'Observações'}
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder={t('costs.notesPlaceholder') || 'Observações adicionais...'}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation(`/costs/${costId}?farmId=${farmId}`)}
                  >
                    {t('common.cancel') || 'Cancelar'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateCost.isPending}
                  >
                    {updateCost.isPending ? (
                      <>{t('common.saving') || 'Salvando'}...</>
                    ) : (
                      <>{t('common.save') || 'Salvar'}</>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EditCostPage;