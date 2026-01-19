import { useState, useEffect } from 'react';
import PropertyCategorySelector from './PropertyCategorySelector';
import AmenitiesSelector from './AmenitiesSelector';

interface EnhancedRentableItemFormProps {
  initialData?: any;
  spaceNodes: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function EnhancedRentableItemForm({
  initialData,
  spaceNodes,
  onSubmit,
  onCancel,
}: EnhancedRentableItemFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    code: '',
    space_node_id: '',
    allocation_type: 'exclusive',
    capacity: 1,
    // Property classification
    property_category: '',
    rental_duration_type: '',
    min_rental_days: 1,
    max_rental_days: null as number | null,
    pricing_unit: 'PER_MONTH',
    // Property details
    area_sqm: null as number | null,
    bedrooms: null as number | null,
    bathrooms: null as number | null,
    floor_number: null as number | null,
    // Amenities & Rules
    amenities: [] as string[],
    house_rules: [] as string[],
    // Booking settings
    instant_booking: false,
    advance_booking_days: 1,
    cancellation_policy: 'MODERATE',
    attrs: {},
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        space_node_id: initialData.space_node_id || '',
        allocation_type: initialData.allocation_type || 'exclusive',
        capacity: initialData.capacity || 1,
        property_category: initialData.property_category || '',
        rental_duration_type: initialData.rental_duration_type || '',
        min_rental_days: initialData.min_rental_days || 1,
        max_rental_days: initialData.max_rental_days || null,
        pricing_unit: initialData.pricing_unit || 'PER_MONTH',
        area_sqm: initialData.area_sqm || null,
        bedrooms: initialData.bedrooms || null,
        bathrooms: initialData.bathrooms || null,
        floor_number: initialData.floor_number || null,
        amenities: initialData.amenities || [],
        house_rules: initialData.house_rules || [],
        instant_booking: initialData.instant_booking || false,
        advance_booking_days: initialData.advance_booking_days || 1,
        cancellation_policy: initialData.cancellation_policy || 'MODERATE',
        attrs: initialData.attrs || {},
      });
      setStep(2); // Skip category selection if editing
    }
  }, [initialData]);

  const handleCategorySelect = (category: any) => {
    if (category) {
      setFormData({
        ...formData,
        property_category: category.code,
        rental_duration_type: category.duration_type,
        pricing_unit: category.typical_pricing_unit || 'PER_MONTH',
        min_rental_days: category.typical_min_days || 1,
      });
      setStep(2);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      alert('Vui lòng nhập mã rentable item');
      return;
    }

    if (!formData.property_category) {
      alert('Vui lòng chọn loại hình');
      return;
    }

    onSubmit(formData);
  };

  const houseRuleOptions = [
    { value: 'no_smoking', label: '🚭 Không hút thuốc' },
    { value: 'no_pets', label: '🐕 Không thú cưng' },
    { value: 'no_parties', label: '🎉 Không tiệc tùng' },
    { value: 'quiet_hours_22_6', label: '🔇 Giờ yên tĩnh (22h-6h)' },
    { value: 'no_cooking', label: '🍳 Không nấu ăn' },
    { value: 'no_visitors', label: '👥 Không khách thăm' },
  ];

  const toggleHouseRule = (rule: string) => {
    setFormData({
      ...formData,
      house_rules: formData.house_rules.includes(rule)
        ? formData.house_rules.filter(r => r !== rule)
        : [...formData.house_rules, rule],
    });
  };

  // Helper functions to determine which fields to show
  const isResidential = () => {
    const residential = ['HOMESTAY', 'GUESTHOUSE', 'HOTEL', 'SERVICED_APARTMENT_SHORT', 'VILLA_RESORT', 
                        'AIRBNB_ROOM', 'COLIVING_SHORT', 'PRIVATE_HOUSE', 'ROOM_RENTAL', 'APARTMENT', 
                        'SERVICED_APARTMENT_MEDIUM', 'WHOLE_HOUSE', 'LUXURY_APARTMENT', 'VILLA'];
    return residential.includes(formData.property_category);
  };

  const isCommercial = () => {
    const commercial = ['OFFICE', 'WAREHOUSE', 'COMMERCIAL_SPACE', 'RETAIL_SPACE_SMALL', 'SHOPHOUSE'];
    return commercial.includes(formData.property_category);
  };

  const isWarehouse = () => {
    return ['WAREHOUSE', 'WAREHOUSE_TEMP'].includes(formData.property_category);
  };

  const isLand = () => formData.property_category === 'LAND';

  const needsBedrooms = () => {
    const withBedrooms = ['HOMESTAY', 'GUESTHOUSE', 'HOTEL', 'SERVICED_APARTMENT_SHORT', 'VILLA_RESORT',
                          'AIRBNB_ROOM', 'PRIVATE_HOUSE', 'ROOM_RENTAL', 'APARTMENT', 
                          'SERVICED_APARTMENT_MEDIUM', 'WHOLE_HOUSE', 'LUXURY_APARTMENT', 'VILLA'];
    return withBedrooms.includes(formData.property_category);
  };

  const needsFloor = () => {
    const withFloor = ['APARTMENT', 'OFFICE', 'LUXURY_APARTMENT', 'SERVICED_APARTMENT_SHORT', 
                       'SERVICED_APARTMENT_MEDIUM', 'RETAIL_SPACE_SMALL'];
    return withFloor.includes(formData.property_category);
  };

  const isShortTerm = () => formData.rental_duration_type === 'SHORT_TERM';
  const isMediumTerm = () => formData.rental_duration_type === 'MEDIUM_TERM';
  const isLongTerm = () => formData.rental_duration_type === 'LONG_TERM';

  // Get category-specific hints
  const getCategoryHints = () => {
    const hints: Record<string, string> = {
      'HOMESTAY': '🏠 Nhà dân cho thuê ngắn hạn - cần phòng ngủ, phòng tắm, tiện nghi cơ bản',
      'GUESTHOUSE': '🏘️ Nhà nghỉ - phòng đơn giản với tiện nghi cơ bản',
      'HOTEL': '🏨 Khách sạn - dịch vụ chuyên nghiệp, nhiều tiện nghi',
      'SERVICED_APARTMENT_SHORT': '🏢 Căn hộ dịch vụ ngắn hạn - đầy đủ tiện nghi, dọn phòng hàng ngày',
      'VILLA_RESORT': '🏖️ Villa nghỉ dưỡng - cao cấp với hồ bơi, sân vườn',
      'AIRBNB_ROOM': '🛏️ Phòng Airbnb - phòng riêng trong nhà chung',
      'COLIVING_SHORT': '👥 Co-living ngắn hạn - không gian chia sẻ cho digital nomad',
      'PRIVATE_HOUSE': '🏡 Nhà riêng - nhà độc lập hoặc liền kề',
      'ROOM_RENTAL': '🛏️ Phòng trọ - cho sinh viên, công nhân',
      'APARTMENT': '🏢 Chung cư - căn hộ với tiện ích chung',
      'SERVICED_APARTMENT_MEDIUM': '🏢 Căn hộ dịch vụ trung hạn - cho expat, công tác',
      'WHOLE_HOUSE': '🏠 Nhà nguyên căn - toàn bộ nhà cho thuê',
      'RETAIL_SPACE_SMALL': '🏪 Mặt bằng nhỏ - kinh doanh quy mô nhỏ',
      'WAREHOUSE_TEMP': '📦 Kho tạm - lưu trữ tạm thời, cần diện tích lớn',
      'OFFICE': '🏢 Văn phòng - làm việc chuyên nghiệp, cần internet tốc độ cao',
      'LAND': '🌾 Đất nền - cần thông tin mặt tiền, loại đất',
      'WAREHOUSE': '🏭 Nhà xưởng - sản xuất, kho bãi lớn, cần công suất điện cao',
      'COMMERCIAL_SPACE': '🏬 Mặt bằng thương mại - siêu thị, trung tâm thương mại',
      'LUXURY_APARTMENT': '🏙️ Chung cư cao cấp - tiện ích đầy đủ, vị trí đẹp',
      'VILLA': '🏰 Biệt thự - cao cấp với đất rộng',
      'SHOPHOUSE': '🏪 Nhà phố kinh doanh - kết hợp ở và kinh doanh',
    };
    return hints[formData.property_category] || '';
  };

  // Step 1: Select Property Category
  if (step === 1) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Bước 1: Chọn loại hình
          </h3>
          <p className="text-gray-600 text-sm">
            Chọn loại hình bất động sản bạn muốn cho thuê
          </p>
        </div>

        <PropertyCategorySelector
          value={formData.property_category}
          onChange={handleCategorySelect}
        />

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Fill Details
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Bước 2: Điền thông tin chi tiết
        </h3>
        <div className="space-y-1">
          <p className="text-gray-600 text-sm">
            Loại hình: <span className="font-semibold">{formData.property_category}</span>
            {!initialData && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="ml-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                Đổi loại hình
              </button>
            )}
          </p>
          {getCategoryHints() && (
            <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
              {getCategoryHints()}
            </p>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Thông tin cơ bản</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã (code) *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="VD: HOMESTAY-001"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Space Node
            </label>
            <select
              value={formData.space_node_id}
              onChange={(e) => setFormData({ ...formData, space_node_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">-- Chọn space node --</option>
              {spaceNodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.node_type})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại phân bổ
            </label>
            <select
              value={formData.allocation_type}
              onChange={(e) => setFormData({ ...formData, allocation_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="exclusive">Độc quyền</option>
              <option value="capacity">Theo sức chứa</option>
              <option value="slot">Theo slot</option>
            </select>
          </div>

          {formData.allocation_type !== 'exclusive' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sức chứa
              </label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đơn vị giá
            </label>
            <select
              value={formData.pricing_unit}
              onChange={(e) => setFormData({ ...formData, pricing_unit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="PER_NIGHT">Theo đêm</option>
              <option value="PER_WEEK">Theo tuần</option>
              <option value="PER_MONTH">Theo tháng</option>
              <option value="PER_QUARTER">Theo quý</option>
              <option value="PER_YEAR">Theo năm</option>
              <option value="PER_SQM_MONTH">Theo m²/tháng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Chi tiết bất động sản</h4>
        
        <div className="grid grid-cols-4 gap-4">
          {/* Diện tích - hiện cho tất cả */}
          <div className={needsBedrooms() ? '' : 'col-span-2'}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diện tích (m²) {(isCommercial() || isLand()) && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.area_sqm || ''}
              onChange={(e) => setFormData({ ...formData, area_sqm: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required={isCommercial() || isLand()}
            />
          </div>

          {/* Phòng ngủ - chỉ cho residential */}
          {needsBedrooms() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phòng ngủ {isResidential() && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                min="0"
                value={formData.bedrooms || ''}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required={isResidential()}
              />
            </div>
          )}

          {/* Phòng tắm - chỉ cho residential */}
          {needsBedrooms() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phòng tắm {isResidential() && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                min="0"
                value={formData.bathrooms || ''}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required={isResidential()}
              />
            </div>
          )}

          {/* Tầng số - chỉ cho apartment, office */}
          {needsFloor() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tầng số
              </label>
              <input
                type="number"
                value={formData.floor_number || ''}
                onChange={(e) => setFormData({ ...formData, floor_number: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Rental duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isShortTerm() ? 'Thuê tối thiểu (đêm)' : 'Thuê tối thiểu (ngày)'} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.min_rental_days}
              onChange={(e) => setFormData({ ...formData, min_rental_days: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {isShortTerm() && 'Gợi ý: 1-7 đêm'}
              {isMediumTerm() && 'Gợi ý: 30-180 ngày'}
              {isLongTerm() && 'Gợi ý: 180-365 ngày'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isShortTerm() ? 'Thuê tối đa (đêm)' : 'Thuê tối đa (ngày)'}
            </label>
            <input
              type="number"
              min="1"
              value={formData.max_rental_days || ''}
              onChange={(e) => setFormData({ ...formData, max_rental_days: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              placeholder="Không giới hạn"
            />
          </div>
        </div>

        {/* Additional info for commercial properties */}
        {isCommercial() && !isWarehouse() && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">💼 Thông tin bổ sung cho bất động sản thương mại</h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Công suất điện (kW)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: 50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Băng thông internet (Mbps)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: 100"
                />
              </div>
            </div>
          </div>
        )}

        {/* Additional info for warehouse */}
        {isWarehouse() && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h5 className="font-medium text-orange-900 mb-2">📦 Thông tin bổ sung cho kho xưởng</h5>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Công suất điện (kW) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: 200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chiều cao trần (m)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: 6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tải trọng sàn (kg/m²)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: 1000"
                />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">Có cẩu trục</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">Có bãi đỗ xe tải</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">Có hệ thống PCCC</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">Có kho lạnh</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Additional info for land */}
        {isLand() && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h5 className="font-medium text-green-900 mb-2">🌾 Thông tin bổ sung cho đất nền</h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mặt tiền (m)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: 10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại đất
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="">-- Chọn loại đất --</option>
                  <option value="residential">Đất ở</option>
                  <option value="commercial">Đất thương mại</option>
                  <option value="agricultural">Đất nông nghiệp</option>
                  <option value="industrial">Đất công nghiệp</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Amenities */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Tiện nghi</h4>
        <AmenitiesSelector
          value={formData.amenities}
          onChange={(amenities) => setFormData({ ...formData, amenities })}
          propertyType={formData.property_category}
        />
      </div>

      {/* House Rules - chỉ cho residential */}
      {isResidential() && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Quy định nhà</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {houseRuleOptions.map((rule) => (
              <button
                key={rule.value}
                type="button"
                onClick={() => toggleHouseRule(rule.value)}
                className={`p-3 border-2 rounded-lg text-left transition ${
                  formData.house_rules.includes(rule.value)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <span className="text-sm">{rule.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Commercial Rules */}
      {(isCommercial() || isWarehouse()) && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Điều khoản sử dụng</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => toggleHouseRule('business_hours_only')}
              className={`p-3 border-2 rounded-lg text-left transition ${
                formData.house_rules.includes('business_hours_only')
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <span className="text-sm">🕐 Chỉ giờ hành chính</span>
            </button>
            <button
              type="button"
              onClick={() => toggleHouseRule('no_hazardous_materials')}
              className={`p-3 border-2 rounded-lg text-left transition ${
                formData.house_rules.includes('no_hazardous_materials')
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <span className="text-sm">⚠️ Không chất nguy hiểm</span>
            </button>
            <button
              type="button"
              onClick={() => toggleHouseRule('insurance_required')}
              className={`p-3 border-2 rounded-lg text-left transition ${
                formData.house_rules.includes('insurance_required')
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <span className="text-sm">🛡️ Yêu cầu bảo hiểm</span>
            </button>
            <button
              type="button"
              onClick={() => toggleHouseRule('maintenance_access')}
              className={`p-3 border-2 rounded-lg text-left transition ${
                formData.house_rules.includes('maintenance_access')
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <span className="text-sm">🔧 Cho phép bảo trì</span>
            </button>
            {isWarehouse() && (
              <>
                <button
                  type="button"
                  onClick={() => toggleHouseRule('24_7_access')}
                  className={`p-3 border-2 rounded-lg text-left transition ${
                    formData.house_rules.includes('24_7_access')
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <span className="text-sm">🔓 Truy cập 24/7</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleHouseRule('loading_dock_available')}
                  className={`p-3 border-2 rounded-lg text-left transition ${
                    formData.house_rules.includes('loading_dock_available')
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <span className="text-sm">🚛 Có bến bốc dỡ</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Booking Settings - chủ yếu cho short-term và medium-term */}
      {(isShortTerm() || isMediumTerm()) && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Cài đặt đặt chỗ</h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.instant_booking}
                  onChange={(e) => setFormData({ ...formData, instant_booking: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">
                  {isShortTerm() ? '⚡ Đặt ngay không cần xác nhận' : '⚡ Cho thuê ngay'}
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                {isShortTerm() && 'Khách có thể đặt và thanh toán ngay lập tức'}
                {isMediumTerm() && 'Cho thuê ngay không cần phê duyệt'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đặt trước tối thiểu (ngày)
              </label>
              <input
                type="number"
                min="0"
                value={formData.advance_booking_days}
                onChange={(e) => setFormData({ ...formData, advance_booking_days: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                {isShortTerm() && 'Gợi ý: 0-3 ngày'}
                {isMediumTerm() && 'Gợi ý: 7-30 ngày'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chính sách hủy
              </label>
              <select
                value={formData.cancellation_policy}
                onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="FLEXIBLE">Linh hoạt (hoàn 100% trước 24h)</option>
                <option value="MODERATE">Trung bình (hoàn 50% trước 7 ngày)</option>
                <option value="STRICT">Nghiêm ngặt (không hoàn tiền)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Long-term contract settings */}
      {isLongTerm() && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Điều khoản hợp đồng dài hạn</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiền cọc (số tháng)
              </label>
              <input
                type="number"
                min="0"
                max="12"
                defaultValue="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="VD: 2"
              />
              <p className="text-xs text-gray-500 mt-1">Thường 2-3 tháng tiền thuê</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tăng giá hàng năm (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                defaultValue="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="VD: 5"
              />
              <p className="text-xs text-gray-500 mt-1">Tăng giá tự động mỗi năm</p>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Yêu cầu hợp đồng chính thức</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Cần ký hợp đồng trước khi bắt đầu thuê
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {initialData ? 'Cập nhật' : 'Tạo'}
        </button>
      </div>
    </form>
  );
}
