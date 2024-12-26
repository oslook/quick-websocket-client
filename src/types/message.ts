export type MessageDirection = 'sent' | 'received' | 'system';
export type MessageType = 'text' | 'binary' | 'connection';

export interface Message {
  content: string;
  type: MessageType;
  direction: MessageDirection;
  timestamp: number;
  level?: 'info' | 'success' | 'error' | 'warning';
} 