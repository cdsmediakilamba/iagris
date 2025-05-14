import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Inventory as InventoryType, InventoryTransaction as TransactionType, InventoryTransactionType } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { formatNumber } from '@/lib/i18n';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  PlusCircle,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  Calendar,
  AlertCircle,
  RefreshCw,
  Truck,
  FileText,
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

export default function InventoryTransactions() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Get user's farms
  const { data: farms, isLoading: isLoadingFarms } = useQuery<any[]>({
    queryKey: ['/api/farms'],
  });

  // Use first farm by default
  React.useEffect(() => {
    if (farms && farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  // Get inventory for selected farm
  const { data: inventory, isLoading: isLoadingInventory } = useQuery<InventoryType[]>({
    queryKey: ['/api/farms', selectedFarmId, 'inventory'],
    enabled: !!selectedFarmId,
  });

  // Get transactions for selected farm
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<TransactionType[]>({
    queryKey: ['/api/farms', selectedFarmId, 'inventory/transactions'],
    enabled: !!selectedFarmId,
  });

  // Get transactions for selected item (if any)
  const { data: itemTransactions, isLoading: isLoadingItemTransactions } = useQuery<TransactionType[]>({
    queryKey: ['/api/inventory', selectedItemId, 'transactions'],
    enabled: !!selectedItemId,
  });

  // Determine which transactions to display
  const displayTransactions = selectedItemId ? itemTransactions : transactions;

  // Filter transactions by search term
  const filteredTransactions = displayTransactions?.filter(transaction => {
    // Log de depuração para verificar o formato das transações
    console.log("Transação encontrada:", transaction);
    
    const matchesSearch = 
      (transaction.notes && transaction.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (transaction.documentNumber && transaction.documentNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply date range filter if available
    if (dateRange.from && dateRange.to) {
      try {
        const transactionDate = new Date(transaction.date);
        return matchesSearch && 
          transactionDate >= dateRange.from && 
          transactionDate <= dateRange.to;
      } catch (error) {
        console.error("Erro ao filtrar data:", error);
        return matchesSearch;
      }
    }
    
    return matchesSearch;
  });

  // Get item name by ID
  const getItemName = (itemId: number) => {
    const item = inventory?.find(i => i.id === itemId);
    return item ? item.name : `Item #${itemId}`;
  };

  // Format date
  const formatDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Verificar se a data é válida
      if (isNaN(dateObj.getTime())) {
        return 'Data inválida';
      }
      
      return format(dateObj, 'PPp', { locale: language === 'pt' ? ptBR : enUS });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case InventoryTransactionType.IN:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
            <ArrowDownCircle className="h-3 w-3 mr-1" />
            {t('inventory.transactions.entry')}
          </Badge>
        );
      case InventoryTransactionType.OUT:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
            <ArrowUpCircle className="h-3 w-3 mr-1" />
            {t('inventory.transactions.withdrawal')}
          </Badge>
        );
      case InventoryTransactionType.ADJUST:
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center">
            <RefreshCw className="h-3 w-3 mr-1" />
            {t('inventory.transactions.adjustment')}
          </Badge>
        );
      default:
        return type;
    }
  };

  // Entry form schema
  const entryFormSchema = z.object({
    quantity: z.string().min(1, { message: t('validation.required') }),
    notes: z.string().optional(),
    documentNumber: z.string().optional(),
    unitPrice: z.string().optional(),
  });

  // Withdrawal form schema
  const withdrawalFormSchema = z.object({
    quantity: z.string().min(1, { message: t('validation.required') }),
    notes: z.string().optional(),
    destination: z.string().optional(),
  });

  // Adjustment form schema
  const adjustmentFormSchema = z.object({
    newQuantity: z.string().min(1, { message: t('validation.required') }),
    notes: z.string().optional(),
  });

  // Setup forms
  const entryForm = useForm<z.infer<typeof entryFormSchema>>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      quantity: '',
      notes: '',
      documentNumber: '',
      unitPrice: '',
    },
  });

  const withdrawalForm = useForm<z.infer<typeof withdrawalFormSchema>>({
    resolver: zodResolver(withdrawalFormSchema),
    defaultValues: {
      quantity: '',
      notes: '',
      destination: '',
    },
  });

  const adjustmentForm = useForm<z.infer<typeof adjustmentFormSchema>>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      newQuantity: '',
      notes: '',
    },
  });

  // Register entry mutation
  const registerEntry = useMutation({
    mutationFn: async (data: z.infer<typeof entryFormSchema>) => {
      if (!selectedItemId) throw new Error("No item selected");
      return await apiRequest(
        `/api/inventory/${selectedItemId}/entry`, 
        { method: 'POST', data }
      );
    },
    onSuccess: () => {
      invalidateQueries();
      toast({
        title: t('inventory.transactions.entryAdded'),
        description: t('common.success'),
      });
      entryForm.reset();
      setEntryDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Register withdrawal mutation
  const registerWithdrawal = useMutation({
    mutationFn: async (data: z.infer<typeof withdrawalFormSchema>) => {
      if (!selectedItemId) throw new Error("No item selected");
      return await apiRequest(
        `/api/inventory/${selectedItemId}/withdrawal`, 
        { method: 'POST', data }
      );
    },
    onSuccess: () => {
      invalidateQueries();
      toast({
        title: t('inventory.transactions.withdrawalAdded'),
        description: t('common.success'),
      });
      withdrawalForm.reset();
      setWithdrawalDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Register adjustment mutation
  const registerAdjustment = useMutation({
    mutationFn: async (data: z.infer<typeof adjustmentFormSchema>) => {
      if (!selectedItemId) throw new Error("No item selected");
      return await apiRequest(
        `/api/inventory/${selectedItemId}/adjustment`, 
        { method: 'POST', data }
      );
    },
    onSuccess: () => {
      invalidateQueries();
      toast({
        title: t('inventory.transactions.adjustmentAdded'),
        description: t('common.success'),
      });
      adjustmentForm.reset();
      setAdjustmentDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper to invalidate all relevant queries
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'inventory'] });
    queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'inventory/transactions'] });
    if (selectedItemId) {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory', selectedItemId, 'transactions'] });
    }
  };

  // Submit handlers
  const onEntrySubmit = (data: z.infer<typeof entryFormSchema>) => {
    registerEntry.mutate(data);
  };

  const onWithdrawalSubmit = (data: z.infer<typeof withdrawalFormSchema>) => {
    registerWithdrawal.mutate(data);
  };

  const onAdjustmentSubmit = (data: z.infer<typeof adjustmentFormSchema>) => {
    registerAdjustment.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-4">{t('inventory.transactions.title')}</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Search, farm select, and date filter */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('common.search')}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {farms && farms.length > 0 && (
              <Select
                value={selectedFarmId?.toString()}
                onValueChange={(value) => {
                  setSelectedFarmId(parseInt(value));
                  setSelectedItemId(null); // Reset selected item when farm changes
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('dashboard.farm')} />
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

            {inventory && inventory.length > 0 && (
              <Select
                value={selectedItemId?.toString() || "all"}
                onValueChange={(value) => setSelectedItemId(value && value !== "all" ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder={t('inventory.selectItem')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.name} ({item.quantity} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto flex gap-2">
                  <Calendar className="h-4 w-4" />
                  {dateRange.from && dateRange.to ? (
                    <>
                      {format(dateRange.from, 'PPP', { locale: language === 'pt' ? ptBR : enUS })} - 
                      {format(dateRange.to, 'PPP', { locale: language === 'pt' ? ptBR : enUS })}
                    </>
                  ) : (
                    t('inventory.transactions.dateRange')
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  selected={{ 
                    from: dateRange.from || undefined, 
                    to: dateRange.to || undefined 
                  }}
                  onSelect={(range) => setDateRange({ 
                    from: range?.from, 
                    to: range?.to
                  })}
                  numberOfMonths={2}
                  locale={language === 'pt' ? ptBR : enUS}
                />
                <div className="p-3 border-t border-border">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setDateRange({ from: undefined, to: undefined })}
                  >
                    {t('common.clear')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Transaction action buttons */}
          {selectedItemId && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto" variant="outline">
                    <ArrowDownCircle className="mr-2 h-4 w-4 text-green-600" />
                    {t('inventory.transactions.newEntry')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{t('inventory.transactions.newEntry')}</DialogTitle>
                  </DialogHeader>
                  <Form {...entryForm}>
                    <form onSubmit={entryForm.handleSubmit(onEntrySubmit)} className="space-y-4">
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">{t('inventory.item')}:</p>
                        <p className="font-medium">{getItemName(selectedItemId)}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={entryForm.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('inventory.quantity')}</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} min="0.01" step="0.01" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={entryForm.control}
                          name="documentNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('inventory.transactions.documentNumber')}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t('inventory.transactions.optional')} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                        <FormField
                          control={entryForm.control}
                          name="unitPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('inventory.transactions.unitPrice')}</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} min="0.01" step="0.01" placeholder={t('inventory.transactions.optional')} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={entryForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('inventory.transactions.notes')}</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder={t('inventory.transactions.optional')} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">{t('common.cancel')}</Button>
                        </DialogClose>
                        <Button type="submit" disabled={registerEntry.isPending}>
                          {registerEntry.isPending ? (
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

              <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto" variant="outline">
                    <ArrowUpCircle className="mr-2 h-4 w-4 text-red-600" />
                    {t('inventory.transactions.newWithdrawal')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{t('inventory.transactions.newWithdrawal')}</DialogTitle>
                  </DialogHeader>
                  <Form {...withdrawalForm}>
                    <form onSubmit={withdrawalForm.handleSubmit(onWithdrawalSubmit)} className="space-y-4">
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">{t('inventory.item')}:</p>
                        <p className="font-medium">{getItemName(selectedItemId)}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={withdrawalForm.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('inventory.quantity')}</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} min="0.01" step="0.01" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={withdrawalForm.control}
                          name="destination"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('inventory.transactions.destination')}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder={t('inventory.transactions.optional')} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={withdrawalForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('inventory.transactions.notes')}</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder={t('inventory.transactions.optional')} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">{t('common.cancel')}</Button>
                        </DialogClose>
                        <Button type="submit" disabled={registerWithdrawal.isPending}>
                          {registerWithdrawal.isPending ? (
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

              <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto" variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4 text-blue-600" />
                    {t('inventory.transactions.newAdjustment')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>{t('inventory.transactions.newAdjustment')}</DialogTitle>
                  </DialogHeader>
                  <Form {...adjustmentForm}>
                    <form onSubmit={adjustmentForm.handleSubmit(onAdjustmentSubmit)} className="space-y-4">
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">{t('inventory.item')}:</p>
                        <p className="font-medium">{getItemName(selectedItemId)}</p>
                      </div>
                      <FormField
                        control={adjustmentForm.control}
                        name="newQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('inventory.transactions.newQuantity')}</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} min="0" step="0.01" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={adjustmentForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('inventory.transactions.notes')}</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">{t('common.cancel')}</Button>
                        </DialogClose>
                        <Button type="submit" disabled={registerAdjustment.isPending}>
                          {registerAdjustment.isPending ? (
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
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {selectedItemId 
                ? `${t('inventory.transactions.for')} ${getItemName(selectedItemId)}`
                : t('inventory.transactions.title')
              }
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingInventory || isLoadingTransactions || isLoadingItemTransactions || isLoadingFarms ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTransactions && filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    {!selectedItemId && <TableHead>{t('inventory.item')}</TableHead>}
                    <TableHead>{t('common.type')}</TableHead>
                    <TableHead>{t('inventory.quantity')}</TableHead>
                    <TableHead>{t('inventory.transactions.previousBalance')}</TableHead>
                    <TableHead>{t('inventory.transactions.newBalance')}</TableHead>
                    <TableHead>{t('inventory.transactions.notes')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {formatDate(transaction.date)}
                      </TableCell>
                      {!selectedItemId && (
                        <TableCell className="font-medium">
                          {getItemName(transaction.inventoryId)}
                        </TableCell>
                      )}
                      <TableCell>
                        {getTransactionTypeLabel(transaction.type)}
                      </TableCell>
                      <TableCell>
                        {transaction.type === InventoryTransactionType.OUT ? '- ' : 
                          transaction.type === InventoryTransactionType.IN ? '+ ' : ''}
                        {formatNumber(transaction.quantity, language)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(transaction.previousBalance, language)}
                      </TableCell>
                      <TableCell>
                        {formatNumber(transaction.newBalance, language)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {transaction.notes || '-'}
                          {transaction.documentNumber && (
                            <Badge variant="outline" className="ml-2">
                              <FileText className="h-3 w-3 mr-1" />
                              {transaction.documentNumber}
                            </Badge>
                          )}
                          {transaction.destinationOrSource && (
                            <Badge variant="outline" className="ml-2">
                              <Truck className="h-3 w-3 mr-1" />
                              {transaction.destinationOrSource}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {t('inventory.transactions.noTransactions')}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? t('common.noSearchResults') 
                  : selectedItemId
                    ? t('inventory.transactions.makeFirstTransaction')
                    : t('inventory.transactions.selectItem')
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}