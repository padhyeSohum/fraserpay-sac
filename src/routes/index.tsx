
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

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

// Route configuration for the application
export const routes = [
  // Auth Routes
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  
  // Student Routes with ProtectedRoute
  { 
    path: "/dashboard", 
    element: <Dashboard />,
    protected: true 
  },
  { 
    path: "/qr-code", 
    element: <QRCode />,
    protected: true 
  },
  { 
    path: "/settings", 
    element: <Settings />,
    protected: true 
  },
  
  // Booth Routes with ProtectedRoute
  { 
    path: "/booth/join", 
    element: <BoothJoin />,
    protected: true 
  },
  { 
    path: "/booth/:boothId", 
    element: <BoothDashboard />,
    protected: true 
  },
  { 
    path: "/booth/:boothId/sell", 
    element: <BoothSell />,
    protected: true 
  },
  { 
    path: "/booth/:boothId/transactions", 
    element: <BoothTransactions />,
    protected: true 
  },
  { 
    path: "/booth/:boothId/settings", 
    element: <BoothSettings />,
    protected: true 
  },
  
  // SAC Routes with RoleProtectedRoute
  { 
    path: "/sac/dashboard", 
    element: <SACDashboard />,
    protected: true,
    requiredRoles: ['sac']
  },
  
  // Shared Routes
  { 
    path: "/leaderboard", 
    element: <Leaderboard />,
    protected: true 
  },
  { 
    path: "/transactions", 
    element: <Navigate to="/dashboard" replace />,
    protected: true 
  },
  
  // Catch-all 404 route
  { path: "*", element: <NotFound /> }
];

// Simplified Loading component
export const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen">
    <p className="text-sm text-muted-foreground">Loading Fraser Pay...</p>
  </div>
);

// Protected Route component
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
};

// Role-based protected route
export const RoleProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[] 
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
};
