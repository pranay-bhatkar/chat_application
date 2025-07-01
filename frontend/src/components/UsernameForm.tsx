import React, { useState } from 'react';
import { User, MessageCircle } from 'lucide-react';

interface UsernameFormProps {
  onSubmit: (username: string) => void;
}

const UsernameForm: React.FC<UsernameFormProps> = ({ onSubmit }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }
    
    if (trimmedUsername.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    
    if (trimmedUsername.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }
    
    setError('');
    onSubmit(trimmedUsername);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Chat Room</h1>
          <p className="text-gray-600">Enter your username to start chatting with others</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                Choose Your Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your username"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    error ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  maxLength={20}
                  autoComplete="username"
                  autoFocus
                />
              </div>
              
              {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <span className="inline-block w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                  {error}
                </p>
              )}
              
              <div className="mt-2 text-xs text-gray-500">
                <p>• 2-20 characters</p>
                <p>• Letters, numbers, underscores, and hyphens only</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Join Chat Room
            </button>
          </form>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl mb-2">🚀</div>
            <p className="text-sm font-medium text-gray-700">Real-time</p>
            <p className="text-xs text-gray-500">Instant messaging</p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-2xl mb-2">👥</div>
            <p className="text-sm font-medium text-gray-700">Multi-user</p>
            <p className="text-xs text-gray-500">Chat with everyone</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <p>Built with MERN Stack • Real-time WebSocket Communication</p>
        </div>
      </div>
    </div>
  );
};

export default UsernameForm;