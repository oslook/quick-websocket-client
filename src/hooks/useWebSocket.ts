import { useState, useCallback, useRef } from 'react';
import { Message, MessageType } from '../types/message';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const addSystemMessage = (content: string, level: Message['level'] = 'info') => {
    setMessages(prev => [...prev, {
      content,
      type: 'connection',
      direction: 'system',
      timestamp: Date.now(),
      level
    }]);
  };

  const connect = useCallback((url: string) => {
    try {
      addSystemMessage(`Connecting to ${url}...`);
      wsRef.current = new WebSocket(url);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        addSystemMessage('Connection established successfully', 'success');
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        addSystemMessage(
          `Connection closed${event.wasClean ? ' cleanly' : ''} with code ${event.code}${
            event.reason ? `: ${event.reason}` : ''
          }`,
          event.wasClean ? 'info' : 'warning'
        );
      };

      wsRef.current.onerror = (event) => {
        setError('WebSocket error occurred');
        setIsConnected(false);
        addSystemMessage('Connection error occurred', 'error');
      };

      wsRef.current.onmessage = (event) => {
        if (event.data instanceof Blob) {
          addSystemMessage(`Received binary message (${event.data.size} bytes)`, 'info');
        }

        const newMessage: Message = {
          content: event.data instanceof Blob ? '[Binary Data]' : event.data,
          type: event.data instanceof Blob ? 'binary' : 'text',
          direction: 'received',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, newMessage]);
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      addSystemMessage(errorMessage, 'error');
    }
  }, []);

  const disconnect = useCallback(() => {
    addSystemMessage('Disconnecting...', 'info');
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((content: string, type: MessageType) => {
    if (!wsRef.current || !isConnected) {
      setError('Not connected to server');
      addSystemMessage('Failed to send message: Not connected to server', 'error');
      return;
    }

    try {
      if (type === 'binary') {
        const buffer = new TextEncoder().encode(content);
        wsRef.current.send(buffer);
        addSystemMessage(`Sent binary message (${buffer.length} bytes)`, 'info');
      } else {
        wsRef.current.send(content);
      }

      const newMessage: Message = {
        content,
        type,
        direction: 'sent',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, newMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      addSystemMessage(errorMessage, 'error');
    }
  }, [isConnected]);

  return {
    isConnected,
    messages,
    error,
    connect,
    disconnect,
    sendMessage,
    clearMessages: useCallback(() => setMessages([]), []),
  };
}; 