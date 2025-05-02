import React, { useState } from 'react';
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
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation('/auth');
  };

  const handleLanguageToggle = (checked: boolean) => {
    setLanguage(checked ? 'en' : 'pt');
  };

  // Mock notifications for UI display
  const notifications = [
    {
      id: 1,
      title: t('dashboard.pendingTasks'),
      message: t('animals.status.needsAttention'),
      icon: 'warning',
      time: '10:45',
      type: 'warning',
    },
    {
      id: 2,
      title: t('crops.pestControl'),
      message: t('dashboard.sector') + ' 3',
      icon: 'pest_control',
      time: '09:30',
      type: 'error',
    },
    {
      id: 3,
      title: t('inventory.stockLevel'),
      message: t('inventory.categories.feed'),
      icon: 'inventory',
      time: '16:20',
      type: 'info',
    },
  ];

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
                <Badge className="absolute top-0 right-0 h-4 w-4 p-0 flex items-center justify-center bg-destructive text-white text-xs">
                  {notifications.length}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72">
              <DropdownMenuLabel className="border-b border-gray-200 py-3">
                {t('notifications.title')}
              </DropdownMenuLabel>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-start">
                      <div className={`mr-2 ${
                        notification.type === 'warning' ? 'text-amber-500' : 
                        notification.type === 'error' ? 'text-red-500' : 
                        'text-blue-500'
                      }`}>
                        {notification.type === 'warning' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>}
                        {notification.type === 'error' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>}
                        {notification.type === 'info' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('common.today')}, {notification.time}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              <div className="p-2 bg-gray-50">
                <Button variant="ghost" className="w-full py-2 text-sm text-center text-primary">
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
