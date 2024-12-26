import { useWebSocket } from './hooks/useWebSocket';
import { useState } from 'react';
import ConnectionPanel from './components/ConnectionPanel';
import MessageInput from './components/MessageInput';
import MessageHistory from './components/MessageHistory';
import HistoryPanel from './components/HistoryPanel';
import { useStorageState } from './hooks/useStorageState';

const App = () => {
  const [url, setUrl] = useState('ws://localhost:8080');
  const [savedMessages, setSavedMessages] = useStorageState<SavedMessage[]>('savedMessages', []);

  const {
    isConnected,
    messages,
    error,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
  } = useWebSocket();

  const handleSaveMessage = (message: SavedMessage) => {
    if (!savedMessages.some(m => m.content === message.content && m.type === message.type)) {
      setSavedMessages([message, ...savedMessages]);
    }
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
            onSelect={(content, type) => isConnected && sendMessage(content, type)}
            disabled={!isConnected}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full">
        <div className="p-6 pb-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Quick WebSocket Client</h1>
            <p className="text-gray-500">Connect and test your WebSocket endpoints</p>
          </div>
          <ConnectionPanel
            url={url}
            setUrl={setUrl}
            onConnect={connect}
            onDisconnect={disconnect}
            isConnected={isConnected}
            error={error}
          />
        </div>
        <div className="flex-1 p-6 pt-4 pb-0 overflow-hidden flex flex-col">
          <MessageHistory messages={messages} onClear={clearMessages} />
        </div>
        <div className="p-6 pt-4">
          <MessageInput 
            onSend={sendMessage} 
            isConnected={isConnected}
            onSaveMessage={handleSaveMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default App; 