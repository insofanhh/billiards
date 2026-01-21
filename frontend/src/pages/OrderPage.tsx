import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import { servicesApi } from '../api/services';
import { useAuthStore } from '../store/authStore';
import { AdminNavigation } from '../components/AdminNavigation';
import { BillTemplate } from '../components/BillTemplate';

// Hooks
import { useStaffOrderSockets } from '../hooks/useStaffOrderSockets';

// Components
import { StaffServiceList } from '../components/staff/StaffServiceList';
import { StaffOrderBill } from '../components/staff/StaffOrderBill';

export function OrderPage() {
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const navigate = useNavigate();

  const { user, logout } = useAuthStore();

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return <div>Không tìm thấy đơn hàng</div>;
  }

  const isActive = order.status === 'active';
  const isPendingEnd = order.status === 'pending_end';
  const isCompleted = order.status === 'completed';

  const servicesTotal = order.items?.reduce((sum: number, item: any) => sum + Number(item.total_price), 0) || 0;
  const currentTotalBeforeDiscount = order.total_before_discount > 0 ? order.total_before_discount : servicesTotal;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
      <div className="print:hidden">
        <AdminNavigation userName={user?.name} userRoles={user?.roles} onLogout={logout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-6">
            <button
              onClick={() => navigate(slug ? `/s/${slug}/staff` : '/staff')}
              className="flex items-center text-slate-500 hover:text-slate-700 transition-colors"
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
          </div>
          <main className="py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {isActive ? (
                <StaffServiceList orderId={Number(id)} services={services} />
            ) : (
              <div className="hidden lg:block lg:col-span-2"></div>
            )}

            <div className={isActive ? 'lg:col-span-1' : 'lg:col-span-3 max-w-7xl mx-auto w-full'}>
                 <StaffOrderBill 
                    order={order} 
                    isActive={isActive} 
                    isPendingEnd={isPendingEnd} 
                    isCompleted={isCompleted}
                    servicesTotal={servicesTotal}
                />
            </div>
          </main>
        </div>
      </div>
      <BillTemplate
        order={order}
        items={order.items || []}
        total={(currentTotalBeforeDiscount - (order.total_discount || 0))}
      />
    </div>
  );
}
