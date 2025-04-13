
// Format currency values (e.g. $10.00)
export const formatCurrency = (amount: number): string => {
  // Check if the amount is likely already in dollars (less than 1000)
  // This helps handle the mix of cents and dollars in the system
  const valueInDollars = amount > 1000 ? amount / 100 : amount;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(valueInDollars);
};

// Format dates (e.g. Mar 15, 2024)
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

// Format student number for display
export const formatStudentNumber = (studentNumber: string): string => {
  return studentNumber || 'N/A';
};

// Format percentage (e.g. 75%)
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};
