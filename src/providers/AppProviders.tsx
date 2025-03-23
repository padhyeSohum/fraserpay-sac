
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth";
import { TransactionProvider } from "@/contexts/transactions/TransactionContext";
import QueryProvider from "./QueryProvider";

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <QueryProvider>
      <BrowserRouter>
        <AuthProvider>
          <TransactionProvider>
            <TooltipProvider delayDuration={0}>
              {children}
              {/* Use only one toast system to prevent DOM conflicts */}
              <Sonner 
                closeButton 
                richColors 
                position="top-right" 
                toastOptions={{
                  className: "!bg-background",
                  style: { 
                    borderColor: "hsl(var(--border))",
                    backgroundColor: "hsl(var(--background))",
                    color: "hsl(var(--foreground))"
                  }
                }}
              />
            </TooltipProvider>
          </TransactionProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryProvider>
  );
};

export default AppProviders;
