import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { Leaf } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Footer from "@/components/Footer";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { user, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
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

  // Handle login submission
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    login(values, () => {
      setIsLoading(false);
      setLocation('/');
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex flex-col sm:flex-row">
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
              {/* Login Form */}
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.username')}</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoading} />
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
                          <Input type="password" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? t('common.loading') : t('common.signIn')}
                  </Button>
                </form>
              </Form>
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
      <Footer />
    </div>
  );
}