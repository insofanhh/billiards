import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { blogApi } from '../../api/blog';

export function LatestPosts() {
  const navigate = useNavigate();
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['latest-posts'],
    queryFn: () => blogApi.getPosts({ status: 'published', limit: 3 }),
  });

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    return `${baseUrl}/storage/${path}`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-4 shadow-sm">
            <div className="h-40 bg-gray-200 dark:bg-white/10 rounded-xl mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!postsData?.data?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/20 bg-white/70 dark:bg-white/5 p-6 text-center text-sm text-gray-500 dark:text-white/50">
        <p>Chưa có tin tức nào.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {postsData.data.slice(0, 3).map((post: any) => (
        <div
          key={post.id}
          className="group cursor-pointer rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 overflow-hidden shadow-sm dark:shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:hover:shadow-green-900/20 hover:scale-[1.02] dark:hover:bg-white/10"
          onClick={() => navigate(`/blog/${post.id}`)}
        >
          <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-white/5">
            {post.thumbnail ? (
              <img
                src={getImageUrl(post.thumbnail)}
                alt={post.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 dark:text-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
            )}
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-white/10 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-[#13ec6d]">
                {post.category?.name || 'Tin tức'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(post.published_at).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-[#13ec6d] transition-colors">
              {post.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {post.summary}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
