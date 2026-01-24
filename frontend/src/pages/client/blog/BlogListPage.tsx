import { useQuery } from '@tanstack/react-query';
import { blogApi } from '../../../api/blog';
import { useNavigate, useParams } from 'react-router-dom';
import { ClientNavigation } from '../../../components/ClientNavigation';
import { useState } from 'react';
import { getTemporaryUserName } from '../../../utils/temporaryUser';

export function BlogListPage() {
    const navigate = useNavigate();
    const { slug } = useParams<{ slug?: string }>();
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [guestName] = useState(getTemporaryUserName);

    const { data: postsData, isLoading } = useQuery({
        queryKey: ['public-posts', selectedCategoryId],
        queryFn: () => blogApi.getPosts({
            status: 'published',
            category_id: selectedCategoryId
        }),
    });

    const { data: categoriesData } = useQuery({
        queryKey: ['public-categories'],
        queryFn: () => blogApi.getCategories(),
    });

    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const baseUrl = apiUrl.replace(/\/api\/?$/, '');
        return `${baseUrl}/storage/${path}`;
    };

    const featuredPost = !selectedCategoryId ? (postsData?.data?.find((post: any) => post.is_feature_post) || postsData?.data?.[0]) : null;
    const recentPosts = postsData?.data?.filter((post: any) => !featuredPost || post.id !== featuredPost.id) || [];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[rgb(16,34,24)] font-display text-slate-800 dark:text-white transition-colors duration-300">
            <ClientNavigation
                userName={guestName}
                onHomeClick={() => navigate(slug ? `/s/${slug}` : '/client')}
                onHistoryClick={() => navigate(slug ? `/s/${slug}/history` : '/client/history')}
                onVouchersClick={() => navigate(slug ? `/s/${slug}/vouchers` : '/client/vouchers')}
                blogActive={true}
            />

            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-[#13ec6d]"></div>
                    </div>
                ) : (
                    <>
                        {featuredPost && !selectedCategoryId && (
                            <section className="bg-gray-900 dark:bg-white/5 rounded-3xl p-8 md:p-12 mb-16 flex flex-col md:flex-row items-center gap-8 shadow-xl border border-transparent dark:border-white/10">
                                <div className="md:w-1/2 text-white">
                                    <p className="text-yellow-400 dark:text-[#13ec6d] font-semibold mb-2 text-sm uppercase tracking-wider">
                                        {featuredPost.category?.name || 'Bài viết nổi bật'}
                                    </p>
                                    <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                                        {featuredPost.title}
                                    </h2>
                                    <p className="text-slate-300 dark:text-gray-300 mb-6 text-lg line-clamp-3">
                                        {featuredPost.summary}
                                    </p>
                                    <button
                                        onClick={() => navigate(`/blog/${featuredPost.id}`)}
                                        className="inline-flex items-center bg-yellow-400 dark:bg-[#13ec6d] text-slate-900 dark:text-zinc-900 font-bold py-3 px-6 rounded-full hover:bg-yellow-300 dark:hover:bg-[#10d863] transition-colors"
                                    >
                                        Đọc thêm
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="md:w-1/2 w-full">
                                    <img
                                        alt={featuredPost.title}
                                        className="rounded-xl object-cover w-full h-64 md:h-80 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300"
                                        src={getImageUrl(featuredPost.thumbnail)}
                                    />
                                </div>
                            </section>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                            <div className="lg:col-span-2">
                                <h3 className="text-2xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="w-2 h-8 bg-yellow-400 dark:bg-[#13ec6d] rounded-full"></span>
                                    {selectedCategoryId ? categoriesData?.find((c: any) => c.id === selectedCategoryId)?.name : 'Bài viết mới nhất'}
                                </h3>
                                <div className="space-y-12">
                                    {recentPosts.length > 0 ? (
                                        recentPosts.map((post: any) => (
                                            <article key={post.id} className="flex flex-col sm:flex-row gap-6 group cursor-pointer" onClick={() => navigate(`/blog/${post.id}`)}>
                                                <div className="w-full sm:w-1/3 overflow-hidden rounded-xl">
                                                    <img
                                                        alt={post.title}
                                                        className="w-full h-48 sm:h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        src={getImageUrl(post.thumbnail)}
                                                    />
                                                </div>
                                                <div className="flex-1 py-2">
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 mb-2">
                                                        <span className="font-medium text-yellow-600 dark:text-[#13ec6d] bg-yellow-50 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                                            {post.category?.name}
                                                        </span>
                                                        <span>•</span>
                                                        <time>{new Date(post.published_at).toLocaleDateString('vi-VN')}</time>
                                                    </div>
                                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-yellow-600 dark:group-hover:text-[#13ec6d] transition-colors">
                                                        {post.title}
                                                    </h4>
                                                    <p className="text-slate-600 dark:text-gray-300 mb-4 line-clamp-2">
                                                        {post.summary}
                                                    </p>
                                                    <span className="font-semibold text-yellow-600 dark:text-[#13ec6d] inline-flex items-center group-hover:translate-x-2 transition-transform">
                                                        Tiếp tục đọc
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </span>
                                                </div>
                                            </article>
                                        ))
                                    ) : (
                                        <p className="text-slate-500 dark:text-gray-400">Không có bài viết nào trong danh mục này.</p>
                                    )}
                                </div>
                            </div>

                            <aside className="lg:col-span-1">
                                <div className="sticky top-8 space-y-8">
                                    <div className="bg-white dark:bg-white/5 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 backdrop-blur-sm">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 border-b border-gray-100 dark:border-white/10 pb-3">
                                            Danh mục
                                        </h3>
                                        <ul className="space-y-3">
                                            <li>
                                                <button
                                                    onClick={() => setSelectedCategoryId(null)}
                                                    className={`flex justify-between items-center w-full text-left transition-colors group ${selectedCategoryId === null ? 'text-yellow-600 dark:text-[#13ec6d] font-bold' : 'text-slate-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-[#13ec6d]'}`}
                                                >
                                                    <span className="group-hover:translate-x-1 transition-transform">Tất cả</span>
                                                </button>
                                            </li>
                                            {Array.isArray(categoriesData) && categoriesData.map((category: any) => (
                                                <li key={category.id}>
                                                    <button
                                                        onClick={() => setSelectedCategoryId(category.id)}
                                                        className={`flex justify-between items-center w-full text-left transition-colors group ${selectedCategoryId === category.id ? 'text-yellow-600 dark:text-[#13ec6d] font-bold' : 'text-slate-600 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-[#13ec6d]'}`}
                                                    >
                                                        <span className="group-hover:translate-x-1 transition-transform">{category.name}</span>
                                                        <span className={`text-xs font-mono px-2 py-1 rounded-full ${selectedCategoryId === category.id ? 'bg-yellow-50 dark:bg-[#13ec6d]/20 text-yellow-700 dark:text-[#13ec6d]' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 group-hover:bg-yellow-50 dark:group-hover:bg-[#13ec6d]/20 group-hover:text-yellow-700 dark:group-hover:text-[#13ec6d]'}`}>
                                                            {category.posts_count || 0}
                                                        </span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-white/10 dark:to-white/5 p-6 rounded-2xl shadow-lg text-white border border-transparent dark:border-white/10">
                                        <h3 className="text-lg font-bold mb-4 pb-3 border-b border-slate-700 dark:border-white/10">
                                            Bản tin
                                        </h3>
                                        <p className="text-slate-300 dark:text-gray-300 text-sm mb-4">
                                            Đăng ký để nhận thông tin cập nhật và mẹo mới nhất trực tiếp vào hộp thư đến của bạn.
                                        </p>
                                        <div className="space-y-3">
                                            <input
                                                type="email"
                                                placeholder="Địa chỉ email của bạn"
                                                className="w-full px-4 py-2 rounded-lg bg-slate-700 dark:bg-white/10 border-none text-white placeholder-slate-400 focus:ring-2 focus:ring-yellow-400 dark:focus:ring-[#13ec6d]"
                                            />
                                            <button className="w-full bg-yellow-400 dark:bg-[#13ec6d] text-slate-900 dark:text-zinc-900 font-bold py-2 rounded-lg hover:bg-yellow-300 dark:hover:bg-[#10d863] transition-colors">
                                                Đăng ký
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
