// src/providers/QueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // هذا هو "المحرك" الذي كان ناقصاً
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // إعدادات اختيارية: تمنع إعادة التحميل المزعجة بمجرد تحريك الماوس
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