import { useWebSocket } from './hooks/useWebSocket';
import { useState, useEffect, useRef } from 'react';
import ConnectionPanel from './components/ConnectionPanel';
import MessageInput from './components/MessageInput';
import MessageHistory from './components/MessageHistory';
import HistoryPanel from './components/HistoryPanel';
import { useStorageState } from './hooks/useStorageState';
import { useTheme } from './hooks/useTheme';
import { SavedMessage, ProtocolType } from './types/message';

const App = () => {
  const [url, setUrl] = useState('');
  const [protocol, setProtocol] = useState<ProtocolType>('websocket');
  const [savedMessages, setSavedMessages] = useStorageState<SavedMessage[]>('savedMessages', []);
  const [subscribedEvents, setSubscribedEvents] = useState<Set<string>>(new Set());
  const unsubscribedEvents = useRef<Set<string>>(new Set());
  const allReceivedEvents = useRef<Set<string>>(new Set()); // Track all unique events for autocomplete
  const { isDark, toggleTheme } = useTheme();

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
    // Clear all events when switching protocols
    setSubscribedEvents(new Set());
    unsubscribedEvents.current.clear();
    allReceivedEvents.current.clear();
    // Clear message history too: leftover messages from the old protocol
    // would otherwise be re-scanned by the auto-subscribe effect and
    // silently re-subscribe events the user had unsubscribed.
    clearMessages();
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
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Left Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        {/* URL History */}
        <div className="flex-1 p-4 border-b border-gray-200 dark:border-gray-700 overflow-y-auto">
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Connection History</h2>
          <HistoryPanel.Urls
            onSelect={url => setUrl(url)}
            disabled={isConnected}
          />
        </div>
        {/* Saved Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Saved Messages</h2>
          <HistoryPanel.Messages
            messages={savedMessages}
            onDeleteMessage={(index) => {
              setSavedMessages(savedMessages.filter((_, i) => i !== index));
            }}
            onSelect={(content: string, type: 'text' | 'binary', event?: string) => isConnected && sendMessage(content, type, event)}
            disabled={!isConnected}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">WebSocket & Socket.IO Client</h1>
            </div>
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">

              <span className="text-sm">v0.0.3</span>
              <button
                onClick={() => window.open('https://github.com/oslook/quick-websocket-client', '_blank')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
              </button>
              <button
                onClick={() => window.open('https://chromewebstore.google.com/detail/json-viewer-chrome-extens/kggkmmjihpjangbkpcdidlhfbnnfaldn', '_blank')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800"
                title="Try our recommended JSON Viewer extension"
              >
                <img src="json-viewer.png" alt="" className="w-5 h-5" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">JSON Viewer</span>
                <span className="text-xs text-blue-500 dark:text-blue-400">★ Recommended</span>
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <ConnectionPanel
            url={url}
            setUrl={setUrl}
            onConnect={connect}
            onDisconnect={disconnect}
            isConnected={isConnected}
            error={error}
            protocol={protocol}
            handleProtocolChange={handleProtocolChange}
          />
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