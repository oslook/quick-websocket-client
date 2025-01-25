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
          <div className="flex gap-1 p-1 border-b border-current border-opacity-10 bg-opacity-50 bg-gray-50 dark:bg-gray-700/50">
            <button
              className={`px-2 py-0.5 text-xs rounded ${viewMode === 'text' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-white dark:hover:bg-gray-600'}`}
              onClick={() => setViewMode('text')}
            >
              Text
            </button>
            {isJSONContent && (
              <button
                className={`px-2 py-0.5 text-xs rounded ${viewMode === 'json' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-white dark:hover:bg-gray-600'}`}
                onClick={() => setViewMode('json')}
              >
                JSON
              </button>
            )}
            <button
              className={`px-2 py-0.5 text-xs rounded ${viewMode === 'hex' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-white dark:hover:bg-gray-600'}`}
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
          return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
        case 'error':
          return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
        case 'warning':
          return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
        default:
          return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      }
    }
    return message.direction === 'sent' 
      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' 
      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-medium text-gray-600 dark:text-gray-300">Messages</h2>
        <button
          onClick={onClear}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Clear
        </button>
      </div>
      <div ref={scrollContainerRef} className="flex-1 space-y-2 overflow-y-auto">
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