import React from 'react';

interface BillTemplateProps {
    order: any;
    items: any[];
    total: number;
}

export const BillTemplate: React.FC<BillTemplateProps> = ({ order, items, total }) => {
    return (
        <div id="print-bill" className="hidden print:block font-mono text-black p-4 max-w-[80mm] mx-auto bg-white">
            {/* <div className="text-center mb-6">
                <h1 className="text-2xl font-bold uppercase mb-1">Billiards Manager</h1>
                <p className="text-sm">ĐC: 123 Đường ABC, Quận XYZ, TP.HCM</p>
                <p className="text-sm">SĐT: 0909 123 456</p>
            </div> */}

            <div className="text-center mb-6 border-b-2 border-dashed border-black pb-4">
                <h2 className="text-xl font-bold uppercase">HÓA ĐƠN THANH TOÁN</h2>
                <p className="text-sm mt-1">Mã đơn: {order.order_code}</p>
            </div>

            <div className="mb-4 text-sm">
                <div className="flex justify-between mb-1">
                    <span>Ngày:</span>
                    <span>{new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}</span>
                </div>
                <div className="flex justify-between mb-1">
                    <span>Bàn:</span>
                    <span className="font-bold">{order.table.name}</span>
                </div>
                <div className="flex justify-between mb-1">
                    <span>Thu ngân:</span>
                    <span>{order.cashier || 'Admin'}</span>
                </div>
                <div className="flex justify-between mb-1">
                    <span>Khách hàng:</span>
                    <span>{order.customer_name || order.customer?.name || 'Khách lẻ'}</span>
                </div>
            </div>

            <table className="w-full text-sm mb-6">
                <thead>
                    <tr className="border-b border-dashed border-black">
                        <th className="text-left py-2">Tên món</th>
                        <th className="text-center py-2 w-10">SL</th>
                        <th className="text-right py-2">Đ.Giá</th>
                        <th className="text-right py-2">T.Tiền</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Time Charge */}
                    {order.total_play_time_minutes > 0 && (
                        <tr className="border-b border-dashed border-gray-300">
                            <td className="py-2">Giờ chơi ({Math.floor(order.total_play_time_minutes / 60)}h {order.total_play_time_minutes % 60}p)</td>
                            <td className="text-center py-2">1</td>
                            <td className="text-right py-2">{new Intl.NumberFormat('vi-VN').format(order.total_before_discount - (items?.reduce((s: number, i: any) => s + Number(i.total_price), 0) || 0))}</td>
                            <td className="text-right py-2">{new Intl.NumberFormat('vi-VN').format(order.total_before_discount - (items?.reduce((s: number, i: any) => s + Number(i.total_price), 0) || 0))}</td>
                        </tr>
                    )}

                    {/* Service Items */}
                    {items.map((item, index) => (
                        <tr key={`${item.id}-${index}`} className="border-b border-dashed border-gray-300">
                            <td className="py-2">{item.service.name}</td>
                            <td className="text-center py-2">{item.qty}</td>
                            <td className="text-right py-2">{new Intl.NumberFormat('vi-VN').format(item.service.price)}</td>
                            <td className="text-right py-2">{new Intl.NumberFormat('vi-VN').format(item.total_price)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t-2 border-dashed border-black pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                    <span>TỔNG CỘNG:</span>
                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(total)}</span>
                </div>
                {order.total_discount > 0 && (
                    <div className="flex justify-between text-sm mt-2">
                        <span>Giảm giá:</span>
                        <span>-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_discount)}</span>
                    </div>
                )}
            </div>

            <div className="text-center text-sm">
                <p className="font-bold mb-2">Xin cảm ơn và hẹn gặp lại!</p>
            </div>
        </div>
    );
};
