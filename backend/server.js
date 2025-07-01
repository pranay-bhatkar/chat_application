import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import Database from './utils/database.js';
import WebSocketManager from './utils/websocket.js';

// Load environment variables
dotenv.config();

/**
 * Main server application for the real-time chat application
 * Handles HTTP requests and WebSocket connections
 */
class ChatServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.port = process.env.PORT || 3001;
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    this.databaseConnected = false;
  }

  /**
   * Configure Express middleware
   */
  setupMiddleware() {
    // Enable CORS for frontend communication
    this.app.use(cors({
      origin: [this.frontendUrl, 'http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Parse JSON requests
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(`📨 ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        activeConnections: WebSocketManager.getActiveConnections(),
        database: this.databaseConnected ? 'Connected' : 'Disconnected (using in-memory storage)'
      });
    });

    // API info endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Chat Application API',
        version: '1.0.0',
        description: 'Real-time chat application backend using MERN stack',
        endpoints: {
          health: '/health',
          websocket: 'ws://localhost:' + this.port
        },
        database: this.databaseConnected ? 'MongoDB Connected' : 'In-memory storage (MongoDB unavailable)'
      });
    });

    // Catch-all route for undefined endpoints
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: 'The requested endpoint does not exist',
        availableEndpoints: ['/health', '/api']
      });
    });
  }

  /**
   * Setup error handling middleware
   */
  setupErrorHandling() {
    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error('❌ Server error:', err);
      
      res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Try to connect to database
      const dbConnection = await Database.connect();
      this.databaseConnected = dbConnection !== null;

      // Setup middleware and routes
      this.setupMiddleware();
      this.setupRoutes();
      this.setupErrorHandling();

      // Initialize WebSocket server
      WebSocketManager.initialize(this.server);

      // Start HTTP server
      this.server.listen(this.port, () => {
        console.log('🚀 =================================');
        console.log('🚀 Chat Server Started Successfully');
        console.log('🚀 =================================');
        console.log(`🌐 HTTP Server: http://localhost:${this.port}`);
        console.log(`🔗 WebSocket Server: ws://localhost:${this.port}`);
        console.log(`📊 Health Check: http://localhost:${this.port}/health`);
        console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`💾 Database: ${this.databaseConnected ? 'MongoDB Connected' : 'In-memory storage'}`);
        console.log('🚀 =================================');
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful server shutdown
   */
  async shutdown() {
    console.log('\n🔄 Shutting down server gracefully...');
    
    try {
      // Close HTTP server
      this.server.close(() => {
        console.log('🔄 HTTP server closed');
      });

      // Close database connection if connected
      if (this.databaseConnected) {
        await Database.disconnect();
      }

      console.log('✅ Server shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the server
const chatServer = new ChatServer();
chatServer.start();