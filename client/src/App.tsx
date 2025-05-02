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
import Crops from "@/pages/crops";
import Inventory from "@/pages/inventory";
import Tasks from "@/pages/tasks";
import Financial from "@/pages/financial";
import Employees from "@/pages/employees";
import Settings from "@/pages/settings";
import Admin from "@/pages/admin";
import { UserRole } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/animals" component={Animals} />
      <ProtectedRoute path="/crops" component={Crops} />
      <ProtectedRoute path="/inventory" component={Inventory} />
      <ProtectedRoute path="/tasks" component={Tasks} />
      <ProtectedRoute path="/financial" component={Financial} />
      <ProtectedRoute 
        path="/employees" 
        component={Employees} 
        allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]} 
      />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute 
        path="/admin" 
        component={Admin} 
        allowedRoles={[UserRole.ADMIN]} 
      />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
