import { useStorageState } from '../../hooks/useStorageState';
import { SavedMessage } from '../../types/message';

type MessageHistoryProps = {
  onSelect: (content: string, type: 'text' | 'binary') => void;
  disabled?: boolean;
  messages: SavedMessage[];
  onDeleteMessage: (index: number) => void;
};

const MessageHistory = ({ 
  onSelect, 
  disabled,
  messages,
  onDeleteMessage 
}: MessageHistoryProps) => {
  if (messages.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">No saved messages</div>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map((message, index) => (
        <div
          key={index}
          className="group flex items-start justify-between p-2 rounded-lg hover:bg-gray-50"
        >
          <button
            onClick={() => onSelect(message.content, message.type)}
            disabled={disabled}
            className="text-sm text-left text-gray-600 hover:text-gray-900 flex-1 disabled:opacity-50"
          >
            <div className="font-medium truncate">
              {message.content && (message.content.length <= 30 ? message.content : message.content.substring(0, 30))}{message.content.length > 30 ? '...' : ''}
            </div>
            <div className="text-xs text-gray-500 mt-1">Type: {message.type}</div>
          </button>
          <button
            onClick={() => onDeleteMessage(index)}
            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default MessageHistory; 