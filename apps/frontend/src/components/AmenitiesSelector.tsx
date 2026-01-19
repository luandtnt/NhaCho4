import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface Amenity {
  code: string;
  name_vi: string;
  name_en: string;
  icon: string;
  category: string;
}

interface AmenitiesSelectorProps {
  value: string[];
  onChange: (amenities: string[]) => void;
  propertyType?: string;
  maxSelection?: number;
}

export default function AmenitiesSelector({ 
  value = [], 
  onChange, 
  propertyType,
  maxSelection 
}: AmenitiesSelectorProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [groupedAmenities, setGroupedAmenities] = useState<Record<string, Amenity[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAmenities();
  }, [propertyType]);

  const loadAmenities = async () => {
    try {
      const url = propertyType 
        ? `/amenities?property_type=${propertyType}`
        : '/amenities/by-category';
      
      const response = await apiClient.get(url);
      
      if (propertyType) {
        setAmenities(response.data.data || []);
      } else {
        const grouped = response.data.data || {};
        setGroupedAmenities(grouped);
        const allAmenities = Object.values(grouped).flat() as Amenity[];
        setAmenities(allAmenities);
      }
    } catch (error) {
      console.error('Không thể tải tiện nghi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (code: string) => {
    const currentValue = value || [];
    const newValue = currentValue.includes(code)
      ? currentValue.filter(c => c !== code)
      : maxSelection && currentValue.length >= maxSelection
        ? currentValue
        : [...currentValue, code];
    
    onChange(newValue);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      BASIC: '🏠 Cơ bản',
      KITCHEN: '🍳 Bếp',
      BATHROOM: '🚿 Phòng tắm',
      ENTERTAINMENT: '🎮 Giải trí',
      SAFETY: '🔒 An toàn',
      TRANSPORTATION: '🚗 Di chuyển',
      WORK: '💼 Làm việc',
      PET: '🐕 Thú cưng',
      ACCESSIBILITY: '♿ Tiếp cận',
    };
    return labels[category] || category;
  };

  const filteredAmenities = amenities.filter(a =>
    a.name_vi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.name_en.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Tìm kiếm tiện nghi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Selection count */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">
          Đã chọn: {(value || []).length} {maxSelection && `/ ${maxSelection}`}
        </span>
        {(value || []).length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-red-600 hover:text-red-700"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Amenities grid */}
      {searchTerm ? (
        // Flat list when searching
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {filteredAmenities.map((amenity) => {
            const currentValue = value || [];
            const isSelected = currentValue.includes(amenity.code);
            const isDisabled = maxSelection && currentValue.length >= maxSelection && !isSelected;
            
            return (
            <button
              key={amenity.code}
              type="button"
              onClick={() => handleToggle(amenity.code)}
              disabled={isDisabled}
              className={`p-3 border-2 rounded-lg text-left transition ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              } ${
                isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{amenity.icon}</span>
                <span className="text-sm font-medium text-gray-900">{amenity.name_vi}</span>
              </div>
            </button>
            );
          })}
        </div>
      ) : (
        // Grouped by category
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(groupedAmenities).map(([category, categoryAmenities]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {getCategoryLabel(category)}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {categoryAmenities.map((amenity) => {
                  const currentValue = value || [];
                  const isSelected = currentValue.includes(amenity.code);
                  const isDisabled = maxSelection && currentValue.length >= maxSelection && !isSelected;
                  
                  return (
                  <button
                    key={amenity.code}
                    type="button"
                    onClick={() => handleToggle(amenity.code)}
                    disabled={isDisabled}
                    className={`p-2 border-2 rounded-lg text-left transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    } ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{amenity.icon}</span>
                      <span className="text-xs font-medium text-gray-900">{amenity.name_vi}</span>
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
