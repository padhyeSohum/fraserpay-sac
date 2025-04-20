
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff } from 'lucide-react';

interface LoadingScreenProps {
  timeout?: boolean;
  customMessage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  timeout = false, 
  customMessage 
}) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {timeout ? 'Taking longer than expected' : 'Loading'}
          </CardTitle>
          <CardDescription>
            {customMessage || (timeout 
              ? 'The application is taking longer to load. This might be due to network issues.' 
              : 'Please wait while we prepare everything...'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {timeout && (
            <div className="flex items-center space-x-2 bg-yellow-50 p-3 rounded-md border border-yellow-200">
              <WifiOff className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Slow PDSB WiFi detected. Try refreshing or connecting to a different network.
              </span>
            </div>
          )}
          
          {timeout && (
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
