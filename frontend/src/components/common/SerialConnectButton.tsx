import React from 'react';
import { useWebSerial } from '../../hooks/useWebSerial';

interface SerialConnectButtonProps {
    onCommand?: (cmd: any) => void;
}

export const SerialConnectButton: React.FC<SerialConnectButtonProps> = () => {
    const { isConnected, connect, disconnect, error } = useWebSerial();

    return (
        <div className="flex items-center gap-2">
            {error && <span className="text-red-500 text-xs">{error}</span>}
            <button 
                onClick={isConnected ? disconnect : connect}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center border ${
                    isConnected 
                    ? "bg-white border-green-500 text-green-600 hover:bg-green-50" 
                    : "bg-slate-900 border-transparent text-white hover:bg-slate-800"
                }`}
            >
                {isConnected ? (
                    <>
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                        USB Connected
                    </>
                ) : (
                    <>
                        <span className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                        Connect USB
                    </>
                )}
            </button>
        </div>
    );
};
