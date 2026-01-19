import { DollarSign, Zap, Droplet, Wifi, Building2, TrendingUp } from 'lucide-react';

interface PricingSectionProps {
  base_price: number;
  price_unit: string;
  deposit_amount?: number;
  booking_hold_deposit?: number;
  service_fee?: number;
  building_management_fee?: number;
  electricity_billing?: string;
  water_billing?: string;
  internet_fee?: number;
  extra_guest_fee?: number;
  weekend_surcharge?: number;
  cleaning_fee?: number;
  yearly_increase_percent?: number;
  rental_duration_type?: string;
}

export default function PricingSection(props: PricingSectionProps) {
  const isShortTerm = props.rental_duration_type === 'SHORT_TERM';
  const isMidTerm = props.rental_duration_type === 'MEDIUM_TERM';
  const isLongTerm = props.rental_duration_type === 'LONG_TERM';

  const getPriceUnitLabel = () => {
    switch (props.price_unit) {
      case 'HOUR': return 'giờ';
      case 'NIGHT': return 'đêm';
      case 'MONTH': return 'tháng';
      default: return props.price_unit;
    }
  };

  const getBillingLabel = (billing: string) => {
    const labels: Record<string, string> = {
      METER_PRIVATE: 'Đồng hồ riêng',
      SHARED: 'Chia theo người',
      OWNER_RATE: 'Giá chủ nhà',
      STATE_RATE: 'Giá nhà nước'
    };
    return labels[billing] || billing;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">💰 Giá & Chi phí</h3>

      {/* Main Price */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-6 mb-6">
        <div className="text-sm opacity-90 mb-2">Giá thuê</div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{props.base_price.toLocaleString('vi-VN')}</span>
          <span className="text-xl">đ/{getPriceUnitLabel()}</span>
        </div>
      </div>

      {/* Additional Fees */}
      <div className="space-y-3">
        {/* Deposit */}
        {props.deposit_amount && (isMidTerm || isLongTerm) && (
          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-gray-900">Tiền cọc</span>
            </div>
            <span className="text-lg font-bold text-amber-600">
              {props.deposit_amount.toLocaleString('vi-VN')}đ
            </span>
          </div>
        )}

        {/* Booking Hold Deposit */}
        {props.booking_hold_deposit && isShortTerm && (
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Cọc giữ chỗ</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {props.booking_hold_deposit.toLocaleString('vi-VN')}đ
            </span>
          </div>
        )}

        {/* Service Fee */}
        {props.service_fee && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Phí dịch vụ</span>
            <span className="font-medium text-gray-900">
              {props.service_fee.toLocaleString('vi-VN')}đ/tháng
            </span>
          </div>
        )}

        {/* Building Management Fee */}
        {props.building_management_fee && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700">Phí quản lý tòa nhà</span>
            </div>
            <span className="font-medium text-gray-900">
              {props.building_management_fee.toLocaleString('vi-VN')}đ/tháng
            </span>
          </div>
        )}

        {/* Utilities */}
        {props.electricity_billing && (isMidTerm || isLongTerm) && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="text-gray-700">Tiền điện</span>
            </div>
            <span className="font-medium text-gray-900">
              {getBillingLabel(props.electricity_billing)}
            </span>
          </div>
        )}

        {props.water_billing && (isMidTerm || isLongTerm) && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-blue-600" />
              <span className="text-gray-700">Tiền nước</span>
            </div>
            <span className="font-medium text-gray-900">
              {getBillingLabel(props.water_billing)}
            </span>
          </div>
        )}

        {props.internet_fee && (
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-purple-600" />
              <span className="text-gray-700">Internet/Wifi</span>
            </div>
            <span className="font-medium text-gray-900">
              {props.internet_fee.toLocaleString('vi-VN')}đ/tháng
            </span>
          </div>
        )}

        {/* Short-term extras */}
        {props.extra_guest_fee && isShortTerm && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Phụ thu thêm người</span>
            <span className="font-medium text-gray-900">
              {props.extra_guest_fee.toLocaleString('vi-VN')}đ/người/đêm
            </span>
          </div>
        )}

        {props.weekend_surcharge && isShortTerm && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Phụ thu cuối tuần</span>
            <span className="font-medium text-gray-900">
              {props.weekend_surcharge.toLocaleString('vi-VN')}đ
            </span>
          </div>
        )}

        {props.cleaning_fee && isShortTerm && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Phí dọn dẹp</span>
            <span className="font-medium text-gray-900">
              {props.cleaning_fee.toLocaleString('vi-VN')}đ
            </span>
          </div>
        )}

        {/* Long-term extras */}
        {props.yearly_increase_percent && isLongTerm && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-600" />
              <span className="text-gray-700">Tăng giá hàng năm</span>
            </div>
            <span className="font-medium text-yellow-700">
              {props.yearly_increase_percent}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
