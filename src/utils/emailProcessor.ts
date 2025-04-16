
import { firestore } from '@/integrations/firebase/client';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { renderTemplate, BALANCE_UPDATE_TEMPLATE } from './emailService';

// This would typically be a Cloud Function triggered by a schedule or HTTP request
// For now, we'll make it a function that can be called manually or on a schedule

export async function processEmailQueue(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
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
        
        // Get the correct template based on the templateName
        let template = '';
        if (emailData.templateName === 'balance_update') {
          template = BALANCE_UPDATE_TEMPLATE;
        }
        // Add other templates as needed...
        
        // Render the template with the provided data
        const renderedHtml = renderTemplate(template, emailData.data);
        console.log('Email content would be:', renderedHtml.substring(0, 100) + '...');
        
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
// For development/testing, you can export this function to call manually
export async function scheduleDailyEmailProcessing() {
  console.log('Starting scheduled daily email processing');
  return processEmailQueue();
}
