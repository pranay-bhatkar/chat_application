import mongoose from 'mongoose';

/**
 * Message Schema for storing chat messages
 * Fields: username, message, timestamp
 */
const messageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  // Add timestamps for created/updated tracking
  timestamps: true
});

// Index for efficient querying by timestamp
messageSchema.index({ timestamp: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;