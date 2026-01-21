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

export function StaffServiceList({ orderId, services }: Props) {
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
      queryClient.invalidateQueries({ queryKey: ['order', String(orderId)] });
      showNotification('Đã đặt dịch vụ thành công!');
    } catch (error) {
      showNotification('Có lỗi xảy ra khi đặt dịch vụ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!services || categories.length === 0) return null;

  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 font-semibold rounded-lg whitespace-nowrap transition-colors ${selectedCategory === cat.id
                ? 'bg-[#13ec6d] text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedServices.map((service) => {
          const availableQuantity = service.inventory_quantity ?? 0;
          const qty = selected[service.id] || 0;
          const isOutOfStock = availableQuantity <= 0;

          return (
            <div key={service.id} className="border border-slate-200 rounded-lg p-4 flex flex-col items-center text-center">
              {service.image && (
                <img src={service.image} alt={service.name} className="w-32 h-32 object-cover mb-4 rounded-md" />
              )}
              <h3 className="font-bold text-slate-900">{service.name}</h3>
              <p className="text-sm text-slate-500 mb-2">{service.description}</p>
              <p className="text-blue-600 font-bold mb-4">
                {formatCurrency(service.price)}
              </p>
              <div className="flex items-center space-x-3">
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
                  className="w-8 h-8 rounded-full bg-slate-200 text-slate-900 flex justify-center items-center font-bold text-xl hover:bg-slate-300"
                >
                  -
                </button>
                <span className="font-bold text-lg">{qty}</span>
                <button
                  onClick={() => {
                    if (isOutOfStock || qty >= availableQuantity) {
                      showNotification('Hết hàng hoặc đủ số lượng');
                      return;
                    }
                    setSelected((s) => ({ ...s, [service.id]: (s[service.id] || 0) + 1 }));
                  }}
                  className={`w-8 h-8 rounded-full bg-[#13ec6d] text-white flex justify-center items-center font-bold text-xl hover:opacity-90 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {hasSelected && (
        <div className="mt-8 border-t border-slate-200 pt-4">
          <h3 className="font-bold text-lg text-slate-900 mb-3">Món đang chọn (Chưa lưu)</h3>
          <div className="space-y-2">
            {Object.entries(selected).map(([id, qty]) => {
              const service = services.find((s) => s.id === Number(id));
              if (!service) return null;
              return (
                <div key={id} className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                   <span className="font-medium text-blue-900">{service.name} (x{qty})</span>
                   <span className="text-blue-700 font-bold">{formatCurrency(service.price * qty)}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận gọi món'}
          </button>
        </div>
      )}
    </div>
  );
}
