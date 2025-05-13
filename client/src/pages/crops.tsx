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
import { formatDate, formatDistanceToNow } from '@/lib/i18n';
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
  Leaf,
  Map,
  Calendar,
  LayoutGrid,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function Crops() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
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
    crop.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Crop form schema
  const formSchema = insertCropSchema.omit({ 
    farmId: true 
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      sector: '',
      area: undefined,
      plantingDate: undefined,
      expectedHarvestDate: undefined,
      status: 'growing',
    },
  });

  // Create crop mutation
  const createCrop = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!selectedFarmId) throw new Error("No farm selected");
      const response = await apiRequest(
        'POST', 
        `/api/farms/${selectedFarmId}/crops`, 
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/farms', selectedFarmId, 'crops'] });
      toast({
        title: t('crops.cropAdded'),
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
    // Convert area to number
    const formattedData = {
      ...data,
      area: typeof data.area === 'string' ? parseInt(data.area) : data.area,
    };
    createCrop.mutate(formattedData);
  };

  // Status badge renderer
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {t('crops.statuses.planning')}
          </Badge>
        );
      case 'planting':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {t('crops.statuses.planting')}
          </Badge>
        );
      case 'growing':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {t('crops.statuses.growing')}
          </Badge>
        );
      case 'harvesting':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            {t('crops.statuses.harvesting')}
          </Badge>
        );
      case 'harvested':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {t('crops.statuses.harvested')}
          </Badge>
        );
      case 'fallow':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            {t('crops.statuses.fallow')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  // Calculate crop progress
  const getCropProgress = (crop: Crop) => {
    if (!crop.plantingDate || !crop.expectedHarvestDate) return 0;
    
    const start = new Date(crop.plantingDate).getTime();
    const end = new Date(crop.expectedHarvestDate).getTime();
    const now = Date.now();
    
    // If already past the expected harvest date
    if (now > end) return 100;
    
    // If before planting date
    if (now < start) return 0;
    
    // Calculate progress
    const totalDuration = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / totalDuration) * 100);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900 mb-4">{t('crops.title')}</h1>
        
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
          
          {/* Add crop button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('crops.addCrop')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{t('crops.addCrop')}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crops.area')}</FormLabel>
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
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crops.status')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('crops.status')} />
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
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="plantingDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crops.plantingDate')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value instanceof Date ? field.value.toISOString().substring(0, 10) : field.value || ''} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expectedHarvestDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('crops.harvestDate')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value instanceof Date ? field.value.toISOString().substring(0, 10) : field.value || ''} 
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
                    <Button type="submit" disabled={createCrop.isPending}>
                      {createCrop.isPending ? (
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

      <Card>
        <CardHeader>
          <CardTitle>{t('crops.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCrops || isLoadingFarms ? (
            <div className="flex justify-center items-center h-64">
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
                    <TableHead>{t('crops.plantingDate')}</TableHead>
                    <TableHead>{t('crops.harvestDate')}</TableHead>
                    <TableHead>{t('crops.status')}</TableHead>
                    <TableHead>{t('dashboard.progress')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCrops.map((crop) => (
                    <TableRow key={crop.id}>
                      <TableCell className="font-medium flex items-center">
                        <Leaf className="h-4 w-4 mr-2 text-primary" />
                        {crop.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Map className="h-4 w-4 mr-2 text-gray-500" />
                          {crop.sector}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <LayoutGrid className="h-4 w-4 mr-2 text-gray-500" />
                          {crop.area} ha
                        </div>
                      </TableCell>
                      <TableCell>
                        {crop.plantingDate ? (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            {formatDate(new Date(crop.plantingDate), 'P', language)}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {crop.expectedHarvestDate ? (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            {formatDate(new Date(crop.expectedHarvestDate), 'P', language)}
                            <br />
                            <span className="text-xs text-gray-500">
                              ({formatDistanceToNow(new Date(crop.expectedHarvestDate), language)})
                            </span>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(crop.status)}
                      </TableCell>
                      <TableCell>
                        {crop.plantingDate && crop.expectedHarvestDate && (
                          <div className="w-32">
                            <Progress value={getCropProgress(crop)} className="h-2" />
                            <div className="text-xs text-gray-500 mt-1">
                              {getCropProgress(crop)}% {t('dashboard.progress')}
                            </div>
                          </div>
                        )}
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
              <Leaf className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">{t('crops.noCrops')}</h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? t('common.noSearchResults') 
                  : t('crops.addCrop')
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
