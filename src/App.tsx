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
  const [githubStars, setGithubStars] = useState<number | null>(null);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    // Fetch GitHub stars
    fetch('https://api.github.com/repos/oslook/quick-websocket-client')
      .then(res => res.json())
      .then(data => setGithubStars(data.stargazers_count))
      .catch(console.error);
  }, []);

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
    // if (newProtocol === 'websocket') {
    //   setUrl('wss://ws.postman-echo.com/raw');
    // } else {
    //   setUrl('https://ws.postman-echo.com/socketio');
    // }
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
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Quick WebSocket Client</h1>
              <span className="text-sm text-gray-600 dark:text-gray-400 italic">Including Socket.IO support</span>
            </div>
            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">

              <span className="text-sm">v0.0.2.1</span>
              {githubStars !== null && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    {githubStars}
                  </span>
                )}
              <button
                onClick={() => window.open('https://github.com/oslook/quick-websocket-client', '_blank')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
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