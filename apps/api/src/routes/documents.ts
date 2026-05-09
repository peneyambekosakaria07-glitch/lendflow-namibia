import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { documents } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const uploadDocumentSchema = z.object({
  borrowerId: z.string().uuid().optional(),
  loanId: z.string().uuid().optional(),
  type: z.enum(['national_id', 'contract', 'collateral', 'payslip', 'other']),
  fileUrl: z.string().url(),
  originalName: z.string(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
});

export async function documentRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // List documents
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { borrowerId, loanId, type } = request.query as any;
    
    const conditions = [];
    
    if (borrowerId) {
      conditions.push(eq(documents.borrowerId, borrowerId));
    }
    if (loanId) {
      conditions.push(eq(documents.loanId, loanId));
    }
    if (type) {
      conditions.push(eq(documents.type, type));
    }
    
    const docs = await db.query.documents.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: [desc(documents.createdAt)],
    });
    
    return reply.send({ documents: docs });
  });

  // Get single document
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, id),
    });
    
    if (!doc) {
      return reply.status(404).send({ error: 'Document not found' });
    }
    
    return reply.send({ document: doc });
  });

  // Upload document (metadata)
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = uploadDocumentSchema.parse(request.body);
    
    const [doc] = await db.insert(documents).values({
      ...body,
      uploadedBy: request.user.id,
    }).returning();
    
    return reply.status(201).send({ document: doc });
  });

  // Delete document
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const doc = await db.query.documents.findFirst({
      where: and(eq(documents.id, id), eq(documents.uploadedBy, request.user.id)),
    });
    
    if (!doc) {
      return reply.status(404).send({ error: 'Document not found or not authorized' });
    }
    
    await db.delete(documents).where(eq(documents.id, id));
    
    return reply.status(204).send();
  });
}
