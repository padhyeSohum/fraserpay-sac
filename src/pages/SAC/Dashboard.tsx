
// Only update the loadTransactions function in the SAC Dashboard
loadTransactions = async () => {
  setIsTransactionLoading(true);
  try {
    const transactionsRef = collection(firestore, 'transactions');
    const q = query(transactionsRef, orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const txs = querySnapshot.docs.map(doc => {
      const txData = doc.data();
      txData.id = doc.id;
      return txData;
    });
    
    console.log('SAC Dashboard: Loaded transactions from Firebase', txs.length);
    setTransactions(txs);
    
    // Calculate total revenue from booth sales, not all transactions
    const boothTransactions = txs.filter(tx => tx.type === 'purchase');
    const boothRevenue = boothTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    // Calculate total funds added
    const fundTransactions = txs.filter(tx => tx.type === 'fund');
    const totalFunds = fundTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    setStats(prev => ({
      ...prev,
      totalTransactions: txs.length,
      totalRevenue: boothRevenue / 100,
      totalTickets: totalFunds / 100
    }));
  } catch (error) {
    console.error('Error loading transactions from Firebase:', error);
    toast.error('Failed to load transactions');
    setTransactions([]);
  } finally {
    setIsTransactionLoading(false);
  }
};
