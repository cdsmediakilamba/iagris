import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/context/LanguageContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertUserSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Leaf } from 'lucide-react';

// Login schema only needs username and password
const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

// Register schema extends the insertUserSchema with password confirmation
const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('login');
  
  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  // Login form setup
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Register form setup
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      email: '',
      role: 'employee',
      language: 'pt',
    },
  });

  // Handle login submission
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        setLocation('/');
      }
    });
  };

  // Handle registration submission
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    // Remove confirmPassword as it's not part of the schema
    const { confirmPassword, ...userData } = values;
    
    registerMutation.mutate(userData, {
      onSuccess: () => {
        setLocation('/');
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-gray-50">
      {/* Auth Forms Section */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <div className="rounded-full bg-primary bg-opacity-10 p-2">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">{t('auth.welcome')}</CardTitle>
            <CardDescription>{t('auth.subTitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
                <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.username')}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={loginMutation.isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.password')}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} disabled={loginMutation.isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? t('common.loading') : t('common.signIn')}
                    </Button>
                  </form>
                </Form>
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">
                    {t('auth.dontHaveAccount')}{' '}
                    <Button 
                      variant="link" 
                      className="p-0" 
                      onClick={() => setActiveTab('register')}
                    >
                      {t('auth.createAccount')}
                    </Button>
                  </p>
                </div>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.username')}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={registerMutation.isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.name')}</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={registerMutation.isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.email')}</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} disabled={registerMutation.isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('common.role')}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value} 
                              disabled={registerMutation.isPending}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('common.role')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="employee">{t('employees.roles.employee')}</SelectItem>
                                <SelectItem value="manager">{t('employees.roles.manager')}</SelectItem>
                                <SelectItem value="admin">{t('employees.roles.admin')}</SelectItem>
                                <SelectItem value="veterinarian">{t('employees.roles.veterinarian')}</SelectItem>
                                <SelectItem value="agronomist">{t('employees.roles.agronomist')}</SelectItem>
                                <SelectItem value="consultant">{t('employees.roles.consultant')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.language')}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={registerMutation.isPending}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('settings.language')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pt">{t('settings.languageOptions.pt')}</SelectItem>
                                <SelectItem value="en">{t('settings.languageOptions.en')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.password')}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} disabled={registerMutation.isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.confirmPassword')}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} disabled={registerMutation.isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? t('common.loading') : t('common.signUp')}
                    </Button>
                  </form>
                </Form>
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">
                    {t('auth.alreadyHaveAccount')}{' '}
                    <Button 
                      variant="link" 
                      className="p-0" 
                      onClick={() => setActiveTab('login')}
                    >
                      {t('auth.loginToAccount')}
                    </Button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Hero Section */}
      <div className="flex-1 bg-primary hidden sm:flex items-center justify-center p-8">
        <div className="max-w-md text-white text-center">
          <div className="mb-4">
            <Leaf className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-4">{t('auth.welcome')}</h1>
          <p className="text-lg mb-6">{t('auth.subTitle')}</p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{t('common.animals')}</h3>
              <p className="text-sm">{t('animals.title')}</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{t('common.crops')}</h3>
              <p className="text-sm">{t('crops.title')}</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{t('common.inventory')}</h3>
              <p className="text-sm">{t('inventory.title')}</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{t('common.offline')}</h3>
              <p className="text-sm">{t('common.offlineMessage')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
