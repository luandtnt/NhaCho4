/**
 * Enhanced Property Form
 * Complete form with all enhanced fields, dynamic rendering based on property type
 */

import { useState, useEffect } from 'react';
import PropertyCategorySelector from './PropertyCategorySelector';
import AmenitiesSelector from './AmenitiesSelector';
import LocationFields from './property-forms/LocationFields';
import PricingFieldsWithPolicy from './property-forms/PricingFieldsWithPolicy';
import PhysicalFields from './property-forms/PhysicalFields';
import BookingFields from './property-forms/BookingFields';

interface EnhancedPropertyFormProps {
  initialData?: any;
  spaceNodes: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function EnhancedPropertyForm({
  initialData,
  spaceNodes,
  onSubmit,
  onCancel,
}: EnhancedPropertyFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic
    code: '',
    space_node_id: '',
    allocation_type: 'exclusive',
    status: 'ACTIVE',
    
    // Classification
    property_category: '',
    rental_duration_type: '',
    
    // Location
    address_full: '',
    province: '',
    district: '',
    ward: '',
    geo_lat: null as number | null,
    geo_lng: null as number | null,
    
    // Pricing
    pricing_policy_id: null as string | null,
    pricing_policy_version: null as number | null,
    pricing_snapshot_at: null as string | null,
    pricing_override: null as any,
    base_price: null as number | null,
    price_unit: 'MONTH',
    currency: 'VND',
    min_rent_duration: 1,
    deposit_amount: null as number | null,
    booking_hold_deposit: null as number | null,
    service_fee: null as number | null,
    building_mgmt_fee: null as number | null,
    
    // Physical
    area_sqm: null as number | null,
    bedrooms: null as number | null,
    bathrooms: null as number | null,
    floors: null as number | null,
    apartment_floor: null as number | null,
    direction: '',
    balcony: false,
    frontage_m: null as number | null,
    parking_slots: null as number | null,
    furnishing_level: 'PARTIAL',
    
    // Amenities
    amenities: [] as string[],
    
    // Booking (SHORT_TERM)
    checkin_time: '',
    checkout_time: '',
    max_occupancy: null as number | null,
    
    // Utilities (MID/LONG)
    electricity_billing: '',
    water_billing: '',
    
    // Metadata
    metadata: {
      version: 1,
      property_type: '',
      lease_group: 'MID' as 'SHORT' | 'MID' | 'LONG',
      details: {},
    },
  });

  useEffect(() => {
    if (initialData) {
      console.log('📝 Edit mode - Loading initial data:', initialData);
      
      // Merge initial data with form defaults
      const mergedData = {
        ...formData,
        ...initialData,
        // Ensure amenities is an array
        amenities: initialData.amenities || [],
        // Ensure metadata exists
        metadata: initialData.metadata || formData.metadata,
      };
      
      setFormData(mergedData);
      
      // Skip category selection step if property_category exists
      if (initialData.property_category) {
        setStep(2);
      }
    }
  }, [initialData]);

  const handleCategorySelect = (category: any) => {
    if (category) {
      console.log('📋 Category selected:', category);
      const leaseGroup = category.duration_type === 'SHORT_TERM' ? 'SHORT' 
        : category.duration_type === 'MEDIUM_TERM' ? 'MID' : 'LONG';
      
      const priceUnit = leaseGroup === 'SHORT' ? 'NIGHT' : 'MONTH';
      
      console.log('📊 Setting formData:', {
        property_category: category.code,
        rental_duration_type: category.duration_type,
        lease_group: leaseGroup,
        price_unit: priceUnit
      });
      
      setFormData({
        ...formData,
        property_category: category.code,
        rental_duration_type: category.duration_type,
        price_unit: priceUnit,
        metadata: {
          version: 1,
          property_type: category.code,
          lease_group: leaseGroup,
          details: {},
        },
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
    
    // Basic validation
    if (!formData.code.trim()) {
      alert('Vui lòng nhập mã rentable item');
      return;
    }

    if (!formData.space_node_id) {
      alert('Vui lòng chọn space node');
      return;
    }

    if (!formData.property_category) {
      alert('Vui lòng chọn loại hình');
      return;
    }

    if (!formData.area_sqm || formData.area_sqm <= 0) {
      alert('Vui lòng nhập diện tích hợp lệ');
      return;
    }

    // Helper to convert to number or undefined
    const toNumber = (val: any) => {
      if (val === null || val === undefined || val === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    };

    // Prepare data for OLD DTO structure (not enhanced)
    const submitData: any = {
      code: formData.code,
      space_node_id: formData.space_node_id,
      allocation_type: formData.allocation_type || 'exclusive',
      property_category: formData.property_category,
      rental_duration_type: formData.rental_duration_type,
      area_sqm: toNumber(formData.area_sqm), // MUST be number
      amenities: formData.amenities || [],
      
      // Put all enhanced fields in attrs
      attrs: {
        // Location
        address_full: formData.address_full,
        province: formData.province,
        district: formData.district,
        ward: formData.ward,
        geo_lat: toNumber(formData.geo_lat),
        geo_lng: toNumber(formData.geo_lng),
        
        // Pricing
        pricing_policy_id: formData.pricing_policy_id,
        pricing_policy_version: toNumber(formData.pricing_policy_version),
        base_price: toNumber(formData.base_price),
        price_unit: formData.price_unit,
        currency: formData.currency || 'VND',
        min_rent_duration: toNumber(formData.min_rent_duration),
        deposit_amount: toNumber(formData.deposit_amount),
        booking_hold_deposit: toNumber(formData.booking_hold_deposit),
        service_fee: toNumber(formData.service_fee),
        building_mgmt_fee: toNumber(formData.building_mgmt_fee),
        
        // Physical
        furnishing_level: formData.furnishing_level,
        bedrooms: toNumber(formData.bedrooms),
        bathrooms: toNumber(formData.bathrooms),
        floors: toNumber(formData.floors),
        apartment_floor: toNumber(formData.apartment_floor),
        direction: formData.direction,
        balcony: formData.balcony,
        frontage_m: toNumber(formData.frontage_m),
        parking_slots: toNumber(formData.parking_slots),
        
        // Booking (SHORT_TERM)
        checkin_time: formData.checkin_time,
        checkout_time: formData.checkout_time,
        max_occupancy: toNumber(formData.max_occupancy),
        
        // Utilities (MID/LONG)
        electricity_billing: formData.electricity_billing,
        water_billing: formData.water_billing,
        
        // Metadata
        metadata: formData.metadata,
        
        // Status
        status: formData.status,
      },
    };

    console.log('📤 Submitting data (OLD DTO structure):', submitData);
    
    // Submit
    onSubmit(submitData);
  };

  const leaseGroup = formData.metadata.lease_group;

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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {initialData ? 'Chỉnh sửa' : 'Thêm'} Rentable Item
          {formData.property_category && ` - ${formData.property_category}`}
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

      {/* Edit Mode: Show current category info */}
      {initialData && formData.property_category && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-600">Loại hình:</span>
              <span className="ml-2 font-semibold text-gray-900">{formData.property_category}</span>
              <span className="ml-2 text-sm text-gray-500">
                ({formData.rental_duration_type})
              </span>
            </div>
            <span className="text-xs text-gray-500">
              ⚠️ Không thể thay đổi loại hình khi chỉnh sửa
            </span>
          </div>
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">📋 Thông tin cơ bản</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleFieldChange('code', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="ROOM-101"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Space Node <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.space_node_id}
              onChange={(e) => handleFieldChange('space_node_id', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Chọn space node</option>
              {spaceNodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.path} - {node.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Location */}
      <LocationFields
        formData={formData}
        onChange={handleFieldChange}
        required={false}
      />

      {/* Pricing - With Policy Integration */}
      <PricingFieldsWithPolicy
        formData={formData}
        onChange={handleFieldChange}
        leaseGroup={leaseGroup}
      />

      {/* Edit Mode Notice */}
      {initialData && formData.pricing_policy_id && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            ℹ️ Chế độ chỉnh sửa
          </h4>
          <p className="text-sm text-blue-800">
            Bạn có thể thay đổi chính sách giá hoặc ghi đè giá riêng cho item này.
            Các thay đổi sẽ được lưu khi bạn click "Cập nhật".
          </p>
        </div>
      )}

      {/* Physical */}
      <PhysicalFields
        formData={formData}
        onChange={handleFieldChange}
        propertyCategory={formData.property_category}
      />

      {/* Booking (SHORT_TERM only) */}
      {leaseGroup === 'SHORT' && (
        <BookingFields
          formData={formData}
          onChange={handleFieldChange}
        />
      )}

      {/* Amenities */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">✨ Tiện ích</h3>
        <AmenitiesSelector
          value={formData.amenities}
          onChange={(amenities) => handleFieldChange('amenities', amenities)}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
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
          {initialData ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
}
