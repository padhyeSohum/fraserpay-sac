
import React, { useState, useEffect } from 'react';
import { firestore } from '@/integrations/firebase/client';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Booth, Product } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';

const BoothList = () => {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchBooths = async () => {
      try {
        // Access the booths collection from Firestore
        const boothsRef = collection(firestore, 'booths');
        const q = query(boothsRef, orderBy('name'));
        const snapshot = await getDocs(q);
        
        const boothsData: Booth[] = [];
        snapshot.forEach((doc) => {
          boothsData.push({
            id: doc.id,
            ...doc.data()
          } as Booth);
        });
        
        setBooths(boothsData);
      } catch (err) {
        console.error('Error fetching booths:', err);
        setError('Failed to load initiatives. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooths();
  }, []);
  
  // Filter booths based on search term
  const filteredBooths = searchTerm 
    ? booths.filter(booth => 
        booth.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booth.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booth.products.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : booths;
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-muted-foreground">Loading initiatives...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search initiatives or products..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {filteredBooths.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm 
              ? "No initiatives match your search." 
              : "No initiatives are currently available."}
          </p>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {filteredBooths.map((booth) => (
            <AccordionItem key={booth.id} value={booth.id} className="border border-border/40 rounded-md mb-3 overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:bg-muted/30">
                <div className="flex flex-col items-start">
                  <div className="font-medium">{booth.name}</div>
                  {booth.description && (
                    <div className="text-sm text-muted-foreground mt-1 text-left line-clamp-1">
                      {booth.description}
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Products:</h4>
                  <div className="grid gap-2">
                    {booth.products.map((product: Product) => (
                      <div 
                        key={product.id} 
                        className="flex justify-between items-center p-3 bg-background rounded-md border border-border/30"
                      >
                        <span>{product.name}</span>
                        <Badge variant="outline" className="font-mono">
                          ${product.price.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default BoothList;
