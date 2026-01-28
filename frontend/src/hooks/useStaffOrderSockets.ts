import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { echo } from '../echo';

export function useStaffOrderSockets(orderId: number | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orderId) return;

    const ordersChannel = echo.channel('orders');
    const staffChannel = echo.private('staff');

    const invalidateOrder = (data: any) => {
      // Check if the event relates to this order
      const pOrderId = data.order?.id || data.transaction?.order_id;
      
      if (Number(pOrderId) === Number(orderId)) {
        queryClient.invalidateQueries({ queryKey: ['order'] }); // Broad invalidation to be safe
        queryClient.invalidateQueries({ queryKey: ['order', String(orderId)] });
        queryClient.refetchQueries({ queryKey: ['order', String(orderId)] });
        
        // Also invalidate tables list as status might change
        queryClient.invalidateQueries({ queryKey: ['tables'] }); 
      }
    };

    const handleTransactionConfirmed = (data: any) => {
        if (data.transaction?.order_id === Number(orderId)) {
            invalidateOrder(data);
        }
    };

    // Listen to events on both channels
    const events = [
        '.order.end.requested',
        '.transaction.created',
        '.transaction.confirmed',
        '.order.service.added',
        '.order.service.updated',
        '.order.service.removed',
        '.order.updated', // Added generic update event
        '.order.app.client_joined' // Example if we needed to know when client joins
    ];

    events.forEach(event => {
        if (event === '.transaction.confirmed') {
            ordersChannel.listen(event, handleTransactionConfirmed);
            staffChannel.listen(event, handleTransactionConfirmed);
        } else {
            ordersChannel.listen(event, invalidateOrder);
            staffChannel.listen(event, invalidateOrder);
        }
    });

    return () => {
        events.forEach(event => {
            ordersChannel.stopListening(event);
            staffChannel.stopListening(event);
        });
        echo.leave('orders');
        echo.leave('staff');
    };
  }, [orderId, queryClient]);
}
