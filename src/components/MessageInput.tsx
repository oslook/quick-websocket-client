import { useState, useCallback, useEffect } from 'react';
import { useStorageState } from '../hooks/useStorageState';
import { formatJSON, isJSON } from '../utils/jsonFormatter';

type SavedMessage = {
  content: string;
  type: 'text' | 'binary';
};

type MessageInputProps = {
  onSend: (content: string, type: 'text' | 'binary') => void;
  isConnected: boolean;
  onSaveMessage: (message: SavedMessage) => void;
};

const MessageInput = ({ onSend, isConnected, onSaveMessage }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'text' | 'binary'>('text');
  const [showFormatted, setShowFormatted] = useState(false);

  const handleSave = useCallback(() => {
    if (message.trim()) {
      onSaveMessage({ content: message.trim(), type });
    }
  }, [message, type, onSaveMessage]);

  const handleSend = useCallback(() => {
    if (message.trim() && isConnected) {
      onSend(message.trim(), type);
      setMessage('');
      setShowFormatted(false);
    }
  }, [message, type, isConnected, onSend]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Command+Enter (Mac) or Control+Enter (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
      // Check for Command+S (Mac) or Control+S (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (message.trim()) {
          handleSave();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSend, handleSave, message]);

  const handleFormat = () => {
    if (isJSON(message)) {
      const formatted = formatJSON(message);
      if (formatted) {
        setMessage(formatted);
        setShowFormatted(true);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'text' | 'binary')}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            disabled={!isConnected}
          >
            <option value="text">Text</option>
            <option value="binary">Binary</option>
          </select>
          {type === 'text' && (
            <button
              onClick={handleFormat}
              disabled={!message.trim() || !isJSON(message)}
              className="px-4 py-2 rounded-lg font-medium bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Format JSON
            </button>
          )}
        </div>
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setShowFormatted(false);
            }}
            className="w-full h-32 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-mono text-sm"
            placeholder="Type your message..."
            disabled={!isConnected}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleSave}
            disabled={!message.trim()}
            className="px-4 py-2 rounded-lg font-medium bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Save Request (⌘+S)"
          >
            Save Request
            <span className="text-xs bg-yellow-400/50 px-1.5 py-0.5 rounded">⌘S</span>
          </button>
          <button
            onClick={handleSend}
            disabled={!isConnected || !message.trim()}
            className="px-6 py-2 rounded-lg font-medium bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Send Request (⌘+Enter)"
          >
            Send Request
            <span className="text-xs bg-green-400/50 px-1.5 py-0.5 rounded">⌘↵</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput; 