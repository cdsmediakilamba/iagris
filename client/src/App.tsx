import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/pages/dashboard";
import Animals from "@/pages/animals";
import AnimalsNew from "@/pages/animals-new";
import AnimalDetails from "@/pages/animal-details";
import Crops from "@/pages/crops";
import Inventory from "@/pages/inventory";
import InventoryTransactions from "@/pages/inventory-transactions";
import Tasks from "@/pages/tasks";
import Goals from "@/pages/goals";
import Financial from "@/pages/financial";
import Employees from "@/pages/employees";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";
import Calendar from "@/pages/calendar";
import Reports from "@/pages/reports";
import Sync from "@/pages/sync";
import UserRegistration from "@/pages/user-registration";
import { UserRole } from "@shared/schema";
import { AuthProvider } from "@/hooks/use-auth";
import { LanguageProvider } from "@/context/LanguageContext";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/calendar" component={Calendar} />
      <ProtectedRoute path="/animals" component={Animals} />
      <ProtectedRoute path="/animals-new" component={AnimalsNew} />
      <ProtectedRoute path="/animals-new/:id" component={AnimalDetails} />
      <ProtectedRoute path="/crops" component={Crops} />
      <ProtectedRoute path="/inventory" component={Inventory} />
      <ProtectedRoute path="/inventory-transactions" component={InventoryTransactions} />
      <ProtectedRoute path="/tasks" component={Tasks} />
      <ProtectedRoute path="/farms/:farmId/goals" component={Goals} />
      <ProtectedRoute path="/financial" component={Financial} />
      <ProtectedRoute 
        path="/employees" 
        component={Employees} 
        allowedRoles={[UserRole.SUPER_ADMIN, UserRole.FARM_ADMIN, UserRole.MANAGER]} 
      />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute 
        path="/admin" 
        component={Admin} 
        allowedRoles={[UserRole.SUPER_ADMIN]} 
      />
      <ProtectedRoute path="/sync" component={Sync} />
      <ProtectedRoute 
        path="/user-registration" 
        component={UserRegistration} 
        allowedRoles={[UserRole.SUPER_ADMIN, UserRole.FARM_ADMIN]} 
      />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
