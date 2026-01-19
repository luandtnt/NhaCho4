import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface PropertyCategory {
  code: string;
  name_vi: string;
  name_en: string;
  duration_type: string;
  icon: string;
  description: string;
  typical_pricing_unit: string;
  typical_min_days: number;
}

interface PropertyCategorySelectorProps {
  value?: string;
  selectedCategory?: string;
  onChange?: (category: PropertyCategory | null) => void;
  onSelect?: (category: PropertyCategory | null) => void;
  durationType?: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
}

export default function PropertyCategorySelector({ 
  value, 
  selectedCategory: selectedCategoryProp,
  onChange, 
  onSelect,
  durationType 
}: PropertyCategorySelectorProps) {
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [groupedCategories, setGroupedCategories] = useState<Record<string, PropertyCategory[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PropertyCategory | null>(null);

  useEffect(() => {
    loadCategories();
  }, [durationType]);

  useEffect(() => {
    if (value && categories.length > 0) {
      const cat = categories.find(c => c.code === value);
      setSelectedCategory(cat || null);
    } else if (selectedCategoryProp && categories.length > 0) {
      const cat = categories.find(c => c.code === selectedCategoryProp);
      setSelectedCategory(cat || null);
    }
  }, [value, selectedCategoryProp, categories]);

  const loadCategories = async () => {
    try {
      const url = durationType 
        ? `/property-categories?duration_type=${durationType}`
        : '/property-categories/by-duration';
      
      const response = await apiClient.get(url);
      
      if (durationType) {
        setCategories(response.data.data || []);
      } else {
        // Grouped by duration
        const grouped = response.data.data || {};
        setGroupedCategories(grouped);
        const allCats = [
          ...(grouped.SHORT_TERM || []),
          ...(grouped.MEDIUM_TERM || []),
          ...(grouped.LONG_TERM || []),
        ];
        setCategories(allCats);
      }
    } catch (error) {
      console.error('Không thể tải danh mục:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (category: PropertyCategory) => {
    setSelectedCategory(category);
    // Support both onChange and onSelect for backward compatibility
    if (onChange) {
      onChange(category);
    }
    if (onSelect) {
      onSelect(category);
    }
  };

  const getDurationLabel = (type: string) => {
    const labels: Record<string, string> = {
      SHORT_TERM: '⏱️ Ngắn hạn (< 1 tháng)',
      MEDIUM_TERM: '📅 Trung hạn (1-6 tháng)',
      LONG_TERM: '📆 Dài hạn (> 6 tháng)',
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>;
  }

  // If specific duration type, show flat list
  if (durationType) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((category) => (
          <button
            key={category.code}
            type="button"
            onClick={() => handleSelect(category)}
            className={`p-4 border-2 rounded-lg text-left transition hover:shadow-md ${
              selectedCategory?.code === category.code
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="text-3xl mb-2">{category.icon}</div>
            <div className="font-semibold text-gray-900">{category.name_vi}</div>
            <div className="text-xs text-gray-500 mt-1">{category.description}</div>
          </button>
        ))}
      </div>
    );
  }

  // Show grouped by duration
  return (
    <div className="space-y-6">
      {Object.entries(groupedCategories).map(([durationType, cats]) => (
        <div key={durationType}>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {getDurationLabel(durationType)}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {cats.map((category) => (
              <button
                key={category.code}
                type="button"
                onClick={() => handleSelect(category)}
                className={`p-3 border-2 rounded-lg text-left transition hover:shadow-md ${
                  selectedCategory?.code === category.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-2xl mb-1">{category.icon}</div>
                <div className="font-medium text-sm text-gray-900">{category.name_vi}</div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {category.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
