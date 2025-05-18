import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/i18n';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  PlusCircle,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  CreditCard,
  Loader2,
  Download,
  Filter,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// Define transaction schema (normally would come from schema.ts)
const transactionSchema = z.object({
  description: z.string().min(1, { message: "Description is required" }),
  amount: z.number().min(0.01, { message: "Amount must be greater than 0" }),
  date: z.date(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, { message: "Category is required" }),
  reference: z.string().optional(),
  farmId: z.number()
});

type Transaction = {
  id: number;
  description: string;
  amount: number;
  date: Date;
  type: "income" | "expense";
  category: string;
  reference?: string;
  farmId: number;
  createdAt: Date;
};

// Generate financial data from real transactions
const generateFinancialData = (transactions: Transaction[], months: number) => {
  const data = [];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  for (let i = 0; i < months; i++) {
    const month = (currentMonth - i + 12) % 12;
    const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const monthName = monthStart.toLocaleString('default', { month: 'short' });
    
    // Filter transactions for this month
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });
    
    // Calculate monthly income and expenses
    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    data.unshift({
      month: monthName,
      income,
      expenses,
      profit: income - expenses
    });
  }
  
  return data;
};

export default function Financial() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Get user's farms
  const { data: farms = [], isLoading: isLoadingFarms } = useQuery<any[]>({
    queryKey: ['/api/farms'],
  });

  // Use first farm by default
  React.useEffect(() => {
    if (farms.length > 0 && !selectedFarmId) {
      setSelectedFarmId(farms[0].id);
    }
  }, [farms, selectedFarmId]);

  // Get costs for selected farm
  const { data: costs = [], isLoading: isLoadingCosts } = useQuery<any[]>({
    queryKey: [`/api/farms/${selectedFarmId}/costs`],
    enabled: !!selectedFarmId,
  });

  // Get inventory transactions for selected farm
  const { data: inventoryTransactions = [], isLoading: isLoadingInventoryTransactions } = useQuery<any[]>({
    queryKey: [`/api/farms/${selectedFarmId}/inventory/transactions`],
    enabled: !!selectedFarmId,
  });

  // Combine costs and inventory transactions into financial transactions
  const transactions: Transaction[] = React.useMemo(() => {
    const result: Transaction[] = [];
    
    // Add costs as expenses
    if (costs && Array.isArray(costs)) {
      costs.forEach(cost => {
        result.push({
          id: cost.id,
          description: cost.description,
          amount: parseFloat(cost.amount), // Convert from string to number
          date: new Date(cost.date),
          type: "expense",
          category: cost.category,
          farmId: cost.farmId,
          createdAt: new Date(cost.createdAt || cost.date)
        });
      });
    }
    
    // Add inventory transactions
    if (inventoryTransactions && Array.isArray(inventoryTransactions)) {
      inventoryTransactions.forEach(transaction => {
        // Skip transactions without price information
        if (!transaction.unitPrice || !transaction.totalPrice) return;
        
        // Input transactions (purchases) are expenses
        if (transaction.type === "in") {
          result.push({
            id: transaction.id,
            description: `Compra de ${transaction.quantity} unidades de ${transaction.inventoryName || 'inventário'}`,
            amount: parseFloat(transaction.totalPrice),
            date: new Date(transaction.date),
            type: "expense",
            category: "purchases",
            reference: transaction.documentNumber,
            farmId: transaction.farmId,
            createdAt: new Date(transaction.createdAt || transaction.date)
          });
        } 
        // Output transactions (sales) are income
        else if (transaction.type === "out" && transaction.category === "sale") {
          result.push({
            id: transaction.id,
            description: `Venda de ${transaction.quantity} unidades de ${transaction.inventoryName || 'inventário'}`,
            amount: parseFloat(transaction.totalPrice),
            date: new Date(transaction.date),
            type: "income",
            category: "sales",
            reference: transaction.documentNumber,
            farmId: transaction.farmId,
            createdAt: new Date(transaction.createdAt || transaction.date)
          });
        }
      });
    }
    
    // Sort by date, newest first
    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [costs, inventoryTransactions]);
  
  const isLoadingTransactions = isLoadingCosts || isLoadingInventoryTransactions;

  // Filter transactions by search term and tab
  const filteredTransactions = transactions.filter(transaction => 
    (transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (activeTab === 'all' || activeTab === transaction.type)
  );

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const profit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;
  
  // Generate financial data for charts based on real transactions
  const financialData = React.useMemo(() => {
    return generateFinancialData(transactions, 6);
  }, [transactions]);

  // Transaction form schema
  const formSchema = transactionSchema.omit({ 
    farmId: true 
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: undefined,
      date: new Date(),
      type: 'income',
      category: '',
      reference: '',
    },
  });

  // Create transaction mutation
  const createTransaction = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!selectedFarmId) throw new Error("No farm selected");
      
      // In a real app, this would call the API
      // const response = await apiRequest('POST', `/api/farms/${selectedFarmId}/transactions`, data);
      // return response.json();
      
      // For now, just return a mock success after a delay
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    },
    onSuccess: () => {
      // In a real app, invalidate the queries
      // queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'transactions'] });
      
      toast({
        title: t('financial.transactionAdded'),
        description: t('common.success'),
      });
      form.reset();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Submit handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createTransaction.mutate(data);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-4">{t('financial.title')}</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Search and farm select */}
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
            
            {farms.length > 0 && (
              <Select
                value={selectedFarmId?.toString()}
                onValueChange={(value) => setSelectedFarmId(parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder={t('dashboard.farm')} />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm: any) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {/* Add transaction button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('financial.addTransaction')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{t('financial.addTransaction')}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('financial.description')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('financial.amount')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('financial.date')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              value={field.value instanceof Date ? field.value.toISOString().substring(0, 10) : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('financial.type')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('financial.type')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="income">{t('financial.types.income')}</SelectItem>
                              <SelectItem value="expense">{t('financial.types.expense')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('financial.category')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('financial.category')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sales">{t('financial.categories.sales')}</SelectItem>
                              <SelectItem value="purchases">{t('financial.categories.purchases')}</SelectItem>
                              <SelectItem value="salaries">{t('financial.categories.salaries')}</SelectItem>
                              <SelectItem value="utilities">{t('financial.categories.utilities')}</SelectItem>
                              <SelectItem value="maintenance">{t('financial.categories.maintenance')}</SelectItem>
                              <SelectItem value="feed">{t('financial.categories.feed')}</SelectItem>
                              <SelectItem value="veterinary">{t('financial.categories.veterinary')}</SelectItem>
                              <SelectItem value="seeds">{t('financial.categories.seeds')}</SelectItem>
                              <SelectItem value="fertilizers">{t('financial.categories.fertilizers')}</SelectItem>
                              <SelectItem value="taxes">{t('financial.categories.taxes')}</SelectItem>
                              <SelectItem value="other">{t('financial.categories.other')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('financial.reference')}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">{t('common.cancel')}</Button>
                    </DialogClose>
                    <Button type="submit" disabled={createTransaction.isPending}>
                      {createTransaction.isPending ? (
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
      
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('financial.income')}</p>
                <h3 className="text-2xl font-medium mt-1 text-green-600">
                  {formatCurrency(totalIncome, language)}
                </h3>
              </div>
              <div className="rounded-full bg-green-100 p-2">
                <ArrowUpCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('financial.expenses')}</p>
                <h3 className="text-2xl font-medium mt-1 text-red-600">
                  {formatCurrency(totalExpenses, language)}
                </h3>
              </div>
              <div className="rounded-full bg-red-100 p-2">
                <ArrowDownCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('financial.profit')}</p>
                <h3 className={`text-2xl font-medium mt-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(profit, language)}
                </h3>
              </div>
              <div className={`rounded-full ${profit >= 0 ? 'bg-green-100' : 'bg-red-100'} p-2`}>
                <DollarSign className={`h-6 w-6 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('financial.profitMargin')}</p>
                <h3 className={`text-2xl font-medium mt-1 ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitMargin.toFixed(1)}%
                </h3>
              </div>
              <div className={`rounded-full ${profitMargin >= 0 ? 'bg-green-100' : 'bg-red-100'} p-2`}>
                <CreditCard className={`h-6 w-6 ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Cash Flow Chart */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('financial.cashFlow')}</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              {t('common.export')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={financialData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number, language)} />
                <Legend />
                <Bar dataKey="income" name={t('financial.income')} fill="#22c55e" />
                <Bar dataKey="expenses" name={t('financial.expenses')} fill="#ef4444" />
                <Bar dataKey="profit" name={t('financial.profit')} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Transactions List */}
      <Card>
        <CardHeader>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center">
              <CardTitle>{t('financial.title')}</CardTitle>
              <TabsList>
                <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
                <TabsTrigger value="income">{t('financial.types.income')}</TabsTrigger>
                <TabsTrigger value="expense">{t('financial.types.expense')}</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('financial.date')}</TableHead>
                    <TableHead>{t('financial.description')}</TableHead>
                    <TableHead>{t('financial.category')}</TableHead>
                    <TableHead className="text-right">{t('financial.amount')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {formatDate(transaction.date, 'P', language)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>{t(`financial.categories.${transaction.category}`)}</TableCell>
                      <TableCell className={`text-right ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+ ' : '- '}
                        {formatCurrency(transaction.amount, language)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">{t('financial.noTransactions')}</h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? t('common.noSearchResults') 
                  : t('financial.addTransaction')
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
