import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import { useNotification } from '../contexts/NotificationContext';

export function useOrderActions(id: string | undefined) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const requestEndMutation = useMutation({
    mutationFn: () => ordersApi.requestEnd(Number(id!)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-order', id] });
      showNotification('Đã kết thúc giờ chơi. Vui lòng thanh toán.');
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: () => ordersApi.cancelRequest(Number(id!)),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['client-order', id], updatedOrder);
      showNotification('Đã hủy yêu cầu mở bàn.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Không thể hủy yêu cầu mở bàn.';
      showNotification(message);
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (data: { method: 'cash' | 'card' | 'mobile'; amount: number }) =>
      ordersApi.createTransaction(Number(id!), data),
    onSuccess: async (_response, variables) => {
      await queryClient.refetchQueries({ queryKey: ['client-order', id] });
      if (variables.method === 'mobile') {
        showNotification('Vui lòng quét mã QR để thanh toán.');
      } else {
        showNotification('Đã gửi yêu cầu thanh toán. Vui lòng đợi nhân viên xác nhận.');
      }
    },
  });

  const applyDiscountMutation = useMutation({
    mutationFn: (code: string) => ordersApi.applyDiscount(Number(id!), code),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['client-order', id], updatedOrder);
      showNotification('Áp dụng mã giảm giá thành công!');
    },
  });

  return {
    requestEndMutation,
    cancelRequestMutation,
    paymentMutation,
    applyDiscountMutation,
  };
}
