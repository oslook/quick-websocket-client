import { useState } from 'react';
import { useStorageState } from '../hooks/useStorageState';
import { ProtocolType } from '../types/message';

type ConnectionPanelProps = {
  url: string;
  setUrl: (url: string) => void;
  onConnect: (url: string) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  error: string | null;
  protocol: ProtocolType;
};

const ConnectionPanel = ({
  url,
  setUrl,
  onConnect,
  onDisconnect,
  isConnected,
  error,
  protocol
}: ConnectionPanelProps) => {
  const [urlHistory, setUrlHistory] = useStorageState<string[]>('urlHistory', []);

  const handleConnect = () => {
    if (url.trim()) {
      onConnect(url.trim());
      if (!urlHistory.includes(url)) {
        setUrlHistory([url, ...urlHistory].slice(0, 10));
      }
    }
  };

  return (
    <div className="flex-1">
      <div className="flex gap-2 items-start">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          placeholder={protocol === 'websocket' ? "WebSocket URL (ws:// or wss://)" : "Socket.IO URL (http:// or https://)"}
          disabled={isConnected}
        />
        <button
          onClick={isConnected ? onDisconnect : handleConnect}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            isConnected
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-500 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default ConnectionPanel; 