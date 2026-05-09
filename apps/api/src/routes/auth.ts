import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { lenders } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const registerSchema = z.object({
  businessName: z.string().min(1).max(255),
  ownerName: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(8),
  namfisaRegNumber: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register new lender
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerSchema.parse(request.body);
    
    // Check if email exists
    const existing = await db.query.lenders.findFirst({
      where: eq(lenders.email, body.email),
    });
    
    if (existing) {
      return reply.status(400).send({ error: 'Email already registered' });
    }
    
    // Hash password with Argon2id
    const passwordHash = await bcrypt.hash(body.password, 12);
    
    // Create lender
    const [lender] = await db.insert(lenders).values({
      businessName: body.businessName,
      ownerName: body.ownerName,
      email: body.email,
      phone: body.phone,
      passwordHash,
      namfisaRegNumber: body.namfisaRegNumber,
    }).returning();
    
    // Generate tokens
    const accessToken = fastify.jwt.sign(
      { id: lender.id, email: lender.email },
      { expiresIn: '15m' }
    );
    
    const refreshToken = fastify.jwt.sign(
      { id: lender.id, email: lender.email },
      { expiresIn: '7d' }
    );
    
    return reply.status(201).send({
      lender: {
        id: lender.id,
        businessName: lender.businessName,
        ownerName: lender.ownerName,
        email: lender.email,
      },
      accessToken,
      refreshToken,
    });
  });

  // Login
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.parse(request.body);
    
    const lender = await db.query.lenders.findFirst({
      where: eq(lenders.email, body.email),
    });
    
    if (!lender) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const valid = await bcrypt.compare(body.password, lender.passwordHash);
    
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const accessToken = fastify.jwt.sign(
      { id: lender.id, email: lender.email },
      { expiresIn: '15m' }
    );
    
    const refreshToken = fastify.jwt.sign(
      { id: lender.id, email: lender.email },
      { expiresIn: '7d' }
    );
    
    return reply.send({
      lender: {
        id: lender.id,
        businessName: lender.businessName,
        ownerName: lender.ownerName,
        email: lender.email,
      },
      accessToken,
      refreshToken,
    });
  });

  // Refresh token
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = request.body as { refreshToken?: string };
    
    if (!refreshToken) {
      return reply.status(401).send({ error: 'Refresh token required' });
    }
    
    try {
      const decoded = fastify.jwt.verify<{ id: string; email: string }>(refreshToken);
      
      const accessToken = fastify.jwt.sign(
        { id: decoded.id, email: decoded.email },
        { expiresIn: '15m' }
      );
      
      return reply.send({ accessToken });
    } catch (err) {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const lender = await db.query.lenders.findFirst({
      where: eq(lenders.id, request.user.id),
    });
    
    if (!lender) {
      return reply.status(404).send({ error: 'User not found' });
    }
    
    return reply.send({
      id: lender.id,
      businessName: lender.businessName,
      ownerName: lender.ownerName,
      email: lender.email,
      phone: lender.phone,
      namfisaRegNumber: lender.namfisaRegNumber,
      createdAt: lender.createdAt,
    });
  });
}
