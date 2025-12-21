import React from 'react';
import { ConnectionStatus } from '../types';

interface StatusCardProps {
  status: ConnectionStatus;
  onRetry: () => void;
  icon: React.ReactNode;
}

export const StatusCard: React.FC<StatusCardProps> = ({ status, onRetry, icon }) => {
  const isPending = status.status === 'pending';
  const isConnected = status.status === 'connected';
  const isError = status.status === 'error';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
          {icon}
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isPending ? 'bg-yellow-100 text-yellow-800' :
          isConnected ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {isPending ? 'Connecting...' : isConnected ? 'Operational' : 'Failed'}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{status.service}</h3>
        <p className="text-sm text-gray-500 mt-1 min-h-[20px]">
           {status.message || 'Waiting for check...'}
        </p>
        
        {status.latency && (
           <p className="text-xs text-gray-400 mt-2 font-mono">
             Latency: {status.latency}ms
           </p>
        )}
      </div>

      <button
        onClick={onRetry}
        disabled={isPending}
        className={`mt-6 w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
          isPending 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {isPending ? 'Checking...' : 'Retest Connection'}
      </button>
    </div>
  );
};