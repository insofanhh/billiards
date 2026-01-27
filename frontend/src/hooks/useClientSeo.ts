import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';

export function useClientSeo() {
  const { data: settings } = useQuery({
    queryKey: ['client-banner-settings'],
    queryFn: settingsApi.getBanners,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!settings) return;

    // Update Title
    if (settings.seoTitle) {
      document.title = settings.seoTitle;
    }

    // Update Meta Description
    let metaDescription = document.querySelector("meta[name='description']");
    if (settings.seoDescription) {
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', settings.seoDescription);
    }

    // Update Meta Keywords
    let metaKeywords = document.querySelector("meta[name='keywords']");
    if (settings.seoKeywords) {
        if (!metaKeywords) {
            metaKeywords = document.createElement('meta');
            metaKeywords.setAttribute('name', 'keywords');
            document.head.appendChild(metaKeywords);
        }
        metaKeywords.setAttribute('content', settings.seoKeywords);
    }

  }, [settings]);
}
