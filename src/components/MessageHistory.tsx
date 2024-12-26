import { isJSON, formatJSON } from '../utils/jsonFormatter';
import { Message } from '../types/message';

type MessageHistoryProps = {
  messages: Message[];
  onClear: () => void;
};

const MessageHistory = ({ messages, onClear }: MessageHistoryProps) => {
  const formatContent = (content: string) => {
    if (isJSON(content)) {
      const formatted = formatJSON(content);
      if (formatted) {
        return (
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {formatted}
          </pre>
        );
      }
    }
    return content;
  };

  const getMessageStyles = (message: Message) => {
    if (message.direction === 'system') {
      const baseStyles = 'border-gray-100 max-w-full mx-auto text-center';
      switch (message.level) {
        case 'success':
          return `bg-green-50 border-green-100 ${baseStyles}`;
        case 'error':
          return `bg-red-50 border-red-100 ${baseStyles}`;
        case 'warning':
          return `bg-yellow-50 border-yellow-100 ${baseStyles}`;
        default:
          return `bg-gray-50 border-gray-100 ${baseStyles}`;
      }
    }
    return message.direction === 'sent'
      ? 'bg-blue-50 border-blue-100 ml-auto'
      : 'bg-gray-50 border-gray-100 mr-auto';
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <span className="text-sm font-medium text-gray-600">Messages</span>
        <button
          onClick={onClear}
          className="text-sm px-3 py-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          Clear All
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`px-3 py-1.5 rounded border ${getMessageStyles(message)} ${
              message.direction === 'system' ? 'max-w-full' : 'max-w-[85%]'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
              {message.direction === 'system' ? (
                <span className={
                  message.level === 'success' ? 'text-green-600' :
                  message.level === 'error' ? 'text-red-600' :
                  message.level === 'warning' ? 'text-yellow-600' :
                  'text-gray-600'
                } className="text-xs">
                  System
                </span>
              ) : (
                <>
                  <span className={message.direction === 'sent' ? 'text-blue-600' : 'text-gray-600'}>
                    {message.direction === 'sent' ? '↑' : '↓'}
                  </span>
                  <span className="text-xs text-gray-400">{message.type}</span>
                </>
              )}
              <span className="text-xs text-gray-400">{new Date(message.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className={`break-all leading-tight ${message.direction === 'system' ? 'text-xs text-gray-600' : ''}`}>
                {formatContent(message.content)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageHistory; 