
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions } from '@/contexts/transactions';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Booth, Product } from '@/types';
import { Store, ChevronLeft } from 'lucide-react';

const ExistingBooths: React.FC = () => {
  const { booths, fetchAllBooths } = useTransactions();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const loadBooths = async () => {
      setIsLoading(true);
      await fetchAllBooths();
      setIsLoading(false);
    };
    
    loadBooths();
  }, [fetchAllBooths]);
  
  const filteredBooths = booths.filter(booth => 
    booth.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booth.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const renderProductList = (products: Product[]) => {
    if (!products || products.length === 0) {
      return <p className="text-muted-foreground text-sm">No products available</p>;
    }
    
    return (
      <div className="space-y-2">
        {products.map((product) => (
          <div key={product.id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
            <span className="font-medium">{product.name}</span>
            <span className="text-muted-foreground">${product.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <Layout 
      title="Existing Booths" 
      showBack={true}
    >
      <div className="max-w-5xl mx-auto mt-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Browse Existing Booths</h1>
          <Button asChild variant="outline">
            <Link to="/teacher/create"><ChevronLeft className="mr-1 h-4 w-4" /> Back to Create Booth</Link>
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Browse other booths for inspiration before creating your own.
          </p>
          <div className="w-full max-w-xs">
            <Input
              placeholder="Search booths..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="bg-muted h-24"></CardHeader>
                <CardContent className="h-48 mt-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-5/6 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBooths.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No booths found</h3>
            <p className="text-muted-foreground">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBooths.map((booth) => (
              <Card key={booth.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle>{booth.name}</CardTitle>
                  <CardDescription>
                    {booth.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <h3 className="text-sm font-semibold mb-2">Products:</h3>
                  {renderProductList(booth.products)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <div className="text-center mt-8">
          <p className="text-muted-foreground mb-4">
            Ready to create your own booth for the event?
          </p>
          <Button asChild size="lg" className="px-8">
            <Link to="/teacher/create">Create Your Booth</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default ExistingBooths;
