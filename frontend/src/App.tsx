import React, { useState } from 'react';
import UsernameForm from './components/UsernameForm';
import ChatInterface from './components/ChatInterface';

/**
 * Main App Component
 * Manages user authentication state and renders appropriate interface
 */
function App() {
  const [username, setUsername] = useState<string>('');

  /**
   * Handle username submission from login form
   */
  const handleUsernameSubmit = (newUsername: string) => {
    setUsername(newUsername);
  };

  /**
   * Handle username change (logout)
   */
  const handleUsernameChange = (newUsername: string) => {
    setUsername(newUsername);
  };

  return (
    <div className="h-screen flex flex-col">
      {username ? (
        <ChatInterface 
          username={username} 
          onUsernameChange={handleUsernameChange}
        />
      ) : (
        <UsernameForm onSubmit={handleUsernameSubmit} />
      )}
    </div>
  );
}

export default App;