import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function AgreementsPage() {
  const navigate = useNavigate();
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadAgreements();
  }, [filterState, page]);

  const loadAgreements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10',
      });
      
      if (filterState) params.append('state', filterState);
      if (searchTerm) params.append('search', searchTerm);

      const response = await apiClient.get(`/agreements?${params}`);
      setAgreements(response.data.data || []);
      setTotalPages(response.data.meta?.total_pages || 1);
    } catch (error) {
      console.error('Không thể tải danh sách hợp đồng:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (state: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      PENDING_CONFIRM: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-orange-100 text-orange-800',
      TERMINATED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-600',
    };
    return colors[state] || 'bg-gray-100 text-gray-800';
  };

  const translateState = (state: string) => {
    const map: any = {
      DRAFT: 'Nháp',
      SENT: 'Đã gửi',
      PENDING_CONFIRM: 'Chờ xác nhận',
      ACTIVE: 'Đang hoạt động',
      EXPIRED: 'Hết hạn',
      TERMINATED: 'Đã chấm dứt',
      CANCELLED: 'Đã hủy',
    };
    return map[state] || state;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' ₫';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  if (loading && agreements.length === 0) {
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
            <h1 className="text-3xl font-bold text-gray-900">Quản lý hợp đồng</h1>
            <p className="text-gray-600 mt-1">Quản lý hợp đồng thuê dài hạn</p>
          </div>
          <button
            onClick={() => navigate('/agreements/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            + Tạo hợp đồng mới
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Nháp</div>
            <div className="text-2xl font-bold text-gray-900">
              {agreements.filter(a => a.state === 'DRAFT').length}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-sm text-blue-600">Đã gửi</div>
            <div className="text-2xl font-bold text-blue-900">
              {agreements.filter(a => a.state === 'SENT').length}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-sm text-yellow-600">Chờ xác nhận</div>
            <div className="text-2xl font-bold text-yellow-900">
              {agreements.filter(a => a.state === 'PENDING_CONFIRM').length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-sm text-green-600">Đang hoạt động</div>
            <div className="text-2xl font-bold text-green-900">
              {agreements.filter(a => a.state === 'ACTIVE').length}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-4">
            <div className="text-sm text-orange-600">Hết hạn</div>
            <div className="text-2xl font-bold text-orange-900">
              {agreements.filter(a => a.state === 'EXPIRED').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm hợp đồng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && loadAgreements()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="DRAFT">Nháp</option>
              <option value="SENT">Đã gửi</option>
              <option value="PENDING_CONFIRM">Chờ xác nhận</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="EXPIRED">Hết hạn</option>
              <option value="TERMINATED">Đã chấm dứt</option>
            </select>
            <button
              onClick={loadAgreements}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Agreements List */}
        {agreements.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có hợp đồng nào</h3>
            <p className="text-gray-600 mb-4">Tạo hợp đồng đầu tiên với khách thuê</p>
            <button
              onClick={() => navigate('/agreements/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              + Tạo hợp đồng mới
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {agreements.map((agreement) => (
                <div
                  key={agreement.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition p-6 cursor-pointer"
                  onClick={() => navigate(`/agreements/${agreement.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Hợp đồng #{agreement.id.slice(0, 8)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStateColor(agreement.state)}`}>
                          {translateState(agreement.state)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {agreement.rentable_item?.space_node?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPrice(agreement.base_price || 0)}
                      </div>
                      <div className="text-sm text-gray-600">/tháng</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 pt-4 border-t text-sm">
                    <div>
                      <div className="text-gray-600">Ngày bắt đầu</div>
                      <div className="font-medium">{formatDate(agreement.start_at)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Ngày kết thúc</div>
                      <div className="font-medium">
                        {agreement.end_at ? formatDate(agreement.end_at) : 'Không xác định'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Tiền cọc</div>
                      <div className="font-medium">{formatPrice(agreement.deposit_amount || 0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Loại</div>
                      <div className="font-medium">
                        {agreement.agreement_type === 'LONG_TERM' ? 'Dài hạn' : 'Ngắn hạn'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  ← Trước
                </button>
                <span className="px-4 py-2">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
