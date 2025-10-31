/**
 * Database connection utilities
 * PostgreSQL connection using pg library
 */

import { Pool, QueryResult } from 'pg';

// Create connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DATABASE || 'agendamedpro',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'admin',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  return pool;
}

/**
 * Execute a SQL query
 * @param text SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 1 second)
    if (duration > 1000) {
      console.warn('Slow query detected:', {
        text: text.substring(0, 100),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', {
      text: text.substring(0, 100),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient() {
  const pool = getPool();
  return await pool.connect();
}

/**
 * Close the database pool
 * Call this when shutting down the application
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Check if database connection is healthy
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health');
    return result.rows[0].health === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
