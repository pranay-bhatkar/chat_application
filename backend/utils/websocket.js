import { WebSocketServer } from "ws";
import Message from "../models/Message.js";
import Database from "./database.js";

/**
 * WebSocket Manager for handling real-time chat functionality
 * Manages client connections, message broadcasting, and chat history
 */
class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Store WebSocket => clientInfo
    this.messageHistory = []; // In-memory fallback for messages
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on("connection", (ws, request) => {
      console.log("🔗 New WebSocket connection established");
      this.handleConnection(ws, request);
    });

    console.log("🚀 WebSocket server initialized");
  }

  /**
   * Handle new client connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} request - HTTP request object
   */
  async handleConnection(ws, request) {
    const clientInfo = {
      ws,
      username: "Anonymous",
      id: Date.now() + Math.random(),
      connectedAt: new Date(),
    };

    // Temporarily store the client
    this.clients.set(ws, clientInfo);

    ws.on("message", async (data) => {
      try {
        const messageData = JSON.parse(data.toString());
        await this.handleMessage(ws, messageData);
      } catch (error) {
        console.error("❌ Error handling message:", error);
        this.sendError(ws, "Invalid message format");
      }
    });

    ws.on("close", () => {
      this.handleDisconnection(ws);
    });

    ws.on("error", (error) => {
      console.error("❌ WebSocket error:", error);
      this.handleDisconnection(ws);
    });

    this.sendMessage(ws, {
      type: "connection",
      message: "Connected to chat server",
    });
  }

  /**
   * Handle incoming messages from clients
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} messageData - Parsed message data
   */
  async handleMessage(ws, messageData) {
    const clientInfo = this.clients.get(ws);
    const { type, username, message } = messageData;

    switch (type) {
      case "join":
        await this.handleUserJoin(ws, username);
        break;

      case "message":
        await this.handleChatMessage(ws, username, message);
        break;

      default:
        this.sendError(ws, "Unknown message type");
    }
  }

  /**
   * Handle user joining the chat
   * @param {WebSocket} ws - WebSocket connection
   * @param {String} username - User's chosen username
   */
  async handleUserJoin(ws, username) {
    try {
      const clientInfo = this.clients.get(ws);
      if (!clientInfo) return;

      clientInfo.username = username || "Anonymous";
      this.clients.set(ws, clientInfo); // Update client info

      console.log(`👤 User "${clientInfo.username}" joined the chat`);

      let history = [];

      if (Database.isConnected()) {
        try {
          const recentMessages = await Message.find()
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();
          history = recentMessages.reverse().map((msg) => ({
            username: msg.username,
            message: msg.message,
            timestamp: msg.timestamp,
          }));
        } catch (dbError) {
          console.error("❌ Error fetching messages from database:", dbError);
          history = this.messageHistory.slice(-50);
        }
      } else {
        history = this.messageHistory.slice(-50);
        console.log(
          "⚠️ Using in-memory message history (database not connected)"
        );
      }

      this.sendMessage(ws, {
        type: "history",
        messages: history,
      });

      this.broadcastMessage({
        type: "system",
        message: `${clientInfo.username} joined the chat`,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("❌ Error handling user join:", error);
      this.sendError(ws, "Error joining chat");
    }
  }

  /**
   * Handle chat message from user
   * @param {WebSocket} ws - WebSocket connection
   * @param {String} username - Sender's username
   * @param {String} message - Chat message content
   */
  async handleChatMessage(ws, username, message) {
    const clientInfo = this.clients.get(ws);
    if (!clientInfo) return;

    try {
      if (!message || message.trim().length === 0) {
        this.sendError(ws, "Message cannot be empty");
        return;
      }

      if (message.length > 1000) {
        this.sendError(ws, "Message too long (max 1000 characters)");
        return;
      }

      const messageData = {
        username: username || clientInfo.username,
        message: message.trim(),
        timestamp: new Date(),
      };

      let savedMessage = messageData;

      if (Database.isConnected()) {
        try {
          const newMessage = new Message(messageData);
          savedMessage = await newMessage.save();
          console.log(
            `💬 Message saved to database: ${username} - ${message.substring(
              0,
              50
            )}...`
          );
        } catch (dbError) {
          console.error("❌ Error saving message to database:", dbError);
        }
      }

      this.messageHistory.push(messageData);
      if (this.messageHistory.length > 100) {
        this.messageHistory = this.messageHistory.slice(-100);
      }

      if (!Database.isConnected()) {
        console.log(
          `💬 Message stored in memory: ${username} - ${message.substring(
            0,
            50
          )}...`
        );
      }

      this.broadcastMessage({
        type: "message",
        username: savedMessage.username,
        message: savedMessage.message,
        timestamp: savedMessage.timestamp,
      });
    } catch (error) {
      console.error("❌ Error handling chat message:", error);
      this.sendError(ws, "Error sending message");
    }
  }

  /**
   * Handle client disconnection
   * @param {WebSocket} ws - WebSocket connection
   */
  handleDisconnection(ws) {
    const clientInfo = this.clients.get(ws);
    const username = clientInfo?.username || "Anonymous";

    console.log(`👋 User "${username}" disconnected`);

    this.clients.delete(ws);

    this.broadcastMessage({
      type: "system",
      message: `${username} left the chat`,
      timestamp: new Date(),
    });
  }

  /**
   * Send message to specific client
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} data - Message data
   */
  sendMessage(ws, data) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Send error message to client
   * @param {WebSocket} ws - WebSocket connection
   * @param {String} error - Error message
   */
  sendError(ws, error) {
    this.sendMessage(ws, {
      type: "error",
      message: error,
    });
  }

  /**
   * Broadcast message to all connected clients
   * @param {Object} messageData - Message to broadcast
   */
  broadcastMessage(messageData) {
    const message = JSON.stringify(messageData);

    this.clients.forEach((clientInfo, ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      } else {
        this.clients.delete(ws);
      }
    });
  }

  /**
   * Get count of active connections
   * @returns {Number} Number of active connections
   */
  getActiveConnections() {
    return this.clients.size;
  }
}

export default new WebSocketManager();
