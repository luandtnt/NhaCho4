import { useState } from 'react';
import { apiClient } from '../api/client';
import { Calendar, DollarSign, Info } from 'lucide-react';

interface PriceCalculatorPreviewProps {
  rentableItem: any;
  pricingPolicy: any;
}

export default function PriceCalculatorPreview({ 
  rentableItem, 
  pricingPolicy 
}: PriceCalculatorPreviewProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [months, setMonths] = useState(1);
  const [years, setYears] = useState(1);
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const durationType = rentableItem.rental_duration_type || 'SHORT_TERM';

  const calculatePrice = async () => {
    if (!startDate) {
      setError('Vui lòng chọn ngày bắt đầu');
      return;
    }

    if (durationType === 'SHORT_TERM' && !endDate) {
      setError('Vui lòng chọn ngày kết thúc');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: any = {
        rentable_item_id: rentableItem.id,
        pricing_policy_id: pricingPolicy.id,
        start_date: startDate,
      };

      if (durationType === 'SHORT_TERM') {
        payload.end_date = endDate;
      } else if (durationType === 'MEDIUM_TERM') {
        payload.months = months;
      } else if (durationType === 'LONG_TERM') {
        payload.years = years;
      }

      const response = await apiClient.post('/pricing/calculate', payload);
      setPriceBreakdown(response.data.calculation);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tính giá');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-lg">Tính giá thuê</h3>
      </div>

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày bắt đầu *
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {durationType === 'SHORT_TERM' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày kết thúc *
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}

        {durationType === 'MEDIUM_TERM' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số tháng thuê *
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}

        {durationType === 'LONG_TERM' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số năm thuê *
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        )}

        <button
          onClick={calculatePrice}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Đang tính...' : 'Tính giá'}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      {priceBreakdown && (
        <div className="border-t pt-4 space-y-3">
          <h4 className="font-semibold text-gray-900">Chi tiết giá</h4>

          {/* Short-term breakdown */}
          {durationType === 'SHORT_TERM' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Số đêm:</span>
                <span className="font-medium">{priceBreakdown.nights} đêm</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Giá trung bình/đêm:</span>
                <span className="font-medium">
                  {formatCurrency(priceBreakdown.breakdown.per_night_avg)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tổng giá phòng:</span>
                <span className="font-medium">{formatCurrency(priceBreakdown.base_price)}</span>
              </div>
              {priceBreakdown.cleaning_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí dọn dẹp:</span>
                  <span className="font-medium">{formatCurrency(priceBreakdown.cleaning_fee)}</span>
                </div>
              )}
              {priceBreakdown.service_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí dịch vụ:</span>
                  <span className="font-medium">{formatCurrency(priceBreakdown.service_fee)}</span>
                </div>
              )}
              {priceBreakdown.breakdown.discount_applied > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá:</span>
                  <span className="font-medium">-{priceBreakdown.breakdown.discount_applied}%</span>
                </div>
              )}
            </>
          )}

          {/* Medium-term breakdown */}
          {durationType === 'MEDIUM_TERM' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Số tháng:</span>
                <span className="font-medium">{priceBreakdown.total_months} tháng</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Giá/tháng:</span>
                <span className="font-medium">{formatCurrency(priceBreakdown.monthly_price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tổng tiền thuê:</span>
                <span className="font-medium">{formatCurrency(priceBreakdown.total_price)}</span>
              </div>
              {priceBreakdown.deposit_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tiền cọc:</span>
                  <span className="font-medium">{formatCurrency(priceBreakdown.deposit_amount)}</span>
                </div>
              )}
              {priceBreakdown.breakdown.discount_applied > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá:</span>
                  <span className="font-medium">-{priceBreakdown.breakdown.discount_applied}%</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold text-blue-600 pt-2 border-t">
                <span>Thanh toán lần đầu:</span>
                <span>{formatCurrency(priceBreakdown.first_payment)}</span>
              </div>
            </>
          )}

          {/* Long-term breakdown */}
          {durationType === 'LONG_TERM' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Số năm:</span>
                <span className="font-medium">{priceBreakdown.total_years} năm</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Giá/tháng (năm 1):</span>
                <span className="font-medium">{formatCurrency(priceBreakdown.base_monthly_price)}</span>
              </div>
              {priceBreakdown.breakdown.annual_increase_percent > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tăng hàng năm:</span>
                  <span className="font-medium">{priceBreakdown.breakdown.annual_increase_percent}%</span>
                </div>
              )}
              {priceBreakdown.yearly_prices && priceBreakdown.yearly_prices.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-600 font-medium">Chi tiết theo năm:</p>
                  {priceBreakdown.yearly_prices.map((price: number, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-gray-600">Năm {idx + 1}:</span>
                      <span>{formatCurrency(price)}</span>
                    </div>
                  ))}
                </div>
              )}
              {priceBreakdown.deposit_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tiền cọc:</span>
                  <span className="font-medium">{formatCurrency(priceBreakdown.deposit_amount)}</span>
                </div>
              )}
            </>
          )}

          {/* Total */}
          <div className="flex justify-between text-lg font-bold text-blue-600 pt-3 border-t-2">
            <span>Tổng cộng:</span>
            <span>{formatCurrency(priceBreakdown.total_price)}</span>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Giá trên là ước tính. Giá chính thức sẽ được xác nhận khi tạo booking.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
