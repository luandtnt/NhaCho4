import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import PropertyFilters from '../components/PropertyFilters';
import { Search, Home, Star, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { formatPrice } from '../utils/formatPrice';

interface Listing {
  id: string;
  title: string;
  description: string;
  media: any[];
  tags: string[];
  pricing_display: {
    from_amount: number;
    currency: string;
    unit: string;
  };
  rentable_items: any[];
}

interface PropertyCategory {
  id: string;
  code: string;
  name: string;
  name_vi: string;
  icon: string;
  duration_type: string;
  description: string;
}

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [selectedDurationType, setSelectedDurationType] = useState<string>('');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchCategories();
    fetchListings();
    fetchFeatured();
  }, [filters, pagination.page]);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/property-categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Lỗi khi tải categories:', error);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Build query params from filters
      const params = new URLSearchParams();
      if (filters.property_category) params.append('property_category', filters.property_category);
      if (filters.rental_duration_type) params.append('rental_duration_type', filters.rental_duration_type);
      if (filters.min_bedrooms) params.append('min_bedrooms', filters.min_bedrooms.toString());
      if (filters.min_bathrooms) params.append('min_bathrooms', filters.min_bathrooms.toString());
      if (filters.min_area) params.append('min_area', filters.min_area.toString());
      if (filters.max_area) params.append('max_area', filters.max_area.toString());
      if (filters.amenities && filters.amenities.length > 0) {
        params.append('amenities', filters.amenities.join(','));
      }
      if (filters.instant_booking !== undefined) {
        params.append('instant_booking', filters.instant_booking.toString());
      }
      
      // Add pagination
      params.append('page', pagination.page.toString());
      params.append('page_size', pagination.limit.toString());
      
      const queryString = params.toString();
      const url = `http://localhost:3000/api/v1/marketplace/discover${queryString ? '?' + queryString : ''}`;
      
      console.log('🔍 Fetching listings with URL:', url);
      console.log('📋 Current filters:', filters);
      
      const response = await fetch(url, { headers });
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Received listings:', result.data?.length, 'items');
        console.log('📊 Pagination:', result.pagination);
        setListings(result.data || []);
        
        // Update pagination from response
        if (result.pagination) {
          setPagination({
            page: result.pagination.page || pagination.page,
            limit: result.pagination.page_size || pagination.limit,
            total: result.pagination.total || 0,
            totalPages: result.pagination.total_pages || 0,
          });
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải tin đăng:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatured = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('http://localhost:3000/api/v1/marketplace/featured?limit=6', {
        headers,
      });
      if (response.ok) {
        const result = await response.json();
        setFeatured(result.data || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải tin đăng nổi bật:', error);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getFirstImage = (listing: Listing) => {
    if (listing.media && listing.media.length > 0) {
      return listing.media[0].url;
    }
    // Use a data URL for placeholder instead of external service
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%239ca3af"%3EKhông có ảnh%3C/text%3E%3C/svg%3E';
  };

  const formatPriceDisplay = (pricing: any) => {
    if (!pricing) return 'Liên hệ';
    return formatPrice(pricing.from_amount, pricing.unit);
  };

  return (
    <Layout userRole="TENANT">
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl font-bold mb-4">Tìm ngôi nhà mơ ước của bạn</h1>
            <p className="text-xl mb-8">Khám phá hàng ngàn bất động sản cho thuê</p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-lg p-4 flex gap-4">
              <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Tìm kiếm theo địa điểm, loại nhà..."
                  className="flex-1 bg-transparent border-none outline-none text-gray-900"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2"
              >
                <SlidersHorizontal className="w-5 h-5" />
                Bộ lọc
              </button>
              <button
                onClick={handleSearch}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Tìm kiếm
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 bg-white rounded-lg shadow-lg p-6">
                <PropertyFilters
                  filters={filters}
                  onChange={setFilters}
                  onApply={() => {
                    fetchListings();
                    setShowFilters(false);
                  }}
                  onReset={() => {
                    setFilters({});
                    setShowFilters(false);
                  }}
                />
              </div>
            )}

            {/* Quick Filters */}
            <div className="mt-6 flex gap-3 flex-wrap">
              {[
                { key: 'apartment', label: '🏠 Căn hộ', filter: { property_category: 'APARTMENT' } },
                { key: 'condo', label: '🏢 Chung cư', filter: { property_category: 'CONDO' } },
                { key: 'house', label: '🏡 Nhà riêng', filter: { property_category: 'PRIVATE_HOUSE' } },
                { key: 'instant', label: '⚡ Đặt ngay', filter: { instant_booking: true } },
                { key: 'reset', label: '🔄 Xóa bộ lọc', filter: {} },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilters(item.key === 'reset' ? {} : { ...filters, ...item.filter })}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Property Categories Section */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Loại hình bất động sản</h2>
                <p className="text-gray-600">Chọn loại hình phù hợp với nhu cầu của bạn</p>
              </div>
            </div>

            {/* Duration Type Tabs */}
            <div className="flex gap-2 mb-6">
              {[
                { key: 'all', label: 'Tất cả', value: '' },
                { key: 'short', label: 'Ngắn hạn (< 1 tháng)', value: 'SHORT_TERM' },
                { key: 'medium', label: 'Trung hạn (1-6 tháng)', value: 'MEDIUM_TERM' },
                { key: 'long', label: 'Dài hạn (> 6 tháng)', value: 'LONG_TERM' },
              ].map((duration) => (
                <button
                  key={duration.key}
                  onClick={() => setSelectedDurationType(duration.value)}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    selectedDurationType === duration.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {duration.label}
                </button>
              ))}
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {categories
                .filter(cat => !selectedDurationType || cat.duration_type === selectedDurationType)
                .map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setFilters({ ...filters, property_category: category.code });
                      window.scrollTo({ top: document.getElementById('listings-section')?.offsetTop, behavior: 'smooth' });
                    }}
                    className={`p-4 border-2 rounded-xl hover:border-blue-500 hover:shadow-lg transition text-center ${
                      filters.property_category === category.code
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="text-4xl mb-2">{category.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{category.name_vi}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {category.duration_type === 'SHORT_TERM' ? 'Ngắn hạn' :
                       category.duration_type === 'MEDIUM_TERM' ? 'Trung hạn' : 'Dài hạn'}
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Featured Section */}
          {featured.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">⭐ Nổi bật</h2>
                  <p className="text-gray-600">Các bất động sản được đề xuất</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map((listing) => (
                  <div
                    key={listing.id}
                    onClick={() => navigate(`/listings/${listing.id}`)}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer relative"
                  >
                    {/* Featured Badge */}
                    <div className="absolute top-2 right-2 z-10 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-md">
                      <Star className="w-4 h-4 fill-current" />
                      Nổi bật
                    </div>
                    
                    <img
                      src={getFirstImage(listing)}
                      alt={listing.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">{listing.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                      
                      {listing.tags && listing.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {listing.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-600">
                          {formatPriceDisplay(listing.pricing_display)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {listing.rentable_items?.length || 0} phòng
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Listings */}
          <div id="listings-section">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {filters.property_category 
                    ? `${categories.find(c => c.code === filters.property_category)?.name_vi || 'Bất động sản'}`
                    : 'Tất cả bất động sản'}
                </h2>
                <p className="text-gray-600">
                  {pagination.total > 0 ? `${pagination.total} kết quả` : `${listings.length} kết quả`}
                </p>
              </div>
              <div className="flex gap-2">
                {filters.property_category && (
                  <button
                    onClick={() => {
                      setFilters({ ...filters, property_category: undefined });
                      setPagination({ ...pagination, page: 1 });
                    }}
                    className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Đang tải...</div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Chưa có bất động sản nào
                </h3>
                <p className="text-gray-600">
                  Hãy quay lại sau để khám phá các bất động sản mới
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((listing) => (
                    <div
                      key={listing.id}
                      onClick={() => navigate(`/listings/${listing.id}`)}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition cursor-pointer"
                    >
                      <img
                        src={getFirstImage(listing)}
                        alt={listing.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-2">{listing.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {listing.description}
                        </p>
                        
                        {listing.tags && listing.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {listing.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">
                            {formatPriceDisplay(listing.pricing_display)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {listing.rentable_items?.length || 0} phòng
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      ← Trước
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPagination({ ...pagination, page: pageNum })}
                            className={`px-4 py-2 border rounded-lg ${
                              pagination.page === pageNum
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Sau →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
