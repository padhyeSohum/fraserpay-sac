
import { firestore } from '@/integrations/firebase/client';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { renderTemplate, BALANCE_UPDATE_TEMPLATE } from './emailService';

// Export the transaction receipt template
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
    <p style="font-size: 16px; color: #333; margin-bottom: 5px;"><strong>Current Balance:</strong> ${{currentBalance}}</p>
  </div>

  <!-- Transaction Details -->
  <div style="margin-bottom: 20px;">
    <p style="font-size: 16px; color: #333; margin-bottom: 5px;"><strong>Transaction Date:</strong> {{date}}</p>
    <p style="font-size: 16px; color: #333; margin-bottom: 15px;"><strong>Total Amount:</strong> ${{totalAmount}}</p>
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

// This would typically be a Cloud Function triggered by a schedule or HTTP request
// For now, we'll make it a function that can be called manually or on a schedule

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
    // Get all pending emails
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
    
    // Process each email
    for (const emailDoc of pendingEmailsSnap.docs) {
      result.processed++;
      const emailData = emailDoc.data();
      const emailRef = doc(firestore, 'emails', emailDoc.id);
      
      try {
        // In a real system, this would use a proper email sending service
        // For now, just log it and mark as sent for demonstration
        console.log(`Sending email to: ${emailData.to}`);
        console.log(`Subject: ${emailData.subject}`);
        console.log(`Template: ${emailData.templateName}`);
        console.log(`Email data:`, emailData.data);
        
        // Get the correct template based on the templateName
        let template = '';
        if (emailData.templateName === 'balance_update') {
          template = BALANCE_UPDATE_TEMPLATE;
        } else if (emailData.templateName === 'transaction_receipt') {
          template = TRANSACTION_RECEIPT_TEMPLATE;
        }
        
        // Render the template with the provided data
        if (template) {
          const renderedHtml = renderTemplate(template, emailData.data);
          console.log('Email content would be:', renderedHtml.substring(0, 100) + '...');
        } else {
          console.error(`Unknown template: ${emailData.templateName}`);
        }
        
        // In a real system, we would call an email API here
        // await emailSendingAPI.send({
        //   to: emailData.to,
        //   subject: emailData.subject,
        //   html: renderedHtml
        // });
        
        // Mark as sent
        await updateDoc(emailRef, {
          status: 'sent',
          sentAt: serverTimestamp()
        });
        
        console.log(`✅ Marked email ${emailDoc.id} as sent`);
        result.sent++;
      } catch (error) {
        console.error(`Error sending email ${emailDoc.id}:`, error);
        
        // Mark as failed
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

// This would typically be scheduled in a Cloud Function
// For development/testing, we can export this function to call manually
export async function scheduleDailyEmailProcessing() {
  console.log('Starting scheduled daily email processing');
  return processEmailQueue();
}

// Add a function to manually trigger email processing on demand
export async function triggerEmailProcessing() {
  console.log('🚀 Manually triggering email processing');
  return processEmailQueue();
}
