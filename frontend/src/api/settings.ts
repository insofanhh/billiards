import { apiClient } from './client';

export const settingsApi = {
  getBanners: async (): Promise<string[]> => {
    const response = await apiClient.get('/settings/banners');
    return response.data?.banners ?? [];
  },
};

