export type MessageDirection = 'sent' | 'received' | 'system';
export type MessageType = 'text' | 'binary' | 'connection';
export type ProtocolType = 'websocket' | 'socket.io';

export interface Message {
  content: string;
  type: MessageType;
  direction: MessageDirection;
  timestamp: number;
  level?: 'info' | 'success' | 'error' | 'warning';
  event?: string; // For Socket.IO events
}

export interface SavedMessage {
  content: string;
  type: 'text' | 'binary';
  event?: string; // For Socket.IO events
}