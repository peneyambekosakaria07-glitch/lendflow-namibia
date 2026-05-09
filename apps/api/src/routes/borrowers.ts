import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { borrowers } from '../db/schema';
import { eq, and, like, sql } from 'drizzle-orm';
import { z } from 'zod';

const createBorrowerSchema = z.object({
  fullName: z.string().min(1).max(255),
  nationalId: z.string().max(20).optional(),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  employmentInfo: z.string().max(255).optional(),
  employerName: z.string().max(255).optional(),
  employerAddress: z.string().max(500).optional(),
  employerPhone: z.string().max(20).optional(),
});

const updateBorrowerSchema = createBorrowerSchema.partial();

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
});

export async function borrowerRoutes(fastify: FastifyInstance) {
  // All routes require auth
  fastify.addHook('preHandler', fastify.authenticate);

  // List borrowers
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = querySchema.parse(request.query);
    const { page, limit, search } = query;
    const offset = (page - 1) * limit;
    
    const conditions = [eq(borrowers.lenderId, request.user.id)];
    
    if (search) {
      conditions.push(
        like(borrowers.fullName, `%${search}%`)
      );
    }
    
    const [borrowersList, countResult] = await Promise.all([
      db.query.borrowers.findMany({
        where: and(...conditions),
        limit,
        offset,
        orderBy: (borrowers, { desc }) => [desc(borrowers.createdAt)],
      }),
      db.select({ count: sql<number>`count(*)` })
        .from(borrowers)
        .where(and(...conditions)),
    ]);
    
    return reply.send({
      borrowers: borrowersList.map(b => ({
        id: b.id,
        fullName: b.fullName,
        nationalId: b.nationalId,
        phone: b.phone,
        email: b.email,
        employmentInfo: b.employmentInfo,
        createdAt: b.createdAt,
      })),
      pagination: {
        page,
        limit,
        total: countResult[0]?.count || 0,
        pages: Math.ceil((countResult[0]?.count || 0) / limit),
      },
    });
  });

  // Get single borrower
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    const borrower = await db.query.borrowers.findFirst({
      where: and(
        eq(borrowers.id, id),
        eq(borrowers.lenderId, request.user.id)
      ),
    });
    
    if (!borrower) {
      return reply.status(404).send({ error: 'Borrower not found' });
    }
    
    return reply.send({ borrower });
  });

  // Create borrower
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createBorrowerSchema.parse(request.body);
    
    const [borrower] = await db.insert(borrowers).values({
      ...body,
      lenderId: request.user.id,
    }).returning();
    
    return reply.status(201).send({ borrower });
  });

  // Update borrower
  fastify.put('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = updateBorrowerSchema.parse(request.body);
    
    // Verify ownership
    const existing = await db.query.borrowers.findFirst({
      where: and(
        eq(borrowers.id, id),
        eq(borrowers.lenderId, request.user.id)
      ),
    });
    
    if (!existing) {
      return reply.status(404).send({ error: 'Borrower not found' });
    }
    
    const [updated] = await db.update(borrowers)
      .set(body)
      .where(eq(borrowers.id, id))
      .returning();
    
    return reply.send({ borrower: updated });
  });

  // Delete borrower (soft delete - just mark)
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    // Verify ownership
    const existing = await db.query.borrowers.findFirst({
      where: and(
        eq(borrowers.id, id),
        eq(borrowers.lenderId, request.user.id)
      ),
    });
    
    if (!existing) {
      return reply.status(404).send({ error: 'Borrower not found' });
    }
    
    // Hard delete for now (could add soft delete column later)
    await db.delete(borrowers).where(eq(borrowers.id, id));
    
    return reply.status(204).send();
  });

  // Get borrower's loans
  fastify.get('/:id/loans', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    // Verify ownership
    const borrower = await db.query.borrowers.findFirst({
      where: and(
        eq(borrowers.id, id),
        eq(borrowers.lenderId, request.user.id)
      ),
    });
    
    if (!borrower) {
      return reply.status(404).send({ error: 'Borrower not found' });
    }
    
    const loans = await db.query.loans.findMany({
      where: eq(loans.borrowerId, id),
      orderBy: (loans, { desc }) => [desc(loans.createdAt)],
    });
    
    return reply.send({ loans });
  });

  // Get borrower's documents
  fastify.get('/:id/documents', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    // Verify ownership
    const borrower = await db.query.borrowers.findFirst({
      where: and(
        eq(borrowers.id, id),
        eq(borrowers.lenderId, request.user.id)
      ),
    });
    
    if (!borrower) {
      return reply.status(404).send({ error: 'Borrower not found' });
    }
    
    const docs = await db.query.documents.findMany({
      where: eq(documents.borrowerId, id),
    });
    
    return reply.send({ documents: docs });
  });
}

// Import loans and documents for routes
import { loans } from '../db/schema';
import { documents } from '../db/schema';
