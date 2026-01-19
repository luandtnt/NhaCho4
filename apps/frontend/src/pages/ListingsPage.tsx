import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function ListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [allListings, setAllListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('PUBLISHED');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAllListings();
  }, []);

  useEffect(() => {
    filterListings();
  }, [activeTab, allListings]);

  const loadAllListings = async () => {
    try {
      const response = await apiClient.get('/listings?page=1&page_size=100');
      setAllListings(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải danh sách tin đăng:', error);
      setAllListings([]);
    } finally {
      setLoading(false);
    }
  };

  const filterListings = () => {
    const filtered = allListings.filter((l: any) => {
      if (activeTab === 'ARCHIVED') {
        return l.status === 'ARCHIVED' || l.status === 'DELETED';
      }
      return l.status === activeTab;
    });
    setListings(filtered);
  };

  const handlePublish = async (id: string) => {
    try {
      await apiClient.post(`/listings/${id}/publish`);
      await loadAllListings();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể đăng tin');
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await apiClient.post(`/listings/${id}/unpublish`);
      await loadAllListings();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể gỡ tin');
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Bạn có chắc muốn lưu trữ tin đăng này?')) return;
    try {
      await apiClient.delete(`/listings/${id}`);
      await loadAllListings();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể lưu trữ tin đăng');
    }
  };

  const handleDuplicate = async (listing: any) => {
    if (!confirm('Tạo bản sao của tin đăng này?')) return;
    try {
      const newListing = {
        title: `${listing.title} (Copy)`,
        description: listing.description || '',
        tags: listing.tags || [],
        pricing_display: listing.pricing_display || { from_amount: 0, currency: 'VND', unit: 'month' },
        rentable_item_ids: listing.rentable_item_ids || [],
        media: listing.media || [],
      };
      
      await apiClient.post('/listings', newListing);
      await loadAllListings();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể sao chép tin đăng');
    }
  };

  const filteredListings = listings.filter((listing) =>
    listing.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-red-100 text-red-800',
    };
    const labels: any = {
      DRAFT: 'Nháp',
      PUBLISHED: 'Đã đăng',
      ARCHIVED: 'Lưu trữ',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout userRole="LANDLORD">
        <div className="p-8">Đang tải...</div>
      </Layout>
    );
  }

  return (
    <Layout userRole="LANDLORD">
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý tin đăng</h1>
            <p className="text-gray-600 mt-1">Đăng và quản lý tin cho thuê của bạn</p>
          </div>
          <button
            onClick={() => navigate('/listings/create')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Tạo tin đăng mới
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('PUBLISHED')}
              className={`flex-1 px-6 py-4 font-medium ${
                activeTab === 'PUBLISHED'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Đã đăng ({allListings.filter(l => l.status === 'PUBLISHED').length})
            </button>
            <button
              onClick={() => setActiveTab('DRAFT')}
              className={`flex-1 px-6 py-4 font-medium ${
                activeTab === 'DRAFT'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Nháp ({allListings.filter(l => l.status === 'DRAFT').length})
            </button>
            <button
              onClick={() => setActiveTab('ARCHIVED')}
              className={`flex-1 px-6 py-4 font-medium ${
                activeTab === 'ARCHIVED'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lưu trữ ({allListings.filter(l => l.status === 'ARCHIVED' || l.status === 'DELETED').length})
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-4 border-b">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm theo tiêu đề..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">Tất cả danh mục</option>
                <option value="apartment">Căn hộ</option>
                <option value="house">Nhà riêng</option>
                <option value="villa">Biệt thự</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg">
                <option value="">Tất cả thành phố</option>
                <option value="hcm">Hồ Chí Minh</option>
                <option value="hn">Hà Nội</option>
                <option value="dn">Đà Nẵng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {filteredListings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab === 'DRAFT' ? 'Chưa có tin nháp' : 
               activeTab === 'ARCHIVED' ? 'Chưa có tin lưu trữ' : 
               'Chưa có tin đăng nào'}
            </h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'DRAFT' ? 'Các tin đăng nháp sẽ hiển thị ở đây' : 
               activeTab === 'ARCHIVED' ? 'Các tin đã lưu trữ sẽ hiển thị ở đây' : 
               'Bắt đầu bằng cách tạo tin đăng đầu tiên'}
            </p>
            {activeTab === 'PUBLISHED' && (
              <button
                onClick={() => navigate('/listings/create')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Tạo tin đăng đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                {/* Image */}
                <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                  <span className="text-6xl">🏠</span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 flex-1">
                      {listing.title}
                    </h3>
                    {getStatusBadge(listing.status)}
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {listing.description || 'Không có mô tả'}
                  </p>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-blue-600">
                      {listing.price?.toLocaleString() || listing.pricing_display?.from_amount?.toLocaleString() || 'N/A'} VND
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(listing.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-sm text-gray-600 mb-4 pb-4 border-b">
                    <span>👁️ 0 lượt xem</span>
                    <span>📧 0 liên hệ</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/listings/${listing.id}`)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium"
                    >
                      Chi tiết
                    </button>
                    
                    {listing.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(listing.id)}
                        className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-lg text-sm font-medium"
                      >
                        Đăng
                      </button>
                    )}
                    
                    {listing.status === 'PUBLISHED' && (
                      <button
                        onClick={() => handleUnpublish(listing.id)}
                        className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 py-2 rounded-lg text-sm font-medium"
                      >
                        Gỡ
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleDuplicate(listing)}
                      className="flex-1 text-blue-600 hover:text-blue-700 py-2 text-sm font-medium"
                    >
                      📋 Sao chép
                    </button>
                    <button
                      onClick={() => handleArchive(listing.id)}
                      className="flex-1 text-red-600 hover:text-red-700 py-2 text-sm font-medium"
                    >
                      🗑️ Lưu trữ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
