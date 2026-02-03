import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import { servicesApi } from '../api/services';
import { BillTemplate } from '../components/BillTemplate';
import { useEffect, useRef, useState } from 'react';

// Hooks
import { useStaffOrderSockets } from '../hooks/useStaffOrderSockets';

// Components
import { StaffServiceList } from '../components/staff/StaffServiceList';
import { StaffOrderBill } from '../components/staff/StaffOrderBill';


export function OrderPage() {
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const [showMobileBill, setShowMobileBill] = useState(false);

  useEffect(() => {
    // Scroll to hide admin navigation
    if (pageRef.current) {
        pageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Check for view param
    if (searchParams.get('view') === 'bill') {
        setShowMobileBill(true);
    }
  }, [searchParams]);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id, slug],
    queryFn: () => ordersApi.getById(Number(id), slug),
    enabled: !!id,
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: servicesApi.getAll,
  });

  // Custom Hooks
  useStaffOrderSockets(Number(id));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return <div className="dark:text-white">Không tìm thấy đơn hàng</div>;
  }

  const isActive = order.status === 'active';
  const isPendingEnd = order.status === 'pending_end';
  const isCompleted = order.status === 'completed';

  const servicesTotal = order.items?.reduce((sum: number, item: any) => sum + Number(item.total_price), 0) || 0;
  const currentTotalBeforeDiscount = order.total_before_discount > 0 ? order.total_before_discount : servicesTotal;

  return (
    <div ref={pageRef} className="font-sans text-slate-800 dark:text-gray-200">
      <div className="print:hidden h-screen flex flex-col overflow-hidden bg-[#1A1D27]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700 bg-[#1A1D27] shrink-0 flex justify-between items-center">
            <button
              onClick={() => navigate(slug ? `/s/${slug}/staff` : '/staff')}
              className="flex items-center text-slate-500 hover:text-slate-200 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Quay lại</span>
            </button>

            {/* Mobile Bill Toggle */}
            <button 
                onClick={() => setShowMobileBill(true)}
                className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold"
            >
                <span>Hóa đơn</span>
                <span className="bg-white/20 px-1.5 rounded text-xs">{formatCurrency(currentTotalBeforeDiscount - (order.total_discount || 0))}</span>
            </button>
        </div>

        {/* Main Content */}
        <main className="flex-1 flex overflow-hidden relative">
            {/* Left Column (Service List) - Full width on mobile */}
            {isActive && (
                <div className="flex-1 lg:flex-[3] lg:border-r border-gray-700 overflow-hidden flex flex-col p-2 lg:p-4">
                  <StaffServiceList orderId={Number(id)} services={services} />
                </div>
            )}

            {/* Right Column (Bill) - Desktop: Visible, Mobile: Hidden unless toggled */}
            <div className={`
                ${isActive ? 'lg:flex-[1.2] lg:min-w-[400px]' : 'lg:flex-1 w-full'} 
                bg-[#1A1D27]
                fixed top-0 left-0 w-full h-[100dvh] z-50 lg:static lg:h-auto lg:z-auto
                transition-transform duration-300 ease-in-out
                ${(showMobileBill || !isActive) ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
                {/* Mobile Close Button for Bill Overlay */}
                 <div className="lg:hidden flex justify-between items-center px-4 pt-4 mb-4 pb-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Chi tiết đơn hàng</h2>
                    <button 
                        onClick={() => !isActive ? window.location.href = '/staff' : setShowMobileBill(false)}
                        className="p-2 text-gray-400 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                 </div>

                 <StaffOrderBill 
                    order={order} 
                    isActive={isActive} 
                    isPendingEnd={isPendingEnd} 
                    isCompleted={isCompleted}
                    servicesTotal={servicesTotal}
                    slug={slug}
                />
            </div>
            
            {/* Mobile Overlay Backdrop */}
            {showMobileBill && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setShowMobileBill(false)}
                />
            )}
        </main>
      </div>
      <BillTemplate
        order={order}
        items={order.items || []}
        total={(currentTotalBeforeDiscount - (order.total_discount || 0))}
      />
    </div>
  );
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
