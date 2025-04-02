
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { firestore } from '@/integrations/firebase/client';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ArrowRight, ArrowLeft, School, Package, FileCheck } from 'lucide-react';
import TeacherForm from './components/TeacherForm';
import BoothList from './components/BoothList';

const TeacherPortal = () => {
  const [activeTab, setActiveTab] = useState("register");
  
  // Simple FraserPay-style header with logo for the standalone page
  const Header = () => (
    <header className="py-4 px-6 flex justify-center items-center border-b border-border/40 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/ed1f3f9a-22a0-42de-a8cb-354fb8c82dae.png" 
          alt="Fraser Pay" 
          className="h-8 w-auto" 
        />
        <h1 className="text-xl font-semibold">Teacher Portal</h1>
      </div>
    </header>
  );
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <Header />
      
      <main className="flex-1 px-6 py-6 w-full max-w-3xl mx-auto">
        <Tabs defaultValue="register" className="w-full" onValueChange={setActiveTab}>
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
              <p className="text-muted-foreground mb-6">
                Fill out this form to register your homeroom, club or initiative for FraserPay.
                Your submission will be reviewed by the SAC before approval.
              </p>
              
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
        Made with ❤️ by John Fraser SAC
      </footer>
    </div>
  );
};

export default TeacherPortal;
