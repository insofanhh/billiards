import { apiClient } from './client';

export interface PublicStore {
  id: number;
  name: string;
  slug: string;
}

export const storesApi = {
  getBySlug: async (slug: string): Promise<PublicStore> => {
    const response = await apiClient.get<PublicStore>(`/public/stores/${slug}`);
    return response.data;
  },
};
