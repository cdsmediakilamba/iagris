import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertInventorySchema, Inventory as InventoryType } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  Truck,
  BarChart3,
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export default function Inventory() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Get user's farms
  const { data: farms, isLoading: isLoadingFarms } = useQuery({
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

  // Get critical inventory for selected farm
  const { data: criticalInventory, isLoading: isLoadingCritical } = useQuery<InventoryType[]>({
    queryKey: ['/api/farms', selectedFarmId, 'inventory/critical'],
    enabled: !!selectedFarmId,
  });

  // Determine which inventory to display based on tab
  const displayInventory = activeTab === 'critical' ? criticalInventory : inventory;

  // Filter inventory by search term
  const filteredInventory = displayInventory?.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Inventory form schema
  const formSchema = insertInventorySchema.omit({ 
    farmId: true 
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: '',
      quantity: undefined,
      unit: '',
      minimumLevel: undefined,
    },
  });

  // Create inventory item mutation
  const createInventoryItem = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!selectedFarmId) throw new Error("No farm selected");
      const response = await apiRequest(
        'POST', 
        `/api/farms/${selectedFarmId}/inventory`, 
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'inventory/critical'] });
      toast({
        title: t('inventory.itemAdded'),
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
    // Convert numeric fields
    const formattedData = {
      ...data,
      quantity: typeof data.quantity === 'string' ? parseInt(data.quantity) : data.quantity,
      minimumLevel: typeof data.minimumLevel === 'string' ? parseInt(data.minimumLevel) : data.minimumLevel,
    };
    createInventoryItem.mutate(formattedData);
  };

  // Get stock level indicator
  const getStockLevelIndicator = (item: InventoryType) => {
    if (!item.minimumLevel) return null;

    const ratio = item.quantity / item.minimumLevel;
    
    if (ratio <= 0.5) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {t('inventory.criticalItems')}
        </Badge>
      );
    }
    
    if (ratio <= 1) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center">
          {t('inventory.stockLevel')}: {t('common.low')}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
        {t('inventory.stockLevel')}: {t('common.ok')}
      </Badge>
    );
  };

  // Order item handler
  const handleOrderItem = (itemId: number) => {
    toast({
      title: t('inventory.orderNow'),
      description: t('common.success'),
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-4">{t('inventory.title')}</h1>
        
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
            
            {farms && farms.length > 0 && (
              <Select
                value={selectedFarmId?.toString()}
                onValueChange={(value) => setSelectedFarmId(parseInt(value))}
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
          </div>
          
          {/* Inventory buttons */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline"
              className="flex items-center text-gray-700"
              onClick={() => navigate('/inventory-transactions')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('inventory.transactions.title') || 'Transações'}
            </Button>
          
            {/* Add inventory button */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('inventory.addItem')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{t('inventory.addItem')}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('inventory.name')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('inventory.category')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('inventory.category')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="feed">{t('inventory.categories.feed')}</SelectItem>
                                <SelectItem value="medicine">{t('inventory.categories.medicine')}</SelectItem>
                                <SelectItem value="seeds">{t('inventory.categories.seeds')}</SelectItem>
                                <SelectItem value="fertilizer">{t('inventory.categories.fertilizer')}</SelectItem>
                                <SelectItem value="pesticide">{t('inventory.categories.pesticide')}</SelectItem>
                                <SelectItem value="fuel">{t('inventory.categories.fuel')}</SelectItem>
                                <SelectItem value="equipment">{t('inventory.categories.equipment')}</SelectItem>
                                <SelectItem value="other">{t('inventory.categories.other')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('inventory.quantity')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('inventory.unit')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('inventory.unit')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="kg">{t('inventory.units.kg')}</SelectItem>
                                <SelectItem value="l">{t('inventory.units.l')}</SelectItem>
                                <SelectItem value="units">{t('inventory.units.units')}</SelectItem>
                                <SelectItem value="bags">{t('inventory.units.bags')}</SelectItem>
                                <SelectItem value="boxes">{t('inventory.units.boxes')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="minimumLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('inventory.minimumLevel')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">{t('common.cancel')}</Button>
                      </DialogClose>
                      <Button type="submit" disabled={createInventoryItem.isPending}>
                        {createInventoryItem.isPending ? (
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
      </div>

      <Card>
        <CardHeader>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center">
              <CardTitle>{t('inventory.title')}</CardTitle>
              <TabsList>
                <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
                <TabsTrigger value="critical">{t('inventory.criticalItems')}</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoadingInventory || isLoadingCritical || isLoadingFarms ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredInventory && filteredInventory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('inventory.name')}</TableHead>
                    <TableHead>{t('inventory.category')}</TableHead>
                    <TableHead>{t('inventory.quantity')}</TableHead>
                    <TableHead>{t('inventory.minimumLevel')}</TableHead>
                    <TableHead>{t('inventory.stockLevel')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium flex items-center">
                        <Package className="h-4 w-4 mr-2 text-primary" />
                        {item.name}
                      </TableCell>
                      <TableCell>{t(`inventory.categories.${item.category}`)}</TableCell>
                      <TableCell>
                        {formatNumber(item.quantity, language)} {item.unit}
                      </TableCell>
                      <TableCell>
                        {item.minimumLevel ? formatNumber(item.minimumLevel, language) : '-'} {item.minimumLevel ? item.unit : ''}
                      </TableCell>
                      <TableCell>
                        {getStockLevelIndicator(item)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.minimumLevel && item.quantity <= item.minimumLevel && (
                            <Button variant="outline" size="sm" className="text-amber-600" onClick={() => handleOrderItem(item.id)}>
                              <Truck className="h-4 w-4 mr-1" />
                              {t('inventory.orderNow')}
                            </Button>
                          )}
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
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">{t('inventory.noItems')}</h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? t('common.noSearchResults') 
                  : t('inventory.addItem')
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
