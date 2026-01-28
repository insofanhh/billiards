import { useMemo, useState, useEffect } from 'react';
import type { Service } from '../../types';
import { ordersApi } from '../../api/orders';
import { useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../contexts/NotificationContext';
import { formatCurrency } from '../../utils/format';

interface Props {
    orderId: number | undefined;
    services?: Service[];
    variant?: 'client' | 'staff';
    gridCols?: string;
    onSuccess?: () => void;
}

export function ClientServiceList({ orderId, services, variant = 'client', gridCols, onSuccess }: Props) {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selected, setSelected] = useState<Record<number, number>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

    const isStaff = variant === 'staff';

    const categories = useMemo(() => {
        if (!services) return [];
        const categoryMap = new Map<number, { id: number; name: string; sort_order?: number }>();
        services.forEach((service) => {
            if (service.category_service) {
                const cat = service.category_service;
                if (!categoryMap.has(cat.id)) {
                    categoryMap.set(cat.id, cat);
                }
            }
        });
        return Array.from(categoryMap.values()).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }, [services]);

    const servicesByCategory = useMemo(() => {
        if (!services) return new Map<number, Service[]>();
        const map = new Map<number, Service[]>();
        services.forEach((service) => {
            const catId = service.category_service?.id || 0;
            if (!map.has(catId)) {
                map.set(catId, []);
            }
            map.get(catId)!.push(service);
        });
        return map;
    }, [services]);

    const displayedServices = useMemo(() => {
        if (!services) return [];
        
        let filtered = services;

        // Filter by category if no search term
        if (!searchTerm && selectedCategory !== null) {
             filtered = servicesByCategory.get(selectedCategory) || [];
        } else if (searchTerm) {
             // If searching, search across ALL services or within category? 
             // Usually search ignores category or searches within. 
             // Let's search across all services for better UX, or filter the current list.
             // User "top right" implies global search context usually.
             // Let's filter GLOBAL services matching the name.
             filtered = services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        return filtered;
    }, [services, selectedCategory, servicesByCategory, searchTerm]);

    useEffect(() => {
        if (categories.length > 0 && selectedCategory === null) {
            setSelectedCategory(categories[0].id);
        }
    }, [categories, selectedCategory]);

    const hasSelected = Object.keys(selected).length > 0;

    const handleSubmit = async () => {
        if (!hasSelected || isSubmitting || !orderId) return;
        
        setIsSubmitting(true);
        try {
            const entries = Object.entries(selected).map(([serviceId, qty]) => ({
                service_id: Number(serviceId),
                qty,
            }));

            // Validate stock
            const exceededEntry = entries.find((entry) => {
                const matched = services?.find((svc) => svc.id === entry.service_id);
                const available = matched?.inventory_quantity ?? 0;
                return available <= 0 || entry.qty > available;
            });
            if (exceededEntry) {
                showNotification('Số lượng dịch vụ trong kho đã đến giới hạn.');
                return;
            }

            await ordersApi.addServices(Number(orderId), entries);
            setSelected({});
            queryClient.invalidateQueries({ queryKey: ['client-order', String(orderId)] });
            showNotification(isStaff ? 'Đã thêm dịch vụ thành công!' : 'Đã gửi yêu cầu gọi dịch vụ. Nhân viên sẽ xử lý ngay.');
            if (onSuccess) onSuccess();
        } catch (error) {
            showNotification('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!services || categories.length === 0) return null;

    const defaultGridCols = isStaff ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    const finalGridCols = gridCols || defaultGridCols;

    return (
        <div className="mt-4">
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 ${isStaff ? 'border-b border-gray-800 pb-2' : 'border-b border-gray-200 dark:border-white/10 pb-2'}`}>
                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => {
                                setSelectedCategory(category.id);
                                setSearchTerm(''); // Clear search when picking category to avoid confusion
                            }}
                            className={`px-4 py-2 whitespace-nowrap rounded-t-lg transition-colors font-medium text-sm ${
                                selectedCategory === category.id && !searchTerm
                                    ? isStaff 
                                        ? 'bg-[#13ec6d] text-black font-bold' 
                                        : 'bg-blue-600 dark:bg-[#13ec6d] text-white dark:text-zinc-900'
                                    : isStaff
                                        ? 'bg-[#272a37] text-gray-400 hover:bg-[#323645] hover:text-white'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Search Input */}
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Tìm dịch vụ..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full sm:w-64 pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-all ${
                            isStaff 
                                ? 'bg-[#272a37] text-white placeholder-gray-500 focus:bg-[#323645] border border-transparent focus:border-[#13ec6d]' 
                                : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white border-transparent focus:ring-2 focus:ring-blue-500'
                        }`}
                    />
                     <svg 
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isStaff ? 'text-gray-500' : 'text-gray-400'}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <div className={`grid ${finalGridCols} gap-4 pr-2 custom-scrollbar ${isStaff ? 'pb-2' : 'max-h-[80vh] overflow-y-auto'}`}>
                {displayedServices.map((service: Service) => {
                    const availableQuantity = service.inventory_quantity ?? 0;
                    const qty = selected[service.id] || 0;
                    const isOutOfStock = availableQuantity <= 0;
                    
                    const cardBase = isStaff 
                        ? 'bg-[#272a37] border-transparent' 
                        : 'bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10';
                        
                    const cardClasses = `${cardBase} rounded-xl p-3 flex flex-col transition-all shadow-sm hover:shadow-md ${isOutOfStock ? 'opacity-50' : ''}`;

                    return (
                        <div key={service.id} className={cardClasses}>
                            <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                {service.image ? (
                                    <img 
                                        src={service.image} 
                                        alt={service.name} 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                        No Image
                                    </div>
                                )}

                            </div>
                            
                            <div className="flex-1 flex flex-col">
                                <h3 className={`font-bold text-sm mb-1 ${isStaff ? 'text-white' : 'text-gray-900 dark:text-white'} line-clamp-2`}>{service.name}</h3>
                                {service.description && (
                                    <p className="text-xs text-gray-500 line-clamp-1 mb-2">{service.description}</p>
                                )}
                                
                                <div className="mt-auto flex items-center justify-between">
                                    <span className={`font-bold ${isStaff ? 'text-[#13ec6d]' : 'text-blue-600 dark:text-[#13ec6d]'}`}>
                                        {formatCurrency(service.price)}
                                    </span>
                                </div>

                                <div className={`flex items-center justify-between mt-3 ${isStaff ? 'bg-[#1A1D27]' : 'bg-gray-50 dark:bg-white/5'} rounded-lg p-1`}>
                                    <button
                                        onClick={() => {
                                            if (qty <= 0) return;
                                            setSelected((s) => {
                                                const next = s[service.id] - 1;
                                                const copy = { ...s };
                                                if (next <= 0) delete copy[service.id];
                                                else copy[service.id] = next;
                                                return copy;
                                            });
                                        }}
                                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                                            isStaff 
                                                ? 'bg-[#323645] text-white hover:bg-[#3e4255]' 
                                                : 'bg-white dark:bg-white/10 text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-50'
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <span className={`font-bold text-sm ${isStaff ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{qty}</span>
                                    <button
                                        onClick={() => {
                                            if (isOutOfStock || qty >= availableQuantity) {
                                                showNotification('Hết hàng hoặc đủ số lượng');
                                                return;
                                            }
                                            setSelected((s) => ({ ...s, [service.id]: (s[service.id] || 0) + 1 }));
                                        }}
                                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                                            isStaff
                                                ? 'bg-[#13ec6d] text-black hover:bg-[#10d462]'
                                                : 'bg-blue-600 dark:bg-[#13ec6d] text-white dark:text-zinc-900 hover:bg-blue-700'
                                        } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {hasSelected && (
                <div className={`mt-6 pt-4 border-t ${isStaff ? 'border-gray-800' : 'border-gray-100 dark:border-white/10'}`}>
                    <h3 className={`font-bold text-base mb-3 ${isStaff ? 'text-white' : 'text-gray-900 dark:text-white'}`}>Món đang chọn (Chưa lưu)</h3>
                    <div className="space-y-2 mb-4">
                        {Object.entries(selected).map(([id, qty]) => {
                            const service = services.find((s) => s.id === Number(id));
                            if (!service) return null;
                            return (
                                <div key={id} className={`flex justify-between items-center p-3 rounded-lg border ${
                                    isStaff 
                                        ? 'bg-[#272a37] border-transparent' 
                                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30'
                                }`}>
                                   <span className={`font-medium ${isStaff ? 'text-gray-300' : 'text-blue-900 dark:text-blue-100'}`}>{service.name} (x{qty})</span>
                                   <span className={`font-bold ${isStaff ? 'text-[#13ec6d]' : 'text-blue-700 dark:text-blue-300'}`}>{formatCurrency(service.price * qty)}</span>
                                </div>
                            );
                        })}
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`w-full font-bold py-3 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${
                            isStaff 
                                ? 'bg-[#323645] text-white hover:text-[#13ec6d]' 
                                : 'bg-blue-600 dark:bg-[#13ec6d] text-white dark:text-zinc-900'
                        }`}
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Xác nhận gọi món'}
                    </button>
                </div>
            )}

        </div>
    );
}
