/**
 * Pricing Fields Component
 * Pricing and contract fields with dynamic rules based on lease group
 */

import React from 'react';

interface PricingFieldsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  leaseGroup: 'SHORT' | 'MID' | 'LONG';
}

export default function PricingFields({ formData, onChange, leaseGroup }: PricingFieldsProps) {
  const priceUnitOptions = leaseGroup === 'SHORT' 
    ? [{ value: 'HOUR', label: 'Giờ' }, { value: 'NIGHT', label: 'Đêm' }]
    : [{ value: 'MONTH', label: 'Tháng' }];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">💰 Giá & Điều kiện thuê</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá cơ bản <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={formData.base_price || ''}
            onChange={(e) => onChange('base_price', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="5000000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Đơn vị giá <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.price_unit || ''}
            onChange={(e) => onChange('price_unit', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="">Chọn đơn vị</option>
            {priceUnitOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thời gian thuê tối thiểu <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.min_rent_duration || ''}
            onChange={(e) => onChange('min_rent_duration', parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="1"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {leaseGroup === 'SHORT' ? 'Số giờ/đêm' : 'Số tháng'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tiền tệ
          </label>
          <select
            value={formData.currency || 'VND'}
            onChange={(e) => onChange('currency', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="VND">VND</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {leaseGroup === 'SHORT' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tiền cọc giữ chỗ
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={formData.booking_hold_deposit || ''}
            onChange={(e) => onChange('booking_hold_deposit', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="1000000"
          />
          <p className="text-xs text-gray-500 mt-1">
            Thường bằng 20-30% giá thuê
          </p>
        </div>
      )}

      {(leaseGroup === 'MID' || leaseGroup === 'LONG') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tiền đặt cọc <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={formData.deposit_amount || ''}
            onChange={(e) => onChange('deposit_amount', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="10000000"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Thường bằng 1-2 tháng tiền thuê
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phí dịch vụ
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={formData.service_fee || ''}
            onChange={(e) => onChange('service_fee', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="500000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phí quản lý tòa nhà
          </label>
          <input
            type="number"
            min="0"
            step="1000"
            value={formData.building_mgmt_fee || ''}
            onChange={(e) => onChange('building_mgmt_fee', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="300000"
          />
        </div>
      </div>

      {(leaseGroup === 'MID' || leaseGroup === 'LONG') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cách tính tiền điện <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.electricity_billing || ''}
              onChange={(e) => onChange('electricity_billing', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Chọn cách tính</option>
              <option value="METER_PRIVATE">Đồng hồ riêng</option>
              <option value="SHARED">Chia theo người</option>
              <option value="OWNER_RATE">Giá chủ nhà</option>
              <option value="STATE_RATE">Giá nhà nước</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cách tính tiền nước <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.water_billing || ''}
              onChange={(e) => onChange('water_billing', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Chọn cách tính</option>
              <option value="METER_PRIVATE">Đồng hồ riêng</option>
              <option value="SHARED">Chia theo người</option>
              <option value="OWNER_RATE">Giá chủ nhà</option>
              <option value="STATE_RATE">Giá nhà nước</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
