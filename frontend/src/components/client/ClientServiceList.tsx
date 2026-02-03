import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    drawerLayout?: 'horizontal' | 'vertical'; // Control drawer layout: horizontal for staff inline, vertical for modals
}

interface SelectedItemRowProps {
    service: Service;
    qty: number;
    isStaff: boolean;
    onDelete: () => void;
}

function SelectedItemRow({ service, qty, isStaff, onDelete }: SelectedItemRowProps) {
    const [showDelete, setShowDelete] = useState(false);
    const touchStartX = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStartX.current) return;
        const diff = touchStartX.current - e.touches[0].clientX;
        if (diff > 50) setShowDelete(true); // Swipe left
        if (diff < -50) setShowDelete(false); // Swipe right
    };

    const handleClick = () => {
        setShowDelete(prev => !prev);
    };

    return (
        <div 
            className={`relative overflow-hidden rounded-lg transition-all border ${
                isStaff 
                    ? 'bg-[#272a37] border-transparent' 
                    : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30'
            }`}
             onTouchStart={handleTouchStart}
             onTouchMove={handleTouchMove}
        >
            <div 
                className={`flex justify-between items-center p-3 transition-transform duration-300 ease-out cursor-pointer select-none ${showDelete ? '-translate-x-12' : 'translate-x-0'}`}
                onClick={handleClick}
            >
                <span className={`font-medium ${isStaff ? 'text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>{service.name} (x{qty})</span>
                <span className="font-bold text-[#13ec6d]">{formatCurrency(service.price * qty)}</span>
            </div>

            <div 
                className={`absolute top-0 bottom-0 right-0 w-12 flex items-center justify-center bg-red-500 text-white transition-opacity duration-300 cursor-pointer ${showDelete ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </div>
        </div>
    );
}

export function ClientServiceList({ orderId, services, variant = 'client', gridCols, onSuccess, drawerLayout = 'vertical' }: Props) {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selected, setSelected] = useState<Record<number, number>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
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

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const categoryRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const hasMoved = useRef(false);

    useEffect(() => {
        if (selectedCategory && scrollContainerRef.current) {
            const button = categoryRefs.current.get(selectedCategory);
            if (button) {
                const container = scrollContainerRef.current;
                
                // Calculate position to center the button
                // scrollLeft = currentScroll + (buttonLeftRelative - containerCenter + buttonHalfWidth)
                const buttonRect = button.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                
                const scrollTarget = container.scrollLeft + 
                    (buttonRect.left - containerRect.left) - 
                    (containerRect.width / 2) + 
                    (buttonRect.width / 2);

                container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
            }
        }
    }, [selectedCategory]);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        hasMoved.current = false;
        if (scrollContainerRef.current) {
            startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
            scrollLeft.current = scrollContainerRef.current.scrollLeft;
        }
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX.current) * 2; // Scroll speed multiplier
        if (Math.abs(walk) > 5) hasMoved.current = true;
        scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (scrollContainerRef.current && e.deltaY !== 0) {
            scrollContainerRef.current.scrollLeft += e.deltaY;
        }
    };

    const handleClickCapture = (e: React.MouseEvent) => {
        if (hasMoved.current) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

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


    const gridContainerClass = isStaff 
        ? 'flex-1 overflow-y-auto min-h-0 custom-scrollbar px-2 pb-4'
        : `pr-2 custom-scrollbar max-h-[80vh] overflow-y-auto`; // Removed grid props from here for client

    // Wrapper for staff grid content
    const StaffGridWrapper = ({ children }: { children: React.ReactNode }) => (
        <div className={`grid ${finalGridCols} gap-4`}>{children}</div>
    );
    
    // Wrapper for client grid (now includes the grid class)
    const ClientGridWrapper = ({ children }: { children: React.ReactNode }) => (
        <div className={`grid ${finalGridCols} gap-4`}>{children}</div>
    );
    
    const GridWrapper = isStaff ? StaffGridWrapper : ClientGridWrapper;

    return (
        <div className={isStaff ? "h-full flex flex-col" : "mt-4"}>
            <div className={`relative flex items-center justify-between gap-2 mb-4 ${isStaff ? 'px-2 pt-4 border-b border-gray-800 pb-2' : 'border-b border-gray-200 dark:border-white/10 pb-2'}`}>
                {/* Categories */}
                <div 
                    ref={scrollContainerRef}
                    className="flex gap-2 overflow-x-auto no-scrollbar flex-1 cursor-grab active:cursor-grabbing select-none"
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onWheel={handleWheel}
                    onClickCapture={handleClickCapture}
                >
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            ref={(el) => {
                                if (el) categoryRefs.current.set(category.id, el);
                                else categoryRefs.current.delete(category.id);
                            }}
                            onClick={() => {
                                setSelectedCategory(category.id);
                                setSearchTerm(''); // Clear search when picking category to avoid confusion
                            }}
                            className={`px-4 py-2 whitespace-nowrap rounded-t-lg transition-colors font-medium text-sm pointer-events-none ${
                                selectedCategory === category.id && !searchTerm
                                    ? isStaff 
                                        ? 'bg-[#13ec6d] text-black font-bold' 
                                        : 'bg-blue-600 dark:bg-[#13ec6d] text-white dark:text-zinc-900'
                                    : isStaff
                                        ? 'bg-[#272a37] text-gray-400 hover:bg-[#323645] hover:text-white'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                            style={{ pointerEvents: 'auto' }} // Re-enable pointer events for click but allow container to handle drag
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Search Input */}
                <div className={`transition-all duration-300 ease-in-out ${
                    isSearchOpen 
                        ? `absolute inset-0 z-10 w-full sm:static sm:w-64 ${isStaff ? 'bg-[#1A1D27]' : 'bg-white dark:bg-gray-900'}` 
                        : 'relative w-10 flex items-center justify-end'
                }`}>
                    {isSearchOpen ? (
                        <div className="relative w-full h-full flex items-center">
                            <input 
                                ref={inputRef}
                                type="text" 
                                placeholder="Tìm dịch vụ..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchOpen(true)} 
                                onBlur={() => {
                                    setTimeout(() => {
                                        setIsSearchOpen(false);
                                    }, 150);
                                }}
                                className={`w-full pl-10 pr-10 py-2 rounded-lg text-sm outline-none transition-all ${
                                    isStaff 
                                        ? 'bg-[#272a37] text-white placeholder-gray-500 border border-transparent focus:border-[#13ec6d]' 
                                        : 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white border-transparent focus:border-[#13ec6d] focus:ring-1 focus:ring-[#13ec6d]'
                                }`}
                                autoFocus
                            />
                            {/* Search Icon (Decorative) */}
                            <div className={`absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none ${isStaff ? 'text-gray-500' : 'text-gray-400'}`}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            
                            {/* Clear/Close Button */}
                             <button
                                onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                                onClick={(e) => {
                                    e.preventDefault(); 
                                    setSearchTerm(''); 
                                    inputRef.current?.focus();
                                }}
                                className={`absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center cursor-pointer transition-colors ${
                                    isStaff ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => {
                                setIsSearchOpen(true);
                                setTimeout(() => inputRef.current?.focus(), 50);
                            }}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                                isStaff 
                                    ? 'text-gray-400 hover:bg-[#323645] hover:text-white' 
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                            } ${searchTerm ? 'text-[#13ec6d]' : ''}`}
                        >
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className={gridContainerClass}>
                <GridWrapper>
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
                                    {/* Stock Badge */}
                                    {isStaff && (
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded z-10">
                                            Kho: {availableQuantity}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex-1 flex flex-col">
                                    <h3 className={`font-bold text-sm mb-1 ${isStaff ? 'text-white' : 'text-gray-900 dark:text-white'} line-clamp-2`}>{service.name}</h3>
                                    {service.description && (
                                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{service.description}</p>
                                    )}
                                    
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="font-bold text-[#13ec6d]">
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
                                            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors bg-[#13ec6d] text-black hover:bg-[#10d462] ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                </GridWrapper>
                {isStaff && hasSelected && (
                    <div className="w-full h-[300px] shrink-0 lg:hidden" aria-hidden="true" />
                )}
            </div>

            {/* Cart / Selected Items Drawer */}
            {/* Cart / Selected Items Drawer */}
            {hasSelected && (() => {
                const shouldBeHorizontal = drawerLayout === 'horizontal'; // Only horizontal when explicitly set
                
                const cartContent = (
                    <div className={`${isStaff 
                        ? 'fixed bottom-0 left-0 right-0 z-[60] bg-[#1A1D27] border-t border-gray-800 p-5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all duration-300 animate-slide-up rounded-t-3xl lg:rounded-none lg:shadow-lg lg:sticky lg:bottom-0 lg:z-10 lg:p-4 lg:animate-none' 
                        : 'fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-[#1a2e23] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] rounded-t-3xl border-t border-gray-100 dark:border-white/5 p-5 pb-8 backdrop-blur-md transition-all duration-300 animate-slide-up'
                    }`}>
                        <div className={`${!isStaff ? 'max-w-4xl mx-auto' : ''}`}>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className={`font-bold text-base ${isStaff ? 'text-white' : 'text-gray-900 dark:text-white'} flex items-center gap-2`}>
                                    Món đang chọn
                                    <span className="bg-[#13ec6d] text-black text-xs px-2 py-0.5 rounded-full font-bold">
                                        {Object.values(selected).reduce((a, b) => a + b, 0)}
                                    </span>
                                </h3>
                                {/* Optional: Clear all button */}
                            </div>

                            <div className={shouldBeHorizontal ? "lg:flex lg:gap-4 lg:items-center" : ""}>
                                <div className={`space-y-2 mb-4 custom-scrollbar ${isStaff 
                                    ? shouldBeHorizontal ? 'max-h-[170px] overflow-y-auto lg:flex-1 lg:max-h-[140px] lg:mb-0 lg:flex lg:flex-nowrap lg:overflow-x-auto lg:overflow-y-hidden lg:gap-2 lg:space-y-0' : 'max-h-[170px] overflow-y-auto'
                                    : 'max-h-[140px] overflow-y-auto pr-1'
                                }`}>
                                    {Object.entries(selected).map(([id, qty]) => {
                                        const service = services.find((s) => s.id === Number(id));
                                        if (!service) return null;
                                        return (
                                            <div key={id} className={shouldBeHorizontal ? "w-full lg:w-auto lg:min-w-[200px]" : "w-full"}>
                                                <SelectedItemRow 
                                                    service={service} 
                                                    qty={qty} 
                                                    isStaff={isStaff} 
                                                    onDelete={() => {
                                                        setSelected(prev => {
                                                            const next = { ...prev };
                                                            delete next[Number(id)];
                                                            return next;
                                                        });
                                                    }} 
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className={`${shouldBeHorizontal ? 'w-full lg:w-auto lg:px-8 lg:h-12 lg:whitespace-nowrap' : 'w-full'} font-bold py-3 rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 bg-[#13ec6d] text-black shadow-lg shadow-[#13ec6d]/20`}
                                >
                                    {isSubmitting ? 'Đang xử lý...' : 'Xác nhận gọi món'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
                
                return isStaff ? cartContent : createPortal(cartContent, document.body);
            })()}

        </div>
    );
}
