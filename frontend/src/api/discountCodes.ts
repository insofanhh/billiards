import { apiClient } from './client';
import type { DiscountCode } from '../types';

export const discountCodesApi = {
  check: async (code: string): Promise<DiscountCode> => {
    const response = await apiClient.get(`/discount-codes/${code}`);
    return response.data;
  },
};

