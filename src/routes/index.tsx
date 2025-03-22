
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

// Simple Loading component with more detailed message
export const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen p-4">
    <p className="text-sm mb-2">Loading Fraser Pay...</p>
    <p className="text-xs text-muted-foreground">This should only take a moment</p>
  </div>
);

// Simplified Protected Route
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
};

// Simplified Role-based protected route
export const RoleProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[] 
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  
  if (!isAuthenticated) {
    console.log("User not authenticated, redirecting to login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    console.log("User does not have required role, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};
