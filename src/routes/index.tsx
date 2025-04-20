
// This file was modified to properly export all needed components for AppRoutes

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import Login from '@/pages/Auth/Login';
import Register from '@/pages/Auth/Register';
import NotFound from '@/pages/NotFound';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Student/Dashboard';
import AddFunds from '@/pages/Student/AddFunds';
import QRCode from '@/pages/Student/QRCode';
import Settings from '@/pages/Student/Settings';
import SACDashboard from '@/pages/SAC/Dashboard';
import BoothDashboard from '@/pages/Booth/Dashboard';
import BoothSell from '@/pages/Booth/Sell';
import BoothTransactions from '@/pages/Booth/Transactions';
import BoothSettings from '@/pages/Booth/Settings';
import BoothJoin from '@/pages/Booth/Join';
import Leaderboard from '@/pages/Leaderboard';

// Route definition type
export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  protected?: boolean;
  roles?: string[];
}

// Define all application routes
export const routes: RouteConfig[] = [
  {
    path: "/login",
    element: <Login />,
    protected: false
  },
  {
    path: "/register",
    element: <Register />,
    protected: false
  },
  {
    path: "/not-found",
    element: <NotFound />,
    protected: false
  },
  {
    path: "/landing",
    element: <Index />,
    protected: false
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
    protected: true
  },
  {
    path: "/add-funds",
    element: <AddFunds />,
    protected: true
  },
  {
    path: "/qrcode",
    element: <QRCode />,
    protected: true
  },
  {
    path: "/settings",
    element: <Settings />,
    protected: true
  },
  {
    path: "/sac/dashboard",
    element: <SACDashboard />,
    protected: true,
    roles: ["sac"]
  },
  {
    path: "/booth/dashboard",
    element: <BoothDashboard />,
    protected: true,
    roles: ["booth", "sac"]
  },
  {
    path: "/booth/sell",
    element: <BoothSell />,
    protected: true,
    roles: ["booth", "sac"]
  },
  {
    path: "/booth/transactions",
    element: <BoothTransactions />,
    protected: true,
    roles: ["booth", "sac"]
  },
  {
    path: "/booth/settings",
    element: <BoothSettings />,
    protected: true,
    roles: ["booth", "sac"]
  },
  {
    path: "/booth/join",
    element: <BoothJoin />,
    protected: true
  },
  {
    path: "/leaderboard",
    element: <Leaderboard />,
    protected: false
  }
];

// Protected route wrapper component
export const ProtectedRoute: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const isAuthenticated = true; // This will be replaced by actual auth logic in AppRoutes.tsx
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Role-based protected route
export const RoleProtectedRoute: React.FC<{children: React.ReactNode, allowedRoles: string[]}> = 
  ({ children, allowedRoles }) => {
  const isAuthenticated = true; // This will be replaced by actual auth logic in AppRoutes.tsx
  const userRole = "student"; // This will be replaced by actual role in AppRoutes.tsx
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Export the LoadingScreen component
interface LoadingScreenProps {
  timeout?: boolean;
  customMessage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  timeout = false, 
  customMessage 
}) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  const headerText = customMessage ? 
    (customMessage === "Signing in with Google" ? "Signing in with Google" : "Taking longer than expected") 
    : "Taking longer than expected";

  const descriptionText = customMessage === "Signing in with Google" 
    ? "PDSB WiFi slows down speeds during high-traffic. This page may take a minute to load." 
    : "The application is taking longer to load. This might be due to network issues.";

  const warningText = customMessage === "Signing in with Google" 
    ? "FraserPay does not work on the PDSB Media Network" 
    : "Slow PDSB WiFi detected. Try refreshing or connecting to a different network.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {headerText}
          </CardTitle>
          <CardDescription>
            {descriptionText}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {timeout && (
            <div className="flex items-center space-x-2 bg-yellow-50 p-3 rounded-md border border-yellow-200">
              <WifiOff className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {warningText}
              </span>
            </div>
          )}
          
          {timeout && (
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

