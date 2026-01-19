/**
 * Physical Fields Component
 * Physical property details with dynamic fields based on property type
 */

import React from 'react';

interface PhysicalFieldsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  propertyCategory: string;
}

export default function PhysicalFields({ formData, onChange, propertyCategory }: PhysicalFieldsProps) {
  const isResidential = ['HOMESTAY', 'GUESTHOUSE', 'HOTEL', 'SERVICED_APARTMENT_SHORT', 
    'VILLA_RESORT', 'AIRBNB_ROOM', 'PRIVATE_HOUSE', 'ROOM_RENTAL', 'APARTMENT',
    'SERVICED_APARTMENT_MEDIUM', 'WHOLE_HOUSE', 'LUXURY_APARTMENT', 'VILLA_LONG', 'SHOPHOUSE'].includes(propertyCategory);
  
  const isApartment = ['APARTMENT', 'LUXURY_APARTMENT', 'SERVICED_APARTMENT_SHORT', 'SERVICED_APARTMENT_MEDIUM'].includes(propertyCategory);
  
  const isHouse = ['PRIVATE_HOUSE', 'WHOLE_HOUSE', 'VILLA_RESORT', 'VILLA_LONG', 'SHOPHOUSE'].includes(propertyCategory);
  
  const isCommercial = ['RETAIL_SPACE_SMALL', 'COMMERCIAL_SPACE', 'SHOPHOUSE', 'LAND_PLOT'].includes(propertyCategory);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">🏗️ Thông số vật lý</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diện tích (m²) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={formData.area_sqm || ''}
            onChange={(e) => onChange('area_sqm', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mức độ nội thất <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.furnishing_level || ''}
            onChange={(e) => onChange('furnishing_level', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="">Chọn mức độ</option>
            <option value="FULL">Đầy đủ</option>
            <option value="PARTIAL">Một phần</option>
            <option value="NONE">Không nội thất</option>
          </select>
        </div>
      </div>

      {isResidential && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số phòng ngủ <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.bedrooms || ''}
              onChange={(e) => onChange('bedrooms', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số phòng tắm <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.bathrooms || ''}
              onChange={(e) => onChange('bathrooms', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="1"
              required
            />
          </div>
        </div>
      )}

      {isApartment && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tầng số
            </label>
            <input
              type="number"
              min="1"
              value={formData.apartment_floor || ''}
              onChange={(e) => onChange('apartment_floor', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hướng
            </label>
            <select
              value={formData.direction || ''}
              onChange={(e) => onChange('direction', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Chọn hướng</option>
              <option value="EAST">Đông</option>
              <option value="WEST">Tây</option>
              <option value="SOUTH">Nam</option>
              <option value="NORTH">Bắc</option>
              <option value="NORTHEAST">Đông Bắc</option>
              <option value="NORTHWEST">Tây Bắc</option>
              <option value="SOUTHEAST">Đông Nam</option>
              <option value="SOUTHWEST">Tây Nam</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ban công
            </label>
            <select
              value={formData.balcony ? 'true' : 'false'}
              onChange={(e) => onChange('balcony', e.target.value === 'true')}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="false">Không</option>
              <option value="true">Có</option>
            </select>
          </div>
        </div>
      )}

      {isHouse && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số tầng
            </label>
            <input
              type="number"
              min="1"
              value={formData.floors || ''}
              onChange={(e) => onChange('floors', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chỗ đỗ xe ô tô
            </label>
            <input
              type="number"
              min="0"
              value={formData.parking_slots || ''}
              onChange={(e) => onChange('parking_slots', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="2"
            />
          </div>
        </div>
      )}

      {isCommercial && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mặt tiền (m) {isCommercial && <span className="text-red-500">*</span>}
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={formData.frontage_m || ''}
            onChange={(e) => onChange('frontage_m', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="5"
            required={isCommercial}
          />
        </div>
      )}
    </div>
  );
}
