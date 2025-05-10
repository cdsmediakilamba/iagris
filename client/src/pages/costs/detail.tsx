import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import { useLocation, useRoute } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, Edit, Trash, Calendar, DollarSign, 
  Tag, Info, Truck, CreditCard, FileText, FileDigit
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { formatCurrency } from '@/lib/i18n';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const CostDetailsPage = () => {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const [, params] = useRoute<{ id: string }>('/costs/:id');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
  
  const handleDelete = async () => {
    try {
      await apiRequest(`/api/farms/${farmId}/costs/${costId}`, {
        method: 'DELETE'
      });
      
      // Show success toast
      toast({
        title: t('common.success') || 'Sucesso',
        description: t('costs.deleteSuccess') || 'Custo excluído com sucesso',
        variant: 'default',
      });
      
      // Invalidate costs query and redirect
      queryClient.invalidateQueries({ queryKey: ['/api/farms', farmId, 'costs'] });
      setLocation('/costs');
    } catch (error) {
      console.error('Error deleting cost:', error);
      toast({
        title: t('common.error') || 'Erro',
        description: t('costs.deleteError') || 'Erro ao excluir o custo',
        variant: 'destructive',
      });
    }
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
              {t('costs.notFoundDescription') || 'O custo solicitado não foi encontrado ou você não tem permissão para visualizá-lo.'}
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
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLocation('/costs')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('common.back') || 'Voltar'}
            </Button>
            <h1 className="text-2xl font-bold">{t('costs.details') || 'Detalhes do Custo'}</h1>
          </div>
          
          {!isLoading && cost && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setLocation(`/costs/${costId}/edit?farmId=${farmId}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit') || 'Editar'}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash className="h-4 w-4 mr-2" />
                {t('common.delete') || 'Excluir'}
              </Button>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ) : cost ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{t('costs.information') || 'Informações do Custo'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {t('common.date') || 'Data'}
                  </div>
                  <div className="font-medium text-base">
                    {cost.date ? format(new Date(cost.date), 'PPP', { locale: language === 'pt' ? ptBR : enUS }) : '-'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Tag className="h-4 w-4 mr-2" />
                    {t('costs.category') || 'Categoria'}
                  </div>
                  <div className="font-medium text-base">
                    {translateCategory(cost.category || 'OTHER')}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4 mr-2" />
                    {t('costs.amount') || 'Valor'}
                  </div>
                  <div className="font-medium text-xl">
                    {formatCurrency(cost.amount, language)}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mr-2" />
                    {t('common.description') || 'Descrição'}
                  </div>
                  <div className="font-medium text-base">
                    {cost.description || '-'}
                  </div>
                </div>
                
                {cost.notes && (
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Info className="h-4 w-4 mr-2" />
                      {t('common.notes') || 'Observações'}
                    </div>
                    <div className="text-base">
                      {cost.notes || '-'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('costs.details') || 'Detalhes Adicionais'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    <Truck className="h-4 w-4 inline mr-2" />
                    {t('costs.supplier') || 'Fornecedor'}
                  </div>
                  <div className="font-medium">
                    {cost.supplier || '-'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4 inline mr-2" />
                    {t('costs.paymentMethod') || 'Método de Pagamento'}
                  </div>
                  <div className="font-medium">
                    {cost.paymentMethod || '-'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 inline mr-2" />
                    {t('costs.documentNumber') || 'Número do Documento'}
                  </div>
                  <div className="font-medium">
                    {cost.documentNumber || '-'}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    <FileDigit className="h-4 w-4 inline mr-2" />
                    ID
                  </div>
                  <div className="font-medium">
                    {cost.id}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    {t('common.createdAt') || 'Data de Registro'}
                  </div>
                  <div className="font-medium">
                    {cost.createdAt ? format(new Date(cost.createdAt), 'PPP', { locale: language === 'pt' ? ptBR : enUS }) : '-'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('costs.confirmDelete') || 'Confirmar exclusão'}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('costs.deleteWarning') || 'Tem certeza que deseja excluir este custo? Esta ação não pode ser desfeita.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t('common.cancel') || 'Cancelar'}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                {t('common.delete') || 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default CostDetailsPage;