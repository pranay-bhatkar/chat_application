import React, { useState, useEffect, useRef } from "react";
import { Send, User, Users, Wifi, WifiOff } from "lucide-react";

interface Message {
  username: string;
  message: string;
  timestamp: string;
  type?: "message" | "system" | "error";
}

interface ChatInterfaceProps {
  username: string;
  onUsernameChange: (username: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  username,
  onUsernameChange,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const getWebSocketUrl = () => {
    return import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:3001";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const connectWebSocket = () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    const wsUrl = getWebSocketUrl();
    console.log("🔄 Attempting to connect to:", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log("⏰ Connection timeout, closing WebSocket");
          ws.close();
          setError("Connection timeout. Please try again.");
          setIsConnecting(false);
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log("✅ Connected to chat server");
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttempts.current = 0;

        if (username.trim()) {
          ws.send(
            JSON.stringify({
              type: "join",
              username: username.trim(),
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (err) {
          console.error("❌ Error parsing message:", err);
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(
          "🔌 WebSocket connection closed:",
          event.code,
          event.reason
        );
        setIsConnected(false);
        setIsConnecting(false);

        if (
          !event.wasClean &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          reconnectAttempts.current++;
          setError(
            `Connection lost. Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`
          );
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current - 1),
            10000
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError(
            "Unable to connect to chat server. Please refresh the page to try again."
          );
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error("❌ WebSocket error:", error);
        setError(
          "Failed to connect to chat server. Please check your connection."
        );
        setIsConnecting(false);
      };
    } catch (err) {
      console.error("❌ Error creating WebSocket connection:", err);
      setError("Failed to create connection");
      setIsConnecting(false);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case "connection":
        console.log("📡 Connection established:", data.message);
        break;

      case "history":
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((msg: any) => ({
              username: msg.username,
              message: msg.message,
              timestamp: new Date(msg.timestamp).toISOString(),
              type: "message",
            }))
          );
        }
        break;

      case "message":
        setMessages((prev) => {
          const newTimestamp = new Date(data.timestamp).toISOString();
          const exists = prev.some(
            (msg) =>
              msg.timestamp === newTimestamp &&
              msg.username === data.username &&
              msg.message === data.message
          );
          if (exists) return prev;
          return [
            ...prev,
            {
              username: data.username,
              message: data.message,
              timestamp: newTimestamp,
              type: "message",
            },
          ];
        });
        break;

      case "system":
        setMessages((prev) => [
          ...prev,
          {
            username: "System",
            message: data.message,
            timestamp: new Date(data.timestamp).toISOString(),
            type: "system",
          },
        ]);
        break;

      case "error":
        setError(data.message);
        setMessages((prev) => [
          ...prev,
          {
            username: "System",
            message: `Error: ${data.message}`,
            timestamp: new Date().toISOString(),
            type: "error",
          },
        ]);
        break;

      default:
        console.log("🔍 Unknown message type:", data);
    }
  };

  const sendMessage = () => {
    if (!currentMessage.trim() || !isConnected || !wsRef.current) return;
    if (currentMessage.length > 1000) {
      setError("Message too long (max 1000 characters)");
      return;
    }

    try {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          username: username.trim() || "Anonymous",
          message: currentMessage.trim(),
        })
      );

      setCurrentMessage("");
      setError(null);
    } catch (err) {
      console.error("❌ Error sending message:", err);
      setError("Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getMessageStyle = (message: Message) => {
    if (message.type === "system")
      return "bg-blue-50 border-blue-200 text-blue-800";
    if (message.type === "error")
      return "bg-red-50 border-red-200 text-red-800";
    if (message.username === username) return "bg-blue-500 text-white ml-auto";
    return "bg-white border border-gray-200";
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (username.trim() && !isConnected && !isConnecting) {
      connectWebSocket();
    }
    return () => {
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [username]);

  useEffect(() => {
    if (isConnected && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isConnected]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Chat Room</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">Connected</span>
                  </>
                ) : isConnecting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                    <span className="text-blue-600">Connecting...</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">Disconnected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span className="font-medium">{username || "Anonymous"}</span>
            </div>
            <button
              onClick={() => onUsernameChange("")}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Change
            </button>
            {!isConnected && !isConnecting && (
              <button
                onClick={connectWebSocket}
                className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4 rounded-r-md">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">
              Welcome to the Chat Room!
            </p>
            <p className="text-sm">
              Messages will appear here when people start chatting.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`max-w-xs md:max-w-md p-3 rounded-lg shadow-sm ${getMessageStyle(
                message
              )} ${message.username === username ? "ml-auto" : "mr-auto"}`}
            >
              {message.type === "system" || message.type === "error" ? (
                <div className="text-center">
                  <p className="text-sm font-medium">{message.message}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <p
                      className={`text-sm font-semibold ${
                        message.username === username
                          ? "text-blue-100"
                          : "text-gray-900"
                      }`}
                    >
                      {message.username}
                    </p>
                    <p
                      className={`text-xs ${
                        message.username === username
                          ? "text-blue-200"
                          : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  <p
                    className={`text-sm ${
                      message.username === username
                        ? "text-white"
                        : "text-gray-800"
                    }`}
                  >
                    {message.message}
                  </p>
                </>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              ref={messageInputRef}
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isConnected ? "Type your message..." : "Connecting..."
              }
              disabled={!isConnected}
              maxLength={1000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>
                {isConnected
                  ? "Press Enter to send"
                  : "Waiting for connection..."}
              </span>
              <span>{currentMessage.length}/1000</span>
            </div>
          </div>
          <button
            onClick={sendMessage}
            disabled={!isConnected || !currentMessage.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
