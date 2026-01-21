import { QRCodeCanvas } from 'qrcode.react';
import type { Table } from '../../../types';
import { getCurrentPriceRate } from '../../../utils/pricing';

interface Props {
  table: Table;
  onDownloadQr: () => void;
  qrCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function TableInfo({ table, onDownloadQr, qrCanvasRef }: Props) {
  const activePriceRate = table.table_type.current_price_rate || getCurrentPriceRate(table.table_type.price_rates);

  return (
    <>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-sm text-gray-500">Loại bàn</p>
          <p className="text-lg font-semibold">{table.table_type.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Số ghế</p>
          <p className="text-lg font-semibold">{table.seats}</p>
        </div>
        {table.location && (
          <div>
            <p className="text-sm text-gray-500">Vị trí</p>
            <p className="text-lg font-semibold">{table.location}</p>
          </div>
        )}
        {activePriceRate && (
          <div>
            <p className="text-sm text-gray-500">Giá mỗi giờ</p>
            <p className="text-lg font-semibold">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activePriceRate.price_per_hour)}
            </p>
          </div>
        )}
      </div>

      {table.qr_code && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-3">Mã QR của bàn:</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="bg-white border rounded-lg p-4 w-fit">
              <QRCodeCanvas
                ref={qrCanvasRef}
                value={table.qr_code}
                size={160}
                includeMargin
                level="H"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 break-all mb-3">{table.qr_code}</p>
              <button
                onClick={onDownloadQr}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Tải mã QR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
