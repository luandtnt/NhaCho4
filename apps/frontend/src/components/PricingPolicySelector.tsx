/**
 * Pricing Policy Selector
 * Component to select a pricing policy when creating/editing a rentable item
 */

import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface PricingPolicySelectorProps {
  propertyCategory: string;
  rentalDurationType: string;
  selectedPolicyId?: string;
  onSelect: (policy: any) => void;
  onOverride?: (override: boolean) => void;
}

export default function PricingPolicySelector({
  propertyCategory,
  rentalDurationType,
  selectedPolicyId,
  onSelect,
  onOverride,
}: PricingPolicySelectorProps) {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [allowOverride, setAllowOverride] = useState(false);

  useEffect(() => {
    if (propertyCategory && rentalDurationType) {
      console.log('🔍 Loading policies for:', { propertyCategory, rentalDurationType });
      loadPolicies();
    }
  }, [propertyCategory, rentalDurationType]);

  // Auto-select policy if selectedPolicyId is provided (edit mode)
  useEffect(() => {
    if (selectedPolicyId && policies.length > 0) {
      const policy = policies.find(p => p.id === selectedPolicyId);
      if (policy) {
        console.log('🔄 Edit mode - auto-selecting existing policy:', policy.name);
        // Don't call onSelect here to avoid re-triggering form updates
        // Just let the UI show it as selected
      }
    }
  }, [selectedPolicyId, policies]);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/pricing-policies', {
        params: {
          property_category: propertyCategory,
          rental_duration_type: rentalDurationType,
          status: 'ACTIVE',
          page: 1,
          limit: 100,
        },
      });
      const loadedPolicies = response.data.data || [];
      console.log('✅ Loaded policies:', loadedPolicies.length, loadedPolicies);
      setPolicies(loadedPolicies);
    } catch (error) {
      console.error('Failed to load pricing policies:', error);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePolicySelect = (policy: any) => {
    console.log('👆 User clicked policy:', policy.id, policy.name);
    onSelect(policy);
  };

  const handleOverrideChange = (checked: boolean) => {
    setAllowOverride(checked);
    if (onOverride) {
      onOverride(checked);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  };

  const getPriceUnitLabel = (unit: string) => {
    const map: any = {
      NIGHT: 'đêm',
      DAY: 'ngày',
      WEEK: 'tuần',
      MONTH: 'tháng',
      YEAR: 'năm',
      HOUR: 'giờ',
    };
    return map[unit] || unit;
  };

  if (!propertyCategory || !rentalDurationType) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          ⚠️ Vui lòng chọn loại hình bất động sản trước khi chọn chính sách giá
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <p className="text-gray-600">Đang tải chính sách giá...</p>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm font-medium mb-2">
          ❌ Không tìm thấy chính sách giá phù hợp
        </p>
        <p className="text-red-700 text-sm">
          Loại hình: <strong>{propertyCategory}</strong> - <strong>{rentalDurationType}</strong>
        </p>
        <p className="text-red-600 text-xs mt-2">
          Vui lòng tạo chính sách giá cho loại hình này trước khi tạo rentable item.
        </p>
      </div>
    );
  }

  // Find selected policy object
  const selectedPolicy = policies.find(p => p.id === selectedPolicyId);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn chính sách giá <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedPolicyId || ''}
          onChange={(e) => {
            const policy = policies.find(p => p.id === e.target.value);
            if (policy) {
              handlePolicySelect(policy);
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">-- Chọn chính sách giá --</option>
          {policies.map((policy) => (
            <option key={policy.id} value={policy.id}>
              {policy.name} - {formatCurrency(policy.base_price)}/{getPriceUnitLabel(policy.price_unit)}
            </option>
          ))}
        </select>
      </div>

      {/* Show selected policy details */}
      {selectedPolicy && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            📋 Chi tiết chính sách: {selectedPolicy.name}
          </h4>
          {selectedPolicy.description && (
            <p className="text-sm text-blue-800 mb-3">{selectedPolicy.description}</p>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm text-blue-900">
            <div>
              <span className="text-blue-700">Giá cơ bản:</span>
              <span className="ml-2 font-semibold">
                {formatCurrency(selectedPolicy.base_price)}/{getPriceUnitLabel(selectedPolicy.price_unit)}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Thời gian thuê tối thiểu:</span>
              <span className="ml-2">{selectedPolicy.min_rent_duration} {getPriceUnitLabel(selectedPolicy.price_unit)}</span>
            </div>
            {selectedPolicy.deposit_amount > 0 && (
              <div>
                <span className="text-blue-700">Tiền cọc:</span>
                <span className="ml-2">{formatCurrency(selectedPolicy.deposit_amount)}</span>
              </div>
            )}
            {selectedPolicy.booking_hold_deposit > 0 && (
              <div>
                <span className="text-blue-700">Tiền cọc giữ chỗ:</span>
                <span className="ml-2">{formatCurrency(selectedPolicy.booking_hold_deposit)}</span>
              </div>
            )}
            {selectedPolicy.service_fee > 0 && (
              <div>
                <span className="text-blue-700">Phí dịch vụ:</span>
                <span className="ml-2">{formatCurrency(selectedPolicy.service_fee)}</span>
              </div>
            )}
            {selectedPolicy.building_management_fee > 0 && (
              <div>
                <span className="text-blue-700">Phí quản lý:</span>
                <span className="ml-2">{formatCurrency(selectedPolicy.building_management_fee)}</span>
              </div>
            )}
          </div>
          {selectedPolicy.scope_province && (
            <div className="mt-2 text-xs text-blue-700">
              📍 Phạm vi: {selectedPolicy.scope_province}
              {selectedPolicy.scope_district && ` - ${selectedPolicy.scope_district}`}
            </div>
          )}
        </div>
      )}

      {/* Override Option */}
      {selectedPolicyId && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={allowOverride}
              onChange={(e) => handleOverrideChange(e.target.checked)}
              className="mt-1 mr-3"
            />
            <div>
              <span className="font-medium text-gray-900">Cho phép ghi đè giá</span>
              <p className="text-sm text-gray-600 mt-1">
                Bật tùy chọn này nếu bạn muốn tùy chỉnh giá riêng cho tài sản này thay vì sử dụng giá từ chính sách.
              </p>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
