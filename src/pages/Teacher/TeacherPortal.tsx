import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { firestore } from '@/integrations/firebase/client';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ArrowRight, ArrowLeft, School, Package, FileCheck } from 'lucide-react';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import TeacherForm from './components/TeacherForm';
import BoothList from './components/BoothList';

const TeacherPortal = () => {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Simple FraserPay-style header with logo for the standalone page
  const Header = () => <header className="absolute top-0 left-0 right-0 py-4 px-6 flex justify-center items-center border-b border-border/40 bg-white/80 backdrop-blur-sm z-10">
      <div className="flex items-center gap-2">
        <img src="/lovable-uploads/ed1f3f9a-22a0-42de-a8cb-354fb8c82dae.png" alt="Fraser Pay" className="h-8 w-auto" />
        <h1 className="text-xl font-semibold">Initiative Sign Up</h1>
      </div>
    </header>;

  // Landing page with two options
  const LandingPage = () => <div className="container max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Sign your class/homeroom up</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Add your initiative, view other initiatives, or see past initiatives for inspiration!
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <Card className="bg-white/90 backdrop-blur-sm border-primary/10 shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-primary" />
              Add your clubs/homeroom's Initiative
            </CardTitle>
            <CardDescription>
              This form takes 1 min to fill out
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p> </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setActiveTab("register")} className="w-full group">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="bg-white/90 backdrop-blur-sm border-primary/10 shadow-lg hover:shadow-xl transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-6 w-6 text-primary" />
              Browse Initiatives
            </CardTitle>
            <CardDescription>
              Explore other clubs and initiatives currently on FraserPay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>See what other homerooms and clubs are doing for charity week! Get inspiration for your own class' initiative</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setActiveTab("browse")} variant="outline" className="w-full group">
              View Initiatives
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>;

  // If an option is selected, show the corresponding tab content
  if (activeTab) {
    return <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
        <Header />
        
        <main className="flex-1 px-6 py-6 w-full max-w-3xl mx-auto mt-16">
          <Button variant="ghost" className="mb-6 flex items-center gap-1" onClick={() => setActiveTab(null)}>
            <ArrowLeft className="h-4 w-4" />
            Back to options
          </Button>
          
          <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="register" className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Register Initiative
              </TabsTrigger>
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <School className="h-4 w-4" />
                Browse Initiatives
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="register" className="space-y-4 animate-fade-in">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-border/30">
                <h2 className="text-xl font-semibold mb-4">Register Your Initiative</h2>
                <p className="text-muted-foreground mb-6">Fill out this form to register your homeroom, club or initiative for Charity Week. </p>
                
                <TeacherForm />
              </div>
            </TabsContent>
            
            <TabsContent value="browse" className="space-y-4 animate-fade-in">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-border/30">
                <h2 className="text-xl font-semibold mb-4">Current Initiatives</h2>
                <p className="text-muted-foreground mb-6">
                  Browse all approved initiatives and their products currently available on FraserPay.
                </p>
                
                <BoothList />
              </div>
            </TabsContent>
          </Tabs>
        </main>
        
        <footer className="px-6 py-4 text-center text-xs text-muted-foreground">
          Made with ❤️ by Akshat Chopra for John Fraser SAC
        </footer>
      </div>;
  }

  // Otherwise, show the landing page with the aurora background
  return <AuroraBackground>
      <Header />
      <LandingPage />
      <footer className="absolute bottom-0 left-0 right-0 px-6 py-4 text-center text-xs text-muted-foreground backdrop-blur-sm bg-white/30">
        Made with ❤️ by Akshat Chopra for John Fraser SAC
      </footer>
    </AuroraBackground>;
};

export default TeacherPortal;
