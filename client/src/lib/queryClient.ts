import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  options: {
    method?: string;
    data?: unknown | undefined;
  } = {}
): Promise<T> {
  const { method = "GET", data } = options;

  console.log(`API Request: ${method} ${url}`, data);
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log(`API Response: ${res.status} ${res.statusText}`);
  
  if (!res.ok) {
    const text = await res.text();
    console.error(`API Error: ${res.status} ${res.statusText}`, text);
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  
  const responseData = await res.json();
  console.log('API Response Data:', responseData);
  return responseData;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Query Request: GET ${queryKey[0]}`);
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    console.log(`Query Response: ${res.status} ${res.statusText}`);
    
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log('Returning null due to 401 status');
      return null;
    }

    if (!res.ok) {
      const text = await res.text();
      console.error(`Query Error: ${res.status} ${res.statusText}`, text);
      throw new Error(`${res.status}: ${text || res.statusText}`);
    }
    
    const responseData = await res.json();
    console.log('Query Response Data:', responseData);
    return responseData;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
