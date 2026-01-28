import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import { useNotification } from '../contexts/NotificationContext';

export function useStaffOrderActions(id: string | undefined, slug?: string) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();
  const orderId = Number(id!);
  const queryKey = ['order', id, slug];
 
  // Actually, previously it was just ['order', id]. 
  // Let's stick to the plan: update to ['order', id, slug].

  const approveEndMutation = useMutation({
    mutationFn: () => ordersApi.approveEnd(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      showNotification('Đã kết thúc bàn thành công!');
    },
  });

  const rejectEndMutation = useMutation({
    mutationFn: () => ordersApi.rejectEnd(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      showNotification('Đã từ chối yêu cầu kết thúc.');
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: (data: { itemId: number; qty: number }) =>
      ordersApi.updateService(orderId, data.itemId, data.qty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showNotification('Đã cập nhật số lượng.');
    },
  });

  const removeServiceMutation = useMutation({
    mutationFn: (itemId: number) => ordersApi.removeService(orderId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showNotification('Đã xóa dịch vụ.');
    },
  });

  const confirmBatchMutation = useMutation({
    mutationFn: async (itemIds: number[]) => {
      await Promise.all(itemIds.map((itemId) => ordersApi.confirmServiceItem(orderId, itemId)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      showNotification('Đã xác nhận các món đã chọn!');
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (data: { method: 'cash' | 'card' | 'mobile'; amount: number }) =>
      ordersApi.createTransaction(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.refetchQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      showNotification('Tạo giao dịch thanh toán thành công!');
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: (txnId: number) => ordersApi.confirmTransaction(orderId, txnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.refetchQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      showNotification('Đã xác nhận thanh toán!');
    },
  });

  const applyDiscountMutation = useMutation({
    mutationFn: (code: string) => ordersApi.applyDiscount(orderId, code),
    onSuccess: () => {
        // queryClient.setQueryData(queryKey, updatedOrder); // Manual update might be flaky if structure differs
        queryClient.invalidateQueries({ queryKey });
        queryClient.refetchQueries({ queryKey });
        showNotification('Áp dụng mã giảm giá thành công!');
    },
  });
  
  const removeDiscountMutation = useMutation({
    mutationFn: () => ordersApi.removeDiscount(orderId),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.refetchQueries({ queryKey });
        showNotification('Đã hủy mã giảm giá thành công!');
    },
  });

  return {
    approveEndMutation,
    rejectEndMutation,
    updateServiceMutation,
    removeServiceMutation,
    confirmBatchMutation,
    paymentMutation,
    confirmPaymentMutation,
    applyDiscountMutation,
    removeDiscountMutation
  };
}
