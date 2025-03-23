
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { routes, ProtectedRoute, RoleProtectedRoute, LoadingScreen } from './index';
import { toast } from 'sonner';

const AppRoutes: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Handle loading timeout state
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000); // Show timeout warning after 5 seconds
      
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);
  
  // Reset loading timeout when path changes
  useEffect(() => {
    setLoadingTimeout(false);
  }, [location.pathname]);
  
  // Handle page refresh and direct URL access
  useEffect(() => {
    // Track page refreshes to maintain state
    const handleBeforeUnload = () => {
      sessionStorage.setItem('wasRefreshed', 'true');
      // Save current path for restoration after refresh
      sessionStorage.setItem('lastPath', location.pathname);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Handle page refresh or direct URL access
    const wasRefreshed = sessionStorage.getItem('wasRefreshed') === 'true';
    const lastPath = sessionStorage.getItem('lastPath');
    
    if (wasRefreshed && isAuthenticated) {
      // Restore the last path if it exists, otherwise go to dashboard
      if (lastPath && lastPath !== '/' && lastPath !== '/login' && lastPath !== '/register') {
        navigate(lastPath);
      } else if (location.pathname === '/' || location.pathname === '') {
        navigate('/dashboard');
      }
      sessionStorage.removeItem('wasRefreshed');
      sessionStorage.removeItem('lastPath');
    }
    
    // Direct URL access detection - ensure proper route handling
    if (!document.referrer && isAuthenticated) {
      console.log("Direct URL access detected, ensuring proper routing");
      
      if (location.pathname === '/' || location.pathname === '') {
        navigate('/dashboard');
      }
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated, navigate, location.pathname]);
  
  // Show loading screen for initial auth state determination, but with a timeout fallback
  if (isLoading) {
    console.log("App is in loading state, auth status not determined yet");
    return <LoadingScreen timeout={loadingTimeout} />;
  }
  
  console.log("App routes rendering, auth status:", isAuthenticated, "user role:", user?.role);

  // If we're at a protected route and not authenticated, redirect to login
  const isProtectedRoute = routes.some(route => 
    route.protected && 
    (location.pathname === route.path || 
     (route.path.includes(':') && location.pathname.startsWith(route.path.split(':')[0])))
  );

  if (isProtectedRoute && !isAuthenticated && !isLoading) {
    return <Navigate to="/login" replace />;
  }

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
