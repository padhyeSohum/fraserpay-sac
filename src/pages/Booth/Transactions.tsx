
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTransactions } from '@/contexts/TransactionContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import TransactionItem from '@/components/TransactionItem';
import TransactionReport from '@/components/TransactionReport';
import { Transaction } from '@/types';

const BoothTransactions = () => {
  const { boothId } = useParams<{ boothId: string }>();
  const { getBoothById, loadBoothTransactions } = useTransactions();
  
  const [booth, setBooth] = useState<ReturnType<typeof getBoothById>>(undefined);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'purchase'>('all');

  useEffect(() => {
    if (boothId) {
      const boothData = getBoothById(boothId);
      setBooth(boothData);
      
      if (boothData) {
        const boothTransactions = loadBoothTransactions(boothId);
        setTransactions(boothTransactions);
      }
    }
  }, [boothId, getBoothById, loadBoothTransactions]);

  const filteredTransactions = selectedType === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === selectedType);

  if (!booth) {
    return (
      <Layout title="Booth not found" showBack>
        <div className="text-center py-10">
          <p className="text-muted-foreground">The booth you're looking for could not be found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title={`${booth.name} Transactions`}
      showBack
    >
      <div className="space-y-6">
        <TransactionReport transactions={transactions} />
        
        <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as 'all' | 'purchase')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="purchase">Purchases Only</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedType} className="animate-fade-in">
            {filteredTransactions.length > 0 ? (
              <div className="space-y-3">
                {filteredTransactions.map(transaction => (
                  <TransactionItem 
                    key={transaction.id} 
                    transaction={transaction} 
                    showSupport
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default BoothTransactions;
