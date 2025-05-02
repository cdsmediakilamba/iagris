import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useLocation } from "wouter";

export default function NotFound() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              404 - {t('errors.notFound')}
            </h1>
            <p className="text-gray-600 mb-6">
              {t('errors.pageDoesNotExist')}
            </p>
            <Button 
              onClick={() => setLocation('/')}
              className="bg-primary hover:bg-primary-dark"
            >
              {t('common.backToDashboard')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
