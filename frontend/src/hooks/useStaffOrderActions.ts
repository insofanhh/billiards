import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import { useNotification } from '../contexts/NotificationContext';

export function useStaffOrderActions(id: string | undefined) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const orderId = Number(id!);

  const approveEndMutation = useMutation({
    mutationFn: () => ordersApi.approveEnd(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      showNotification('Đã kết thúc bàn thành công!');
    },
  });

  const rejectEndMutation = useMutation({
    mutationFn: () => ordersApi.rejectEnd(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      showNotification('Đã từ chối yêu cầu kết thúc.');
    },
  });

  const removeServiceMutation = useMutation({
    mutationFn: (itemId: number) => ordersApi.removeService(orderId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      showNotification('Đã xóa dịch vụ.');
    },
  });

  const confirmBatchMutation = useMutation({
    mutationFn: async (itemIds: number[]) => {
      await Promise.all(itemIds.map((itemId) => ordersApi.confirmServiceItem(orderId, itemId)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      showNotification('Đã xác nhận các món đã chọn!');
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (data: { method: 'cash' | 'card' | 'mobile'; amount: number }) =>
      ordersApi.createTransaction(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.refetchQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      showNotification('Tạo giao dịch thanh toán thành công!');
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (txnId: number) => ordersApi.confirmTransaction(orderId, txnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.refetchQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      showNotification('Đã xác nhận thanh toán!');
    },
  });

  const applyDiscountMutation = useMutation({
    mutationFn: (code: string) => ordersApi.applyDiscount(orderId, code),
    onSuccess: (updatedOrder) => {
        queryClient.setQueryData(['order', id], updatedOrder);
        showNotification('Áp dụng mã giảm giá thành công!');
    },
  });

  return {
    approveEndMutation,
    rejectEndMutation,
    removeServiceMutation,
    confirmBatchMutation,
    paymentMutation,
    confirmPaymentMutation,
    applyDiscountMutation
  };
}
