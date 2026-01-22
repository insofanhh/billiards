import { apiClient } from './client';

export interface PublicStore {
  id: number;
  name: string;
  slug: string;
}

export interface StorePaymentInfo {
  bank_account_no: string;
  bank_name: string;
  bank_account_name: string;
}

export const storesApi = {
  getBySlug: async (slug: string): Promise<PublicStore> => {
    const response = await apiClient.get<PublicStore>(`/public/stores/${slug}`);
    return response.data;
  },
  
  getPaymentInfo: async (slug: string): Promise<StorePaymentInfo | null> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: StorePaymentInfo }>(`/public/stores/${slug}/payment-info`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Failed to fetch payment info:', error);
      return null;
    }
  },
};
