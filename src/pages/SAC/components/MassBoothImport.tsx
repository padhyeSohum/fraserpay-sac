
import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import CSVUploader from '@/components/CSVUploader';
import { parseCSV, validateBoothCSV, generateBoothCSVTemplate, downloadCSVTemplate } from '@/utils/csvParser';
import { Button } from '@/components/ui/button';
import { Download, Store, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth';

const MassBoothImport = () => {
  const { user } = useAuth();
  const [booths, setBooths] = useState<Record<string, string>[]>([]);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileLoad = (csvData: string) => {
    try {
      const parsedData = parseCSV(csvData);
      const validation = validateBoothCSV(parsedData);
      
      if (!validation.isValid) {
        toast.error(validation.message || 'Invalid CSV format');
        return;
      }
      
      setBooths(parsedData);
      setIsUploaded(true);
      toast.success(`CSV parsed successfully. ${parsedData.length} booths found.`);
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error('Error parsing CSV:', error);
    }
  };
  
  const handleDownloadTemplate = () => {
    const template = generateBoothCSVTemplate();
    downloadCSVTemplate(template, 'booth_template.csv');
    toast.success('Template downloaded successfully');
  };
  
  const handleImport = async () => {
    if (!user) {
      toast.error('You must be logged in to create booths');
      return;
    }
    
    if (booths.length === 0) {
      toast.error('No booths to import');
      return;
    }
    
    setIsProcessing(true);
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    try {
      for (const booth of booths) {
        try {
          // Check if booth with same name already exists
          const { data: existingBooth } = await supabase
            .from('booths')
            .select('id')
            .eq('name', booth.name)
            .maybeSingle();
          
          if (existingBooth) {
            results.failed++;
            results.errors.push(`Booth with name "${booth.name}" already exists`);
            continue;
          }
          
          // Create new booth
          const { data, error } = await supabase
            .from('booths')
            .insert({
              name: booth.name,
              description: booth.description,
              pin: booth.pin,
              members: [user.id],
              sales: 0
            })
            .select()
            .single();
          
          if (error) {
            results.failed++;
            results.errors.push(`Failed to create booth "${booth.name}": ${error.message}`);
          } else if (data) {
            // Update the user's booth_access array
            const { data: userData, error: getUserError } = await supabase
              .from('users')
              .select('booth_access')
              .eq('id', user.id)
              .single();
            
            if (!getUserError && userData) {
              const updatedBoothAccess = [...(userData.booth_access || []), data.id];
              
              await supabase
                .from('users')
                .update({ booth_access: updatedBoothAccess })
                .eq('id', user.id);
            }
            
            results.success++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Error processing booth "${booth.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      setProcessResult(results);
      
      if (results.failed === 0) {
        toast.success(`Successfully imported ${results.success} booths`);
      } else {
        toast.warning(`Imported ${results.success} booths with ${results.failed} failures`);
      }
    } catch (error) {
      toast.error('Failed to import booths');
      console.error('Error importing booths:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const reset = () => {
    setBooths([]);
    setIsUploaded(false);
    setProcessResult(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Mass Booth Import</h2>
        </div>
        <Button size="sm" variant="outline" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>
      
      {!isUploaded ? (
        <CSVUploader 
          onFileLoad={handleFileLoad} 
          title="Upload Booths CSV"
          description="Upload a CSV file with booth data to import multiple booths at once"
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium">Ready to import {booths.length} booths</p>
            <p className="text-sm text-muted-foreground">
              Review the preview below before importing
            </p>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    {Object.keys(booths[0] || {}).map((header) => (
                      <th key={header} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {booths.slice(0, 5).map((booth, index) => (
                    <tr key={index}>
                      {Object.values(booth).map((value, i) => (
                        <td key={i} className="px-4 py-2 text-sm">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {booths.length > 5 && (
              <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/50">
                Showing 5 of {booths.length} booths
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={handleImport} 
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : `Import ${booths.length} Booths`}
            </Button>
            <Button 
              variant="outline" 
              onClick={reset}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
          
          {processResult && processResult.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import Errors</AlertTitle>
              <AlertDescription>
                <div className="mt-2 max-h-40 overflow-y-auto text-sm">
                  <ul className="list-disc pl-5 space-y-1">
                    {processResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {processResult && (
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p>Import complete: {processResult.success} successful, {processResult.failed} failed</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MassBoothImport;
