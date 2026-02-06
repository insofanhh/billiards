import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import { useNotification } from '../contexts/NotificationContext';
import { AddressSelector } from '../components/AddressSelector';
import { AdminNavigation } from '../components/AdminNavigation';

// --- Types & Schema ---

const profileSchema = z.object({
  birthday: z.string().min(1, 'Ngày sinh là bắt buộc'),
  cccd: z.string().min(9, 'Số CCCD/Passport không hợp lệ'),
  phone_contact: z.string().min(10, 'Số điện thoại không hợp lệ'),
  email_contact: z.string().email('Email không hợp lệ'),
  country: z.string().min(1, 'Quốc gia là bắt buộc'),
  province: z.string().min(1, 'Tỉnh/Thành phố là bắt buộc'),
  ward: z.string().min(1, 'Phường/Xã là bắt buộc'),
  address_detail: z.string().min(5, 'Địa chỉ chi tiết là bắt buộc'),
});

type ProfileForm = z.infer<typeof profileSchema>;

type PaymentInfo = {
    amount: number;
    bank_account: string;
    bank_name: string;
    bank_owner: string;
    content: string;
    qr_url: string;
};

// --- Components ---

const StepIndicator = ({ currentStep }: { currentStep: number }) => {
    return (
        <div className="flex items-center justify-center mb-10">
            <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold transition-all duration-300 ${currentStep >= 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-500'}`}>
                    1
                </div>
                <div className={`ml-2 text-sm font-medium ${currentStep >= 1 ? 'text-white' : 'text-gray-500'}`}>Thông tin</div>
            </div>
            
            <div className={`w-24 h-1 mx-4 rounded transition-all duration-300 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-700'}`}></div>
            
            <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold transition-all duration-300 ${currentStep >= 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-600 text-gray-500'}`}>
                    2
                </div>
                <div className={`ml-2 text-sm font-medium ${currentStep >= 2 ? 'text-white' : 'text-gray-500'}`}>Thanh toán</div>
            </div>
        </div>
    );
};

const PlanCard = ({ month, price, selected, onSelect }: { month: number, price: number, selected: boolean, onSelect: () => void }) => {
    const isPopular = month === 12;
    return (
        <div 
            onClick={onSelect}
            className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${
                selected 
                ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/20' 
                : 'bg-gray-800 border-gray-700 hover:border-gray-500 hover:bg-gray-750'
            }`}
        >
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                    TIẾT KIỆM NHẤT
                </div>
            )}
            <div className="flex justify-between items-center mb-2">
                <span className={`text-lg font-bold ${selected ? 'text-blue-400' : 'text-white'}`}>{month} Tháng</span>
                {selected && <span className="material-symbols-outlined text-blue-500">check_circle</span>}
            </div>
            <div className="text-2xl font-bold text-white mb-1">
                {price.toLocaleString()}đ
            </div>
            <div className="text-xs text-gray-400">
                {(price / month).toLocaleString()}đ / tháng
            </div>
        </div>
    );
};

// --- Main Page ---

export const SubscriptionExtensionPage = () => {
    const { slug } = useParams();
    const { showNotification } = useNotification();
    const { user, logout } = useAuthStore();
    
    const [loading, setLoading] = useState(true);
    const [storeInfo, setStoreInfo] = useState<any>(null);
    const [step, setStep] = useState(1);
    
    // Payment State
    const [selectedMonths, setSelectedMonths] = useState(12); // Default to 12 months for upsell
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
    const [checkingPayment, setCheckingPayment] = useState(false);

    // Form
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch, trigger } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: { country: 'Việt Nam' }
    });

    const countryValue = watch('country');
    const provinceValue = watch('province');
    const wardValue = watch('ward');

    // -- Effects --

    useEffect(() => {
        fetchStoreInfo();
    }, [slug]);

    useEffect(() => {
        if (step === 2) {
            fetchPaymentInfo();
        }
    }, [step, selectedMonths]);

    // Polling Logic
    const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    useEffect(() => {
        // Only poll if we have payment info shown (Step 2) and not already checking
        if (step === 2 && paymentInfo) {
            startPolling();
        }
        return () => stopPolling();
    }, [step, paymentInfo, slug]);

    const startPolling = () => {
        stopPolling();
        const poll = async () => {
            if (!slug) return;
            // Silent check
            try {
                const res = await apiClient.get(`/public/store-extensions/${slug}`);
                if (!res.data.is_expired) { // is_expired becomes false upon successful activation
                    // Success!
                    showNotification('Thanh toán thành công! Đang chuyển hướng...', 'success');
                    
                    // Critical: Refresh auth session before redirecting (FORCE refresh)
                    await useAuthStore.getState().checkSession(true);
                    
                    setTimeout(() => {
                         window.location.href = `/s/${slug}/staff`;
                    }, 1500);
                    return; // Stop polling
                }
            } catch (e) {
                // Ignore errors during silent poll
            }
            // Schedule next poll
            pollTimeoutRef.current = setTimeout(poll, 3000);
        };
        poll();
    };

    const stopPolling = () => {
        if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
        }
    };

    // -- Actions --

    const fetchStoreInfo = async () => {
        try {
            const res = await apiClient.get(`/public/store-extensions/${slug}`);
            setStoreInfo(res.data);
            if (res.data.profile) {
                reset(res.data.profile);
            }
            if (res.data.profile_completed) {
                setStep(2);
            }
        } catch (err: any) {
            showNotification(`Lỗi tải thông tin: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const onSubmitProfile = async (data: ProfileForm) => {
        try {
            await apiClient.put(`/public/store-extensions/${slug}/profile`, data);
            showNotification('Thông tin đã được lưu', 'success');
            setStep(2);
        } catch (err: any) {
            showNotification(err.response?.data?.message || 'Lỗi cập nhật', 'error');
        }
    };

    const fetchPaymentInfo = async () => {
        setPaymentInfo(null); // Reset to show loading state if needed
        try {
            const res = await apiClient.get(`/public/store-extensions/${slug}/payment-info`, {
                params: { months: selectedMonths }
            });
            setPaymentInfo(res.data);
        } catch (err: any) {
             showNotification('Lỗi tạo mã thanh toán', 'error');
        }
    };

    const handleManualCheck = async () => {
        setCheckingPayment(true);
        try {
            const res = await apiClient.get(`/public/store-extensions/${slug}`);
            if (!res.data.is_expired) {
                showNotification('Thanh toán thành công!', 'success');
                 await useAuthStore.getState().checkSession(true);
                 window.location.href = `/s/${slug}/staff`;
            } else {
                showNotification('Chưa nhận được thanh toán. Vui lòng thử lại sau.', 'error');
            }
        } finally {
            setCheckingPayment(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showNotification('Đã sao chép vào bộ nhớ tạm');
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Đang tải dữ liệu...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-gray-200 font-sans selection:bg-blue-500/30">
            {/* Header / Brand */}
            <AdminNavigation 
                userName={user?.name} 
                userRoles={user?.roles} 
                storeName={storeInfo?.name || user?.store?.name} 
                onLogout={logout} 
            />

            <div className="max-w-5xl mx-auto px-6 py-10">
                <StepIndicator currentStep={step} />

                {/* Step 1: Profile Form */}
                {step === 1 && (
                    <div className="max-w-3xl mx-auto animate-fade-in-up">
                        <div className="bg-[#1e293b] rounded-2xl p-8 border border-gray-700 shadow-2xl">
                             <div className="flex items-center gap-3 mb-6 border-b border-gray-700 pb-4">
                                <span className="material-symbols-outlined text-blue-500">badge</span>
                                <h2 className="text-xl font-bold text-white">Xác nhận thông tin chủ cửa hàng</h2>
                            </div>

                            <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Họ tên / Chủ sở hữu</label>
                                        <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed">
                                            {storeInfo?.owner?.name || user?.name || '---'}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Ngày sinh <span className="text-red-500">*</span></label>
                                        <input 
                                            {...register('birthday')} 
                                            type="date" 
                                            className="w-full bg-gray-800 border border-gray-600 focus:border-blue-500 rounded-lg p-3 text-white outline-none transition-all" 
                                        />
                                        {errors.birthday && <p className="text-red-400 text-xs">{errors.birthday.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Số CCCD / Passport <span className="text-red-500">*</span></label>
                                        <input 
                                            {...register('cccd')} 
                                            className="w-full bg-gray-800 border border-gray-600 focus:border-blue-500 rounded-lg p-3 text-white outline-none transition-all" 
                                            placeholder="Nhập số CCCD..." 
                                        />
                                        {errors.cccd && <p className="text-red-400 text-xs">{errors.cccd.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">SĐT Liên hệ <span className="text-red-500">*</span></label>
                                        <input 
                                            {...register('phone_contact')} 
                                            className="w-full bg-gray-800 border border-gray-600 focus:border-blue-500 rounded-lg p-3 text-white outline-none transition-all" 
                                            placeholder="09xxx..." 
                                        />
                                        {errors.phone_contact && <p className="text-red-400 text-xs">{errors.phone_contact.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Email Liên hệ <span className="text-red-500">*</span></label>
                                        <input 
                                            {...register('email_contact')} 
                                            readOnly
                                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-gray-400 cursor-not-allowed outline-none" 
                                        />
                                        {errors.email_contact && <p className="text-red-400 text-xs">{errors.email_contact.message}</p>}
                                    </div>

                                    {/* Address Selector spans 2 cols on mobile if needed, but keeping grid consistency */}
                                    <div className="md:col-span-2 space-y-4 pt-2">
                                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Địa chỉ</h3>
                                        <AddressSelector
                                            countryValue={countryValue}
                                            provinceValue={provinceValue}
                                            wardValue={wardValue}
                                            onProvinceChange={(val) => { setValue('province', val); trigger('province'); }}
                                            onWardChange={(val) => { setValue('ward', val); trigger('ward'); }}
                                            errors={errors}
                                        />
                                         {/* Hidden Inputs for Form Submission */}
                                         <input type="hidden" {...register('country')} value="Việt Nam" />
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Địa chỉ cụ thể <span className="text-red-500">*</span></label>
                                        <input 
                                            {...register('address_detail')} 
                                            className="w-full bg-gray-800 border border-gray-600 focus:border-blue-500 rounded-lg p-3 text-white outline-none transition-all" 
                                            placeholder="Số nhà, tên đường, khu vực..." 
                                        />
                                        {errors.address_detail && <p className="text-red-400 text-xs">{errors.address_detail.message}</p>}
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSubmitting ? 'Đang lưu...' : 'Tiếp tục: Thanh toán'}
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Step 2: Payment */}
                {step === 2 && (
                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                        {/* Left Column: Plan Selection */}
                         <div className="lg:col-span-7 space-y-6">
                            <div className="bg-[#1e293b] rounded-2xl p-6 border border-gray-700">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-yellow-500">Workspace_premium</span>
                                    Chọn gói dịch vụ
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <PlanCard month={1} price={100000} selected={selectedMonths === 1} onSelect={() => setSelectedMonths(1)} />
                                    <PlanCard month={3} price={300000} selected={selectedMonths === 3} onSelect={() => setSelectedMonths(3)} />
                                    <PlanCard month={6} price={600000} selected={selectedMonths === 6} onSelect={() => setSelectedMonths(6)} />
                                    <PlanCard month={12} price={1200000} selected={selectedMonths === 12} onSelect={() => setSelectedMonths(12)} />
                                </div>
                            </div>
                            
                            <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-800/50 flex gap-4">
                                <span className="material-symbols-outlined text-blue-400 text-3xl">info</span>
                                <div>
                                    <h4 className="font-bold text-blue-100">Lưu ý quan trọng</h4>
                                    <p className="text-sm text-blue-200/80 mt-1">
                                        Hệ thống sẽ tự động kích hoạt ngay sau khi nhận được chuyển khoản. 
                                        Nếu gặp sự cố, vui lòng liên hệ hotline hỗ trợ.
                                    </p>
                                </div>
                            </div>

                            <button onClick={() => setStep(1)} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm px-2">
                                <span className="material-symbols-outlined text-base">arrow_back</span>
                                Quay lại chỉnh sửa thông tin
                            </button>
                         </div>

                        {/* Right Column: Payment Details */}
                        <div className="lg:col-span-5">
                            <div className="bg-[#1e293b] rounded-2xl p-6 border border-gray-700 sticky top-24 shadow-2xl">
                                <h3 className="text-lg font-bold text-white mb-6 text-center">Thông tin thanh toán</h3>
                                
                                {!paymentInfo ? (
                                    <div className="py-12 flex flex-col items-center">
                                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                                         <p className="text-gray-400">Đang tạo mã QR...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-teal-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                            <div className="relative bg-white p-4 rounded-lg shadow-xl mb-6">
                                                {/* Use QRCodeSVG for sharper generation if image fails, but backend sends URL. Let's use image from backend if available for brand consistency (SePay often includes logic in image), else SVG fallback? Backend sends `qr_url`. */}
                                                <img src={paymentInfo.qr_url} alt="QR Code" className="w-48 h-48 object-contain" />
                                            </div>
                                        </div>

                                        <div className="w-full bg-gray-800/50 rounded-xl border border-gray-700 divide-y divide-gray-700 text-sm">
                                            <div className="p-3 flex justify-between items-center">
                                                <span className="text-gray-400">Ngân hàng</span>
                                                <span className="font-bold text-white">{paymentInfo.bank_name}</span>
                                            </div>
                                            <div className="p-3 flex justify-between items-center group cursor-pointer hover:bg-gray-700/50 transition" onClick={() => copyToClipboard(paymentInfo.bank_account)}>
                                                <span className="text-gray-400">Số tài khoản</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white tracking-wider">{paymentInfo.bank_account}</span>
                                                    <span className="material-symbols-outlined text-gray-500 text-[14px] group-hover:text-white">content_copy</span>
                                                </div>
                                            </div>
                                            <div className="p-3 flex justify-between items-center">
                                                <span className="text-gray-400">Chủ tài khoản</span>
                                                <span className="font-bold text-white uppercase">{paymentInfo.bank_owner}</span>
                                            </div>
                                            <div className="p-3 flex justify-between items-center group cursor-pointer hover:bg-gray-700/50 transition" onClick={() => copyToClipboard(paymentInfo.amount.toString())}>
                                                <span className="text-gray-400">Số tiền</span>
                                                 <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#4ade80] text-base">{paymentInfo.amount.toLocaleString()}đ</span>
                                                    <span className="material-symbols-outlined text-gray-500 text-[14px] group-hover:text-white">content_copy</span>
                                                 </div>
                                            </div>
                                            <div className="p-3 flex flex-col gap-1 bg-blue-900/10 cursor-pointer hover:bg-blue-900/20 transition" onClick={() => copyToClipboard(paymentInfo.content)}>
                                                <div className="flex justify-between">
                                                    <span className="text-blue-400 font-medium">Nội dung chuyển khoản</span>
                                                    <span className="material-symbols-outlined text-blue-400 text-[14px]">content_copy</span>
                                                </div>
                                                <div className="font-mono font-bold text-yellow-400 text-lg text-center tracking-widest bg-gray-900/50 rounded py-1 border border-dashed border-gray-600">
                                                    {paymentInfo.content}
                                                </div>
                                                <p className="text-[10px] text-gray-500 text-center italic mt-1">*Copy chính xác nội dung này</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 w-full">
                                            <div className="flex items-center justify-center gap-2 text-sm text-[#4ade80] bg-[#4ade80]/10 py-2 rounded-lg mb-4 animate-pulse">
                                                <span className="material-symbols-outlined text-lg">sync</span>
                                                Đang chờ xác nhận thanh toán...
                                            </div>
                                            
                                            <button 
                                                onClick={handleManualCheck}
                                                className="w-full py-2 text-sm text-gray-400 hover:text-white hover:underline transition-colors"
                                                disabled={checkingPayment}
                                            >
                                                {checkingPayment ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản xong'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                     </div>
                )}
            </div>
            
            {/* Simple Footer style */}
            <div className="text-center py-6 text-gray-600 text-xs">
                &copy; {new Date().getFullYear()} Billiards Management Platform. Secure Payment via SePay.
            </div>
        </div>
    );
};
