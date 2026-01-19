import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, SlidersHorizontal, X, MapPin, Home, DollarSign } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Search filters
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    location: '',
    type: '',
    min_price: '',
    max_price: '',
    bedrooms: '',
    bathrooms: '',
    tags: '',
    sort: 'newest',
  });

  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 12,
    total: 0,
    total_pages: 0,
  });

  useEffect(() => {
    searchListings();
  }, [filters.sort, pagination.page]);

  const searchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.append('q', filters.q);
      if (filters.location) params.append('location', filters.location);
      if (filters.type) params.append('type', filters.type);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.bedrooms) params.append('bedrooms', filters.bedrooms);
      if (filters.bathrooms) params.append('bathrooms', filters.bathrooms);
      if (filters.tags) params.append('tags', filters.tags);
      params.append('sort', filters.sort);
      params.append('page', pagination.page.toString());
      params.append('page_size', pagination.page_size.toString());

      const response = await fetch(`http://localhost:3000/api/v1/marketplace/search?${params}`);
      if (response.ok) {
        const result = await response.json();
        setListings(result.data || []);
        setPagination(result.pagination || pagination);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm tin đăng:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    searchListings();
  };

  const clearFilters = () => {
    setFilters({
      q: '',
      location: '',
      type: '',
      min_price: '',
      max_price: '',
      bedrooms: '',
      bathrooms: '',
      tags: '',
      sort: 'newest',
    });
    setPagination({ ...pagination, page: 1 });
  };

  const getFirstImage = (media: any[]) => {
    const image = media?.find(m => m.type === 'image');
    return image?.url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  const formatPrice = (pricing: any) => {
    if (!pricing || !pricing.from_amount) return 'Liên hệ';
    return `${pricing.from_amount.toLocaleString('vi-VN')} ${pricing.currency || 'VND'}/${pricing.unit || 'tháng'}`;
  };

  return (
    <Layout userRole="TENANT">
      <div className="min-h-screen bg-gray-50">
        {/* Search Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex gap-4">
              {/* Search Input */}
              <div className="flex-1 flex items-center gap-3 px-4 py-2 border rounded-lg">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.q}
                  onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Tìm kiếm theo địa điểm, loại nhà..."
                  className="flex-1 border-none outline-none"
                />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
                  showFilters ? 'bg-blue-50 border-blue-600 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                Bộ lọc
              </button>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tìm kiếm
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Địa điểm
                    </label>
                    <input
                      type="text"
                      value={filters.location}
                      onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                      placeholder="VD: Quận 1, TP.HCM"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại hình
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Tất cả</option>
                      <option value="apartment">Căn hộ</option>
                      <option value="house">Nhà riêng</option>
                      <option value="room">Phòng trọ</option>
                      <option value="office">Văn phòng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá từ (VND)
                    </label>
                    <input
                      type="number"
                      value={filters.min_price}
                      onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá đến (VND)
                    </label>
                    <input
                      type="number"
                      value={filters.max_price}
                      onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                      placeholder="Không giới hạn"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số phòng ngủ
                    </label>
                    <select
                      value={filters.bedrooms}
                      onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Không yêu cầu</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số phòng tắm
                    </label>
                    <select
                      value={filters.bathrooms}
                      onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Không yêu cầu</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Xóa bộ lọc
                  </button>
                  <button
                    onClick={handleSearch}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Kết quả tìm kiếm</h2>
              <p className="text-gray-600">
                {pagination.total} kết quả
                {filters.q && ` cho "${filters.q}"`}
              </p>
            </div>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_low">Giá thấp đến cao</option>
              <option value="price_high">Giá cao đến thấp</option>
              <option value="relevance">Liên quan nhất</option>
            </select>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Đang tìm kiếm...</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Không tìm thấy kết quả
              </h3>
              <p className="text-gray-600 mb-4">
                Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    onClick={() => navigate(`/listings/${listing.id}`)}
                    className="bg-white rounded-lg shadow hover:shadow-xl transition cursor-pointer overflow-hidden"
                  >
                    <div className="relative h-48">
                      <img
                        src={getFirstImage(listing.media)}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-blue-600 font-bold text-lg">
                          {formatPrice(listing.pricing_display)}
                        </div>
                      </div>

                      {listing.tags && listing.tags.length > 0 && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {listing.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Trước
                  </button>
                  
                  <span className="px-4 py-2">
                    Trang {pagination.page} / {pagination.total_pages}
                  </span>
                  
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.total_pages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
