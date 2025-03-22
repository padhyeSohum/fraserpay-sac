
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { routes, ProtectedRoute, RoleProtectedRoute, LoadingScreen } from './index';

const AppRoutes: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [redirectChecked, setRedirectChecked] = useState(false);

  // Simplified effect to handle initial routing only once
  useEffect(() => {
    // Only run this effect once after authentication is established
    if (!isLoading && !redirectChecked) {
      console.log("Initial route check - Auth status:", isAuthenticated, "Path:", location.pathname);
      setRedirectChecked(true);
    }
  }, [isLoading, isAuthenticated, location.pathname, redirectChecked]);

  // If still loading auth state, show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {routes.map((route, index) => {
        // Handle routes that require authentication
        if (route.protected) {
          if (route.requiredRoles) {
            return (
              <Route 
                key={index} 
                path={route.path} 
                element={
                  <RoleProtectedRoute allowedRoles={route.requiredRoles}>
                    {route.element}
                  </RoleProtectedRoute>
                } 
              />
            );
          }
          
          return (
            <Route 
              key={index} 
              path={route.path} 
              element={
                <ProtectedRoute>
                  {route.element}
                </ProtectedRoute>
              } 
            />
          );
        }
        
        // Regular routes without authentication
        return <Route key={index} path={route.path} element={route.element} />;
      })}
      
      {/* Root route redirects based on auth status */}
      <Route path="/" element={
        isLoading ? (
          <LoadingScreen />
        ) : isAuthenticated ? (
          user?.role === 'sac' ? 
            <Navigate to="/sac/dashboard" replace /> : 
            <Navigate to="/dashboard" replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
    </Routes>
  );
};

export default AppRoutes;
