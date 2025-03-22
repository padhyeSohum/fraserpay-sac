
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TransactionProvider } from "@/contexts/TransactionContext";
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
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </TransactionProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryProvider>
  );
};

export default AppProviders;
