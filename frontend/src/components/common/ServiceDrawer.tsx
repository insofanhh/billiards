
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { servicesApi } from '../../api/services';
import { ClientServiceList } from '../client/ClientServiceList';
import { useEffect, useState } from 'react';

interface ServiceDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: number;
    slug?: string;
    tableCode?: string;
}

export function ServiceDrawer({ isOpen, onClose, orderId, slug, tableCode }: ServiceDrawerProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => {
                setIsVisible(false);
                document.body.style.overflow = 'unset';
            }, 300); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const { data: services, isLoading } = useQuery({
        queryKey: ['services', slug],
        queryFn: servicesApi.getAll,
        enabled: isVisible, 
    });

    if (!isVisible && !isOpen) return null;

    return createPortal(
        <div 
            className={`fixed inset-0 z-[60] flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={(e) => {
                e.stopPropagation();
            }}
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Drawer */}
            <div 
                className={`relative w-full max-w-md h-full bg-[#1A1D27] dark:bg-[#1A1D27] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-white">Thêm dịch vụ</h2>
                        {tableCode && <p className="text-sm text-gray-400">Bàn {tableCode}</p>}
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {isLoading ? (
                         <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <ClientServiceList orderId={orderId} services={services} variant="staff" drawerLayout="vertical" onSuccess={onClose} />
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
