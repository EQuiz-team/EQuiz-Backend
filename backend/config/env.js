import { config } from 'dotenv';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;
const DB_pg_URL = process.env.DB_pg_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ARCJET_KEY = process.env.ARCJET_KEY;
const ARCJET_ENV = process.env.ARCJET_ENV;

console.log(`Environment PORT: ${process.env.PORT}`);
console.log(`Node Environment: ${process.env.NODE_ENV}`);
console.log(`PostgreSQL URL: ${process.env.DB_pg_URL}`);
console.log(`JWT Secret: ${process.env.JWT_SECRET ? '[HIDDEN]' : 'Not Set'}`);
console.log(`JWT Expiration: ${process.env.JWT_EXPIRES_IN || '7d'}`);
console.log(`ARCJET Key: ${process.env.ARCJET_KEY ? '[HIDDEN]' : 'Not Set'}`);
console.log(`ARCJET Environment: ${process.env.ARCJET_ENV || 'development'}`);

export { 
     PORT,
     NODE_ENV, 
     DB_pg_URL, 
     JWT_SECRET, 
     JWT_EXPIRES_IN, 
     ARCJET_KEY, 
     ARCJET_ENV 
    };