import { useWebSocket } from './hooks/useWebSocket';
import { useState, useEffect, useRef } from 'react';
import ConnectionPanel from './components/ConnectionPanel';
import MessageInput from './components/MessageInput';
import MessageHistory from './components/MessageHistory';
import HistoryPanel from './components/HistoryPanel';
import { useStorageState } from './hooks/useStorageState';
import { SavedMessage, ProtocolType } from './types/message';

const App = () => {
  const [url, setUrl] = useState('wss://ws.postman-echo.com/raw');
  const [protocol, setProtocol] = useState<ProtocolType>('websocket');
  const [savedMessages, setSavedMessages] = useStorageState<SavedMessage[]>('savedMessages', []);
  const [subscribedEvents, setSubscribedEvents] = useState<Set<string>>(new Set());
  const unsubscribedEvents = useRef<Set<string>>(new Set());
  const allReceivedEvents = useRef<Set<string>>(new Set()); // Track all unique events for autocomplete

  const {
    isConnected,
    messages,
    error,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
  } = useWebSocket();

  // Auto-subscribe to received events
  useEffect(() => {
    if (protocol === 'socket.io') {
      const newEvents = messages
        .filter(m => m.direction === 'received' && m.event)
        .map(m => m.event as string);
      
      // Add to all received events for autocomplete
      newEvents.forEach(event => allReceivedEvents.current.add(event));
      
      // Filter out unsubscribed events and add new ones
      const eventsToAdd = newEvents.filter(event => !unsubscribedEvents.current.has(event));
      
      if (eventsToAdd.length > 0) {
        setSubscribedEvents(prev => new Set([...prev, ...eventsToAdd]));
      }
    }
  }, [messages, protocol]);

  const handleSaveMessage = (message: SavedMessage) => {
    if (!savedMessages.some(m => 
      m.content === message.content && 
      m.type === message.type && 
      m.event === message.event
    )) {
      setSavedMessages([message, ...savedMessages]);
    }
  };

  const handleProtocolChange = (newProtocol: ProtocolType) => {
    if (isConnected) {
      disconnect();
    }
    setProtocol(newProtocol);
    if (newProtocol === 'websocket') {
      setUrl('wss://ws.postman-echo.com/raw');
    } else {
      setUrl('https://ws.postman-echo.com/socketio');
    }
    // Clear all events when switching protocols
    setSubscribedEvents(new Set());
    unsubscribedEvents.current.clear();
    allReceivedEvents.current.clear();
  };

  const handleUnsubscribe = (event: string) => {
    setSubscribedEvents(prev => {
      const newSet = new Set(prev);
      newSet.delete(event);
      return newSet;
    });
    unsubscribedEvents.current.add(event);
  };

  const handleSubscribe = (event: string) => {
    if (!subscribedEvents.has(event)) {
      setSubscribedEvents(prev => new Set([...prev, event]));
      unsubscribedEvents.current.delete(event);
    }
  };

  // Get all available events for autocomplete
  const getAvailableEvents = () => {
    return Array.from(allReceivedEvents.current)
      .filter(event => !subscribedEvents.has(event));
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* URL History */}
        <div className="flex-1 p-4 border-b border-gray-200 overflow-y-auto">
          <h2 className="text-sm font-medium text-gray-600 mb-3">Connection History</h2>
          <HistoryPanel.Urls
            onSelect={url => setUrl(url)}
            disabled={isConnected}
          />
        </div>
        {/* Saved Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h2 className="text-sm font-medium text-gray-600 mb-3">Saved Messages</h2>
          <HistoryPanel.Messages
            messages={savedMessages}
            onDeleteMessage={(index) => {
              setSavedMessages(savedMessages.filter((_, i) => i !== index));
            }}
            onSelect={(content, type, event) => isConnected && sendMessage(content, type, event)}
            disabled={!isConnected}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Quick WebSocket Client</h1>
          <div className="flex gap-2 items-start">
            <select
              value={protocol}
              onChange={(e) => handleProtocolChange(e.target.value as ProtocolType)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 whitespace-nowrap"
              disabled={isConnected}
            >
              <option value="websocket">WebSocket</option>
              <option value="socket.io">Socket.IO</option>
            </select>
            <ConnectionPanel
              url={url}
              setUrl={setUrl}
              onConnect={connect}
              onDisconnect={disconnect}
              isConnected={isConnected}
              error={error}
              protocol={protocol}
            />
          </div>
        </div>
        <div className="flex-1 px-4 overflow-hidden flex flex-col min-h-0">
          <MessageHistory 
            messages={messages} 
            onClear={clearMessages}
            subscribedEvents={subscribedEvents}
            protocol={protocol}
          />
        </div>
        <div className="p-4">
          <MessageInput 
            onSend={sendMessage} 
            isConnected={isConnected}
            onSaveMessage={handleSaveMessage}
            protocol={protocol}
            subscribedEvents={subscribedEvents}
            onSubscribe={handleSubscribe}
            onUnsubscribe={handleUnsubscribe}
            availableEvents={getAvailableEvents()}
          />
        </div>
      </div>
    </div>
  );
};

export default App; 