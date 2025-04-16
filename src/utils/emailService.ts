
import { firestore } from '@/integrations/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { User, Transaction } from '@/types';
import { toast } from 'sonner';

// Define email data structures
export interface EmailLog {
  to: string;
  subject: string;
  templateName: string;
  data: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  createdAt: any; // Firebase timestamp
  sentAt?: any; // Firebase timestamp
}

export interface BalanceUpdateEmailData {
  userName: string;
  userEmail: string;
  studentNumber: string;
  currentBalance: number;
  date: string;
  addedAmount?: number; // Optional for balance updates
}

export interface TransactionReceiptEmailData {
  userName: string;
  userEmail: string;
  studentNumber: string;
  currentBalance: number;
  date: string;
  totalAmount: number;
  products: Array<{
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

// Templates as strings - in production these would be stored elsewhere
export const BALANCE_UPDATE_TEMPLATE = `<div style="font-family: 'Poppins', Arial, sans-serif; background: #f9f9f9; max-width: 650px; margin: auto; padding: 20px; border-radius: 8px; color: #333; border: 1px solid #ddd; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
  <!-- Header Image with cornered style -->
  <div style="border-radius: 8px 8px 0 0; overflow: hidden; margin-bottom: 20px;">
    <img src="https://i.imgur.com/hGzP8MC.png" alt="FraserPay Banner" style="width: 100%; height: auto; display: block;" />
  </div>

  <!-- Greeting -->
  <p style="font-size: 18px; color: #333; margin-bottom: 20px; text-align: center;">Hey there! Your FraserPay account has been updated.</p>

  <!-- Email Title -->
  <h2 style="font-size: 28px; font-weight: bold; color: #6f42c1; text-align: center; margin-bottom: 20px;">Balance Update Notification</h2>

  <!-- User Information -->
  <div style="margin-bottom: 20px; padding: 15px; background-color: #f2f2f2; border-radius: 6px;">
    <p style="font-size: 16px; color: #333; margin-bottom: 5px;"><strong>User Name:</strong> {{userName}}</p>
    <p style="font-size: 16px; color: #333; margin-bottom: 5px;"><strong>Email:</strong> {{userEmail}}</p>
    <p style="font-size: 16px; color: #333; margin-bottom: 5px;"><strong>Student Number:</strong> {{studentNumber}}</p>
    <p style="font-size: 16px; color: #333; margin-bottom: 5px;"><strong>Current Balance:</strong> ${{currentBalance}}</p>
  </div>

  <!-- Transaction Details -->
  <div style="margin-bottom: 20px;">
    <p style="font-size: 16px; color: #333; margin-bottom: 5px;"><strong>Transaction Date:</strong> {{date}}</p>
    {{#if addedAmount}}
    <p style="font-size: 18px; color: #28a745; margin-bottom: 15px;"><strong>Amount Added:</strong> ${{addedAmount}}</p>
    {{/if}}
  </div>

  <!-- Thank You Message -->
  <p style="font-size: 16px; color: #333; text-align: center; font-weight: bold;">Thank you for being part of Charity Week!</p>

  <!-- Footer -->
  <hr style="border: none; border-top: 2px solid #6f42c1; margin: 40px 0;" />
  <p style="text-align: center; font-size: 12px; color: #888;">This is an automated message. For help, reply to this email or DM <a href="https://instagram.com/johnfrasersac" style="color: #6f42c1;">@johnfrasersac</a>.</p>
  <p style="text-align: center; font-size: 12px; color: #888;">FraserPay: Fast, Secure, Easy</p>
</div>`;

// Helper function to replace template variables
export function renderTemplate(template: string, data: Record<string, any>): string {
  let renderedTemplate = template;
  
  // Replace simple variables
  Object.entries(data).forEach(([key, value]) => {
    // Handle currency formatting for monetary values
    if (key.includes('balance') || key.includes('amount') || key.includes('price') || key.includes('subtotal')) {
      if (typeof value === 'number') {
        renderedTemplate = renderedTemplate.replace(
          new RegExp(`{{${key}}}`, 'g'), 
          value.toFixed(2)
        );
      }
    } else {
      renderedTemplate = renderedTemplate.replace(
        new RegExp(`{{${key}}}`, 'g'), 
        String(value || '')
      );
    }
  });
  
  // Handle conditional sections (very basic implementation)
  const conditionalRegex = /{{#if ([^}]+)}}([\s\S]*?){{\/if}}/g;
  renderedTemplate = renderedTemplate.replace(conditionalRegex, (match, condition, content) => {
    return data[condition] ? content : '';
  });
  
  // Handle loop sections (very basic implementation)
  // This is a simplified version that only handles 'each' loops
  const loopRegex = /{{#each ([^}]+)}}([\s\S]*?){{\/each}}/g;
  renderedTemplate = renderedTemplate.replace(loopRegex, (match, arrayName, template) => {
    if (!data[arrayName] || !Array.isArray(data[arrayName])) return '';
    
    return data[arrayName].map((item: any) => {
      let itemContent = template;
      Object.entries(item).forEach(([key, value]) => {
        // Handle currency formatting for monetary values
        if (key.includes('price') || key.includes('subtotal')) {
          if (typeof value === 'number') {
            itemContent = itemContent.replace(
              new RegExp(`{{${key}}}`, 'g'), 
              (value as number).toFixed(2)
            );
          }
        } else {
          itemContent = itemContent.replace(
            new RegExp(`{{${key}}}`, 'g'), 
            String(value || '')
          );
        }
      });
      return itemContent;
    }).join('');
  });
  
  return renderedTemplate;
}

// Queue an email to be sent
export async function queueEmail(to: string, subject: string, templateName: string, data: Record<string, any>): Promise<boolean> {
  try {
    console.log(`🔵 Queueing email to: ${to}, subject: ${subject}`);
    console.log('Email data:', data);
    
    if (!to || to.trim() === '') {
      console.error('❌ Cannot queue email: recipient email is missing');
      return false;
    }
    
    // In production, we would send this directly to a cloud function
    // For now, we'll just store it in Firestore and assume a function will process it
    const emailsCollection = collection(firestore, 'emails');
    const docRef = await addDoc(emailsCollection, {
      to,
      subject,
      templateName,
      data,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    console.log('✅ Email queued successfully with ID:', docRef.id);
    return true;
  } catch (error) {
    console.error('❌ Error queueing email:', error);
    toast.error('Failed to queue email notification');
    return false;
  }
}

// Send balance update email
export async function sendBalanceUpdateEmail(
  user: User,
  amount: number,
  newBalance: number
): Promise<boolean> {
  if (!user.email) {
    console.log('⚠️ User has no email address, skipping balance update email');
    return false;
  }
  
  // Check if user has email notifications enabled (default to true if not specified)
  if (user.emailNotifications === false) {
    console.log('⚠️ User has disabled email notifications, skipping email');
    return false;
  }
  
  try {
    console.log('🔵 Preparing balance update email for user:', user.name);
    console.log('Email:', user.email, 'Amount:', amount, 'New Balance:', newBalance);
    
    const emailData: BalanceUpdateEmailData = {
      userName: user.name,
      userEmail: user.email,
      studentNumber: user.studentNumber,
      currentBalance: newBalance,
      date: new Date().toLocaleDateString(),
      addedAmount: amount
    };
    
    console.log('Email data prepared:', emailData);
    const subject = `FraserPay: Your Balance Was Updated`;
    
    return await queueEmail(user.email, subject, 'balance_update', emailData);
  } catch (error) {
    console.error('❌ Error sending balance update email:', error);
    return false;
  }
}

// Send transaction receipt email - can be used for daily digest
export async function sendTransactionReceiptEmail(
  user: User,
  transactions: Transaction[],
  currentBalance: number
): Promise<boolean> {
  if (!user.email || transactions.length === 0) {
    console.log('User has no email or no transactions, skipping receipt email');
    return false;
  }
  
  // Check if user has email notifications enabled (default to true if not specified)
  if (user.emailNotifications === false) {
    console.log('⚠️ User has disabled email notifications, skipping receipt email');
    return false;
  }
  
  try {
    // Process transactions into products
    const products = transactions.flatMap(transaction => 
      transaction.products?.map(product => ({
        productName: product.productName,
        quantity: product.quantity,
        price: product.price,
        subtotal: product.quantity * product.price
      })) || []
    );
    
    // Calculate total amount
    const totalAmount = products.reduce((sum, product) => sum + product.subtotal, 0);
    
    const emailData: TransactionReceiptEmailData = {
      userName: user.name,
      userEmail: user.email,
      studentNumber: user.studentNumber,
      currentBalance: currentBalance,
      date: new Date().toLocaleDateString(),
      totalAmount: totalAmount,
      products: products
    };
    
    const subject = `FraserPay: Your Transaction Receipt`;
    
    return await queueEmail(user.email, subject, 'transaction_receipt', emailData);
  } catch (error) {
    console.error('Error sending transaction receipt email:', error);
    return false;
  }
}
