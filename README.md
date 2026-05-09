# LendFlow Namibia

**Mobile-first Micro-SaaS for Local Lenders in Namibia**

LendFlow replaces manual ledgers with a digital ecosystem that automates interest calculation, loan tracking, and borrower communication via WhatsApp/SMS.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native (Expo) + Tamagui + Zustand |
| Backend | Fastify (Node.js) + Drizzle ORM |
| Database | PostgreSQL (Railway) + Turso Edge |
| SMS/WhatsApp | Twilio |
| Storage | Cloudflare R2 |
| Jobs | BullMQ + Redis |

## Project Structure

```
lendflow/
├── apps/
│   ├── mobile/          # React Native Expo app
│   └── api/            # Fastify backend API
├── packages/
│   └── shared/         # Shared types, constants, validation
├── turbo.json          # Turbo monorepo config
└── package.json         # Root workspace
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL (local or Turso)
- Redis

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp apps/api/.env.example apps/api/.env

# Edit .env with your credentials

# Generate database migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Start development servers
npm run dev
```

### Environment Variables

See `apps/api/.env.example` for required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `TWILIO_*` - Twilio credentials
- `R2_*` - Cloudflare R2 credentials

## Documentation

- [Architecture](./ARCHITECTURE.md)
- [Database Schema](./SCHEMA.sql)
- [Interest Calculation Engine](./INTEREST_ENGINE.md)
- [Communication System](./COMMUNICATION_SYSTEM.md)
- [UI/UX Specification](./SPEC.md)

## NAMFISA Compliance

LendFlow is designed to comply with NAMFISA regulations for micro-lenders in Namibia:

- Simple and compound interest calculation
- APR disclosure for borrowers
- Configurable penalty rates with grace periods
- Loan amount and term limits

## License

Private - All rights reserved
