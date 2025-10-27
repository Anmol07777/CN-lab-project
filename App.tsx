import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import ChatWindow from './components/ChatWindow';
import ReadmeModal from './components/ReadmeModal';
import LoggedOut from './components/LoggedOut';
import { chatService } from './services/chatService';
import { User, Message } from './types';

type AppState = 'login' | 'chatting' | 'loggedOut';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastUser, setLastUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [showReadme, setShowReadme] = useState(false);

  const handleUserUpdate = useCallback((updatedUsers: User[]) => {
    setUsers(updatedUsers);
  }, []);

  const handleMessageUpdate = useCallback((updatedMessages: Message[]) => {
    setMessages(updatedMessages);
  }, []);

  useEffect(() => {
    chatService.on('user-update', handleUserUpdate);
    chatService.on('message', handleMessageUpdate);

    setUsers(chatService.getUsers());
    setMessages(chatService.getMessages());

    return () => {
      chatService.off('user-update', handleUserUpdate);
      chatService.off('message', handleMessageUpdate);
    };
  }, [handleUserUpdate, handleMessageUpdate]);

  const handleLogin = (username: string) => {
    try {
      const user = chatService.connect(username);
      setCurrentUser(user);
      setLastUser(user);
      setAppState('chatting');
      setLoginError(null);
    } catch (e: any) {
      setLoginError(e.message);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      chatService.disconnect(currentUser.id);
      setCurrentUser(null);
      setAppState('loggedOut');
    }
  };

  const handleSendMessage = (text: string) => {
    if (currentUser) {
      chatService.sendMessage(currentUser.id, text);
    }
  };

  const handleAddUser = (username: string) => {
    try {
        chatService.connect(username);
        setAddUserError(null);
    } catch (e: any) {
        setAddUserError(e.message);
    }
  };

  const handleSwitchUser = (user: User) => {
    if (user.id !== 'bot_1') {
        setCurrentUser(user);
    }
  };

  const handleToggleAI = (userId: string) => {
    chatService.toggleAI(userId);
  };

  const handleJoinAgain = () => {
    if (lastUser) {
        try {
            const user = chatService.connect(lastUser.username);
            setCurrentUser(user);
            setAppState('chatting');
            setLoginError(null);
        } catch(e: any) {
            setLoginError(e.message);
            setAppState('login');
        }
    }
  };

  const handleCreateNew = () => {
      // Instead of reloading the page, simply transition back to the login state.
      setAppState('login');
      setLoginError(null);
  };

  const renderContent = () => {
    switch (appState) {
      case 'login':
        return <Login onLogin={handleLogin} error={loginError} />;
      case 'loggedOut':
        return lastUser && <LoggedOut onJoinAgain={handleJoinAgain} onCreateNew={handleCreateNew} username={lastUser.username} />;
      case 'chatting':
        if (!currentUser) {
          setAppState('login');
          return null;
        }
        return (
          <ChatWindow
            currentUser={currentUser}
            users={users}
            messages={messages}
            onSendMessage={handleSendMessage}
            onLogout={handleLogout}
            onShowReadme={() => setShowReadme(true)}
            onAddUser={handleAddUser}
            addUserError={addUserError}
            onSwitchUser={handleSwitchUser}
            onToggleAI={handleToggleAI}
          />
        );
      default:
        return <Login onLogin={handleLogin} error={loginError} />;
    }
  };

  return (
    <>
      {renderContent()}
      {showReadme && <ReadmeModal onClose={() => setShowReadme(false)} />}
    </>
  );
};

export default App;