
interface Highlight {
  title: string;
  description: string;
}

const highlightCards: Highlight[] = [
  {
    title: 'Quét mã để bắt đầu',
    description: 'Đưa camera tới mã QR trên bàn để mở bàn và tạo yêu cầu phục vụ trong vài giây.',
  },
  {
    title: 'Theo dõi thông báo',
    description: 'Khi quản trị viên đăng thông báo mới, nội dung sẽ xuất hiện tự động tại khu vực bên dưới.',
  },
  {
    title: 'Săn khuyến mãi',
    description: 'Các gói ưu đãi, happy hour hoặc mã giảm giá sẽ được CMS đồng bộ để bạn xem nhanh.',
  },
];

const infoSteps = [
    { title: 'Bước 1', description: 'Chọn nút Quét mã QR và cấp quyền camera.' },
    { title: 'Bước 2', description: 'Giữ camera ổn định trước mã QR được dán trên bàn.' },
    { title: 'Bước 3', description: 'Hệ thống sẽ mở trang bàn để bạn yêu cầu mở bàn hoặc gọi thêm dịch vụ.' },
];

export function InfoSection() {
    return (
        <>
            <section className="grid gap-6 md:grid-cols-3">
                {highlightCards.map((item) => (
                    <div key={item.title} className="rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-[#13ec6d]">Thông tin</p>
                        <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">{item.title}</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                    </div>
                ))}
            </section>

             <section className="rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-8 shadow-sm backdrop-blur-sm">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Hướng dẫn nhanh</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {infoSteps.map((step) => (
                    <div key={step.title} className="rounded-2xl bg-gray-50 dark:bg-white/5 p-4 border border-gray-100 dark:border-white/5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-[#13ec6d]">{step.title}</p>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
                    </div>
                    ))}
                </div>
            </section>
        </>
    );
}
