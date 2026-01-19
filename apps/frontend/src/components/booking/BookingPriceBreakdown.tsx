import { DollarSign, Loader } from 'lucide-react';

interface BookingPriceBreakdownProps {
  priceData: any;
  loading?: boolean;
}

export default function BookingPriceBreakdown({ priceData, loading }: BookingPriceBreakdownProps) {
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Đang tính giá...</span>
        </div>
      </div>
    );
  }

  if (!priceData) return null;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Chi tiết giá</h2>
      </div>

      <div className="space-y-3">
        {/* Breakdown Items */}
        {priceData.breakdown && priceData.breakdown.map((item: any, idx: number) => (
          <div key={idx} className="flex items-start justify-between text-sm">
            <span className="text-gray-700">{item.label}</span>
            <span className={`font-medium ${item.amount < 0 ? 'text-green-600' : 'text-gray-900'}`}>
              {item.amount < 0 ? '-' : ''}{formatPrice(Math.abs(item.amount))}
            </span>
          </div>
        ))}

        {/* Booking Hold Deposit */}
        {priceData.booking_hold_deposit > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <div className="flex items-start justify-between text-sm">
              <div>
                <p className="font-medium text-blue-900">Phí giữ chỗ</p>
                <p className="text-xs text-blue-700 mt-1">Sẽ trừ vào tổng tiền khi thanh toán</p>
              </div>
              <span className="font-medium text-blue-900">
                {formatPrice(priceData.booking_hold_deposit)}
              </span>
            </div>
          </div>
        )}

        {/* Total */}
        <div className="pt-4 border-t-2 border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
            <span className="text-2xl font-bold text-blue-600">
              {formatPrice(priceData.total)}
            </span>
          </div>
        </div>

        {/* Summary Info */}
        <div className="bg-gray-50 rounded-lg p-3 mt-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {priceData.nights > 0 && (
              <div>
                <p className="text-gray-600">Số đêm</p>
                <p className="font-medium text-gray-900">{priceData.nights} đêm</p>
              </div>
            )}
            {priceData.hours && (
              <div>
                <p className="text-gray-600">Số giờ</p>
                <p className="font-medium text-gray-900">{priceData.hours} giờ</p>
              </div>
            )}
            <div>
              <p className="text-gray-600">Giá cơ bản</p>
              <p className="font-medium text-gray-900">{formatPrice(priceData.base_price)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
