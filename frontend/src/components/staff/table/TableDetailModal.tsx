import { useRef } from 'react';
import type { Table } from '../../../types';
import { TableInfo } from './TableInfo';
import { useTableActions } from '../../../hooks/useTableActions';

interface Props {
    table: Table;
    isOpen: boolean;
    onClose: () => void;
    slug?: string;
}

export function TableDetailModal({ table, isOpen, onClose, slug }: Props) {
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const { createOrder, isCreating } = useTableActions(table.code, slug);

    if (!isOpen) return null;

    const handleDownloadQr = () => {
        const canvas = qrCanvasRef.current;
        if (!canvas) return;

        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `QR_Table_${table.code}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColorConfig = (statusName: string) => {
        switch (statusName) {
            case 'Trống': return { badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
            case 'Đang sử dụng': return { badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
            case 'Bảo trì': return { badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' };
            default: return { badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
        }
    };

    const { badge } = getStatusColorConfig(table.status);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                    aria-hidden="true"
                    onClick={onClose}
                ></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal Panel */}
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <div className="flex items-center space-x-3 mb-1">
                                    <h3 className="text-2xl leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                                        {table.code}
                                    </h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${badge}`}>
                                        {table.status}
                                    </span>
                                </div>
                                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                                    {table.name}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                        <TableInfo 
                            table={table}
                            onDownloadQr={handleDownloadQr}
                            qrCanvasRef={qrCanvasRef}
                        />
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 flex flex-row-reverse gap-3">
                         {table.status === 'Trống' && (
                            <button
                                type="button"
                                onClick={() => createOrder({ table_code: table.code })}
                                disabled={isCreating}
                                className={`flex-1 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:flex-none sm:w-auto sm:text-sm ${isCreating ? 'opacity-75 cursor-wait' : ''}`}
                            >
                                {isCreating ? 'Đang mở...' : 'Mở bàn'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
