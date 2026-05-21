import pg from "pg";

// ============================================================
// Database Client
// ============================================================

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ============================================================
// Query Helper
// ============================================================

export const query = async <T>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> => {
  const client = await pool.connect();

  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
};

export default pool;
