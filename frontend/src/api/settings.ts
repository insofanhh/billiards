import { apiClient } from './client';

export type BannerSettings = {
  images: string[];
  videoUrl: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  learnMoreUrl?: string | null;
};

export const settingsApi = {
  getBanners: async (): Promise<BannerSettings> => {
    const response = await apiClient.get('/settings/banners');
    return {
        images: response.data?.banners ?? [],
        videoUrl: response.data?.banner_video_url ?? null,
        seoTitle: response.data?.seo_title,
        seoDescription: response.data?.seo_description,
        seoKeywords: response.data?.seo_keywords,
        learnMoreUrl: response.data?.learn_more_url,
    };
  },
};

