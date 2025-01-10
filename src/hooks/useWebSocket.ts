import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, MessageType } from '../types/message';
import { io, Socket } from 'socket.io-client';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [protocol, setProtocol] = useState<'websocket' | 'socket.io'>('websocket');

  const addSystemMessage = (content: string, level: Message['level'] = 'info') => {
    setMessages(prev => [...prev, {
      content,
      type: 'connection',
      direction: 'system',
      timestamp: Date.now(),
      level
    }]);
  };

  const handleSocketIOMessage = (event: string, data: any) => {
    const newMessage: Message = {
      content: typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data),
      type: 'text',
      direction: 'received',
      timestamp: Date.now(),
      event
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const connect = useCallback((url: string) => {
    try {
      if (url.startsWith('ws://') || url.startsWith('wss://')) {
        setProtocol('websocket');
        addSystemMessage(`Connecting to WebSocket at ${url}...`);
        wsRef.current = new WebSocket(url);
        
        wsRef.current.onopen = () => {
          setIsConnected(true);
          setError(null);
          addSystemMessage('WebSocket connection established successfully', 'success');
        };

        wsRef.current.onclose = (event) => {
          setIsConnected(false);
          addSystemMessage(
            `WebSocket connection closed${event.wasClean ? ' cleanly' : ''} with code ${event.code}${
              event.reason ? `: ${event.reason}` : ''
            }`,
            event.wasClean ? 'info' : 'warning'
          );
        };

        wsRef.current.onerror = (event) => {
          setError('WebSocket error occurred');
          setIsConnected(false);
          addSystemMessage('WebSocket connection error occurred', 'error');
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
      } else {
        setProtocol('socket.io');
        addSystemMessage(`Initializing Socket.IO connection to ${url}...`);
        
        // Close existing connection if any
        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
        }

        // For Socket.IO, use the URL as is (should be http:// or https://)
        socketRef.current = io(url, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 5000,
          forceNew: true,
          autoConnect: false,
        });

        // Debug connection details
        addSystemMessage(`Socket.IO configuration:
• URL: ${url}
• Transport: websocket
• Timeout: 5000ms
• Max reconnection attempts: 3`, 'info');

        // Connect manually
        socketRef.current.connect();

        socketRef.current.on('connect', () => {
          setIsConnected(true);
          setError(null);
          addSystemMessage(`Socket.IO connected successfully
• Socket ID: ${socketRef.current?.id}
• Transport: ${socketRef.current?.io.engine.transport.name}`, 'success');
        });

        socketRef.current.on('connect_error', (error) => {
          const errorMsg = `Socket.IO connection error: ${error.message}`;
          console.error('Socket.IO connection error:', error);
          setError(errorMsg);
          setIsConnected(false);
          addSystemMessage(errorMsg, 'error');
        });

        socketRef.current.on('disconnect', (reason) => {
          setIsConnected(false);
          addSystemMessage(`Socket.IO disconnected: ${reason}`, 'warning');
          if (reason === 'io server disconnect') {
            addSystemMessage('Server initiated disconnect, attempting to reconnect...', 'info');
            socketRef.current?.connect();
          }
        });

        socketRef.current.on('reconnect_attempt', (attemptNumber) => {
          addSystemMessage(`Socket.IO reconnection attempt ${attemptNumber}/3...`, 'info');
        });

        socketRef.current.on('reconnect', (attemptNumber) => {
          addSystemMessage(`Socket.IO reconnected after ${attemptNumber} attempts`, 'success');
          setIsConnected(true);
          setError(null);
        });

        socketRef.current.on('reconnect_error', (error) => {
          addSystemMessage(`Socket.IO reconnection error: ${error.message}`, 'error');
        });

        socketRef.current.on('reconnect_failed', () => {
          addSystemMessage('Socket.IO reconnection failed after all attempts', 'error');
        });

        // Handle all incoming messages
        socketRef.current.onAny((event, ...args) => {
          if (event !== 'connect' && event !== 'disconnect' && !event.startsWith('reconnect')) {
            handleSocketIOMessage(event, args[0]);
          }
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      console.error('Connection error:', err);
      setError(errorMessage);
      addSystemMessage(errorMessage, 'error');
    }
  }, []);

  const disconnect = useCallback(() => {
    addSystemMessage('Disconnecting...', 'info');
    if (protocol === 'websocket') {
      wsRef.current?.close();
      wsRef.current = null;
    } else {
      socketRef.current?.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, [protocol]);

  const sendMessage = useCallback((content: string, type: MessageType, event?: string) => {
    if (!isConnected) {
      setError('Not connected to server');
      addSystemMessage('Failed to send message: Not connected to server', 'error');
      return;
    }

    try {
      if (protocol === 'websocket') {
        if (!wsRef.current) {
          throw new Error('WebSocket not initialized');
        }

        if (type === 'binary') {
          const buffer = new TextEncoder().encode(content);
          wsRef.current.send(buffer);
          addSystemMessage(`Sent binary message (${buffer.length} bytes)`, 'info');
        } else {
          wsRef.current.send(content);
        }
      } else {
        if (!socketRef.current) {
          throw new Error('Socket.IO not initialized');
        }

        if (!event) {
          throw new Error('Event name is required for Socket.IO messages');
        }

        socketRef.current.emit(event, content);
        addSystemMessage(`Sent message to event: ${event}`, 'info');
      }

      const newMessage: Message = {
        content,
        type,
        direction: 'sent',
        timestamp: Date.now(),
        event: protocol === 'socket.io' ? event : undefined
      };
      setMessages(prev => [...prev, newMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      addSystemMessage(errorMessage, 'error');
    }
  }, [isConnected, protocol]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

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