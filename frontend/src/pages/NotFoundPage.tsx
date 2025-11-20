import { useNavigate } from 'react-router-dom';
import { ClientNavigation } from '../components/ClientNavigation';
import { getTemporaryUserName } from '../utils/temporaryUser';

export function NotFoundPage() {
  const navigate = useNavigate();
  const guestName = getTemporaryUserName();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      <ClientNavigation
        userName={guestName}
        onHomeClick={() => navigate('/client')}
        onHistoryClick={() => navigate('/client/history')}
      />

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center px-4 py-10">
        <div className="text-center">
          <div className="mb-8 inline-block rounded-3xl bg-gray-900 px-8 py-4">
            <h1 className="text-8xl font-bold text-white sm:text-9xl">404</h1>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Trang không tìm thấy</h2>
              <p className="mt-4 text-lg text-gray-600">
                Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => navigate('/client')}
                className="rounded-2xl bg-yellow-400 px-6 py-3 text-base font-semibold text-gray-900 shadow-lg shadow-yellow-500/30 transition hover:bg-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
              >
                Về trang chủ
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-2xl border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
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

