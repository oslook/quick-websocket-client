import { Message } from '../types/message';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { formatJSON, isJSON, formatHexDump } from '../utils/formatters';

type MessageHistoryProps = {
  messages: Message[];
  onClear: () => void;
  subscribedEvents?: Set<string>;
  protocol?: 'websocket' | 'socket.io';
};

type ViewMode = 'text' | 'json' | 'hex';

type MessageItemProps = {
  message: Message;
  className: string;
};

const MessageItem = ({ message, className }: MessageItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('text');
  const content = message.content;
  const isExpandable = content.includes('\n') || content.length > 80;
  const isJSONContent = isJSON(content);

  // Format one-line preview
  const getPreviewContent = () => {
    if (content.length <= 80) return content;
    return content.split('\n')[0].slice(0, 80) + '...';
  };

  // Format expanded content based on view mode
  const getExpandedContent = () => {
    switch (viewMode) {
      case 'json':
        return isJSONContent ? formatJSON(content) : 'Invalid JSON';
      case 'hex':
        return formatHexDump(content);
      default:
        return content;
    }
  };

  return (
    <div className={`rounded-lg border text-sm font-mono ${className}`}>
      <div 
        className="p-2 flex items-center gap-2 cursor-pointer hover:bg-opacity-80"
        onClick={() => isExpandable && setIsExpanded(!isExpanded)}
      >
        <span className="text-xs opacity-70 whitespace-nowrap">
          {format(message.timestamp, 'HH:mm:ss.SSS')}
        </span>
        <span className="text-xs truncate flex-1">
          {formatMessage(message, getPreviewContent())}
        </span>
        {isExpandable && (
          <button 
            className="text-xs opacity-50 hover:opacity-100 px-1"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div className="border-t border-current border-opacity-10">
          <div className="flex gap-1 p-1 border-b border-current border-opacity-10 bg-opacity-50 bg-gray-50">
            <button
              className={`px-2 py-0.5 text-xs rounded ${viewMode === 'text' ? 'bg-white shadow' : 'hover:bg-white'}`}
              onClick={() => setViewMode('text')}
            >
              Text
            </button>
            {isJSONContent && (
              <button
                className={`px-2 py-0.5 text-xs rounded ${viewMode === 'json' ? 'bg-white shadow' : 'hover:bg-white'}`}
                onClick={() => setViewMode('json')}
              >
                JSON
              </button>
            )}
            <button
              className={`px-2 py-0.5 text-xs rounded ${viewMode === 'hex' ? 'bg-white shadow' : 'hover:bg-white'}`}
              onClick={() => setViewMode('hex')}
            >
              Hex
            </button>
          </div>
          <pre className="p-2 overflow-x-auto whitespace-pre">
            {getExpandedContent()}
          </pre>
        </div>
      )}
    </div>
  );
};

const MessageHistory = ({ messages, onClear, subscribedEvents = new Set(), protocol = 'websocket' }: MessageHistoryProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter messages based on subscribed events
  const filteredMessages = messages.filter(message => {
    // Always show system/connection messages
    if (message.type === 'connection') return true;
    
    // For Socket.IO, only show messages with subscribed events or sent messages
    if (protocol === 'socket.io' && message.event) {
      return message.direction === 'sent' || subscribedEvents.has(message.event);
    }
    
    // Show all WebSocket messages
    return true;
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      const { scrollHeight, clientHeight, scrollTop } = scrollContainer;
      const isScrolledNearBottom = scrollHeight - clientHeight - scrollTop < 100;
      
      if (isScrolledNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [filteredMessages]);

  const getMessageClass = (message: Message) => {
    if (message.type === 'connection') {
      switch (message.level) {
        case 'success':
          return 'bg-green-50 text-green-700 border-green-200';
        case 'error':
          return 'bg-red-50 text-red-700 border-red-200';
        case 'warning':
          return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        default:
          return 'bg-blue-50 text-blue-700 border-blue-200';
      }
    }
    return message.direction === 'sent' 
      ? 'bg-purple-50 text-purple-700 border-purple-200' 
      : 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-medium text-gray-600">Message History</h2>
        <button
          onClick={onClear}
          className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
        >
          Clear
        </button>
      </div>
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-1"
      >
        {filteredMessages.map((message, index) => (
          <MessageItem
            key={index}
            message={message}
            className={getMessageClass(message)}
          />
        ))}
        {filteredMessages.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No messages yet
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

const formatMessage = (message: Message, content: string) => {
  if (message.type === 'connection') {
    return content;
  }
  
  let prefix = '';
  if (message.direction === 'sent') {
    prefix = message.event 
      ? `📤 [Emit: ${message.event}] ` 
      : '📤 [Sent] ';
  } else {
    prefix = message.event 
      ? `📥 [Event: ${message.event}] ` 
      : '📥 [Received] ';
  }
  
  return prefix + content;
};

export default MessageHistory; 