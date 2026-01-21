import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tablesApi } from '../api/tables';
import { useAuthStore } from '../store/authStore';
import { AdminNavigation } from '../components/AdminNavigation';
import { useTableActions } from '../hooks/useTableActions';

// Components
import { TableInfo } from '../components/staff/table/TableInfo';
import { PendingOpenRequest } from '../components/staff/table/PendingOpenRequest';
import { PendingEndRequest } from '../components/staff/table/PendingEndRequest';
import { ActiveOrderCard } from '../components/staff/table/ActiveOrderCard';

export function TableDetailPage() {
  const { code, slug } = useParams<{ code: string; slug: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const { data: table, isLoading } = useQuery({
    queryKey: ['table', code, slug],
    queryFn: () => tablesApi.getByCode(code!, slug),
    enabled: !!code,
  });

  const {
    createOrder, 
    isCreating,
    approveEnd,
    isApprovingEnd,
    rejectEnd,
    isRejectingEnd,
    approveOpen,
    isApprovingOpen,
    rejectOpen,
    isRejectingOpen,
  } = useTableActions(code, slug);

  const handleStartOrder = () => {
    if (code) {
      createOrder({ table_code: code });
    }
  };

  const handleDownloadQr = () => {
    if (!table || !qrCanvasRef.current) return;
    const url = qrCanvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${table.code}-qr.png`;
    link.click();
  };

  const handleViewOrder = () => {
    if (table?.active_order?.id) {
      navigate(slug ? `/s/${slug}/staff/order/${table.active_order.id}` : `/order/${table.active_order.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy bàn</h2>
          <button
            onClick={() => navigate(slug ? `/s/${slug}/staff` : '/staff')}
            className="text-blue-600 hover:text-blue-800"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const isAvailable = table.status.name === 'Trống';
  const hasActiveOrder = !!table.active_order;
  const hasPendingPaymentOrder = table.active_order?.status === 'completed';
  const hasPendingEndOrder = !!table.pending_end_order;
  const hasPendingOpenOrder = !!table.pending_order;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation userName={user?.name} onLogout={logout} />
      <div className="max-w-7xl mx-auto py-8 px-4 lg:px-8">
        <button
          onClick={() => navigate(slug ? `/s/${slug}/staff` : '/staff')}
          className="mb-8 text-gray-500 hover:text-gray-700 flex items-center"
        >
          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Quay lại</span>
        </button>

        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{table.code}</h1>
              <p className="text-xl text-gray-600 mt-2">{table.name}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${table.status.name === 'Trống' ? 'bg-green-100 text-green-800' :
              table.status.name === 'Đang sử dụng' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
              {table.status.name}
            </span>
          </div>

          {hasPendingOpenOrder && table.pending_order && (
            <PendingOpenRequest 
              pendingOrder={table.pending_order}
              onApprove={approveOpen}
              onReject={rejectOpen}
              isApproving={isApprovingOpen}
              isRejecting={isRejectingOpen}
            />
          )}

          {hasActiveOrder && !hasPendingEndOrder && (
             <ActiveOrderCard activeOrder={table.active_order} />
          )}

          {hasPendingEndOrder && table.pending_end_order && (
            <PendingEndRequest 
             pendingEndOrder={table.pending_end_order}
             onApprove={approveEnd}
             onReject={rejectEnd}
             isApproving={isApprovingEnd}
             isRejecting={isRejectingEnd}
            />
          )}

          <TableInfo 
            table={table} 
            onDownloadQr={handleDownloadQr}
            qrCanvasRef={qrCanvasRef}
          />

          <div className="flex space-x-4">
            {hasActiveOrder ? (
              <button
                onClick={handleViewOrder}
                className={`flex-1 py-3 px-6 rounded-md font-medium ${hasPendingPaymentOrder ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {hasPendingPaymentOrder ? 'Xử lý thanh toán' : 'Tiếp tục đơn hàng'}
              </button>
            ) : (
              <button
                onClick={handleStartOrder}
                disabled={!isAvailable || isCreating}
                className={`flex-1 py-3 px-6 rounded-md font-medium ${isAvailable
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {isCreating ? 'Đang mở bàn...' : 'Mở bàn'}
              </button>
            )}
          </div>

          {!isAvailable && !hasActiveOrder && (
            <p className="mt-4 text-sm text-red-600 text-center">
              Bàn đang được sử dụng hoặc bảo trì
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
