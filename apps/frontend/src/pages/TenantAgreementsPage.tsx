import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function TenantAgreementsPage() {
  const navigate = useNavigate();
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState<string>('');

  useEffect(() => {
    loadAgreements();
  }, [filterState]);

  const loadAgreements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        page_size: '50',
      });
      
      if (filterState) params.append('state', filterState);

      const response = await apiClient.get(`/agreements?${params}`);
      setAgreements(response.data.data || []);
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
      SENT: 'Chờ xác nhận',
      PENDING_CONFIRM: 'Đã xác nhận',
      ACTIVE: 'Đang hoạt động',
      EXPIRED: 'Hết hạn',
      TERMINATED: 'Đã kết thúc',
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

  if (loading) {
    return (
      <Layout userRole="TENANT">
        <div className="p-8">Đang tải...</div>
      </Layout>
    );
  }

  return (
    <Layout userRole="TENANT">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Hợp đồng của tôi</h1>
          <p className="text-gray-600 mt-1">
            Quản lý các hợp đồng thuê nhà của bạn
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-sm text-yellow-600">Chờ xác nhận</div>
            <div className="text-2xl font-bold text-yellow-900">
              {agreements.filter(a => a.state === 'SENT').length}
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
          <div className="bg-gray-50 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Tổng số</div>
            <div className="text-2xl font-bold text-gray-900">
              {agreements.length}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="SENT">Chờ xác nhận</option>
            <option value="PENDING_CONFIRM">Đã xác nhận</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="EXPIRED">Hết hạn</option>
            <option value="TERMINATED">Đã kết thúc</option>
          </select>
        </div>

        {/* Agreements List */}
        {agreements.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có hợp đồng nào
            </h3>
            <p className="text-gray-600">
              Các hợp đồng thuê nhà của bạn sẽ hiển thị ở đây
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {agreements.map((agreement) => (
              <div
                key={agreement.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-6 cursor-pointer"
                onClick={() => navigate(`/my-agreements/${agreement.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {agreement.rentable_item?.space_node?.name || `Hợp đồng #${agreement.id.slice(0, 8)}`}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStateColor(agreement.state)}`}>
                        {translateState(agreement.state)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(agreement.start_at)} → {agreement.end_at ? formatDate(agreement.end_at) : 'Không xác định'}
                    </p>
                  </div>
                  
                  {/* Action indicator */}
                  {agreement.state === 'SENT' && (
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm font-medium">
                      ⚠️ Cần xác nhận
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <div className="text-xs text-gray-500">Tiền thuê/tháng</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatPrice(agreement.base_price || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Tiền cọc</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatPrice(agreement.deposit_amount || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Loại</div>
                    <div className="text-sm text-gray-900">
                      {agreement.agreement_type === 'LONG_TERM' ? 'Dài hạn' : 'Ngắn hạn'}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                {agreement.state === 'SENT' && (
                  <div className="mt-4 pt-4 border-t">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/my-agreements/${agreement.id}`);
                      }}
                      className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
                    >
                      ✍️ Xem & Xác nhận hợp đồng
                    </button>
                  </div>
                )}

                {agreement.state === 'ACTIVE' && (
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/my-invoices');
                      }}
                      className="flex-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium"
                    >
                      💰 Hóa đơn
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/my-tickets');
                      }}
                      className="flex-1 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 text-sm font-medium"
                    >
                      🔧 Báo hỏng
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
