
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface BoothsListProps {
  booths: any[];
  isLoading: boolean;
  onTogglePWYC?: (boothId: string, current: boolean) => void;
}

const BoothsList: React.FC<BoothsListProps> = ({ booths, isLoading, onTogglePWYC }) => {
  if (isLoading) {
    return <p>Loading booths...</p>;
  }

  if (!booths || booths.length === 0) {
    return <p>No booths found.</p>;
  }

  return (
    <div className="space-y-4">
      {booths.map((booth) => (
        <Card key={booth.id}>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4">
            <div>
              <span className="font-semibold">{booth.name}</span>
              {booth.pwycEnabled && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                  PWYC
                </span>
              )}
              <div className="text-xs text-muted-foreground">{booth.description}</div>
            </div>
            {onTogglePWYC && (
              <div className="mt-2 sm:mt-0 flex items-center gap-2">
                <span className="text-xs">PWYC</span>
                <Switch
                  checked={!!booth.pwycEnabled}
                  onCheckedChange={() => onTogglePWYC(booth.id, !!booth.pwycEnabled)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BoothsList;
