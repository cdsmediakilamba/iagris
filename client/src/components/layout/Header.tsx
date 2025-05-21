import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  ChevronDown,
  Menu,
  LogOut,
  User,
  Settings,
  AlertTriangle,
  AlertCircle,
  Info,
  Check
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

interface HeaderProps {
  toggleSidebar: () => void;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'warning' | 'error' | 'info' | 'success';
  forUser?: number | null; // ID do usuário específico ou null para todos
  forRole?: string | null; // Função específica ou null para todos
  isRead: boolean;
  farmId?: number | null; // ID da fazenda específica ou null para todos
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout(() => {
      setLocation('/auth');
    });
  };

  const handleLanguageToggle = (checked: boolean) => {
    setLanguage(checked ? 'en' : 'pt');
  };

  // Função para filtrar notificações com base no usuário atual
  const filterNotificationsForUser = (allNotifications: Notification[]) => {
    if (!user) return [];

    return allNotifications.filter(notification => {
      // Se a notificação é para um usuário específico, verificar se é o usuário atual
      if (notification.forUser && notification.forUser !== user.id) {
        return false;
      }
      
      // Se a notificação é para uma função específica, verificar se o usuário tem essa função
      if (notification.forRole && notification.forRole !== user.role) {
        return false;
      }
      
      // Se a notificação é para uma fazenda específica, verificar se o usuário tem acesso a essa fazenda
      if (notification.farmId && user.farmId !== notification.farmId) {
        // No caso de super_admin ou outros casos especiais, pode não precisar dessa verificação
        if (user.role !== 'super_admin') {
          return false;
        }
      }
      
      return true;
    });
  };

  // Carregar notificações do sistema
  useEffect(() => {
    // Em uma implementação real, isso viria de uma API
    const mockNotifications: Notification[] = [
      {
        id: 1,
        title: t('notifications.taskUpdate'),
        message: t('notifications.needsAttention'),
        time: '10:45',
        type: 'warning',
        forUser: null, // Para todos os usuários
        forRole: null, // Para todas as funções
        isRead: false,
        farmId: 6
      },
      {
        id: 2,
        title: t('notifications.animalHealth'),
        message: t('dashboard.sector') + ' 3',
        time: '09:30',
        type: 'error',
        forUser: null,
        forRole: 'farm_admin', // Apenas para administradores de fazenda
        isRead: false,
        farmId: 6
      },
      {
        id: 3,
        title: t('notifications.inventoryAlert'),
        message: t('inventory.categories.feed'),
        time: '16:20',
        type: 'info',
        forUser: 10, // ID do usuário específico
        forRole: null,
        isRead: false,
        farmId: null // Para todas as fazendas
      },
      {
        id: 4,
        title: t('notifications.systemAlert'),
        message: t('notifications.generalNotification'),
        time: '14:05',
        type: 'success',
        forUser: null,
        forRole: 'super_admin', // Apenas para super administradores
        isRead: false,
        farmId: null
      }
    ];
    
    // Filtrar notificações para o usuário atual
    const userNotifications = filterNotificationsForUser(mockNotifications);
    setNotifications(userNotifications);
    
    // Atualizar contador de não lidas
    setUnreadCount(userNotifications.filter(n => !n.isRead).length);
  }, [t, user]);

  // Marcar uma notificação como lida
  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
    
    // Atualizar contador
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Marcar todas as notificações como lidas
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);
  };

  return (
    <header className="bg-white shadow-md z-10">
      <div className="flex justify-between items-center px-4 py-2">
        <div className="flex items-center">
          <Button
            variant="ghost"
            className="lg:hidden mr-2 text-gray-600 hover:text-primary"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <span className="text-primary mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </span>
            <h1 className="text-xl font-medium text-primary">
              {t('common.appName')}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Language Toggle */}
          <div className="flex items-center">
            <span className="mr-2 text-sm font-medium">PT</span>
            <Switch
              checked={language === 'en'}
              onCheckedChange={handleLanguageToggle}
            />
            <span className="ml-2 text-sm font-medium">EN</span>
          </div>

          {/* Notifications */}
          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative p-1 rounded-full text-gray-600 hover:bg-gray-100">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center bg-destructive text-white text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80">
              <DropdownMenuLabel className="border-b border-gray-200 py-3 flex justify-between items-center">
                <span>{t('notifications.title')}</span>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-primary"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                  >
                    {t('notifications.markAllAsRead')}
                  </Button>
                )}
              </DropdownMenuLabel>
              
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {t('notifications.noNotifications')}
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${notification.isRead ? 'opacity-70' : 'bg-blue-50'}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start w-full">
                        <div className={`mr-3 flex-shrink-0 ${
                          notification.type === 'warning' ? 'text-amber-500' : 
                          notification.type === 'error' ? 'text-red-500' : 
                          notification.type === 'success' ? 'text-green-500' :
                          'text-blue-500'
                        }`}>
                          {notification.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
                          {notification.type === 'error' && <AlertCircle className="h-5 w-5" />}
                          {notification.type === 'success' && <Check className="h-5 w-5" />}
                          {notification.type === 'info' && <Info className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <p className="text-sm font-medium">
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full ml-2"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {t('common.today')}, {notification.time}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              
              <div className="p-2 bg-gray-50">
                <Button 
                  variant="ghost" 
                  className="w-full py-2 text-sm text-center text-primary"
                  onClick={() => {
                    setNotificationsOpen(false);
                    setLocation('/notifications');
                  }}
                >
                  {t('notifications.viewAll')}
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center text-gray-600 hover:text-primary">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt={user?.name || 'User'} />
                  <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span className="font-medium hidden sm:inline mr-1">{user?.name || 'User'}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel className="border-b border-gray-200 py-3">
                <div className="font-medium">{user?.name}</div>
                <div className="text-sm text-gray-500">
                  {t(`employees.roles.${user?.role}`)}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem className="flex items-center p-3 cursor-pointer" onClick={() => setLocation('/profile')}>
                <User className="mr-2 h-4 w-4 text-gray-500" />
                <span>{t('common.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center p-3 cursor-pointer" onClick={() => setLocation('/settings')}>
                <Settings className="mr-2 h-4 w-4 text-gray-500" />
                <span>{t('common.settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center p-3 cursor-pointer text-red-500" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('common.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
