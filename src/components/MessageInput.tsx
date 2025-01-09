import { useState, useCallback, useEffect, useRef } from 'react';
import { useStorageState } from '../hooks/useStorageState';
import { formatJSON, isJSON } from '../utils/jsonFormatter';
import { ProtocolType, SavedMessage, MessageType } from '../types/message';

type MessageInputProps = {
  onSend: (content: string, type: MessageType, event?: string) => void;
  isConnected: boolean;
  onSaveMessage: (message: SavedMessage) => void;
  protocol: ProtocolType;
  subscribedEvents: Set<string>;
  onSubscribe: (event: string) => void;
  onUnsubscribe: (event: string) => void;
  availableEvents?: string[];
};

const MessageInput = ({ 
  onSend, 
  isConnected, 
  onSaveMessage,
  protocol,
  subscribedEvents,
  onSubscribe,
  onUnsubscribe,
  availableEvents = []
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<MessageType>('text');
  const [event, setEvent] = useState('');
  const [showFormatted, setShowFormatted] = useState(false);
  const [newEvent, setNewEvent] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && inputRef.current && 
          !suggestionRef.current.contains(event.target as Node) &&
          !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter suggestions based on input
  const suggestions = availableEvents
    .filter(e => e.toLowerCase().includes(newEvent.toLowerCase()))
    .slice(0, 5); // Limit to 5 suggestions

  const handleEventSelect = (selectedEvent: string) => {
    setNewEvent(selectedEvent);
    setShowSuggestions(false);
    // Optional: Auto subscribe when selecting an event
    if (selectedEvent.trim()) {
      onSubscribe(selectedEvent.trim());
      setNewEvent('');
    }
  };

  const handleSave = useCallback(() => {
    if (message.trim()) {
      onSaveMessage({ 
        content: message.trim(), 
        type,
        event: protocol === 'socket.io' ? event : undefined 
      });
    }
  }, [message, type, event, protocol, onSaveMessage]);

  const handleSend = useCallback(() => {
    if (message.trim() && isConnected) {
      onSend(message.trim(), type, protocol === 'socket.io' ? event : undefined);
      setMessage('');
      setShowFormatted(false);
    }
  }, [message, type, event, protocol, isConnected, onSend]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
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
      <div className="p-4 space-y-3">
        {protocol === 'socket.io' && (
          <div className="flex gap-2">
            <input
              type="text"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              placeholder="Event name"
              disabled={!isConnected}
            />
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={newEvent}
                onChange={(e) => {
                  setNewEvent(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="Subscribe to event"
                disabled={!isConnected}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  ref={suggestionRef}
                  className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg"
                >
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                      onClick={() => handleEventSelect(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                if (newEvent.trim()) {
                  onSubscribe(newEvent.trim());
                  setNewEvent('');
                  setShowSuggestions(false);
                }
              }}
              disabled={!isConnected || !newEvent.trim()}
              className="px-4 py-2 rounded-lg font-medium bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Subscribe
            </button>
          </div>
        )}

        {protocol === 'socket.io' && subscribedEvents.size > 0 && (
          <div className="flex flex-wrap gap-1">
            {Array.from(subscribedEvents).map((e) => (
              <span 
                key={e}
                className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1"
              >
                {e}
                <button
                  onClick={() => onUnsubscribe(e)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setShowFormatted(false);
            }}
            className="w-full h-24 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-mono text-sm"
            placeholder={protocol === 'socket.io' ? "Message content..." : "Type your message..."}
            disabled={!isConnected}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MessageType)}
              className="px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              disabled={!isConnected}
            >
              <option value="text">Text</option>
              <option value="binary">Binary</option>
            </select>
            {type === 'text' && (
              <button
                onClick={handleFormat}
                disabled={!message.trim() || !isJSON(message)}
                className="px-3 py-1.5 text-sm rounded-lg font-medium bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Format JSON
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!message.trim()}
              className="px-3 py-1.5 text-sm rounded-lg font-medium bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              title="Save Request (⌘+S)"
            >
              Save
              <span className="text-xs bg-yellow-400/50 px-1 py-0.5 rounded">⌘S</span>
            </button>
            <button
              onClick={handleSend}
              disabled={!isConnected || !message.trim() || (protocol === 'socket.io' && !event.trim())}
              className="px-3 py-1.5 text-sm rounded-lg font-medium bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              title="Send Request (⌘+Enter)"
            >
              Send
              <span className="text-xs bg-green-400/50 px-1 py-0.5 rounded">⌘↵</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput; 