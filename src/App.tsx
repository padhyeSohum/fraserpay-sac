
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TransactionProvider } from "@/contexts/TransactionContext";

// Auth Pages
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";

// Student Pages
import Dashboard from "@/pages/Student/Dashboard";
import QRCode from "@/pages/Student/QRCode";
import Settings from "@/pages/Student/Settings";

// Booth Pages
import BoothJoin from "@/pages/Booth/Join";
import BoothDashboard from "@/pages/Booth/Dashboard";
import BoothSell from "@/pages/Booth/Sell";
import BoothTransactions from "@/pages/Booth/Transactions";
import BoothSettings from "@/pages/Booth/Settings";

// SAC Pages
import SACDashboard from "@/pages/SAC/Dashboard";

// Shared Pages
import Leaderboard from "@/pages/Leaderboard";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
};

// Role-based protected route
const RoleProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[] 
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Redirect based on authentication status and user role
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Specific redirect logic based on roles
      if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
        if (user.role === 'sac') {
          // Navigate to SAC dashboard for SAC members
          window.location.href = '/sac/dashboard';
        } else {
          // Navigate to regular dashboard for students
          window.location.href = '/dashboard';
        }
      }
    }
  }, [isAuthenticated, isLoading, user, location.pathname]);

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Student Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/qr-code" element={
        <ProtectedRoute>
          <QRCode />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      
      {/* Booth Routes */}
      <Route path="/booth/join" element={
        <ProtectedRoute>
          <BoothJoin />
        </ProtectedRoute>
      } />
      <Route path="/booth/:boothId" element={
        <ProtectedRoute>
          <BoothDashboard />
        </ProtectedRoute>
      } />
      <Route path="/booth/:boothId/sell" element={
        <ProtectedRoute>
          <BoothSell />
        </ProtectedRoute>
      } />
      <Route path="/booth/:boothId/transactions" element={
        <ProtectedRoute>
          <BoothTransactions />
        </ProtectedRoute>
      } />
      <Route path="/booth/:boothId/settings" element={
        <ProtectedRoute>
          <BoothSettings />
        </ProtectedRoute>
      } />
      
      {/* SAC Routes */}
      <Route path="/sac/dashboard" element={
        <RoleProtectedRoute allowedRoles={['sac']}>
          <SACDashboard />
        </RoleProtectedRoute>
      } />
      
      {/* Shared Routes */}
      <Route path="/leaderboard" element={
        <ProtectedRoute>
          <Leaderboard />
        </ProtectedRoute>
      } />
      <Route path="/transactions" element={
        <ProtectedRoute>
          <Navigate to="/dashboard" replace />
        </ProtectedRoute>
      } />
      
      {/* Redirect root to login or dashboard */}
      <Route path="/" element={
        isLoading ? (
          <div className="flex items-center justify-center h-screen">Loading...</div>
        ) : isAuthenticated ? (
          <Navigate to="/dashboard" replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TransactionProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppRoutes />
            </TooltipProvider>
          </TransactionProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
