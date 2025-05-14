import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser } from "@shared/schema";
import { getQueryFn, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Tipo do contexto de autenticação
type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: LoginData, onSuccess?: () => void) => void;
  register: (userData: RegisterData, onSuccess?: () => void) => void;
  logout: (onSuccess?: () => void) => void;
};

// Schema para login (apenas username e password)
const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof insertUserSchema>;

// Criação do contexto de autenticação
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Consulta para obter dados do usuário atual
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Tentando login com:", credentials);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || response.statusText);
      }

      return await response.json();
    },
    onSuccess: () => {
      refetch(); // Recarregar dados do usuário após login bem-sucedido
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo de volta ao FarmManager Pro",
      });
    },
    onError: (error: Error) => {
      console.error("Erro de login:", error);
      toast({
        title: "Falha no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para registro
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || response.statusText);
      }

      return await response.json();
    },
    onSuccess: () => {
      refetch(); // Recarregar dados do usuário após registro bem-sucedido
      toast({
        title: "Registro bem-sucedido",
        description: "Bem-vindo ao FarmManager Pro",
      });
    },
    onError: (error: Error) => {
      console.error("Erro de registro:", error);
      toast({
        title: "Falha no registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || response.statusText);
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout realizado",
        description: "Você saiu com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Funções de wrapper para as mutations
  const login = (credentials: LoginData, onSuccess?: () => void) => {
    loginMutation.mutate(credentials, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
      }
    });
  };

  const register = (userData: RegisterData, onSuccess?: () => void) => {
    registerMutation.mutate(userData, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
      }
    });
  };

  const logout = (onSuccess?: () => void) => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
      }
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
