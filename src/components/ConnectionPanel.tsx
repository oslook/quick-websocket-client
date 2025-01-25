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
  handleProtocolChange: (protocol: ProtocolType) => void;
};

const ConnectionPanel = ({
  url,
  setUrl,
  onConnect,
  onDisconnect,
  isConnected,
  error,
  protocol,
  handleProtocolChange
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
        <select
          value={protocol}
          onChange={(e) => handleProtocolChange(e.target.value as ProtocolType)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium shadow-sm transition-colors duration-150 appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:24px] bg-[calc(100%-8px)_center] bg-no-repeat pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isConnected}
        >
          <option value="websocket" className="py-2">WebSocket</option>
          <option value="socket.io" className="py-2">Socket.IO</option>
        </select>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
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
        <div className="mt-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default ConnectionPanel; 