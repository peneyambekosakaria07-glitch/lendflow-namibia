// Database connection
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, {
  schema: {
    lenders: require('./schema').lenders,
    borrowers: require('./schema').borrowers,
    loans: require('./schema').loans,
    repaymentPlans: require('./schema').repaymentPlans,
    payments: require('./schema').payments,
    documents: require('./schema').documents,
    reminderLogs: require('./schema').reminderLogs,
    lenderSettings: require('./schema').lenderSettings,
    reminderConfigs: require('./schema').reminderConfigs,
    refreshTokens: require('./schema').refreshTokens,
    auditLogs: require('./schema').auditLogs,
  },
});
