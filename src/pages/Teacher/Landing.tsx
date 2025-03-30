
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TeacherLanding: React.FC = () => {
  return (
    <Layout 
      title="FraserPay for Teachers"
      showBack={true}
    >
      <div className="max-w-4xl mx-auto mt-8 space-y-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
          <img 
            src="/lovable-uploads/ed1f3f9a-22a0-42de-a8cb-354fb8c82dae.png" 
            alt="Fraser Pay" 
            className="h-16 w-auto" 
          />
          <h1 className="text-3xl font-bold">Welcome to FraserPay</h1>
          <p className="text-muted-foreground max-w-2xl">
            The digital payment system for John Fraser Secondary School events
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>How FraserPay Works</CardTitle>
              <CardDescription>
                The digital ticket system for school events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                FraserPay allows students to purchase digital tickets that can be used at various 
                booths during school events. Instead of handling cash, all transactions 
                are digital, providing a smoother experience for everyone.
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Students purchase digital tickets through the SAC</li>
                <li>Booths offer products that can be purchased with these tickets</li>
                <li>Transactions are quick, easy, and recorded digitally</li>
                <li>Booth owners can track their sales in real-time</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>For Teachers</CardTitle>
              <CardDescription>
                Create and manage your event booth
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                As a teacher, you can create a booth for your class or club to participate 
                in school events. Set up products, prices, and manage your booth all from 
                this dashboard.
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Create a booth with custom name and description</li>
                <li>Add products with prices</li>
                <li>View other booths for inspiration</li>
                <li>Manage your booth during the event</li>
              </ul>
              <Button asChild className="w-full mt-4">
                <Link to="/teacher/create">Create Your Booth</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ready to Get Started?</CardTitle>
            <CardDescription>
              Create your booth for the upcoming event
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <p className="mb-4 text-center">
              Click below to authenticate and create your booth. You'll be able to 
              set up products, prices, and see how your booth will appear to students.
            </p>
            <Button asChild size="lg" className="px-8">
              <Link to="/teacher/create">Create Your Booth</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TeacherLanding;
