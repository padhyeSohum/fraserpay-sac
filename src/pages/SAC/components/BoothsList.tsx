
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Booth } from '@/types';
import { Eye, EyeOff } from 'lucide-react';

interface BoothsListProps {
  booths: Booth[];
  isLoading?: boolean;
}

const BoothsList: React.FC<BoothsListProps> = ({ 
  booths = [],
  isLoading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  const togglePinVisibility = (boothId: string) => {
    setShowPins(prev => ({
      ...prev,
      [boothId]: !prev[boothId]
    }));
  };

  const filteredBooths = booths.filter(booth => 
    booth.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Booths</CardTitle>
        <CardDescription>All active booths with their access PINs</CardDescription>
        <div className="mt-2">
          <Input
            placeholder="Search booths..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBooths.length === 0 ? (
              <p className="text-muted-foreground">No booths found</p>
            ) : (
              filteredBooths.map((booth) => (
                <div 
                  key={booth.id} 
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div className="flex-1">
                    <p className="font-medium">{booth.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{booth.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <span className="text-sm font-medium">PIN:</span>
                      {showPins[booth.id] ? (
                        <span className="font-mono">{booth.pin}</span>
                      ) : (
                        <span className="font-mono">••••••</span>
                      )}
                    </div>
                    <button
                      onClick={() => togglePinVisibility(booth.id)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPins[booth.id] ? "Hide PIN" : "Show PIN"}
                    >
                      {showPins[booth.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BoothsList;
