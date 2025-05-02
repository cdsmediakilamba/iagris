import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { Download, Filter, PawPrint } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Animal } from '@shared/schema';
import { format } from 'date-fns';

interface AnimalHealthTableProps {
  animals: Animal[];
  isLoading?: boolean;
}

export default function AnimalHealthTable({ animals, isLoading = false }: AnimalHealthTableProps) {
  const { t, language } = useLanguage();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {t('dashboard.healthy')}
          </Badge>
        );
      case 'monitor':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {t('dashboard.monitor')}
          </Badge>
        );
      case 'needs_attention':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            {t('dashboard.needsAttention')}
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

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex justify-between items-center pb-2">
          <CardTitle>{t('dashboard.animalHealth')}</CardTitle>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="space-y-2 w-full max-w-md">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center pb-2">
        <CardTitle>{t('dashboard.animalHealth')}</CardTitle>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">{t('dashboard.id')}</TableHead>
                <TableHead>{t('dashboard.animal')}</TableHead>
                <TableHead>{t('dashboard.breed')}</TableHead>
                <TableHead>{t('dashboard.lastVaccine')}</TableHead>
                <TableHead>{t('dashboard.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {animals.length > 0 ? (
                animals.map((animal) => (
                  <TableRow key={animal.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{animal.identificationCode}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <PawPrint className="h-4 w-4 text-gray-500 mr-2" />
                        <span>{t(`animals.${animal.species.toLowerCase()}`)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{animal.breed}</TableCell>
                    <TableCell>{formatDate(animal.lastVaccineDate)}</TableCell>
                    <TableCell>{getStatusBadge(animal.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                    {t('animals.noAnimals')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
