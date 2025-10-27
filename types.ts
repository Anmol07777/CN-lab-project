export enum MessageType {
  USER = 'user',
  SYSTEM = 'system',
}

export interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: Date;
  type: MessageType;
  color: string;
}

export interface User {
  id: string;
  username: string;
  color: string;
  isAI: boolean;
}