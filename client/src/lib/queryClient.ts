import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage: string;
    try {
      // First try to parse as JSON for structured error
      const errorJson = await res.json();
      errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
    } catch (e) {
      // If JSON parsing fails, fall back to text
      try {
        errorMessage = await res.text();
      } catch (textError) {
        // If all fails, use status text
        errorMessage = res.statusText || 'Unknown error';
      }
    }
    console.error(`API error ${res.status}:`, errorMessage);
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    console.log(`API Request: ${method} ${url}`, data ? { data } : '');
    
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    console.log(`API Response: ${res.status} ${res.statusText}`);
    
    // Clone the response before checking if it's ok (since reading the body is destructive)
    const clonedRes = res.clone();
    
    // Check if response is not ok and throw appropriate error
    if (!res.ok) {
      let errorMessage: string;
      try {
        // First try to parse as JSON for structured error
        const errorJson = await res.json();
        errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } catch (e) {
        // If JSON parsing fails, fall back to text
        try {
          errorMessage = await res.text();
        } catch (textError) {
          // If all fails, use status text
          errorMessage = res.statusText || 'Unknown error';
        }
      }
      console.error(`API error ${res.status}:`, errorMessage);
      throw new Error(`${res.status}: ${errorMessage}`);
    }
    
    return clonedRes;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
