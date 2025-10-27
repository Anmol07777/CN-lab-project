import React, { useState, useRef, useEffect } from 'react';
import { Message, User, MessageType } from '../types';

interface ChatWindowProps {
  currentUser: User;
  users: User[];
  messages: Message[];
  onSendMessage: (text: string) => void;
  onLogout: () => void;
  onShowReadme: () => void;
  onAddUser: (username: string) => void;
  addUserError: string | null;
  onSwitchUser: (user: User) => void;
  onToggleAI: (userId: string) => void;
}

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.5a5.5 5.5 0 0 1 5.5 5.5c0 1.57-.67 3-1.75 4.02A8.995 8.995 0 0 1 21 21v1H3v-1a9 9 0 0 1 5.25-8.48A5.5 5.5 0 0 1 6.5 8a5.5 5.5 0 0 1 5.5-5.5M12 4a4 4 0 0 0-4 4c0 1.34.69 2.52 1.76 3.24A7.49 7.49 0 0 0 4 20h16a7.5 7.5 0 0 0-5.76-7.76A4 4 0 0 0 16 8a4 4 0 0 0-4-4Z" />
    </svg>
);

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 20.5V3.5L22 12Z" />
    </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
    </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
    </svg>
);

const BotIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM9 12a1 1 0 0 0-1-1H6a1 1 0 0 0 0 2h2a1 1 0 0 0 1-1Zm6 0a1 1 0 0 0-1-1h-2a1 1 0 1 0 0 2h2a1 1 0 0 0 1-1Zm-3 9c-3.86 0-7-3.14-7-7v-3h14v3c0 3.86-3.14 7-7 7Zm-9 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z" />
    </svg>
);

const ChatWindow: React.FC<ChatWindowProps> = ({ 
    currentUser, users, messages, onSendMessage, onLogout, onShowReadme, 
    onAddUser, addUserError, onSwitchUser, onToggleAI 
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isUserListOpen, setIsUserListOpen] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '/quit') {
      onLogout();
      return;
    }
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const parseAndRenderMentions = (text: string, userList: User[]) => {
    const usernames = userList.map(u => u.username);
    const regex = /@([a-zA-Z0-9_]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const username = match[1];
      const userExists = usernames.some(u => u.toLowerCase() === username.toLowerCase());

      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      if (userExists) {
        parts.push(
          <strong key={match.index} className="bg-cyan-800/80 px-1 py-0.5 rounded-sm text-cyan-300">
            @{username}
          </strong>
        );
      } else {
        parts.push(match[0]);
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  const UserList = () => {
    const [newUsername, setNewUsername] = useState('');

    const handleAddUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (newUsername.trim()) {
        onAddUser(newUsername.trim());
        setNewUsername('');
      }
    };

    return (
        <div className="flex flex-col h-full bg-gray-800/50 rounded-lg">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Users ({users.length})</h2>
                <p className="text-xs text-gray-400">Click a user to switch profile</p>
            </div>
            <ul className="flex-1 overflow-y-auto p-2 space-y-1">
                {users.map((user) => (
                <li 
                    key={user.id} 
                    className={`flex items-center justify-between p-2 rounded-md transition-colors duration-200 group ${
                        user.id === 'bot_1' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:bg-gray-700/50'
                    } ${
                        user.id === currentUser.id ? 'bg-cyan-800/60' : ''
                    }`}
                    onClick={() => user.id !== 'bot_1' && onSwitchUser(user)}
                    title={user.id === 'bot_1' ? "This is the main ChatBot" : `Switch to ${user.username}`}
                >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <UserIcon className={`w-6 h-6 flex-shrink-0 ${user.color}`} />
                        <span className={`font-medium truncate ${user.id === currentUser.id ? 'text-white' : 'text-gray-300'}`}>
                            {user.username} {user.id === currentUser.id && '(You)'}
                        </span>
                    </div>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleAI(user.id);
                        }}
                        disabled={user.id === currentUser.id || user.id === 'bot_1'}
                        className="p-1 rounded-full text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed group-hover:opacity-100 transition-opacity"
                        title={user.isAI ? `Switch ${user.username} to human control` : `Let AI control ${user.username}`}
                    >
                        <BotIcon className={`w-5 h-5 ${user.isAI ? 'text-cyan-400' : ''}`} />
                    </button>
                </li>
                ))}
            </ul>
            <form onSubmit={handleAddUser} className="p-2 border-t border-gray-700">
                <p className="text-sm font-semibold text-white mb-2 px-1">Add Simulated User</p>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="New username..."
                        className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
                    />
                    <button type="submit" className="p-2 bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-gray-600" disabled={!newUsername.trim()} aria-label="Add user">
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
                {addUserError && <p className="text-red-400 text-xs mt-2 px-1">{addUserError}</p>}
            </form>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="flex items-center justify-between p-4 bg-gray-800 shadow-md z-10">
        <div className="flex items-center space-x-2">
           <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
             Live Chat
           </h1>
        </div>
        <div className="flex items-center space-x-4">
            <button onClick={onShowReadme} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="Show app info">
                <InfoIcon className="w-6 h-6 text-gray-400" />
            </button>
            <button
              onClick={() => setIsUserListOpen(!isUserListOpen)}
              className="md:hidden p-2 rounded-full hover:bg-gray-700 transition-colors"
              aria-label="Toggle user list"
            >
              <UserIcon className="w-6 h-6 text-gray-400" />
            </button>
            <button
            onClick={onLogout}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
            Leave Chat
            </button>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* User List - Desktop */}
        <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0 p-4">
            <UserList />
        </aside>

        {/* User List - Mobile Drawer */}
        {isUserListOpen && (
            <div 
                className="fixed inset-0 bg-black/60 z-20 md:hidden" 
                onClick={() => setIsUserListOpen(false)}
            >
                <aside className="fixed top-0 right-0 h-full w-64 bg-gray-800 p-4 z-30 transform transition-transform duration-300 ease-in-out"
                    onClick={e => e.stopPropagation()}>
                    <UserList />
                </aside>
            </div>
        )}

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto mb-4 space-y-1 pr-2">
            {messages.map((msg) => {
                if (msg.type === MessageType.SYSTEM) {
                    return (
                        <div key={msg.id} className="flex justify-center py-1">
                            <p className="text-sm text-center text-gray-500 italic">
                                {msg.text}
                            </p>
                        </div>
                    );
                }

                const isMentioned = msg.text.toLowerCase().includes(`@${currentUser.username.toLowerCase()}`);
                return (
                    <div 
                        key={msg.id} 
                        className={`flex items-start gap-3 p-2 rounded-lg transition-colors duration-200 ${
                            isMentioned ? 'bg-cyan-900/40' : ''
                        }`}
                    >
                        <UserIcon className={`w-8 h-8 flex-shrink-0 mt-1 ${msg.color}`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                                <span className={`font-bold ${msg.color}`}>{msg.username}</span>
                                <span className="text-xs text-gray-500">{formatTimestamp(msg.timestamp)}</span>
                            </div>
                            <p className="mt-1 text-base break-words text-gray-200">
                                {parseAndRenderMentions(msg.text, users)}
                            </p>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-4 mt-auto">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Send message as ${currentUser.username}...`}
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-lg"
              autoComplete="off"
            />
            <button
              type="submit"
              className="p-3 bg-cyan-600 rounded-full text-white hover:bg-cyan-700 disabled:bg-gray-600 transition-colors"
              disabled={!message.trim()}
              aria-label="Send message"
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default ChatWindow;