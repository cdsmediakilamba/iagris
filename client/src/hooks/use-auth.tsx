import { createContext, ReactNode, useContext, useState, useEffect } from "react";
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
  failedAttempts: number;
  isBlocked: boolean;
  timeRemaining: number;
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
  
  // Estados para controle de tentativas de login
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockEndTime, setBlockEndTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Efeito para o contador regressivo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isBlocked && blockEndTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, blockEndTime - now);
        setTimeRemaining(Math.ceil(remaining / 1000));
        
        if (remaining <= 0) {
          setIsBlocked(false);
          setFailedAttempts(0);
          setBlockEndTime(null);
          setTimeRemaining(0);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBlocked, blockEndTime]);
  
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
      
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      
      if (newFailedAttempts >= 3) {
        const blockTime = Date.now() + (10 * 60 * 1000); // 10 minutos
        setIsBlocked(true);
        setBlockEndTime(blockTime);
        setTimeRemaining(600); // 10 minutos em segundos
        
        toast({
          title: "Conta temporariamente bloqueada",
          description: "Muitas tentativas falhadas. Tente novamente em 10 minutos.",
          variant: "destructive",
        });
      } else {
        const attemptsLeft = 3 - newFailedAttempts;
        toast({
          title: "Dados de acesso incorretos",
          description: `Verifique seu nome de usuário e senha. Tentativas restantes: ${attemptsLeft}`,
          variant: "destructive",
        });
      }
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
    if (isBlocked) {
      toast({
        title: "Conta bloqueada",
        description: `Aguarde ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')} para tentar novamente.`,
        variant: "destructive",
      });
      return;
    }
    
    loginMutation.mutate(credentials, {
      onSuccess: () => {
        // Reset tentativas em caso de sucesso
        setFailedAttempts(0);
        setIsBlocked(false);
        setBlockEndTime(null);
        setTimeRemaining(0);
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
        logout,
        failedAttempts,
        isBlocked,
        timeRemaining
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
