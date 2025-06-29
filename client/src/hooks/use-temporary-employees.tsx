import { useQuery } from '@tanstack/react-query';
import { TemporaryEmployee } from '@shared/schema';

export const useTemporaryEmployees = (farmId?: number) => {
  return useQuery<TemporaryEmployee[]>({
    queryKey: ['/api/temporary-employees', farmId],
    enabled: !!farmId,
  });
};

export const useExpiringContracts = (farmId?: number) => {
  const { data: employees } = useTemporaryEmployees(farmId);
  
  if (!employees) return { count: 0, employees: [] };
  
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const expiringEmployees = employees.filter(employee => {
    const endDate = new Date(employee.endDate);
    return endDate >= today && endDate <= thirtyDaysFromNow;
  });
  
  return {
    count: expiringEmployees.length,
    employees: expiringEmployees
  };
};

export const getDaysRemaining = (endDate: string): number => {
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};