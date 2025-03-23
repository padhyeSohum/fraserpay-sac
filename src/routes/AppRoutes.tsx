
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { routes, ProtectedRoute, RoleProtectedRoute, LoadingScreen } from './index';
import { toast } from 'sonner';

const AppRoutes: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const location = useLocation();
  
  // Monitor for prolonged loading to detect potential freezes
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // Show timeout warning after 10 seconds
      
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);
  
  // Reset timeout when route changes
  useEffect(() => {
    setLoadingTimeout(false);
  }, [location.pathname]);
  
  // Show clear loading message while auth is being determined
  if (isLoading) {
    console.log("App is in loading state, auth status not determined yet");
    return <LoadingScreen timeout={loadingTimeout} />;
  }
  
  console.log("App routes rendering, auth status:", isAuthenticated, "user role:", user?.role);

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
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            user?.role === 'sac' ? 
              <Navigate to="/sac/dashboard" replace /> : 
              <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
    </Routes>
  );
};

export default AppRoutes;
