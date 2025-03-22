
import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { routes, ProtectedRoute, RoleProtectedRoute, LoadingScreen } from './index';

const AppRoutes: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // Show clear loading message while auth is being determined
  if (isLoading) {
    console.log("App is in loading state, auth status not determined yet");
    return <LoadingScreen />;
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
