
import React from 'react';
import AppRoutes from './AppRoutes';
import { BrowserRouter } from 'react-router-dom';
import AppProviders from '@/providers/AppProviders';

// Import all route components to ensure they're properly loaded
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

const Routes = () => {
  return (
    <BrowserRouter>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </BrowserRouter>
  );
};

export default Routes;
