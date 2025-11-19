import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeCanvas } from 'qrcode.react';
import { tablesApi } from '../api/tables';
import { ordersApi } from '../api/orders';
import { useAuthStore } from '../store/authStore';
import { AdminNavigation } from '../components/AdminNavigation';

export function TableDetailPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const { data: table, isLoading } = useQuery({
    queryKey: ['table', code],
    queryFn: () => tablesApi.getByCode(code!),
    enabled: !!code,
  });

  const createOrderMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      navigate(`/order/${order.id}`);
    },
  });

  const approveEndMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.approveEnd(orderId),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table', code] });
      navigate(`/order/${order.id}`);
    },
  });

  const rejectEndMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.rejectEnd(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table', code] });
    },
  });

  const approveOpenMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.approve(orderId),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table', code] });
      navigate(`/order/${order.id}`);
    },
  });

  const rejectOpenMutation = useMutation({
    mutationFn: (orderId: number) => ordersApi.reject(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table', code] });
    },
  });

  const handleStartOrder = () => {
    if (code) {
      createOrderMutation.mutate({ table_code: code });
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
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const isAvailable = table.status.name === 'Trống';
  const activePriceRate = table.table_type.current_price_rate || table.table_type.price_rates?.find(rate => rate.active);
  const hasActiveOrder = !!table.active_order;
  const hasPendingEndOrder = !!table.pending_end_order;
  const hasPendingOpenOrder = !!table.pending_order;

  const handleViewOrder = () => {
    if (table.active_order?.id) {
      navigate(`/order/${table.active_order.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation userName={user?.name} onLogout={logout} />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-blue-600 hover:text-blue-800"
        >
          ← Quay lại
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{table.code}</h1>
              <p className="text-xl text-gray-600 mt-2">{table.name}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              table.status.name === 'Trống' ? 'bg-green-100 text-green-800' :
              table.status.name === 'Đang sử dụng' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {table.status.name}
            </span>
          </div>

          {hasPendingOpenOrder && table.pending_order && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="mb-4">
                <p className="text-sm text-yellow-800 font-medium">Có yêu cầu mở bàn từ khách</p>
                {table.pending_order.user_name && (
                  <p className="text-xs text-yellow-700 mt-1">Khách: {table.pending_order.user_name}</p>
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => approveOpenMutation.mutate(table.pending_order!.id)}
                  disabled={approveOpenMutation.isPending}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {approveOpenMutation.isPending ? 'Đang duyệt...' : 'Duyệt mở bàn'}
                </button>
                <button
                  onClick={() => rejectOpenMutation.mutate(table.pending_order!.id)}
                  disabled={rejectOpenMutation.isPending}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {rejectOpenMutation.isPending ? 'Đang xử lý...' : 'Từ chối'}
                </button>
              </div>
            </div>
          )}

          {hasActiveOrder && !hasPendingEndOrder && table.active_order && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Đơn hàng đang diễn ra</p>
                  <p className="text-sm text-blue-800 mt-1">{table.active_order.order_code}</p>
                  {table.active_order.start_at && (
                    <p className="text-xs text-blue-600 mt-1">
                      Bắt đầu: {new Date(table.active_order.start_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {hasPendingEndOrder && table.pending_end_order && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="mb-4">
                <p className="text-sm text-orange-800 font-medium">Khách hàng đã yêu cầu kết thúc giờ chơi</p>
                <p className="text-sm text-orange-700 mt-1">Đơn hàng: {table.pending_end_order.order_code}</p>
                {table.pending_end_order.user_name && (
                  <p className="text-xs text-orange-600 mt-1">Khách: {table.pending_end_order.user_name}</p>
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    if (table.pending_end_order?.id) {
                      approveEndMutation.mutate(table.pending_end_order.id);
                    }
                  }}
                  disabled={approveEndMutation.isPending}
                  className="flex-1 py-2 px-4 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  {approveEndMutation.isPending ? 'Đang xử lý...' : 'Duyệt kết thúc giờ chơi'}
                </button>
                <button
                  onClick={() => {
                    if (table.pending_end_order?.id) {
                      rejectEndMutation.mutate(table.pending_end_order.id);
                    }
                  }}
                  disabled={rejectEndMutation.isPending}
                  className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  {rejectEndMutation.isPending ? 'Đang xử lý...' : 'Từ chối'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500">Loại bàn</p>
              <p className="text-lg font-semibold">{table.table_type.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Số ghế</p>
              <p className="text-lg font-semibold">{table.seats}</p>
            </div>
            {table.location && (
              <div>
                <p className="text-sm text-gray-500">Vị trí</p>
                <p className="text-lg font-semibold">{table.location}</p>
              </div>
            )}
            {activePriceRate && (
              <div>
                <p className="text-sm text-gray-500">Giá mỗi giờ</p>
                <p className="text-lg font-semibold">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activePriceRate.price_per_hour)}
                </p>
              </div>
            )}
          </div>

          {table.qr_code && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-3">Mã QR của bàn:</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="bg-white border rounded-lg p-4 w-fit">
                  <QRCodeCanvas
                    ref={qrCanvasRef}
                    value={table.qr_code}
                    size={160}
                    includeMargin
                    level="H"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 break-all mb-3">{table.qr_code}</p>
                  <button
                    onClick={handleDownloadQr}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    Tải mã QR
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            {hasActiveOrder ? (
              <button
                onClick={handleViewOrder}
                className="flex-1 py-3 px-6 rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Tiếp tục đơn hàng
              </button>
            ) : (
              <button
                onClick={handleStartOrder}
                disabled={!isAvailable || createOrderMutation.isPending}
                className={`flex-1 py-3 px-6 rounded-md font-medium ${
                  isAvailable
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {createOrderMutation.isPending ? 'Đang mở bàn...' : 'Mở bàn'}
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

