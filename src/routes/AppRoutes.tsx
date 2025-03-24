
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useTransactions } from "@/contexts/transactions";
import { routes, ProtectedRoute, RoleProtectedRoute, LoadingScreen } from './index';
import { toast } from 'sonner';

const AppRoutes: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { fetchAllBooths } = useTransactions();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const routeInitialized = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle loading timeout state
  useEffect(() => {
    if (isLoading) {
      timeoutRef.current = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000); // Show timeout warning after 5 seconds
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);
  
  // Reset loading timeout when path changes
  useEffect(() => {
    setLoadingTimeout(false);
  }, [location.pathname]);
  
  // Handle page refresh and direct URL access - optimize to run once
  useEffect(() => {
    if (routeInitialized.current) return;
    
    const handleRouteInitialization = async () => {
      // Only run once per session
      routeInitialized.current = true;
      
      console.log("Initializing routes on path:", location.pathname);
      
      // Handle direct URL access
      if (isAuthenticated && !isLoading) {
        // Ensure booths are loaded
        if (user) {
          try {
            await fetchAllBooths();
          } catch (error) {
            console.error("Error fetching booths:", error);
          }
        }
        
        // For root path, redirect to dashboard if authenticated
        if (location.pathname === '/' || location.pathname === '') {
          navigate('/dashboard', { replace: true });
        }
      }
    };
    
    // Always run route initialization after a short delay, even if still loading
    const initTimer = setTimeout(() => {
      handleRouteInitialization();
    }, 1000); // 1 second delay
    
    // Track page refreshes to maintain state
    const handleBeforeUnload = () => {
      sessionStorage.setItem('lastPath', location.pathname);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearTimeout(initTimer);
    };
  }, [isAuthenticated, isLoading, location.pathname, navigate, user, fetchAllBooths]);
  
  // Show loading screen for initial auth state determination, but proceed after 8 seconds
  // regardless of auth state to prevent permanent loading
  if (isLoading && !loadingTimeout) {
    console.log("App is in loading state, auth status not determined yet");
    return <LoadingScreen timeout={false} />;
  }
  
  console.log("App routes rendering, auth status:", isAuthenticated, "user role:", user?.role);

  return (
    <Routes>
      {routes.map((route, index) => {
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
        
        return <Route key={index} path={route.path} element={route.element} />;
      })}
      
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Catch-all route for 404 handling */}
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
};

export default AppRoutes;
