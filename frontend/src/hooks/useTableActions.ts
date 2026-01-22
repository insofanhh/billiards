import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../api/orders';
import { useNotification } from '../contexts/NotificationContext';

export function useTableActions(tableCode: string | undefined, slug?: string) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showNotification } = useNotification();

    const invalidateQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['tables'] });
        if (tableCode) {
            queryClient.invalidateQueries({ queryKey: ['table', tableCode] });
        }
    };

    const createOrderMutation = useMutation({
        mutationFn: (data: { table_code: string }) => ordersApi.create(data, slug),
        onSuccess: (order) => {
            invalidateQueries();
            navigate(slug ? `/s/${slug}/staff/order/${order.id}` : `/order/${order.id}`);
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Có lỗi xảy ra khi mở bàn';
            const debug = error.response?.data?.debug;
            console.error('Create order error:', error);
            showNotification(message + (debug ? ` (${JSON.stringify(debug)})` : ''));
        },
    });

    const approveEndMutation = useMutation({
        mutationFn: (orderId: number) => ordersApi.approveEnd(orderId),
        onSuccess: (order) => {
            invalidateQueries();
            navigate(slug ? `/s/${slug}/staff/order/${order.id}` : `/order/${order.id}`);
        },
    });

    const rejectEndMutation = useMutation({
        mutationFn: (orderId: number) => ordersApi.rejectEnd(orderId),
        onSuccess: () => {
            invalidateQueries();
        },
    });

    const approveOpenMutation = useMutation({
        mutationFn: (orderId: number) => ordersApi.approve(orderId),
        onSuccess: () => {
            invalidateQueries();
        },
    });

    const rejectOpenMutation = useMutation({
        mutationFn: (orderId: number) => ordersApi.reject(orderId),
        onSuccess: () => {
            invalidateQueries();
        },
    });

    return {
        createOrder: createOrderMutation.mutate,
        isCreating: createOrderMutation.isPending,
        approveEnd: approveEndMutation.mutate,
        isApprovingEnd: approveEndMutation.isPending,
        rejectEnd: rejectEndMutation.mutate,
        isRejectingEnd: rejectEndMutation.isPending,
        approveOpen: approveOpenMutation.mutate,
        isApprovingOpen: approveOpenMutation.isPending,
        rejectOpen: rejectOpenMutation.mutate,
        isRejectingOpen: rejectOpenMutation.isPending,
    };
}
