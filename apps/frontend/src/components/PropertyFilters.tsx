import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface PropertyFiltersProps {
  filters: any;
  onChange: (filters: any) => void;
  onApply: () => void;
  onReset: () => void;
}

export default function PropertyFilters({ filters, onChange, onApply, onReset }: PropertyFiltersProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadCategories();
    loadAmenities();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await apiClient.get('/property-categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadAmenities = async () => {
    try {
      const response = await apiClient.get('/amenities');
      setAmenities(response.data.data || []);
    } catch (error) {
      console.error('Error loading amenities:', error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleAmenity = (amenityCode: string) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = currentAmenities.includes(amenityCode)
      ? currentAmenities.filter((a: string) => a !== amenityCode)
      : [...currentAmenities, amenityCode];
    onChange({ ...filters, amenities: newAmenities });
  };

  return (
    <div className="space-y-4">
      {/* Duration Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Thời gian thuê
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: '', label: 'Tất cả' },
            { value: 'SHORT_TERM', label: 'Ngắn hạn' },
            { value: 'MEDIUM_TERM', label: 'Trung hạn' },
            { value: 'LONG_TERM', label: 'Dài hạn' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleFilterChange('rental_duration_type', option.value)}
              className={`px-3 py-2 text-sm rounded-lg border-2 transition ${
                filters.rental_duration_type === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại hình
        </label>
        <select
          value={filters.property_category || ''}
          onChange={(e) => handleFilterChange('property_category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Tất cả loại hình</option>
          {categories.map((cat) => (
            <option key={cat.code} value={cat.code}>
              {cat.icon} {cat.name_vi}
            </option>
          ))}
        </select>
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phòng ngủ tối thiểu
          </label>
          <select
            value={filters.min_bedrooms || ''}
            onChange={(e) => handleFilterChange('min_bedrooms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Không yêu cầu</option>
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phòng tắm tối thiểu
          </label>
          <select
            value={filters.min_bathrooms || ''}
            onChange={(e) => handleFilterChange('min_bathrooms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Không yêu cầu</option>
            {[1, 2, 3, 4].map(n => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        {showAdvanced ? '▼ Ẩn bộ lọc nâng cao' : '▶ Hiện bộ lọc nâng cao'}
      </button>

      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t">
          {/* Area Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diện tích (m²)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Từ"
                value={filters.min_area || ''}
                onChange={(e) => handleFilterChange('min_area', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Đến"
                value={filters.max_area || ''}
                onChange={(e) => handleFilterChange('max_area', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Instant Booking */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.instant_booking || false}
                onChange={(e) => handleFilterChange('instant_booking', e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Chỉ hiện bất động sản đặt ngay</span>
            </label>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiện nghi
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {amenities.slice(0, 10).map((amenity) => (
                <label key={amenity.code} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(filters.amenities || []).includes(amenity.code)}
                    onChange={() => toggleAmenity(amenity.code)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    {amenity.icon} {amenity.name_vi}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onReset}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Đặt lại
        </button>
        <button
          type="button"
          onClick={onApply}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Áp dụng
        </button>
      </div>
    </div>
  );
}
