import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function TenantTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'MAINTENANCE',
    priority: 'MEDIUM',
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const response = await apiClient.get('/tenant/tickets?page=1&page_size=20');
      setTickets(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải danh sách yêu cầu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/tenant/tickets', newTicket);
      setShowCreateForm(false);
      setNewTicket({ title: '', description: '', category: 'MAINTENANCE', priority: 'MEDIUM' });
      loadTickets();
      alert('Đã tạo yêu cầu thành công!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Tạo yêu cầu thất bại');
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      URGENT: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const translateCategory = (category: string) => {
    const map: any = {
      MAINTENANCE: 'Bảo trì',
      REPAIR: 'Sửa chữa',
      NOISE: 'Tiếng ồn',
      SAFETY: 'An toàn',
      CLEANING: 'Vệ sinh',
      OTHER: 'Khác',
    };
    return map[category] || category;
  };

  const translatePriority = (priority: string) => {
    const map: any = {
      URGENT: 'Khẩn cấp',
      HIGH: 'Cao',
      MEDIUM: 'Trung bình',
      LOW: 'Thấp',
    };
    return map[priority] || priority;
  };

  const translateStatus = (status: string) => {
    const map: any = {
      OPEN: 'Mới',
      IN_PROGRESS: 'Đang xử lý',
      RESOLVED: 'Đã giải quyết',
      CLOSED: 'Đã đóng',
    };
    return map[status] || status;
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yêu cầu hỗ trợ</h1>
            <p className="text-gray-600 mt-1">
              Báo cáo sự cố và yêu cầu bảo trì
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showCreateForm ? 'Hủy' : '+ Tạo yêu cầu mới'}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tạo yêu cầu mới</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: Vòi nước bị rò rỉ"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả chi tiết *
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  placeholder="Mô tả chi tiết vấn đề..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại yêu cầu
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="MAINTENANCE">Bảo trì</option>
                    <option value="REPAIR">Sửa chữa</option>
                    <option value="NOISE">Tiếng ồn</option>
                    <option value="SAFETY">An toàn</option>
                    <option value="CLEANING">Vệ sinh</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mức độ ưu tiên
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="LOW">Thấp</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HIGH">Cao</option>
                    <option value="URGENT">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tạo yêu cầu
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có yêu cầu nào
            </h3>
            <p className="text-gray-600 mb-4">
              Tạo yêu cầu mới khi bạn cần hỗ trợ
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Tạo yêu cầu đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-6"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {ticket.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {ticket.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-gray-600">
                    {translateCategory(ticket.category)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {translatePriority(ticket.priority)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {translateStatus(ticket.status)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t">
                  <span>Tạo lúc: {new Date(ticket.created_at).toLocaleString('vi-VN')}</span>
                  {ticket.status === 'RESOLVED' && (
                    <button className="text-green-600 hover:text-green-800 font-medium">
                      ✓ Xác nhận đã giải quyết
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Lưu ý</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Yêu cầu khẩn cấp sẽ được xử lý trong vòng 24h</li>
            <li>• Yêu cầu thường sẽ được xử lý trong 2-3 ngày làm việc</li>
            <li>• Bạn sẽ nhận thông báo khi yêu cầu được cập nhật</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
