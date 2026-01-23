// src/providers/QueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // This is the "engine" that was missing
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Optional settings: prevent annoying reload on mouse movement
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}