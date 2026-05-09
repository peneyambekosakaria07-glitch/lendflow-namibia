import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { twilioService } from '../services/twilio';
import { InboundMessageProcessor } from '../services/inboundMessageProcessor';

interface TwilioInboundParams {
  From?: string;
  To?: string;
  Body?: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
}

interface TwilioStatusParams {
  MessageSid: string;
  MessageStatus: string;
  ErrorCode?: string;
}

export async function webhookRoutes(fastify: FastifyInstance) {
  // Twilio inbound message webhook
  fastify.post('/twilio/inbound', async (request: FastifyRequest<{ Body: TwilioInboundParams }>, reply: FastifyReply) => {
    const params = request.body;
    
    // Validate Twilio signature in production
    if (process.env.NODE_ENV === 'production') {
      const signature = request.headers['x-twilio-signature'] as string;
      if (!twilioService.validateWebhookSignature(signature, request.url, params as Record<string, string>)) {
        return reply.status(403).send('Forbidden');
      }
    }
    
    const from = params.From || '';
    const body = params.Body?.trim() || '';
    const hasMedia = parseInt(params.NumMedia || '0') > 0;
    const mediaUrl = params.MediaUrl0;
    const mediaContentType = params.MediaContentType0;
    
    const inboundMessage = {
      from,
      type: hasMedia ? 'image' : 'text',
      body,
      mediaUrl,
      mediaContentType,
      receivedAt: new Date(),
    };
    
    // Queue for async processing
    InboundMessageProcessor.queueJob(inboundMessage);
    
    // Respond immediately to Twilio (within 15 seconds)
    return reply.status(200).send('');
  });

  // Twilio status callback
  fastify.post('/twilio/status', async (request: FastifyRequest<{ Body: TwilioStatusParams }>, reply: FastifyReply) => {
    const { MessageSid, MessageStatus, ErrorCode } = request.body;
    
    await InboundMessageProcessor.updateMessageStatus(MessageSid, MessageStatus, ErrorCode);
    
    return reply.status(200).send('');
  });

  // WhatsApp status callback
  fastify.post('/whatsapp/status', async (request: FastifyRequest<{ Body: TwilioStatusParams }>, reply: FastifyReply) => {
    const { MessageSid, MessageStatus, ErrorCode } = request.body;
    
    await InboundMessageProcessor.updateMessageStatus(MessageSid, MessageStatus, ErrorCode);
    
    return reply.status(200).send('');
  });
}
