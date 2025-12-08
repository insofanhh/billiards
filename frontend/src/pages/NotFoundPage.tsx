import { useNavigate } from 'react-router-dom';
import { ClientNavigation } from '../components/ClientNavigation';
import { getTemporaryUserName } from '../utils/temporaryUser';

export function NotFoundPage() {
  const navigate = useNavigate();
  const guestName = getTemporaryUserName();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[rgb(16,34,24)] transition-colors duration-300">
      <ClientNavigation
        userName={guestName}
        onHomeClick={() => navigate('/client')}
        onHistoryClick={() => navigate('/client/history')}
        onVouchersClick={() => navigate('/client/vouchers')}
      />

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center px-4 py-10">
        <div className="text-center">
          <div className="mb-8 inline-block rounded-3xl bg-gray-900 dark:bg-white/10 px-8 py-4">
            <h1 className="text-8xl font-bold text-white sm:text-9xl">404</h1>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Trang không tìm thấy</h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => navigate('/client')}
                className="rounded-2xl bg-yellow-400 dark:bg-[#13ec6d] px-6 py-3 text-base font-semibold text-gray-900 dark:text-zinc-900 shadow-lg shadow-yellow-500/30 dark:shadow-green-500/20 transition hover:bg-yellow-300 dark:hover:bg-[#10d863] focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              >
                Về trang chủ
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-2xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 px-6 py-3 text-base font-semibold text-gray-700 dark:text-white transition hover:bg-gray-50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

