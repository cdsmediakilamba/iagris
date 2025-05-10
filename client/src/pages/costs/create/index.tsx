import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CostCategory } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form } from '@/components/ui/form';
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
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const CreateCostPage = () => {
  const params = useParams();
  const farmId = params.farmId;
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  console.log("Parâmetros na URL:", params);
  console.log("Farm ID recebido:", farmId);
  
  // Estados do formulário
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<string>(CostCategory.OTHER);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
      
      // Invalidar a query de custos para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['/api/farms', parseInt(farmId || '0'), 'costs'] });
      
      // Redirecionar para a página de custos
      navigate('/costs');
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
      farmId: parseInt(farmId || '0'),
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
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Custo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Campo: Data */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Data</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        {date ? (
                          format(date, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => date && setDate(date)}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Campo: Categoria */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select onValueChange={setCategory} defaultValue={category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(CostCategory).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Campo: Valor */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Valor</label>
                  <Input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Campo: Fornecedor */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Fornecedor</label>
                  <Input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                  />
                </div>

                {/* Campo: Método de Pagamento */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Método de Pagamento</label>
                  <Input
                    type="text"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                </div>

                {/* Campo: Número do Documento */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Número do Documento</label>
                  <Input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Campo: Descrição */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Campo: Observações */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => navigate('/costs')}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateCostPage;