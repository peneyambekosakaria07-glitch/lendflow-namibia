// Twilio Service - extracted from COMMUNICATION_SYSTEM.md

import Twilio from 'twilio';

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export type Channel = 'sms' | 'whatsapp';

export interface TwilioMessage {
  sid: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  to: string;
  body: string;
  dateCreated: Date;
}

export class TwilioService {
  formatNamibiaNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('264')) {
      return `+264${cleaned.substring(3)}`;
    }
    if (cleaned.startsWith('0')) {
      return `+264${cleaned.substring(1)}`;
    }
    return `+264${cleaned}`;
  }

  async sendSMS(to: string, body: string): Promise<TwilioMessage> {
    const formattedNumber = this.formatNamibiaNumber(to);
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: formattedNumber,
    });
    return {
      sid: message.sid,
      status: message.status,
      to: formattedNumber,
      body,
      dateCreated: message.dateCreated,
    };
  }

  async sendWhatsApp(to: string, body: string): Promise<TwilioMessage> {
    const formattedNumber = this.formatNamibiaNumber(to);
    const message = await client.messages.create({
      body,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`,
    });
    return {
      sid: message.sid,
      status: message.status,
      to: formattedNumber,
      body,
      dateCreated: message.dateCreated,
    };
  }

  async sendMessage(outbound: { to: string; body: string; channel: Channel }): Promise<TwilioMessage> {
    return outbound.channel === 'whatsapp'
      ? this.sendWhatsApp(outbound.to, outbound.body)
      : this.sendSMS(outbound.to, outbound.body);
  }

  validateWebhookSignature(signature: string, url: string, params: Record<string, string>): boolean {
    return Twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      signature,
      url,
      params
    );
  }
}

export const twilioService = new TwilioService();
