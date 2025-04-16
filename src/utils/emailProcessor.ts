
import { firestore } from '@/integrations/firebase/client';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { renderTemplate, BALANCE_UPDATE_TEMPLATE } from './emailService';

export const TRANSACTION_RECEIPT_TEMPLATE = `<div style="font-family: 'Poppins', Arial, sans-serif; background: #f9f9f9; max-width: 650px; margin: auto; padding: 20px; border-radius: 8px; color: #333; border: 1px solid #ddd; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
  <!-- Header Image with cornered style -->
  <div style="border-radius: 8px 8px 0 0; overflow: hidden; margin-bottom: 20px;">
    <img src="https://i.imgur.com/hGzP8MC.png" alt="FraserPay Banner" style="width: 100%; height: auto; display: block;" />
  </div>

  <!-- Greeting -->
  <p style="font-size: 18px; color: #333; margin-bottom: 20px; text-align: center;">Hey there! Here's your receipt for today. If you have any concerns, please feel free to reach out to SAC.</p>

  <!-- Email Title -->
  <h2 style="font-size: 28px; font-weight: bold; color: #6f42c1; text-align: center; margin-bottom: 20px;">Your Daily Receipt</h2>

  <!-- User Information -->
  <div style="margin-bottom: 20px; padding: 15px; background-color: #f2f2f2; border-radius: 6px;">
    <p style="font-size: 16px; color: #333; margin-bottom: 5px;"><strong>User Name:</strong> {{userName}}</p>
    <p style="font-size: 16px; color: #333; margin-bottom: 5px;"><strong>Email:</strong> {{userEmail}}</p>
    <p style="font-size: 16px; color: #333; margin-bottom: 5px;"><strong>Student Number:</strong> {{studentNumber}}</p>
  </div>

  <!-- Transaction Details -->
  <div style="margin-bottom: 20px;">
    <p style="font-size: 16px; color: #333; margin-bottom: 5px;"><strong>Transaction Date:</strong> {{date}}</p>
    <p style="font-size: 16px; color: #333; margin-bottom: 15px;"><strong>Total Amount:</strong> ${{amount}}</p>
  </div>

  <!-- Products List -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 16px;">
    <thead>
      <tr>
        <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">Product</th>
        <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">Quantity</th>
        <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Price</th>
        <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      {{#each products}}
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{productName}}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">{{quantity}}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${{price}}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${{subtotal}}</td>
        </tr>
      {{/each}}
    </tbody>
  </table>

  <!-- Thank You Message -->
  <p style="font-size: 16px; color: #333; text-align: center; font-weight: bold;">Thank you for being part of Charity Week!</p>

  <!-- Footer -->
  <hr style="border: none; border-top: 2px solid #6f42c1; margin: 40px 0;" />
  <p style="text-align: center; font-size: 12px; color: #888;">This is an automated message. For help, reply to this email or DM <a href="https://instagram.com/johnfrasersac" style="color: #6f42c1;">@johnfrasersac</a>.</p>
  <p style="text-align: center; font-size: 12px; color: #888;">FraserPay: Fast, Secure, Easy</p>
</div>`;

export async function processEmailQueue(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  console.log('⭐ Starting email processing...');
  const result = {
    processed: 0,
    sent: 0,
    failed: 0
  };
  
  try {
    const emailsCollection = collection(firestore, 'emails');
    const pendingEmailsQuery = query(
      emailsCollection,
      where('status', '==', 'pending'),
      // Limit to 50 emails per processing batch
      // In production, this would be handled by Firebase Functions
    );
    
    const pendingEmailsSnap = await getDocs(pendingEmailsQuery);
    
    if (pendingEmailsSnap.empty) {
      console.log('No pending emails to process');
      return result;
    }
    
    console.log(`Processing ${pendingEmailsSnap.size} pending emails`);
    
    for (const emailDoc of pendingEmailsSnap.docs) {
      result.processed++;
      const emailData = emailDoc.data();
      const emailRef = doc(firestore, 'emails', emailDoc.id);
      
      try {
        console.log(`Sending email to: ${emailData.to}`);
        console.log(`Subject: ${emailData.subject}`);
        console.log(`Template: ${emailData.templateName}`);
        console.log(`Email data:`, emailData.data);
        
        let template = '';
        if (emailData.templateName === 'balance_update') {
          template = BALANCE_UPDATE_TEMPLATE;
        } else if (emailData.templateName === 'transaction_receipt') {
          template = TRANSACTION_RECEIPT_TEMPLATE;
        }
        
        if (template) {
          // Ensure all required template variables exist in the data object
          const safeData = { ...emailData.data };
          
          // Check for receipt-specific fields
          if (emailData.templateName === 'transaction_receipt') {
            if (safeData.products === undefined) {
              safeData.products = [];
            }
            
            // Add amount if missing - fixed shorthand property error
            if (safeData.amount === undefined) {
              safeData.amount = 0;
            }
          }
          
          // Check for balance update fields
          if (emailData.templateName === 'balance_update') {
            if (safeData.addedAmount === undefined) {
              safeData.addedAmount = 0;
            }
          }
          
          // Ensure products have all required properties - fixed shorthand property errors
          if (Array.isArray(safeData.products)) {
            safeData.products = safeData.products.map((product: any) => {
              const processedProduct = { ...product };
              if (processedProduct.price === undefined) {
                processedProduct.price = 0;
              }
              if (processedProduct.subtotal === undefined) {
                processedProduct.subtotal = 0;
              }
              return processedProduct;
            });
          }
          
          const renderedHtml = renderTemplate(template, safeData);
          console.log('Email content would be:', renderedHtml.substring(0, 100) + '...');
        } else {
          console.error(`Unknown template: ${emailData.templateName}`);
        }
        
        await updateDoc(emailRef, {
          status: 'sent',
          sentAt: serverTimestamp()
        });
        
        console.log(`✅ Marked email ${emailDoc.id} as sent`);
        result.sent++;
      } catch (error) {
        console.error(`Error sending email ${emailDoc.id}:`, error);
        
        await updateDoc(emailRef, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          sentAt: serverTimestamp()
        });
        
        result.failed++;
      }
    }
    
    console.log('Email processing complete:', result);
    return result;
  } catch (error) {
    console.error('Error processing email queue:', error);
    throw error;
  }
}

export async function scheduleDailyEmailProcessing() {
  console.log('Starting scheduled daily email processing');
  return processEmailQueue();
}

export async function triggerEmailProcessing() {
  console.log('🚀 Manually triggering email processing');
  return processEmailQueue();
}
