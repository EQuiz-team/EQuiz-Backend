import pkg from 'pg';
import { DB_pg_URL } from '../config/env.js';

const { Pool } = pkg;

const sessionPool = new Pool({
  connectionString: DB_pg_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default sessionPool;