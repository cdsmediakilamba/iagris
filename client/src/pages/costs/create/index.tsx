import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useParams } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { insertCostSchema, CostCategory, type InsertCost } from '@shared/schema';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { pt, enUS } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Estender o schema para validação
const createCostSchema = insertCostSchema.extend({
  date: z.coerce.date(),
  amount: z.string().min(1),
});

type CreateCostFormValues = z.infer<typeof createCostSchema>;

const CreateCostPage = () => {
  const { farmId } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { language: locale, t } = useLanguage();
  const queryClient = useQueryClient();
  
  const dateLocale = locale === 'pt' ? pt : enUS;

  // Inicializar o formulário com valores padrão
  const form = useForm<CreateCostFormValues>({
    resolver: zodResolver(createCostSchema),
    defaultValues: {
      farmId: parseInt(farmId || '0'),
      date: new Date(),
      category: CostCategory.OTHER,
      amount: '',
      description: '',
      supplier: '',
      notes: '',
      paymentMethod: '',
      documentNumber: '',
    },
  });

  // Mutation para criar um novo custo
  const createCost = useMutation({
    mutationFn: async (data: CreateCostFormValues) => {
      return await apiRequest(`/api/farms/${farmId}/costs`, {
        method: 'POST',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: t('costs.createSuccess') || 'Custo adicionado com sucesso',
        description: t('costs.createSuccessDescription') || 'O novo custo foi registrado no sistema.',
      });
      
      // Invalidar a query de custos para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['/api/farms', parseInt(farmId || '0'), 'costs'] });
      
      // Redirecionar para a página de custos
      navigate(`/costs`);
    },
    onError: () => {
      toast({
        title: t('costs.createError') || 'Erro ao adicionar custo',
        description: t('costs.createErrorDescription') || 'Ocorreu um erro ao registrar o custo. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateCostFormValues) => {
    createCost.mutate({
      ...data,
      createdBy: 0, // Será substituído no backend pelo ID do usuário autenticado
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('costs.createTitle') || 'Adicionar Novo Custo'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Campo: Data */}
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t('common.date') || 'Data'}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: dateLocale })
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo: Categoria */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('costs.category') || 'Categoria'}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('costs.selectCategory') || "Selecione uma categoria"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(CostCategory).map((category) => (
                              <SelectItem key={category} value={category}>
                                {t(`costs.categories.${category}`) || category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo: Valor */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('costs.amount') || 'Valor'}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo: Fornecedor */}
                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('costs.supplier') || 'Fornecedor'}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo: Método de Pagamento */}
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('costs.paymentMethod') || 'Método de Pagamento'}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Campo: Número do Documento */}
                  <FormField
                    control={form.control}
                    name="documentNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('costs.documentNumber') || 'Número do Documento'}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Campo: Descrição */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.description') || 'Descrição'}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campo: Observações */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.notes') || 'Observações'}</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => navigate('/costs')}
                  >
                    {t('common.cancel') || 'Cancelar'}
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createCost.isPending}
                  >
                    {createCost.isPending 
                      ? t('common.saving') || 'Salvando...' 
                      : t('common.save') || 'Salvar'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateCostPage;