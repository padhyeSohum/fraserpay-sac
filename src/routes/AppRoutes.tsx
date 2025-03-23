import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Index from '@/pages/Index';
import Login from '@/pages/Auth/Login';
import Register from '@/pages/Auth/Register';
import Dashboard from '@/pages/Student/Dashboard';
import QRCode from '@/pages/Student/QRCode';
import StudentTransactions from '@/pages/Student/Transactions';
import StudentSettings from '@/pages/Student/Settings';
import Leaderboard from '@/pages/Leaderboard';
import BoothJoin from '@/pages/Booth/Join';
import BoothDashboard from '@/pages/Booth/Dashboard';
import BoothSell from '@/pages/Booth/Sell';
import BoothTransactions from '@/pages/Booth/Transactions';
import BoothSettings from '@/pages/Booth/Settings';
import SACDashboard from '@/pages/SAC/Dashboard';
import AddFunds from '@/pages/SAC/AddFunds';
import AdjustBalance from '@/pages/SAC/AdjustBalance';
import NotFound from '@/pages/NotFound';

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      
      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
        }
      />
      
      {/* Student Routes */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/qr-code"
        element={
          isAuthenticated ? <QRCode /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/transactions"
        element={
          isAuthenticated ? <StudentTransactions /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/settings"
        element={
          isAuthenticated ? <StudentSettings /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/leaderboard"
        element={
          isAuthenticated ? <Leaderboard /> : <Navigate to="/login" replace />
        }
      />
      
      {/* Booth Routes */}
      <Route
        path="/booth/join"
        element={
          isAuthenticated ? <BoothJoin /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/booth/:boothId"
        element={
          isAuthenticated ? <BoothDashboard /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/booth/:boothId/sell"
        element={
          isAuthenticated ? <BoothSell /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/booth/:boothId/transactions"
        element={
          isAuthenticated ? <BoothTransactions /> : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/booth/:boothId/settings"
        element={
          isAuthenticated ? <BoothSettings /> : <Navigate to="/login" replace />
        }
      />
      
      {/* SAC Routes */}
      <Route
        path="/sac/dashboard"
        element={
          isAuthenticated && user?.role === 'sac' ? (
            <SACDashboard />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/sac/add-funds"
        element={
          isAuthenticated && user?.role === 'sac' ? (
            <AddFunds />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/sac/adjust-balance"
        element={
          isAuthenticated && user?.role === 'sac' ? (
            <AdjustBalance />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      
      {/* Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
