
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { routes, ProtectedRoute, RoleProtectedRoute, LoadingScreen } from './index';

const AppRoutes: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [initialRedirectComplete, setInitialRedirectComplete] = useState(false);

  // Redirect based on authentication status and user role only once during initial load
  useEffect(() => {
    // Only execute this logic on initial page load and when auth loading is complete
    if (!isLoading && !initialRedirectComplete) {
      if (isAuthenticated && user) {
        // Only redirect if we're at login, register, or root
        if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/') {
          if (user.role === 'sac') {
            window.location.href = '/sac/dashboard';
          } else {
            window.location.href = '/dashboard';
          }
        }
      }
      setInitialRedirectComplete(true);
    }
  }, [isAuthenticated, isLoading, user, location.pathname, initialRedirectComplete]);

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
      
      {/* Root route special case */}
      <Route path="/" element={
        isLoading ? (
          <LoadingScreen />
        ) : isAuthenticated ? (
          <Navigate to="/dashboard" replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
    </Routes>
  );
};

export default AppRoutes;
