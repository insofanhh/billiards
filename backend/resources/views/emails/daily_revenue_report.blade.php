<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: DejaVu Sans, sans-serif; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        h2 { color: #333; }
        .total { font-weight: bold; text-align: right; }
    </style>
</head>
<body>
    <h1>Báo cáo doanh thu ngày {{ $date }} (00:00 - 12:59)</h1>

    <h2>1. Đơn hàng (Orders)</h2>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Bàn</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Giờ tạo</th>
            </tr>
        </thead>
        <tbody>
            @foreach($orders as $order)
            <tr>
                <td>{{ $order->id }}</td>
                <td>{{ $order->order_code }}</td>
                <td>{{ $order->user->name ?? 'N/A' }}</td>
                <td>{{ $order->table_id }}</td>
                <td>{{ number_format($order->total_paid) }} đ</td>
                <td>{{ $order->status }}</td>
                <td>{{ $order->created_at->format('H:i') }}</td>
            </tr>
            @endforeach
            @if($orders->isEmpty())
            <tr><td colspan="7">Không có đơn hàng nào.</td></tr>
            @endif
        </tbody>
        <tfoot>
            <tr>
                <td colspan="4" class="total">Tổng cộng:</td>
                <td colspan="3"><strong>{{ number_format($orders->sum('total_paid')) }} đ</strong></td>
            </tr>
        </tfoot>
    </table>

    <h2>2. Giao dịch (Transactions)</h2>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Giờ tạo</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transactions as $transaction)
            <tr>
                <td>{{ $transaction->id }}</td>
                <td>{{ $transaction->order->order_code ?? 'N/A' }}</td>
                <td>{{ $transaction->order->user->name ?? $transaction->customer_name ?? $transaction->user->name ?? 'N/A' }}</td>
                <td>{{ number_format($transaction->amount) }} đ</td>
                <td>{{ $transaction->method }}</td>
                <td>{{ $transaction->status }}</td>
                <td>{{ $transaction->created_at->format('H:i') }}</td>
            </tr>
            @endforeach
            @if($transactions->isEmpty())
            <tr><td colspan="7">Không có giao dịch nào.</td></tr>
            @endif
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3" class="total">Tổng cộng:</td>
                <td colspan="4"><strong>{{ number_format($transactions->sum('amount')) }} đ</strong></td>
            </tr>
        </tfoot>
    </table>

    <h2>3. Dịch vụ (Services)</h2>
    <table>
        <thead>
            <tr>
                <th>ID Dịch vụ</th>
                <th>Tên dịch vụ</th>
                <th>Số lượng bán</th>
                <th>Doanh thu</th>
                <th>Tồn kho hiện tại</th>
            </tr>
        </thead>
        <tbody>
            @foreach($services as $serviceId => $group)
                @php
                    $firstItem = $group->first();
                    $serviceName = $firstItem->service->name ?? 'Unknown';
                    $totalQty = $group->sum('qty');
                    $totalRevenue = $group->sum('total_price');
                    $currentStock = $firstItem->service->inventory->quantity ?? 0;
                @endphp
            <tr>
                <td>{{ $serviceId }}</td>
                <td>{{ $serviceName }}</td>
                <td>{{ $totalQty }}</td>
                <td>{{ number_format($totalRevenue) }} đ</td>
                <td>{{ $currentStock }}</td>
            </tr>
            @endforeach
            @if($services->isEmpty())
            <tr><td colspan="5">Không có dịch vụ nào được bán.</td></tr>
            @endif
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3" class="total">Tổng doanh thu dịch vụ:</td>
                <td colspan="2"><strong>{{ number_format($services->sum(fn($g) => $g->sum('total_price'))) }} đ</strong></td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
