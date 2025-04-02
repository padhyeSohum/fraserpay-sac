
import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { firestore } from '@/integrations/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';

// Form validation schema
const formSchema = z.object({
  teacherName: z.string().min(2, { message: "Teacher name is required" }),
  teacherEmail: z.string().email({ message: "Valid email is required" }),
  initiativeName: z.string().min(2, { message: "Initiative name is required" }),
  initiativeDescription: z.string().min(10, { message: "Please provide a brief description (min 10 characters)" }),
  products: z.array(
    z.object({
      name: z.string().min(1, { message: "Product name is required" }),
      price: z.string().min(1, { message: "Price is required" })
        .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
          message: "Price must be a positive number"
        })
    })
  ).min(1, { message: "At least one product is required" })
});

type FormValues = z.infer<typeof formSchema>;

const TeacherForm = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teacherName: "",
      teacherEmail: "",
      initiativeName: "",
      initiativeDescription: "",
      products: [{ name: "", price: "" }]
    }
  });

  const addProduct = () => {
    const products = form.getValues("products");
    form.setValue("products", [...products, { name: "", price: "" }]);
  };

  const removeProduct = (index: number) => {
    const products = form.getValues("products");
    if (products.length > 1) {
      form.setValue("products", products.filter((_, i) => i !== index));
    } else {
      toast.error("At least one product is required");
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      // Validate first step fields
      const result = await form.trigger(["teacherName", "teacherEmail", "initiativeName", "initiativeDescription"]);
      if (result) setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const formattedProducts = data.products.map(product => ({
        name: product.name,
        price: parseFloat(product.price)
      }));
      
      const submissionData = {
        teacherName: data.teacherName,
        teacherEmail: data.teacherEmail,
        initiativeName: data.initiativeName,
        initiativeDescription: data.initiativeDescription,
        products: formattedProducts,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      
      // Add to "pending_booths" collection in Firebase
      await addDoc(collection(firestore, 'pending_booths'), submissionData);
      
      toast.success("Your initiative has been submitted for review!");
      setIsSuccess(true);
      
      // Reset form after successful submission
      form.reset();
    } catch (error) {
      console.error("Error submitting initiative:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success message after submission
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-medium mb-2">Submission Received!</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Thank you for registering your initiative. The SAC will review your submission and reach out via email once approved.
        </p>
        <Button onClick={() => setIsSuccess(false)}>Submit Another Initiative</Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-medium">Initiative Details</h3>
            
            <FormField
              control={form.control}
              name="teacherName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="teacherEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.smith@pdsb.net" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="initiativeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initiative Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Homeroom 205 Bake Sale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="initiativeDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Briefly describe your initiative or what you're fundraising for" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-4">
              <Button 
                type="button"
                onClick={nextStep}
                className="w-full sm:w-auto"
              >
                Continue to Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Products</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addProduct}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </div>
            
            {form.getValues("products").map((_, index) => (
              <div key={index} className="space-y-4 p-4 border border-border/40 rounded-md relative">
                <FormField
                  control={form.control}
                  name={`products.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Chocolate Chip Cookie" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`products.${index}.price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input placeholder="2.50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.getValues("products").length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => removeProduct(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Initiative"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
};

export default TeacherForm;
