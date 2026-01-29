import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { echo } from '../echo';

interface SocketCallbacks {
    onMerge?: (targetTable: string) => void;
    onMove?: (newTableName: string) => void;
}

export function useOrderSockets(orderId: number | undefined, userId: number | undefined, callbacks?: SocketCallbacks) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orderId || !userId) return;

    const userChannel = echo.private(`user.${userId}`);
    const ordersChannel = echo.channel('orders');

    const invalidateOrder = (data: any) => {
      const pOrderId = data.order?.id || data.transaction?.order_id;
      
      if (Number(pOrderId) === Number(orderId)) {
        queryClient.invalidateQueries({ queryKey: ['client-order', String(orderId)] });
        queryClient.refetchQueries({ queryKey: ['client-order', String(orderId)] });
      }
    };

    const handleTransactionConfirmed = (data: any) => {
        if (data.transaction?.order_id === Number(orderId)) {
            invalidateOrder(data);
        }
    };

    const handleMerge = (data: any) => {
        console.log('Order merged event received:', data);
        if (Number(data.orderId) === Number(orderId) && callbacks?.onMerge) {
            callbacks.onMerge(data.targetTableName);
        }
    };

    const handleMove = (data: any) => {
        console.log('Order moved event received:', data);
        if (Number(data.orderId) === Number(orderId)) {
             queryClient.invalidateQueries({ queryKey: ['client-order', String(orderId)] });
             queryClient.refetchQueries({ queryKey: ['client-order', String(orderId)] });

             if (callbacks?.onMove) {
                 callbacks.onMove(data.newTableName);
             }
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

    userChannel.listen('.order.updated', invalidateOrder);
    ordersChannel.listen('.order.updated', invalidateOrder);

    userChannel.listen('.order.service.removed', invalidateOrder);
    ordersChannel.listen('.order.service.removed', invalidateOrder);

    // Merge & Move Events - Public Orders Channel
    ordersChannel.listen('.order.merged', handleMerge);
    ordersChannel.listen('.order.moved', handleMove);

    return () => {
      userChannel.stopListening('.order.approved');
      userChannel.stopListening('.order.rejected');
      userChannel.stopListening('.order.end.approved');
      userChannel.stopListening('.order.end.rejected');
      userChannel.stopListening('.transaction.confirmed');
      userChannel.stopListening('.order.service.added');
      userChannel.stopListening('.order.service.updated');
      userChannel.stopListening('.order.updated');
      userChannel.stopListening('.order.service.removed');
      
      ordersChannel.stopListening('.order.approved');
      ordersChannel.stopListening('.order.rejected');
      ordersChannel.stopListening('.order.end.approved');
      ordersChannel.stopListening('.order.end.rejected');
      ordersChannel.stopListening('.transaction.confirmed');
      ordersChannel.stopListening('.order.service.added');
      ordersChannel.stopListening('.order.service.updated');
      ordersChannel.stopListening('.order.updated');
      ordersChannel.stopListening('.order.service.removed');
      ordersChannel.stopListening('.order.merged');
      ordersChannel.stopListening('.order.moved');
      
      echo.leave(`user.${userId}`);
      echo.leave('orders');
    };
  }, [orderId, userId, queryClient, callbacks]);
}
