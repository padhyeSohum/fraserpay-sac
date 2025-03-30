
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const BoothSuccess: React.FC = () => {
  const [teacherName, setTeacherName] = useState<string>('');
  
  useEffect(() => {
    const storedTeacherName = sessionStorage.getItem('teacherName');
    if (storedTeacherName) {
      setTeacherName(storedTeacherName);
    }
  }, []);
  
  return (
    <Layout 
      title="Booth Created" 
      showBack={false}
    >
      <div className="flex justify-center items-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4 text-primary">
              <CheckCircle className="h-16 w-16" />
            </div>
            <CardTitle className="text-2xl text-center">Success!</CardTitle>
            <CardDescription className="text-center">
              Your booth has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>
              Thank you, {teacherName || 'Teacher'}! Your booth has been registered for the upcoming event.
            </p>
            <p className="text-muted-foreground">
              The SAC team will review your submission and may contact you if any additional information is needed.
            </p>
            <p className="font-medium">
              You'll receive your booth access PIN via email before the event.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button asChild className="w-full" variant="outline">
              <Link to="/teacher">Return to Teacher Portal</Link>
            </Button>
            <Button asChild variant="link">
              <Link to="/">Go to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default BoothSuccess;
