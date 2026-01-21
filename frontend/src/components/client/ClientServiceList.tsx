import { useMemo, useState, useEffect } from 'react';
import type { Service } from '../../types';
import { ordersApi } from '../../api/orders';
import { useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../../contexts/NotificationContext';
import { formatCurrency } from '../../utils/format';

interface Props {
    orderId: number | undefined;
    services?: Service[];
}

export function ClientServiceList({ orderId, services }: Props) {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selected, setSelected] = useState<Record<number, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

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
        if (selectedCategory === null) {
            return services;
        }
        return servicesByCategory.get(selectedCategory) || [];
    }, [services, selectedCategory, servicesByCategory]);

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
                serviceId: Number(serviceId),
                qty,
            }));

            // Validate stock
            const exceededEntry = entries.find((entry) => {
                const matched = services?.find((svc) => svc.id === entry.serviceId);
                const available = matched?.inventory_quantity ?? 0;
                return available <= 0 || entry.qty > available;
            });
            if (exceededEntry) {
                showNotification('Số lượng dịch vụ trong kho đã đến giới hạn.');
                return;
            }

            await Promise.all(
                entries.map((e) =>
                    ordersApi.addService(Number(orderId), { service_id: e.serviceId, qty: e.qty }),
                ),
            );
            setSelected({});
            queryClient.invalidateQueries({ queryKey: ['client-order', String(orderId)] });
            showNotification('Đã gửi yêu cầu gọi dịch vụ. Nhân viên sẽ xử lý ngay.');
        } catch (error) {
            showNotification('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!services || categories.length === 0) return null;

    return (
        <div className="mt-4">
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 border-b border-gray-200 dark:border-white/10 no-scrollbar">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 whitespace-nowrap rounded-t-md transition-colors ${selectedCategory === category.id
                            ? 'bg-blue-600 dark:bg-[#13ec6d] text-white dark:text-zinc-900 font-medium'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-2 no-scrollbar">
                {displayedServices.map((service: Service) => {
                    const availableQuantity = service.inventory_quantity ?? 0;
                    const qty = selected[service.id] || 0;
                    const isOutOfStock = availableQuantity <= 0;
                    const cardClasses = `bg-white dark:bg-white/5 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-3 flex flex-col transition-all hover:shadow-md ${isOutOfStock ? 'opacity-50' : ''
                        }`;

                    const handleIncrease = () => {
                        if (isOutOfStock) {
                            showNotification('Dịch vụ này đã hết hàng.');
                            return;
                        }
                        if (qty >= availableQuantity) {
                            showNotification('Số lượng dịch vụ trong kho đã đến giới hạn.');
                            return;
                        }
                        setSelected((s) => ({ ...s, [service.id]: (s[service.id] || 0) + 1 }));
                    };

                    return (
                        <div key={service.id} className={cardClasses}>
                            {service.image && (
                                <img
                                    src={service.image}
                                    alt={service.name}
                                    className="w-full h-32 object-cover rounded-lg mb-2 bg-gray-100 dark:bg-white/10"
                                />
                            )}
                            <div className="flex-1">
                                <p className="font-medium text-sm mb-1 text-gray-900 dark:text-white">{service.name}</p>
                                {service.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{service.description}</p>
                                )}
                                <p className="font-semibold text-blue-600 dark:text-[#13ec6d] mb-2">
                                    {formatCurrency(service.price)}
                                </p>
                                {isOutOfStock && (
                                    <p className="text-xs mb-2 text-red-600 dark:text-red-400">Hết hàng</p>
                                )}
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center space-x-2 w-full justify-between">
                                    <button
                                        onClick={() => {
                                            if (qty <= 0) return;
                                            setSelected((s) => {
                                                const current = s[service.id] || 0;
                                                const next = Math.max(0, current - 1);
                                                const copy = { ...s };
                                                if (next === 0) delete copy[service.id]; else copy[service.id] = next;
                                                return copy;
                                            });
                                        }}
                                        disabled={qty <= 0}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${qty <= 0
                                            ? 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                            : 'bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white'
                                            }`}
                                    >
                                        −
                                    </button>
                                    <span className="w-6 text-center text-sm font-medium text-gray-900 dark:text-white">{qty}</span>
                                    <button
                                        onClick={handleIncrease}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold transition-colors ${isOutOfStock || qty >= availableQuantity
                                            ? 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                            : 'bg-blue-600 dark:bg-[#13ec6d] hover:bg-blue-700 dark:hover:bg-[#10d863] text-white dark:text-zinc-900'
                                            }`}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={handleSubmit}
                disabled={!hasSelected || isSubmitting}
                className={`mt-4 w-full py-3 px-4 rounded-xl text-white font-medium transition-colors shadow-lg ${hasSelected && !isSubmitting
                    ? 'bg-blue-600 dark:bg-[#13ec6d] hover:bg-blue-700 dark:hover:bg-[#10d863] dark:text-zinc-900 shadow-blue-500/20 dark:shadow-green-500/20'
                    : 'bg-gray-300 dark:bg-white/10 dark:text-gray-500 cursor-not-allowed shadow-none'
                    }`}
            >
                {isSubmitting ? 'Đang gửi yêu cầu...' : 'Đặt dịch vụ'}
            </button>
        </div>
    );
}
