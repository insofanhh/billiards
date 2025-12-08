import { apiClient } from './client';
import type { DiscountCode } from '../types';

export const discountCodesApi = {
  check: async (code: string): Promise<DiscountCode> => {
    const response = await apiClient.get(`/discount-codes/${code}`);
    return response.data;
  },
  getPublicDiscounts: async (): Promise<DiscountCode[]> => {
    const response = await apiClient.get('/public-discounts');
    return response.data;
  },
  getSavedDiscounts: async (): Promise<DiscountCode[]> => {
    const response = await apiClient.get('/saved-discounts');
    return response.data;
  },
  saveDiscount: async (id: number): Promise<void> => {
    await apiClient.post(`/save-discount/${id}`);
  },
  removeSavedDiscount: async (id: number): Promise<void> => {
    await apiClient.delete(`/save-discount/${id}`);
  },
};

