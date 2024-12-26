import { useStorageState } from '../../hooks/useStorageState';

type UrlHistoryProps = {
  onSelect: (url: string) => void;
  disabled?: boolean;
};

const UrlHistory = ({ onSelect, disabled }: UrlHistoryProps) => {
  const [urlHistory, setUrlHistory] = useStorageState<string[]>('urlHistory', []);

  const handleDelete = (urlToDelete: string) => {
    setUrlHistory(urlHistory.filter(url => url !== urlToDelete));
  };

  if (urlHistory.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">No connection history</div>
    );
  }

  return (
    <div className="space-y-2">
      {urlHistory.map((url) => (
        <div
          key={url}
          className="group flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
        >
          <button
            onClick={() => onSelect(url)}
            disabled={disabled}
            className="text-sm text-left text-gray-600 hover:text-gray-900 truncate flex-1 disabled:opacity-50"
            title={url}
          >
            {url}
          </button>
          <button
            onClick={() => handleDelete(url)}
            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
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

export default UrlHistory; 