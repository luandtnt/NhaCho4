/**
 * Create Pricing Policy Form
 * Dynamic form with fields based on property type and rental duration
 */

import { useState, useEffect } from 'react';
import PropertyCategorySelector from './PropertyCategorySelector';

interface CreatePricingPolicyFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function CreatePricingPolicyForm({
  initialData,
  onSubmit,
  onCancel,
}: CreatePricingPolicyFormProps) {
  const [step, setStep] = useState(initialData ? 2 : 1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    property_category: '',
    rental_duration_type: '',
    scope_province: '',
    scope_district: '',
    pricing_mode: 'FIXED',
    base_price: 0,
    price_unit: 'MONTH',
    min_rent_duration: 1,
    deposit_amount: 0,
    booking_hold_deposit: 0,
    service_fee: 0,
    building_management_fee: 0,
    electricity_billing: '',
    water_billing: '',
    pricing_details: {},
    tiered_pricing: null,
  });

  useEffect(() => {
    if (initialData) {
      // Only extract editable fields from initialData
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        property_category: initialData.property_category || '',
        rental_duration_type: initialData.rental_duration_type || '',
        scope_province: initialData.scope_province || '',
        scope_district: initialData.scope_district || '',
        pricing_mode: initialData.pricing_mode || 'FIXED',
        base_price: initialData.base_price || 0,
        price_unit: initialData.price_unit || 'MONTH',
        min_rent_duration: initialData.min_rent_duration || 1,
        deposit_amount: initialData.deposit_amount || 0,
        booking_hold_deposit: initialData.booking_hold_deposit || 0,
        service_fee: initialData.service_fee || 0,
        building_management_fee: initialData.building_management_fee || 0,
        electricity_billing: initialData.electricity_billing || '',
        water_billing: initialData.water_billing || '',
        pricing_details: initialData.pricing_details || {},
        tiered_pricing: initialData.tiered_pricing || null,
      });
    }
  }, [initialData]);

  const handleCategorySelect = (category: any) => {
    if (category) {
      const priceUnit = category.duration_type === 'SHORT_TERM' ? 'NIGHT' : 'MONTH';
      
      setFormData({
        ...formData,
        property_category: category.code,
        rental_duration_type: category.duration_type,
        price_unit: priceUnit,
      });
      setStep(2);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên chính sách');
      return;
    }

    if (!formData.property_category) {
      alert('Vui lòng chọn loại hình bất động sản');
      return;
    }

    if (formData.base_price <= 0) {
      alert('Vui lòng nhập giá cơ bản hợp lệ');
      return;
    }

    // Ensure all numeric fields are numbers, not strings
    const cleanedData = {
      ...formData,
      base_price: Number(formData.base_price) || 0,
      min_rent_duration: Number(formData.min_rent_duration) || 1,
      deposit_amount: Number(formData.deposit_amount) || 0,
      booking_hold_deposit: Number(formData.booking_hold_deposit) || 0,
      service_fee: Number(formData.service_fee) || 0,
      building_management_fee: Number(formData.building_management_fee) || 0,
    };

    onSubmit(cleanedData);
  };

  const isShortTerm = formData.rental_duration_type === 'SHORT_TERM';
  const isMidTerm = formData.rental_duration_type === 'MEDIUM_TERM';
  const isLongTerm = formData.rental_duration_type === 'LONG_TERM';

  if (step === 1) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Chọn loại hình bất động sản
        </h2>
        <PropertyCategorySelector
          selectedCategory={formData.property_category}
          onSelect={handleCategorySelect}
        />
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Hủy
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between sticky top-0 bg-white pb-4 border-b">
        <h2 className="text-2xl font-bold text-gray-900">
          {initialData ? 'Chỉnh sửa' : 'Tạo'} chính sách giá
        </h2>
        {!initialData && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Đổi loại hình
          </button>
        )}
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">📋 Thông tin cơ bản</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên chính sách <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="VD: Giá thuê căn hộ 2PN - Quận 1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
            placeholder="Mô tả chi tiết về chính sách giá này..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại hình
            </label>
            <input
              type="text"
              value={formData.property_category}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thời hạn thuê
            </label>
            <input
              type="text"
              value={formData.rental_duration_type}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Scope */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">📍 Phạm vi áp dụng</h3>
        <p className="text-sm text-gray-600">
          Để trống nếu áp dụng cho toàn quốc
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tỉnh/Thành phố
            </label>
            <input
              type="text"
              value={formData.scope_province}
              onChange={(e) => handleFieldChange('scope_province', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="VD: Hồ Chí Minh"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quận/Huyện
            </label>
            <input
              type="text"
              value={formData.scope_district}
              onChange={(e) => handleFieldChange('scope_district', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="VD: Quận 1"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">💰 Thông tin giá</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá cơ bản <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.base_price}
              onChange={(e) => handleFieldChange('base_price', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đơn vị
            </label>
            <select
              value={formData.price_unit}
              onChange={(e) => handleFieldChange('price_unit', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {isShortTerm && (
                <>
                  <option value="NIGHT">Đêm</option>
                  <option value="HOUR">Giờ</option>
                  <option value="DAY">Ngày</option>
                </>
              )}
              {(isMidTerm || isLongTerm) && (
                <>
                  <option value="MONTH">Tháng</option>
                  <option value="YEAR">Năm</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thời gian thuê tối thiểu
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={formData.min_rent_duration}
              onChange={(e) => handleFieldChange('min_rent_duration', parseInt(e.target.value))}
              className="w-32 px-3 py-2 border rounded-lg"
            />
            <span className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
              {formData.price_unit === 'NIGHT' ? 'đêm' : 
               formData.price_unit === 'HOUR' ? 'giờ' :
               formData.price_unit === 'DAY' ? 'ngày' :
               formData.price_unit === 'MONTH' ? 'tháng' : 'năm'}
            </span>
          </div>
        </div>
      </div>

      {/* Deposits & Fees */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">💵 Cọc & Phí</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {(isMidTerm || isLongTerm) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiền cọc
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.deposit_amount}
                onChange={(e) => handleFieldChange('deposit_amount', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Thường bằng 1-2 tháng tiền thuê</p>
            </div>
          )}

          {isShortTerm && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phí giữ chỗ
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.booking_hold_deposit}
                onChange={(e) => handleFieldChange('booking_hold_deposit', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Phí đặt trước để giữ phòng</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phí dịch vụ
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.service_fee}
              onChange={(e) => handleFieldChange('service_fee', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {(isMidTerm || isLongTerm) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phí quản lý tòa nhà
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.building_management_fee}
                onChange={(e) => handleFieldChange('building_management_fee', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Utilities (MID/LONG only) */}
      {(isMidTerm || isLongTerm) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">⚡ Tiện ích</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cách tính tiền điện
              </label>
              <select
                value={formData.electricity_billing}
                onChange={(e) => handleFieldChange('electricity_billing', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Chọn cách tính</option>
                <option value="METERED">Theo đồng hồ</option>
                <option value="FIXED">Cố định hàng tháng</option>
                <option value="INCLUDED">Đã bao gồm trong giá thuê</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cách tính tiền nước
              </label>
              <select
                value={formData.water_billing}
                onChange={(e) => handleFieldChange('water_billing', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Chọn cách tính</option>
                <option value="METERED">Theo đồng hồ</option>
                <option value="FIXED">Cố định hàng tháng</option>
                <option value="INCLUDED">Đã bao gồm trong giá thuê</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Lưu ý về Chính sách giá</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Chính sách mới được tạo ở trạng thái ACTIVE</li>
          <li>• Chỉ có thể chọn chính sách ACTIVE khi tạo rentable item</li>
          <li>• Có thể tạo nhiều chính sách cho cùng loại hình (phân biệt theo khu vực)</li>
          <li>• Rentable item có thể ghi đè giá nếu cần tùy chỉnh riêng</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t sticky bottom-0 bg-white">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {initialData ? 'Cập nhật' : 'Tạo chính sách'}
        </button>
      </div>
    </form>
  );
}
