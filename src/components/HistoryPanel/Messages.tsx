import { SavedMessage, MessageType } from '../../types/message';

type MessagesProps = {
  messages: SavedMessage[];
  onDeleteMessage: (index: number) => void;
  onSelect: (content: string, type: MessageType, event?: string) => void;
  disabled: boolean;
};

const Messages = ({ messages, onDeleteMessage, onSelect, disabled }: MessagesProps) => {
  const handleSelect = (message: SavedMessage) => {
    if (!disabled) {
      onSelect(message.content, message.type, message.event);
    }
  };

  return (
    <div className="space-y-2">
      {messages.map((message, index) => (
        <div
          key={index}
          className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group relative"
        >
          <div className="text-sm font-mono truncate text-gray-600">
            {message.event && (
              <span className="text-blue-600 mr-2">{message.event}</span>
            )}
            {message.content}
          </div>
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button
              onClick={() => handleSelect(message)}
              disabled={disabled}
              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              Use
            </button>
            <button
              onClick={() => onDeleteMessage(index)}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      ))}
      {messages.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          No saved messages
        </div>
      )}
    </div>
  );
};

export default Messages; 