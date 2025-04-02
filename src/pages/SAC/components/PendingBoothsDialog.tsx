
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { firestore } from '@/integrations/firebase/client';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { School, ThumbsUp, ThumbsDown, CheckCircle, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { createBooth } from '@/contexts/transactions/boothService';
import { useAuth } from '@/contexts/auth';

interface PendingBooth {
  id: string;
  teacherName: string;
  teacherEmail: string;
  initiativeName: string;
  initiativeDescription: string;
  products: { name: string; price: number }[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

interface PendingBoothsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PendingBoothsDialog: React.FC<PendingBoothsDialogProps> = ({ open, onOpenChange }) => {
  const [pendingBooths, setPendingBooths] = useState<PendingBooth[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooth, setSelectedBooth] = useState<PendingBooth | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const { user } = useAuth();
  
  const fetchPendingBooths = async () => {
    try {
      setLoading(true);
      const pendingRef = collection(firestore, 'pending_booths');
      const q = query(pendingRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const booths: PendingBooth[] = [];
      snapshot.forEach((doc) => {
        booths.push({
          id: doc.id,
          ...doc.data()
        } as PendingBooth);
      });
      
      setPendingBooths(booths);
    } catch (err) {
      console.error('Error fetching pending booths:', err);
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (open) {
      fetchPendingBooths();
    }
  }, [open]);
  
  const handleApprove = async () => {
    if (!selectedBooth || !user) return;
    
    setIsApproving(true);
    try {
      // Create new booth in booths collection
      const boothId = await createBooth(
        selectedBooth.initiativeName,
        selectedBooth.initiativeDescription,
        user.id,
        // Generate a random 6-digit PIN
        Math.floor(100000 + Math.random() * 900000).toString()
      );
      
      if (boothId) {
        // Add products to the booth
        const boothRef = doc(firestore, 'booths', boothId);
        
        // Delete the pending booth request
        await deleteDoc(doc(firestore, 'pending_booths', selectedBooth.id));
        
        toast.success('Initiative approved and created successfully!');
        
        // Refresh the list
        await fetchPendingBooths();
        setSelectedBooth(null);
      }
    } catch (error) {
      console.error('Error approving booth:', error);
      toast.error('Failed to approve initiative');
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleReject = async () => {
    if (!selectedBooth) return;
    
    setIsRejecting(true);
    try {
      // Delete the pending booth request
      await deleteDoc(doc(firestore, 'pending_booths', selectedBooth.id));
      
      toast.success('Initiative request rejected');
      
      // Refresh the list
      await fetchPendingBooths();
      setSelectedBooth(null);
    } catch (error) {
      console.error('Error rejecting booth:', error);
      toast.error('Failed to reject initiative');
    } finally {
      setIsRejecting(false);
    }
  };
  
  // Filter pending booths
  const pendingRequests = pendingBooths.filter(booth => booth.status === 'pending');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Teacher Initiative Requests
          </DialogTitle>
          <DialogDescription>
            Review and approve initiative requests from teachers
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
            </div>
          ) : (
            selectedBooth ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedBooth(null)}
                  >
                    Back to list
                  </Button>
                </div>
                
                <div className="space-y-4 p-4 border rounded-md">
                  <div>
                    <h3 className="text-lg font-medium">{selectedBooth.initiativeName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Submitted by {selectedBooth.teacherName} ({selectedBooth.teacherEmail})
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium">Description:</h4>
                    <p className="text-sm">{selectedBooth.initiativeDescription}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Products:</h4>
                    <ScrollArea className="h-[200px] rounded-md border p-4">
                      <div className="space-y-2">
                        {selectedBooth.products.map((product, index) => (
                          <div 
                            key={index}
                            className="flex justify-between items-center p-3 bg-muted/50 rounded-md"
                          >
                            <span>{product.name}</span>
                            <Badge variant="outline" className="font-mono">
                              ${product.price.toFixed(2)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
                
                <div className="flex justify-between gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBooth(null)}
                  >
                    Cancel
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isRejecting || isApproving}
                      className="flex items-center gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      {isRejecting ? "Rejecting..." : "Reject"}
                    </Button>
                    
                    <Button
                      onClick={handleApprove}
                      disabled={isApproving || isRejecting}
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isApproving ? "Approving..." : "Approve"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No pending initiative requests</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 p-1">
                  {pendingRequests.map((booth) => (
                    <div 
                      key={booth.id}
                      className="p-4 border rounded-md cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelectedBooth(booth)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{booth.initiativeName}</h3>
                          <p className="text-sm text-muted-foreground">
                            By {booth.teacherName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {booth.products.length} products
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooth(booth);
                              handleReject();
                            }}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooth(booth);
                              handleApprove();
                            }}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendingBoothsDialog;
