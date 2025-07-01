# Real-Time Chat Application - MERN Stack

A production-ready real-time chat application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring WebSocket communication for instant messaging.

## 🚀 Features

- **Real-time messaging** using WebSocket connections
- **Multi-user support** with concurrent connections
- **Message persistence** with MongoDB storage
- **Chat history** retrieval (last 50 messages)
- **User join/leave notifications**
- **Responsive design** for all devices
- **Error handling** and connection management
- **Clean, modern UI** with Tailwind CSS

## 🏗️ Architecture

### Backend Architecture
- **Express.js server** handling HTTP requests and WebSocket connections
- **WebSocket server** using the `ws` module for real-time communication
- **MongoDB database** with Mongoose for message storage
- **Asynchronous patterns** for handling concurrent connections
- **Connection pooling** and graceful error handling

### Frontend Architecture
- **React.js SPA** with TypeScript support
- **Component-based architecture** with reusable UI components
- **WebSocket client** using browser's native WebSocket API
- **State management** with React hooks
- **Responsive design** with Tailwind CSS

### Communication Flow
1. Client connects to WebSocket server
2. Server accepts connection and requests username
3. Server sends recent chat history to new client
4. Messages are broadcast to all connected clients in real-time
5. All messages are persisted to MongoDB database

## 🛠️ Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **ws** - WebSocket library
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Frontend
- **React.js** - User interface library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Vite** - Build tool and development server

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone https://github.com/pranay-bhatkar/chat_application
cd chat_application
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the backend server
npm run dev
```

The backend server will start on `http://localhost:3001`

### 3. Frontend Setup
```bash
# Navigate to project root (if in backend directory)
cd ..
cd frontend


# Install frontend dependencies
npm install

# Start the frontend development server
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Database Setup

MongoDB Atlas:
1. Create a cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Get your connection string
3. Update the `MONGODB_URI` in your `.env` file

## 🚀 Running the Application

### Development Mode
1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. In a new terminal, start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

### Production Mode
1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Start the backend in production mode:
   ```bash
   cd backend
   npm start
   ```

## 🌐 Deployment

### Backend Deployment (Render)

# Set environment variables
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app

#### Render:
1. Connect your GitHub repository to Render
2. Set build command: `cd backend && npm install`
3. Set start command: `cd backend && npm start`
4. Add environment variables in Render dashboard

### Frontend Deployment (Vercel)

#### Vercel:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Important**: Update the WebSocket URL in `src/components/ChatInterface.tsx` to point to your deployed backend:
```typescript
const WS_URL = 'wss://your-backend-url.herokuapp.com';
```

## 🧪 Testing the Application

### Local Testing
1. Open multiple browser tabs/windows to `http://localhost:5173`
2. Enter different usernames in each tab
3. Send messages and verify real-time communication
4. Check that messages persist by refreshing and rejoining

### Production Testing
1. Share the deployed URL with multiple users
2. Test concurrent connections
3. Verify message persistence across sessions
4. Test connection recovery after network issues

## 📁 Project Structure

```
mern-chat-application/
├── backend/                    # Backend server code
│   ├── models/                # Database models
│   │   └── Message.js         # Message schema
│   ├── utils/                 # Utility modules
│   │   ├── database.js        # Database connection
│   │   └── websocket.js       # WebSocket manager
│   ├── .env                  # Environment variables (gitignored)
│   ├── package.json          # Backend dependencies
│   └── server.js             # Main server file
├── src/                      # Frontend source code
│   ├── components/           # React components
│   │   ├── ChatInterface.tsx # Main chat interface
│   │   └── UsernameForm.tsx  # Username input form
│   ├── App.tsx              # Main App component
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── package.json            # Frontend dependencies
├── tailwind.config.js      # Tailwind CSS configuration
├── vite.config.ts         # Vite configuration
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the `backend` directory:

```env
# MongoDB Connection
MONGODB_URI=

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

### WebSocket Configuration
The WebSocket connection is configured in `src/components/ChatInterface.tsx`:

```typescript
// For development
const WS_URL = 'ws://localhost:3001';

// For production (update with your deployed backend URL)
const WS_URL = 'wss://your-backend-url.herokuapp.com';
```

## 🎯 Key Implementation Details

### Concurrency Handling
- **Asynchronous I/O**: All database operations use async/await patterns
- **Connection pooling**: MongoDB connection is shared across requests
- **Event-driven architecture**: WebSocket events handle multiple concurrent connections
- **Non-blocking operations**: Server can handle multiple clients simultaneously

### Error Handling
- **Database connection errors**: Graceful handling with retry logic
- **WebSocket connection issues**: Automatic reconnection attempts
- **Message validation**: Input sanitization and length limits
- **Network failures**: Connection status indicators and error messages

### Security Considerations
- **Input validation**: Message content and username validation
- **CORS configuration**: Restricted to specific origins
- **Connection limits**: MongoDB connection pooling prevents overload
- **Error message sanitization**: Prevents information leakage

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start
- Check MongoDB connection string in `.env`
- Ensure MongoDB is running (local) or accessible (Atlas)
- Verify port 3001 is not in use

#### Frontend can't connect to WebSocket
- Ensure backend server is running on port 3001
- Check WebSocket URL in `ChatInterface.tsx`
- Verify CORS settings in backend server

#### Messages not persisting
- Check MongoDB connection and database permissions
- Verify Message model schema is correct
- Check server logs for database errors

#### Connection issues in production
- Ensure WebSocket URL uses `wss://` (secure WebSocket)
- Check environment variables are set correctly
- Verify CORS settings include production frontend URL

### Debugging Tips
1. Check browser console for client-side errors
2. Check server logs for backend issues
3. Use MongoDB Compass to inspect database
4. Test WebSocket connection with browser dev tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built as part of the Full-Stack Intern assignment for Kuvaka Tech
- Uses the MERN stack for modern web development
- Implements real-time communication without external libraries like Socket.IO
- Demonstrates concurrent connection handling and database integration

---
