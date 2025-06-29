import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertCropSchema, Crop } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
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
  Leaf,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CropsCalendar from '@/components/calendar/CropsCalendar';

export default function Crops() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

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

  // Get crops for selected farm
  const { data: crops, isLoading: isLoadingCrops } = useQuery<Crop[]>({
    queryKey: ['/api/farms', selectedFarmId, 'crops'],
    enabled: !!selectedFarmId,
  });

  // Filter crops by search term
  const filteredCrops = crops?.filter(crop => 
    crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    crop.sector?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Simplified crop form schema 
  const formSchema = z.object({
    name: z.string().min(1, { message: t('validation.required') }),
    sector: z.string().min(1, { message: t('validation.required') }),
    area: z.number().min(1, { message: t('validation.positive') }),
    status: z.string().min(1, { message: t('validation.required') }),
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      sector: '',
      area: 0,
      status: 'growing',
    },
  });

  // Create crop mutation
  const createCrop = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!selectedFarmId) throw new Error("No farm selected");
      
      // Add farmId and default plantingDate to data
      const cropData = {
        ...data,
        farmId: selectedFarmId,
        plantingDate: new Date(),
        expectedHarvestDate: null
      };
      
      const response = await apiRequest(
        `/api/farms/${selectedFarmId}/crops`, 
        {
          method: 'POST',
          data: cropData
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'crops'] });
      toast({
        title: t('crops.cropAdded'),
        description: t('common.success'),
      });
      form.reset({
        name: '',
        sector: '',
        area: 0,
        status: 'growing',
      });
      setIsOpen(false);
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
    createCrop.mutate(data);
  };

  // Status badge renderer
  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { bg: string, text: string, border: string }> = {
      planning: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      planting: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      growing: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      harvesting: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      harvested: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
      fallow: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    };
    
    const styles = statuses[status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
    
    return (
      <Badge variant="outline" className={`${styles.bg} ${styles.text} ${styles.border}`}>
        {t(`crops.statuses.${status}`) || status}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-4">{t('crops.title')}</h1>
      </div>

      <Tabs defaultValue="crops" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="crops" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Culturas
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crops" className="space-y-6">
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
                value={selectedFarmId?.toString() || ''}
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
          
          {/* Add crop button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('crops.addCrop')}
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{t('crops.addCrop')}</SheetTitle>
                <SheetDescription>
                  {t('crops.addCropDescription') || 'Preencha os campos para adicionar uma nova plantação.'}
                </SheetDescription>
              </SheetHeader>
              
              <div className="py-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crops.name')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crops.sector')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crops.area')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value))} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crops.status')}</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('crops.selectStatus') || 'Selecione o status'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="planning">{t('crops.statuses.planning')}</SelectItem>
                              <SelectItem value="planting">{t('crops.statuses.planting')}</SelectItem>
                              <SelectItem value="growing">{t('crops.statuses.growing')}</SelectItem>
                              <SelectItem value="harvesting">{t('crops.statuses.harvesting')}</SelectItem>
                              <SelectItem value="harvested">{t('crops.statuses.harvested')}</SelectItem>
                              <SelectItem value="fallow">{t('crops.statuses.fallow')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <SheetFooter className="pt-4">
                      <SheetClose asChild>
                        <Button type="button" variant="outline">
                          {t('common.cancel')}
                        </Button>
                      </SheetClose>
                      <Button 
                        type="submit" 
                        disabled={createCrop.isPending}
                      >
                        {createCrop.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('common.loading')}
                          </>
                        ) : (
                          t('common.save')
                        )}
                      </Button>
                    </SheetFooter>
                  </form>
                </Form>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('crops.cropsList')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCrops || isLoadingFarms ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCrops && filteredCrops.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('crops.name')}</TableHead>
                    <TableHead>{t('crops.sector')}</TableHead>
                    <TableHead>{t('crops.area')}</TableHead>
                    <TableHead>{t('crops.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCrops.map((crop) => (
                    <TableRow key={crop.id}>
                      <TableCell className="font-medium">{crop.name}</TableCell>
                      <TableCell>{crop.sector}</TableCell>
                      <TableCell>{crop.area} m²</TableCell>
                      <TableCell>{getStatusBadge(crop.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10">
              <Leaf className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {t('crops.noCrops') || 'Nenhuma plantação encontrada'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? (t('common.noSearchResults') || 'Nenhuma plantação encontrada para essa busca') 
                  : (t('crops.addCropPrompt') || 'Clique no botão adicionar para criar uma nova plantação')
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          {selectedFarmId && Array.isArray(crops) && crops.length >= 0 ? (
            <CropsCalendar farmId={selectedFarmId} crops={crops} />
          ) : (
            <div className="text-center py-10">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {t('calendar.loading') || 'Carregando calendário...'}
              </h3>
              <p className="text-gray-500">
                {selectedFarmId 
                  ? (t('calendar.loadingEvents') || 'Aguarde enquanto carregamos os eventos do calendário') 
                  : (t('calendar.selectFarm') || 'Selecione uma fazenda para ver o calendário')
                }
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}