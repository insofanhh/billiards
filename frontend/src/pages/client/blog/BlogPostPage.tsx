import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi } from '../../../api/blog';
import { useParams, useNavigate } from 'react-router-dom';
import { ClientNavigation } from '../../../components/ClientNavigation';
import { useState, useMemo } from 'react';
import { getTemporaryUserName } from '../../../utils/temporaryUser';

export function BlogPostPage() {
    const { id, slug } = useParams<{ id: string; slug?: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [guestName] = useState(getTemporaryUserName);
    const [commentContent, setCommentContent] = useState('');
    const [submitError, setSubmitError] = useState('');

    const isAuthenticated = !!localStorage.getItem('auth_token');
    const isTemporaryUser = !!localStorage.getItem('is_temporary_user'); // Assuming this flag is set

    const { data: post, isLoading } = useQuery({
        queryKey: ['post', id],
        queryFn: () => blogApi.getPost(Number(id)),
    });

    const { data: relatedPostsData } = useQuery({
        queryKey: ['related-posts', post?.category_id],
        queryFn: () => blogApi.getPosts({
            category_id: post?.category_id,
            status: 'published'
        }),
        enabled: !!post?.category_id,
    });

    const { data: comments } = useQuery({
        queryKey: ['comments', id],
        queryFn: () => blogApi.getComments(Number(id)),
        enabled: !!id,
    });

    const createCommentMutation = useMutation({
        mutationFn: (content: string) => blogApi.createComment(Number(id), content),
        onSuccess: () => {
            setCommentContent('');
            queryClient.invalidateQueries({ queryKey: ['comments', id] });
            setSubmitError('');
        },
        onError: (error: any) => {
            setSubmitError(error.response?.data?.message || 'Failed to submit comment');
        }
    });

    const relatedPosts = useMemo(() => {
        if (!relatedPostsData?.data) return [];
        const filtered = relatedPostsData.data.filter((p: any) => p.id !== Number(id));
        return filtered.sort(() => 0.5 - Math.random()).slice(0, 3);
    }, [relatedPostsData, id]);

    const getImageUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const baseUrl = apiUrl.replace(/\/api\/?$/, '');
        return `${baseUrl}/storage/${path}`;
    };

    const handleCommentSubmit = () => {
        if (!commentContent.trim()) return;
        createCommentMutation.mutate(commentContent);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f8f8f5] dark:bg-[rgb(16,34,24)] flex items-center justify-center transition-colors duration-300">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#facc15] dark:border-[#13ec6d]"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#f8f8f5] dark:bg-[rgb(16,34,24)] flex flex-col items-center justify-center font-display transition-colors duration-300">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Bài viết không tồn tại</h2>
                <button
                    onClick={() => navigate('/blog')}
                    className="mt-4 text-[#facc15] dark:text-[#13ec6d] hover:text-yellow-600 dark:hover:text-[#10d863] font-medium"
                >
                    &larr; Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f8f5] dark:bg-[rgb(16,34,24)] font-display text-zinc-800 dark:text-white transition-colors duration-300">
            <ClientNavigation
                userName={guestName}
                onHomeClick={() => navigate(slug ? `/s/${slug}` : '/client')}
                onHistoryClick={() => navigate(slug ? `/s/${slug}/history` : '/client/history')}
                onVouchersClick={() => navigate(slug ? `/s/${slug}/vouchers` : '/client/vouchers')}
                blogActive={true}
            />

            <main className="flex flex-1 justify-center py-5 sm:py-10">
                <div className="flex w-full max-w-7xl flex-col gap-8 px-4 lg:px-8">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-wrap gap-2 text-sm">
                            <a
                                href="/blog"
                                onClick={(e) => { e.preventDefault(); navigate('/blog'); }}
                                className="text-zinc-500 dark:text-gray-400 transition-colors hover:text-[#facc15] dark:hover:text-[#13ec6d]"
                            >
                                Blog
                            </a>
                            <span className="text-zinc-500 dark:text-gray-400">/</span>
                            <span className="text-zinc-500 dark:text-gray-400">{post.category?.name}</span>
                            <span className="text-zinc-500 dark:text-gray-400">/</span>
                            <span className="text-zinc-800 dark:text-white">{post.title}</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h1 className="text-3xl font-black leading-tight tracking-[-0.033em] text-zinc-900 dark:text-white sm:text-5xl">
                                {post.title}
                            </h1>
                            <p className="text-base font-normal leading-normal text-zinc-500 dark:text-gray-400">
                                Ngày đăng: {new Date(post.published_at).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    </div>

                    {post.thumbnail && (
                        <div
                            className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden rounded-xl min-h-[24rem]"
                            style={{ backgroundImage: `url("${getImageUrl(post.thumbnail)}")` }}
                        >
                        </div>
                    )}

                    <div className="bg-white dark:bg-white/5 rounded-xl p-6 sm:p-8 backdrop-blur-sm border border-transparent dark:border-white/10">
                        {post.summary && (
                            <div className="text-xl text-zinc-600 dark:text-gray-300 mb-8 italic border-l-4 border-[#facc15] dark:border-[#13ec6d] pl-6 py-2 bg-gray-50 dark:bg-white/5 rounded-r-lg">
                                {post.summary}
                            </div>
                        )}
                        <div
                            className="prose prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-gray-300 prose-headings:font-display prose-headings:font-bold prose-headings:text-zinc-900 dark:prose-headings:text-white prose-a:text-[#facc15] dark:prose-a:text-[#13ec6d] prose-strong:text-zinc-900 dark:prose-strong:text-white"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        <div className="mt-8 flex items-center justify-start gap-4 border-t border-zinc-100 dark:border-white/10 pt-6">
                            <p className="text-sm font-medium text-zinc-500 dark:text-gray-400">Chia sẻ bài viết:</p>
                            <div className="flex gap-2">
                                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-gray-400 transition-colors hover:bg-[#facc15] dark:hover:bg-[#13ec6d] hover:text-zinc-900 dark:hover:text-zinc-900">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                                </button>
                                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-gray-400 transition-colors hover:bg-[#facc15] dark:hover:bg-[#13ec6d] hover:text-zinc-900 dark:hover:text-zinc-900">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z"></path></svg>
                                </button>
                                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-gray-400 transition-colors hover:bg-[#facc15] dark:hover:bg-[#13ec6d] hover:text-zinc-900 dark:hover:text-zinc-900">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Related Posts */}
                    {relatedPosts.length > 0 && (
                        <div className="flex flex-col gap-6">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Bài viết liên quan</h2>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {relatedPosts.map((relatedPost: any) => (
                                    <div
                                        key={relatedPost.id}
                                        className="flex flex-col overflow-hidden rounded-xl bg-white dark:bg-white/5 transition-transform hover:-translate-y-1 cursor-pointer border border-transparent dark:border-white/10"
                                        onClick={() => {
                                            navigate(`/blog/${relatedPost.id}`);
                                            window.scrollTo(0, 0);
                                        }}
                                    >
                                        <div
                                            className="aspect-video w-full bg-cover bg-center bg-gray-200 dark:bg-white/10"
                                            style={{ backgroundImage: `url("${getImageUrl(relatedPost.thumbnail)}")` }}
                                        ></div>
                                        <div className="flex flex-1 flex-col p-4">
                                            <h3 className="font-bold text-zinc-800 dark:text-white line-clamp-2">{relatedPost.title}</h3>
                                            <p className="mt-2 flex-1 text-sm text-zinc-500 dark:text-gray-400 line-clamp-2">{relatedPost.summary}</p>
                                            <span className="mt-4 text-sm font-bold text-[#facc15] dark:text-[#13ec6d] transition-opacity hover:opacity-80">Đọc thêm →</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comments */}
                    <div className="flex flex-col gap-6">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Bình luận ({comments?.length || 0})</h2>
                        <div className="space-y-6">
                            {/* Comment Form */}
                            <div className="flex flex-col gap-4 rounded-xl bg-white dark:bg-white/5 p-4 sm:p-6 border border-transparent dark:border-white/10">
                                {!isAuthenticated ? (
                                    <div className="text-center py-6">
                                        <p className="text-zinc-600 dark:text-gray-400 mb-4">Vui lòng đăng nhập để bình luận.</p>
                                        <button
                                            onClick={() => navigate('/login')}
                                            className="px-6 py-2 bg-[#facc15] dark:bg-[#13ec6d] text-zinc-900 font-bold rounded-lg hover:opacity-90 transition-opacity"
                                        >
                                            Đăng nhập
                                        </button>
                                    </div>
                                ) : isTemporaryUser ? (
                                    <div className="text-center py-6">
                                        <p className="text-zinc-600 dark:text-gray-400 mb-4">Người dùng tạm thời không thể bình luận. Vui lòng đăng ký tài khoản đầy đủ.</p>
                                        <button
                                            onClick={() => navigate('/register')}
                                            className="px-6 py-2 bg-[#facc15] dark:bg-[#13ec6d] text-zinc-900 font-bold rounded-lg hover:opacity-90 transition-opacity"
                                        >
                                            Đăng ký
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <textarea
                                                className="w-full rounded-lg border-zinc-300 dark:border-white/10 bg-zinc-50 dark:bg-white/5 p-3 text-sm text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-gray-500 focus:border-[#facc15] dark:focus:border-[#13ec6d] focus:ring-[#facc15] dark:focus:ring-[#13ec6d]"
                                                placeholder="Viết bình luận..."
                                                rows={3}
                                                value={commentContent}
                                                onChange={(e) => setCommentContent(e.target.value)}
                                            ></textarea>
                                            {submitError && <p className="text-red-500 text-sm mt-2">{submitError}</p>}
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    onClick={handleCommentSubmit}
                                                    disabled={createCommentMutation.isPending || !commentContent.trim()}
                                                    className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#facc15] dark:bg-[#13ec6d] text-zinc-900 text-sm font-bold leading-normal tracking-[0.015em] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <span className="truncate">
                                                        {createCommentMutation.isPending ? 'Đang gửi...' : 'Gửi bình luận'}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Comments List */}
                            {comments && comments.length > 0 ? (
                                comments.map((comment: any) => (
                                    <div key={comment.id} className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold">
                                            {comment.user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div className="flex-1 rounded-xl bg-white dark:bg-white/5 p-4 border border-transparent dark:border-white/10">
                                            <div className="flex items-baseline justify-between">
                                                <p className="font-bold text-zinc-800 dark:text-white">{comment.user?.name || 'Người dùng ẩn danh'}</p>
                                                <p className="text-xs text-zinc-500 dark:text-gray-400">
                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <p className="mt-2 text-sm text-zinc-700 dark:text-gray-300">{comment.content}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-zinc-500 dark:text-gray-400 text-sm py-4">
                                    Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ suy nghĩ của bạn!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
