import mongoose from 'mongoose';
import config from './index';
import logger from '../utils/logger';

class Database {
  private static instance: Database;
  
  private constructor() {}
  
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      };

      await mongoose.connect(config.database.url, options);
      
      logger.info('✅ Database connected successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('❌ Database connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️ Database disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('🔄 Database reconnected');
      });

    } catch (error) {
      logger.error('❌ Failed to connect to database:', error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
    }
  }

  public isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

export default Database;
