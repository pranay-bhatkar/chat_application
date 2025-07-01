import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Database connection utility
 * Handles MongoDB connection with proper error handling
 */
class Database {
  static instance = null;

  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    Database.instance = this;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp';
      
      console.log('🔄 Attempting to connect to MongoDB...');
      console.log('📍 MongoDB URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
      
      await mongoose.connect(mongoUri, {
        // Use new URL parser
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // Add connection timeout
        serverSelectionTimeoutMS: 10000, // 10 seconds
        connectTimeoutMS: 10000, // 10 seconds
        socketTimeoutMS: 45000, // 45 seconds
      });

      console.log('✅ Connected to MongoDB successfully');

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('🔄 MongoDB connection closed through app termination');
        process.exit(0);
      });

      return mongoose.connection;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      
      // If MongoDB connection fails, provide helpful error message
      if (error.message.includes('ECONNREFUSED')) {
        console.error('💡 Suggestion: Make sure MongoDB is running or check your MONGODB_URI in .env file');
        console.error('💡 For local MongoDB: brew services start mongodb-community (macOS) or sudo systemctl start mongod (Linux)');
        console.error('💡 For MongoDB Atlas: Ensure your connection string is correct and IP is whitelisted');
      }
      
      // Don't exit the process, let the server continue with limited functionality
      console.log('⚠️ Server will continue without database functionality');
      return null;
    }
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log('🔄 MongoDB connection closed');
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

export default new Database();