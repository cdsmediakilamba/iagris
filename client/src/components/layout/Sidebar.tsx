import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useLocation } from 'wouter';
import { UserRole } from '@shared/schema';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useExpiringContracts } from '@/hooks/use-temporary-employees';
import {
  Calendar,
  LayoutDashboard,
  CheckSquare,
  Leaf,
  PawPrint,
  Warehouse,
  Users,
  DollarSign,
  FileText,
  ShieldAlert,
  RefreshCw,
  WifiOff,
  Target,
  BarChart3,
  Package,
  UserCheck,
  AlertTriangle,
  ShoppingCart
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Get the first farm ID if user is super admin, otherwise use their farm ID
  const farmId = user?.role === UserRole.SUPER_ADMIN ? 6 : (user?.farmId ?? undefined); // Using default farm ID 6 for now
  const { count: expiringCount } = useExpiringContracts(farmId);

  const isAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isFarmAdmin = user?.role === UserRole.FARM_ADMIN;
  const isManager = user?.role === UserRole.MANAGER || isAdmin;
  
  // Only Super Admin and Farm Admin can access temporary employees
  const canAccessTempEmployees = isAdmin || isFarmAdmin;

  const sidebarItems = [
    {
      title: t('common.dashboard'),
      icon: <LayoutDashboard className="mr-4 h-5 w-5" />,
      path: '/',
      active: location === '/',
    },
    {
      title: t('common.calendar'),
      icon: <Calendar className="mr-4 h-5 w-5" />,
      path: '/calendar',
      active: location === '/calendar',
    },
    {
      title: t('common.goals'),
      icon: <Target className="mr-4 h-5 w-5" />,
      path: `/farms/${user?.farmId || 12}/goals`,
      active: location.includes('/goals'),
    },
    {
      title: t('common.animals'),
      icon: <PawPrint className="mr-4 h-5 w-5" />,
      path: '/animals',
      active: location === '/animals',
      show: false, // Ocultar a página animals do menu
    },
    {
      title: t('common.animals'),
      icon: <PawPrint className="mr-4 h-5 w-5" />,
      path: '/animals-new',
      active: location === '/animals-new',
    },
    {
      title: t('common.crops'),
      icon: <Leaf className="mr-4 h-5 w-5" />,
      path: '/crops',
      active: location === '/crops',
    },
    {
      title: t('common.inventory'),
      icon: <Warehouse className="mr-4 h-5 w-5" />,
      path: '/inventory',
      active: location === '/inventory',
    },
    {
      title: t('inventory.transactions.title') || 'Transações de Inventário',
      icon: <BarChart3 className="mr-4 h-5 w-5" />,
      path: '/inventory-transactions',
      active: location === '/inventory-transactions',
    },
    {
      title: t('common.employees'),
      icon: <Users className="mr-4 h-5 w-5" />,
      path: '/employees',
      active: location === '/employees',
      show: isManager,
    },
    {
      title: t('common.temporaryEmployees'),
      icon: <UserCheck className="mr-4 h-5 w-5" />,
      path: '/temporary-employees',
      active: location === '/temporary-employees',
      show: canAccessTempEmployees,
      badge: expiringCount > 0 ? expiringCount : undefined,
    },
    {
      title: t('common.finance'),
      icon: <DollarSign className="mr-4 h-5 w-5" />,
      path: '/financial',
      active: location === '/financial',
      show: isManager,
    },
    {
      title: t('common.costs') || 'Custos',
      icon: <BarChart3 className="mr-4 h-5 w-5" />,
      path: '/costs',
      active: location === '/costs' || location.includes('/costs'),
    },
    {
      title: 'Solicitações de Compras',
      icon: <ShoppingCart className="mr-4 h-5 w-5" />,
      path: '/solicitacoes',
      active: location === '/solicitacoes',
      show: canAccessTempEmployees, // Apenas Super Admin e Farm Admin
    },
    {
      title: t('common.reports'),
      icon: <FileText className="mr-4 h-5 w-5" />,
      path: '/reports',
      active: location === '/reports',
    },
    {
      title: t('common.admin'),
      icon: <ShieldAlert className="mr-4 h-5 w-5" />,
      path: '/admin',
      active: location === '/admin',
      show: isAdmin,
    },
    {
      title: t('common.sync'),
      icon: <RefreshCw className="mr-4 h-5 w-5" />,
      path: '/sync',
      active: location === '/sync',
    },
  ];

  // Filter sidebar items based on user role
  const filteredItems = sidebarItems.filter(item => item.show !== false);

  const renderNavItem = (item: typeof sidebarItems[0], index: number) => (
    <a
      key={index}
      href={item.path}
      onClick={(e) => {
        e.preventDefault();
        setLocation(item.path);
      }}
      className={cn(
        "flex items-center px-4 py-3 rounded-md mb-1 relative",
        item.active 
          ? "bg-primary border-l-4 border-primary pl-3" 
          : "text-gray-900 hover:bg-gray-100"
      )}
    >
      <div className={cn("mr-4 h-5 w-5", item.active ? "text-white" : "")}>
        {item.icon}
      </div>
      <span className={cn(
        "text-sm flex-1",
        item.active ? "text-white font-medium" : "text-gray-900"
      )}>
        {item.title}
      </span>
      {(item as any).badge && (
        <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center">
          {(item as any).badge}
        </span>
      )}
    </a>
  );

  return (
    <aside className={cn(
      "sidebar bg-white shadow-md lg:block fixed lg:relative z-20 h-full",
      isOpen ? "open" : ""
    )}>
      <div className="h-full flex flex-col">
        <div className="overflow-y-auto flex-grow">
          <nav className="p-4">
            <div className="mb-4">
              <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('common.dashboard') || 'Dashboard'}
              </h2>
              {filteredItems.slice(0, 4).map((item, index) => renderNavItem(item, index))}
            </div>
            
            <div className="mb-4">
              <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('common.management') || 'Gestão'}
              </h2>
              {filteredItems.slice(4, 10).map((item, index) => renderNavItem(item, index))}
            </div>
            
            <div>
              <h2 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('common.system') || 'Sistema'}
              </h2>
              {filteredItems.slice(10).map((item, index) => renderNavItem(item, index))}
            </div>
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gray-100 rounded-md p-3">
            <div className="flex items-center mb-2">
              <WifiOff className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm font-medium">
                {t('common.offline')}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {t('common.offlineMessage')}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}