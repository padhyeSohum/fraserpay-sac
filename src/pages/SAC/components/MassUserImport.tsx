
import React, { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import CSVUploader from '@/components/CSVUploader';
import { parseCSV, validateUserCSV, generateUserCSVTemplate, downloadCSVTemplate } from '@/utils/csvParser';
import { Button } from '@/components/ui/button';
import { Download, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const MassUserImport = () => {
  const [users, setUsers] = useState<Record<string, string>[]>([]);
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
      const validation = validateUserCSV(parsedData);
      
      if (!validation.isValid) {
        toast.error(validation.message || 'Invalid CSV format');
        return;
      }
      
      setUsers(parsedData);
      setIsUploaded(true);
      toast.success(`CSV parsed successfully. ${parsedData.length} users found.`);
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error('Error parsing CSV:', error);
    }
  };
  
  const handleDownloadTemplate = () => {
    const template = generateUserCSVTemplate();
    downloadCSVTemplate(template, 'user_template.csv');
    toast.success('Template downloaded successfully');
  };
  
  const handleImport = async () => {
    if (users.length === 0) {
      toast.error('No users to import');
      return;
    }
    
    setIsProcessing(true);
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    try {
      for (const user of users) {
        try {
          // Check if user with student number already exists
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('student_number', user.studentNumber)
            .maybeSingle();
          
          if (existingUser) {
            results.failed++;
            results.errors.push(`User with student number ${user.studentNumber} already exists`);
            continue;
          }
          
          // Create new user
          const { error } = await supabase
            .from('users')
            .insert({
              student_number: user.studentNumber,
              name: user.name,
              email: user.email,
              role: user.role || 'student',
              qr_code: crypto.randomUUID(),
              tickets: 0
            });
          
          if (error) {
            results.failed++;
            results.errors.push(`Failed to create user ${user.name}: ${error.message}`);
          } else {
            results.success++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Error processing user ${user.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      setProcessResult(results);
      
      if (results.failed === 0) {
        toast.success(`Successfully imported ${results.success} users`);
      } else {
        toast.warning(`Imported ${results.success} users with ${results.failed} failures`);
      }
    } catch (error) {
      toast.error('Failed to import users');
      console.error('Error importing users:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const reset = () => {
    setUsers([]);
    setIsUploaded(false);
    setProcessResult(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Mass User Import</h2>
        </div>
        <Button size="sm" variant="outline" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>
      
      {!isUploaded ? (
        <CSVUploader 
          onFileLoad={handleFileLoad} 
          title="Upload Users CSV"
          description="Upload a CSV file with user data to import multiple users at once"
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium">Ready to import {users.length} users</p>
            <p className="text-sm text-muted-foreground">
              Review the preview below before importing
            </p>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    {Object.keys(users[0] || {}).map((header) => (
                      <th key={header} className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {users.slice(0, 5).map((user, index) => (
                    <tr key={index}>
                      {Object.values(user).map((value, i) => (
                        <td key={i} className="px-4 py-2 text-sm">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length > 5 && (
              <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/50">
                Showing 5 of {users.length} users
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={handleImport} 
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : `Import ${users.length} Users`}
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

export default MassUserImport;
