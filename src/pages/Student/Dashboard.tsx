
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import TransactionItem from '@/components/TransactionItem';
import BoothCard from '@/components/BoothCard';
import { QrCode, ListOrdered, Settings, Plus } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy } from 'firebase/firestore';
import { firestore } from '@/integrations/firebase/client';
import { toast } from 'sonner';
