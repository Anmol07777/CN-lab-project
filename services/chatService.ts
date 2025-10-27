import { GoogleGenAI, Chat } from '@google/genai';
import { Message, MessageType, User } from '../types';

type ChatServiceEvent = 'message' | 'user-update';
type Listener = (...args: any[]) => void;

// Predefined set of Tailwind color classes for usernames
const USER_COLORS = [
  'text-red-400', 'text-orange-400', 'text-amber-400', 'text-yellow-400',
  'text-lime-400', 'text-green-400', 'text-emerald-400', 'text-teal-400',
  'text-cyan-400', 'text-sky-400', 'text-blue-400', 'text-indigo-400',
  'text-violet-400', 'text-purple-400', 'text-fuchsia-400', 'text-pink-400',
  'text-rose-400',
];

// Helper function to generate a consistent color from a username
const generateColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % USER_COLORS.length);
  return USER_COLORS[index];
};


class ChatService {
  private users: User[] = [];
  private messages: Message[] = [];
  private listeners: Map<ChatServiceEvent, Set<Listener>> = new Map();
  private ai: GoogleGenAI;
  private aiUserSessions: Map<string, Chat> = new Map();
  private static instance: ChatService;

  private constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  public on(event: ChatServiceEvent, listener: Listener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  public off(event: ChatServiceEvent, listener: Listener): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(listener);
    }
  }

  private emit(event: ChatServiceEvent, ...args: any[]): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(listener => listener(...args));
    }
  }

  public connect(username: string): User {
    if (this.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        throw new Error("Username is already taken.");
    }

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random()}`,
      username,
      color: generateColor(username),
      isAI: false,
    };
    this.users.push(newUser);
    this.addSystemMessage(`${username} has joined the chat.`);
    this.emit('user-update', [...this.users]);
    
    // Start the main ChatBot if it isn't already running
    if (!this.users.some(u => u.id === 'bot_1')) {
      this.startBot();
    }
    
    return newUser;
  }

  public disconnect(userId: string): void {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const user = this.users[userIndex];
      this.users.splice(userIndex, 1);
      this.addSystemMessage(`${user.username} has left the chat.`);
      
      // Clean up AI session if the user was an AI
      if (this.aiUserSessions.has(userId)) {
        this.aiUserSessions.delete(userId);
      }

      this.emit('user-update', [...this.users]);
    }
    // If the only user left is the bot, stop it.
    if (this.users.length === 1 && this.users[0].id === 'bot_1') {
      this.stopBot();
    }
  }

  private _addMessage(message: Message) {
    this.messages.push(message);
    this.emit('message', [...this.messages]);
  }
  
  public async sendMessage(userId: string, text: string): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      username: user.username,
      text,
      timestamp: new Date(),
      type: MessageType.USER,
      color: user.color,
    };
    this._addMessage(newMessage);

    // AI Response Logic
    // 1. Find all valid users mentioned in the message (excluding the sender).
    const allMentionedUsers = this.users.filter(u =>
      u.id !== user.id && text.toLowerCase().includes(`@${u.username.toLowerCase()}`)
    );

    // 2. From those mentions, find which ones are AI-controlled.
    const mentionedAIs = allMentionedUsers.filter(u => u.isAI);

    if (mentionedAIs.length > 0) {
      // Rule A: One or more AIs were mentioned. Have them respond.
      for (const aiUser of mentionedAIs) {
        const promptForAI = `You are the user named ${aiUser.username}. The user ${user.username} just said this to you in a chat: "${text}". Respond to them directly as ${aiUser.username}.`;
        setTimeout(() => this.generateAIResponse(aiUser, promptForAI), 500 + Math.random() * 500);
      }
    } else if (allMentionedUsers.length > 0) {
      // Rule B: Only humans were mentioned. No AI should respond.
      // Do nothing.
    } else {
      // Rule C: No one was mentioned. Let the main ChatBot respond,
      // but only if the message is from a human user.
      const mainBot = this.users.find(u => u.id === 'bot_1');
      if (mainBot && !user.isAI) {
        setTimeout(() => this.generateAIResponse(mainBot, text), 500);
      }
    }
  }

  private async generateAIResponse(aiUser: User, prompt: string): Promise<void> {
    const session = this.aiUserSessions.get(aiUser.id);
    if (!session) return;

    try {
      const response = await session.sendMessage({ message: prompt });
      const botResponseText = response.text;
      
      if (botResponseText) {
        const botMessage: Message = {
          id: `msg_${Date.now()}_${Math.random()}`,
          username: aiUser.username,
          text: botResponseText,
          timestamp: new Date(),
          type: MessageType.USER,
          color: aiUser.color,
        };
        this._addMessage(botMessage);
      }
    } catch (error) {
      console.error(`Error getting AI response for ${aiUser.username}:`, error);
    }
  }

  public toggleAI(userId: string): void {
    const user = this.users.find(u => u.id === userId);
    if (!user || user.id === 'bot_1') return; // Cannot change ChatBot's status

    user.isAI = !user.isAI;

    if (user.isAI) {
      const session = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `You are a user in a multi-user chatroom. Your name is ${user.username}. Engage in conversation naturally and act like a real person with that name. Keep your answers relatively short.`,
        }
      });
      this.aiUserSessions.set(user.id, session);
      this.addSystemMessage(`${user.username} is now controlled by AI.`);
    } else {
      this.aiUserSessions.delete(user.id);
      this.addSystemMessage(`${user.username} is now controlled by a human.`);
    }
    this.emit('user-update', [...this.users]);
  }

  private addSystemMessage(text: string): void {
    const systemMessage: Message = {
      id: `sys_${Date.now()}_${Math.random()}`,
      username: 'System',
      text,
      timestamp: new Date(),
      type: MessageType.SYSTEM,
      color: 'text-gray-500',
    };
    this._addMessage(systemMessage);
  }

  private startBot(): void {
    const botUser: User = { id: 'bot_1', username: 'ChatBot', color: generateColor('ChatBot'), isAI: true };
    if (!this.users.some(u => u.id === 'bot_1')) {
      this.users.push(botUser);
    }
    
    if (!this.aiUserSessions.has('bot_1')) {
      const session = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are a helpful and friendly chatbot in a multi-user chatroom. Your name is ChatBot. Only answer general questions when no one else is being talked to. Be conversational and keep your answers relatively short.',
        }
      });
      this.aiUserSessions.set('bot_1', session);
      this.emit('user-update', [...this.users]);
    }

    setTimeout(() => {
      this._addMessage({
        id: `msg_${Date.now()}_${Math.random()}`,
        username: botUser.username,
        text: "Hello everyone! I'm here to chat and answer your questions. Mention users with @username to talk to them directly!",
        timestamp: new Date(),
        type: MessageType.USER,
        color: botUser.color,
      });
    }, 1000);
  }

  private stopBot(): void {
    this.aiUserSessions.delete('bot_1');
    const botIndex = this.users.findIndex(u => u.id === 'bot_1');
    if (botIndex !== -1) {
      this.users.splice(botIndex, 1);
      this.emit('user-update', [...this.users]);
    }
  }

  public getMessages(): Message[] {
    return [...this.messages];
  }

  public getUsers(): User[] {
    return [...this.users];
  }
}

export const chatService = ChatService.getInstance();