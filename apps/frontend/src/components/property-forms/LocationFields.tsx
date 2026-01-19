/**
 * Location Fields Component
 * Common location fields for all property types
 */

import React from 'react';

interface LocationFieldsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  required?: boolean;
}

const PROVINCES = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'];
const DISTRICTS_HCM = ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 7', 'Bình Thạnh', 'Thủ Đức'];
const WARDS = ['Phường 1', 'Phường 2', 'Phường Bến Nghé', 'Phường Đa Kao', 'Phường Thảo Điền'];

export default function LocationFields({ formData, onChange, required = false }: LocationFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">📍 Vị trí</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Địa chỉ đầy đủ {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={formData.address_full || ''}
          onChange={(e) => onChange('address_full', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
          required={required}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tỉnh/Thành phố {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={formData.province || ''}
            onChange={(e) => onChange('province', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required={required}
          >
            <option value="">Chọn tỉnh/thành</option>
            {PROVINCES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quận/Huyện {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={formData.district || ''}
            onChange={(e) => onChange('district', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required={required}
          >
            <option value="">Chọn quận/huyện</option>
            {DISTRICTS_HCM.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phường/Xã {required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={formData.ward || ''}
            onChange={(e) => onChange('ward', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required={required}
          >
            <option value="">Chọn phường/xã</option>
            {WARDS.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vĩ độ (Latitude)
          </label>
          <input
            type="number"
            step="0.000001"
            value={formData.geo_lat || ''}
            onChange={(e) => onChange('geo_lat', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="10.762622"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kinh độ (Longitude)
          </label>
          <input
            type="number"
            step="0.000001"
            value={formData.geo_lng || ''}
            onChange={(e) => onChange('geo_lng', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="106.660172"
          />
        </div>
      </div>
    </div>
  );
}
