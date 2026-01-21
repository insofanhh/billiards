import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { echo } from '../echo';

export function useOrderSockets(orderId: number | undefined, userId: number | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orderId || !userId) return;

    const userChannel = echo.private(`user.${userId}`);
    const ordersChannel = echo.channel('orders');

    const invalidateOrder = (data: any) => {
      // Check if the event relates to this order
      // Some events might be generic or have different payload structures
      // Ideally we check data.order?.id or data.transaction?.order_id
      const pOrderId = data.order?.id || data.transaction?.order_id;
      if (pOrderId === Number(orderId)) {
        queryClient.invalidateQueries({ queryKey: ['client-order', String(orderId)] });
        queryClient.refetchQueries({ queryKey: ['client-order', String(orderId)] });
      }
    };

    const handleTransactionConfirmed = (data: any) => {
        if (data.transaction?.order_id === Number(orderId)) {
            invalidateOrder(data);
            // Scroll logic can be handled by a separate effect monitoring transaction status
            // or we can expose an event emitter here if strictly needed.
            // For now, we rely on state updates triggering UI changes.
        }
    };

    // Listen to events
    userChannel.listen('.order.approved', invalidateOrder);
    ordersChannel.listen('.order.approved', invalidateOrder);
    
    userChannel.listen('.order.rejected', invalidateOrder);
    ordersChannel.listen('.order.rejected', invalidateOrder);

    userChannel.listen('.order.end.approved', invalidateOrder);
    ordersChannel.listen('.order.end.approved', invalidateOrder);

    userChannel.listen('.order.end.rejected', invalidateOrder);
    ordersChannel.listen('.order.end.rejected', invalidateOrder);

    userChannel.listen('.transaction.confirmed', handleTransactionConfirmed);
    ordersChannel.listen('.transaction.confirmed', handleTransactionConfirmed);

    userChannel.listen('.order.service.added', invalidateOrder);
    ordersChannel.listen('.order.service.added', invalidateOrder);

    userChannel.listen('.order.service.updated', invalidateOrder);
    ordersChannel.listen('.order.service.updated', invalidateOrder);

    userChannel.listen('.order.service.removed', invalidateOrder);
    ordersChannel.listen('.order.service.removed', invalidateOrder);

    return () => {
      userChannel.stopListening('.order.approved');
      userChannel.stopListening('.order.rejected');
      userChannel.stopListening('.order.end.approved');
      userChannel.stopListening('.order.end.rejected');
      userChannel.stopListening('.transaction.confirmed');
      userChannel.stopListening('.order.service.added');
      userChannel.stopListening('.order.service.updated');
      userChannel.stopListening('.order.service.removed');
      
      ordersChannel.stopListening('.order.approved');
      ordersChannel.stopListening('.order.rejected');
      ordersChannel.stopListening('.order.end.approved');
      ordersChannel.stopListening('.order.end.rejected');
      ordersChannel.stopListening('.transaction.confirmed');
      ordersChannel.stopListening('.order.service.added');
      ordersChannel.stopListening('.order.service.updated');
      ordersChannel.stopListening('.order.service.removed');
      
      echo.leave(`user.${userId}`);
      echo.leave('orders');
    };
  }, [orderId, userId, queryClient]);
}
