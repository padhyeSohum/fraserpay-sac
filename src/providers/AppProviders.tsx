
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TransactionProvider } from "@/contexts/TransactionContext";
import QueryProvider from "./QueryProvider";

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <React.StrictMode>
      <QueryProvider>
        <BrowserRouter>
          <AuthProvider>
            <TransactionProvider>
              <TooltipProvider delayDuration={0}>
                {children}
                <Toaster />
                <Sonner />
              </TooltipProvider>
            </TransactionProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryProvider>
    </React.StrictMode>
  );
};

export default AppProviders;
