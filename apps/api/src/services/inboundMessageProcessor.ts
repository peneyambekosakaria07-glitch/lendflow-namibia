// Inbound Message Processor - handles WhatsApp/SMS messages from borrowers
import { db } from '../db';
import { borrowers, payments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { twilioService } from './twilio';
import { r2Service } from './r2';
import { renderReminderTemplate } from './templateRenderer';

export interface InboundMessage {
  from: string;
  type: 'text' | 'image';
  body?: string;
  mediaUrl?: string;
  mediaContentType?: string;
  receivedAt: Date;
}

export class InboundMessageProcessor {
  static queueJob(message: InboundMessage): void {
    // In production, would add to BullMQ queue
    console.log('Queuing inbound message:', message);
  }

  static async process(message: InboundMessage): Promise<void> {
    const { from, type, body, mediaUrl, mediaContentType } = message;
    
    const formattedPhone = twilioService.formatNamibiaNumber(from);
    const borrower = await db.query.borrowers.findFirst({
      where: eq(borrowers.phone, formattedPhone),
    });
    
    if (!borrower) {
      await twilioService.sendSMS(from, "Hi! This number is not registered with LendFlow. Please contact your lender.");
      return;
    }
    
    if (type === 'image' && mediaUrl) {
      await this.handleDepositSlipImage(borrower.id, from, mediaUrl, mediaContentType);
    } else if (type === 'text') {
      await this.handleTextMessage(borrower.id, from, body || '');
    }
  }

  private static async handleDepositSlipImage(
    borrowerId: string,
    from: string,
    mediaUrl: string,
    mediaContentType?: string
  ): Promise<void> {
    try {
      const imageBuffer = await r2Service.download(mediaUrl);
      const r2Key = `pending-payments/${borrowerId}/${Date.now()}.jpg`;
      await r2Service.upload(r2Key, imageBuffer, { ContentType: mediaContentType });
      const r2Url = r2Service.getPublicUrl(r2Key);
      
      await db.insert(payments).values({
        borrowerId,
        depositSlipUrl: r2Url,
        status: 'pending',
      });
      
      const ack = renderReminderTemplate('proof_of_payment_received', 'whatsapp', {
        borrowerName: borrower.fullName, amount: '', dueDate: ''
      });
      await twilioService.sendWhatsApp(from, ack);
    } catch (error) {
      console.error('Failed to process deposit slip:', error);
    }
  }

  private static async handleTextMessage(borrowerId: string, from: string, body: string): Promise<void> {
    const normalized = body.toLowerCase().trim();
    
    if (normalized === 'balance' || normalized === 'bal') {
      await twilioService.sendWhatsApp(from, "You don't have any active loans. Contact your lender if you have questions.");
    }
  }

  static async updateMessageStatus(sid: string, status: string, errorCode?: string): Promise<void> {
    console.log(`Message ${sid} status: ${status}`, errorCode || '');
  }
}
