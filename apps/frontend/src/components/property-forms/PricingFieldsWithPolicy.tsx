/**
 * Pricing Fields With Policy Component
 * Integrates PricingPolicySelector with manual override option
 */

import { useState, useEffect } from 'react';
import PricingPolicySelector from '../PricingPolicySelector';

interface PricingFieldsWithPolicyProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  leaseGroup: 'SHORT' | 'MID' | 'LONG';
}

export default function PricingFieldsWithPolicy({ 
  formData, 
  onChange, 
  leaseGroup 
}: PricingFieldsWithPolicyProps) {
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [allowOverride, setAllowOverride] = useState(false);

  // Initialize with existing pricing_policy_id if in edit mode
  useEffect(() => {
    if (formData.pricing_policy_id && !selectedPolicy) {
      console.log('🔄 Edit mode - existing pricing_policy_id:', formData.pricing_policy_id);
      // The PricingPolicySelector will handle loading and displaying the policy
    }
  }, [formData.pricing_policy_id]);

  const handlePolicySelect = (policy: any) => {
    console.log('🎯 Policy selected:', policy);
    setSelectedPolicy(policy);
    
    // Auto-fill pricing fields from policy
    onChange('pricing_policy_id', policy.id);
    onChange('pricing_policy_version', policy.version);
    onChange('pricing_snapshot_at', new Date().toISOString());
    onChange('base_price', policy.base_price);
    onChange('price_unit', policy.price_unit);
    onChange('min_rent_duration', policy.min_rent_duration);
    onChange('deposit_amount', policy.deposit_amount || 0);
    onChange('booking_hold_deposit', policy.booking_hold_deposit || 0);
    onChange('service_fee', policy.service_fee || 0);
    onChange('building_mgmt_fee', policy.building_management_fee || 0);
    onChange('electricity_billing', policy.electricity_billing || '');
    onChange('water_billing', policy.water_billing || '');
    
    // Reset override when selecting new policy
    setAllowOverride(false);
  };

  const handleOverrideChange = (override: boolean) => {
    setAllowOverride(override);
    if (!override) {
      // Reset to policy values
      if (selectedPolicy) {
        onChange('base_price', selectedPolicy.base_price);
        onChange('deposit_amount', selectedPolicy.deposit_amount || 0);
        onChange('booking_hold_deposit', selectedPolicy.booking_hold_deposit || 0);
        onChange('service_fee', selectedPolicy.service_fee || 0);
        onChange('building_mgmt_fee', selectedPolicy.building_management_fee || 0);
      }
      onChange('pricing_override', null);
    }
  };

  const handleOverrideFieldChange = (field: string, value: any) => {
    onChange(field, value);
    
    // Track overridden fields
    const currentOverride = formData.pricing_override || {};
    onChange('pricing_override', {
      ...currentOverride,
      [field]: value,
    });
  };

  const priceUnitOptions = leaseGroup === 'SHORT' 
    ? [{ value: 'HOUR', label: 'Giờ' }, { value: 'NIGHT', label: 'Đêm' }]
    : [{ value: 'MONTH', label: 'Tháng' }];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">💰 Chính sách Giá</h3>
        
        {/* Policy Selector */}
        <PricingPolicySelector
          propertyCategory={formData.property_category}
          rentalDurationType={formData.rental_duration_type}
          selectedPolicyId={formData.pricing_policy_id}
          onSelect={handlePolicySelect}
          onOverride={handleOverrideChange}
        />
      </div>

      {/* Manual Override Fields */}
      {allowOverride && selectedPolicy && (
        <div className="space-y-4 border-t pt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">
              ⚠️ Ghi đè giá riêng cho item này
            </h4>
            <p className="text-sm text-yellow-800">
              Các thay đổi bên dưới sẽ chỉ áp dụng cho item này, không ảnh hưởng đến chính sách gốc.
            </p>
          </div>

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
                onChange={(e) => handleOverrideFieldChange('base_price', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-yellow-400 rounded-lg bg-yellow-50"
                placeholder="5000000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đơn vị giá
              </label>
              <select
                value={formData.price_unit || ''}
                onChange={(e) => handleOverrideFieldChange('price_unit', e.target.value)}
                className="w-full px-3 py-2 border border-yellow-400 rounded-lg bg-yellow-50"
                disabled
              >
                {priceUnitOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian thuê tối thiểu
              </label>
              <input
                type="number"
                min="1"
                value={formData.min_rent_duration || ''}
                onChange={(e) => handleOverrideFieldChange('min_rent_duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-yellow-400 rounded-lg bg-yellow-50"
                placeholder="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiền tệ
              </label>
              <select
                value={formData.currency || 'VND'}
                onChange={(e) => onChange('currency', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                disabled
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
                onChange={(e) => handleOverrideFieldChange('booking_hold_deposit', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-yellow-400 rounded-lg bg-yellow-50"
                placeholder="1000000"
              />
            </div>
          )}

          {(leaseGroup === 'MID' || leaseGroup === 'LONG') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiền đặt cọc
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.deposit_amount || ''}
                onChange={(e) => handleOverrideFieldChange('deposit_amount', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-yellow-400 rounded-lg bg-yellow-50"
                placeholder="10000000"
              />
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
                onChange={(e) => handleOverrideFieldChange('service_fee', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-yellow-400 rounded-lg bg-yellow-50"
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
                onChange={(e) => handleOverrideFieldChange('building_mgmt_fee', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-yellow-400 rounded-lg bg-yellow-50"
                placeholder="300000"
              />
            </div>
          </div>
        </div>
      )}

      {/* Show read-only pricing info when policy selected but not overriding */}
      {selectedPolicy && !allowOverride && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">
            ✅ Sử dụng chính sách: {selectedPolicy.name}
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm text-green-800">
            <div>
              <span className="font-medium">Giá:</span> {selectedPolicy.base_price?.toLocaleString('vi-VN')} VNĐ/{selectedPolicy.price_unit}
            </div>
            <div>
              <span className="font-medium">Thuê tối thiểu:</span> {selectedPolicy.min_rent_duration} {selectedPolicy.price_unit}
            </div>
            {selectedPolicy.deposit_amount > 0 && (
              <div>
                <span className="font-medium">Tiền cọc:</span> {selectedPolicy.deposit_amount?.toLocaleString('vi-VN')} VNĐ
              </div>
            )}
            {selectedPolicy.service_fee > 0 && (
              <div>
                <span className="font-medium">Phí dịch vụ:</span> {selectedPolicy.service_fee?.toLocaleString('vi-VN')} VNĐ
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
