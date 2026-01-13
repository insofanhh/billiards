import { apiClient } from './client';

export type BannerSettings = {
  images: string[];
  videoUrl: string | null;
};

export const settingsApi = {
  getBanners: async (): Promise<BannerSettings> => {
    const response = await apiClient.get('/settings/banners');
    return {
        images: response.data?.banners ?? [],
        videoUrl: response.data?.banner_video_url ?? null
    };
  },
};

