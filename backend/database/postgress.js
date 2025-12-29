import { Sequelize } from 'sequelize';
import { DB_pg_URL, NODE_ENV } from '../config/env.js';

if (!DB_pg_URL) {
  throw new Error('Database connection string (DB_pg_URL) is not defined in environment variables');
}

// Parse the connection URL to extract components (optional)
const parseConnectionString = (url) => {
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
  const match = url.match(regex);
  
  if (match) {
    return {
      username: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5]
    };
  }
  return null;
};

const dbConfig = parseConnectionString(DB_pg_URL);

// Create Sequelize instance with explicit configuration
const sequelize = dbConfig 
  ? new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: NODE_ENV === 'development' ? (msg) => console.log(`📦 ${msg}`) : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      },
      timezone: '+00:00' // UTC
    })
  : new Sequelize(DB_pg_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    });

// Connection function
const connectionToDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL database connected successfully');
    
    // Database synchronization strategy based on environment
    switch (NODE_ENV) {
      case 'development':
        // Use alter in development to update tables
        await sequelize.sync({ alter: { drop: false } });
        console.log('🔄 Development database synchronized (alter)');
        break;
      case 'test':
        // Force sync in test environment (drops and recreates tables)
        await sequelize.sync({ force: true });
        console.log('🧪 Test database synchronized (force)');
        break;
      case 'production':
        // Just authenticate in production - migrations should be handled separately
        console.log('🚀 Production database connected (no auto-sync)');
        break;
      default:
        await sequelize.sync();
        console.log('📊 Database synchronized');
    }
    
    return sequelize;
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL database:');
    console.error('Error details:', error.message);
    
    // More detailed error information
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    
    // Exit process if database connection fails
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
    
    throw error;
  }
};

// Handle application shutdown gracefully
const gracefulShutdown = async () => {
  console.log('🛑 Closing database connection...');
  try {
    await sequelize.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Export
export { sequelize, connectionToDatabase };
export default connectionToDatabase;