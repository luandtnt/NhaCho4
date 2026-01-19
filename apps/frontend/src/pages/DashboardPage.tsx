import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { apiClient } from '../api/client';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await authApi.me();
      setUser(userData);

      // Determine user role from email (simple check for demo)
      const userRole = userData.email.includes('landlord') ? 'LANDLORD' : 'TENANT';

      // Load basic stats based on role
      if (userRole === 'TENANT') {
        // Tenant: load their own data
        const [invoices, payments, tickets] = await Promise.all([
          apiClient.get('/tenant/invoices?page=1&page_size=5').catch(() => ({ data: { data: [] } })),
          apiClient.get('/tenant/payments?page=1&page_size=5').catch(() => ({ data: { data: [] } })),
          apiClient.get('/tenant/tickets?page=1&page_size=5').catch(() => ({ data: { data: [] } })),
        ]);

        setStats({
          invoices: invoices.data.data?.length || 0,
          payments: payments.data.data?.length || 0,
          tickets: tickets.data.data?.length || 0,
          role: userRole,
        });
      } else {
        // Landlord: load all org data
        const [invoices, payments, tickets] = await Promise.all([
          apiClient.get('/invoices?page=1&page_size=5').catch(() => ({ data: { data: [] } })),
          apiClient.get('/payments?page=1&page_size=5').catch(() => ({ data: { data: [] } })),
          apiClient.get('/tickets?page=1&page_size=5').catch(() => ({ data: { data: [] } })),
        ]);

        setStats({
          invoices: invoices.data.data?.length || 0,
          payments: payments.data.data?.length || 0,
          tickets: tickets.data.data?.length || 0,
          role: userRole,
        });
      }
    } catch (error) {
      console.error('Không thể tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển URP</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Hóa đơn</div>
            <div className="text-3xl font-bold text-gray-900">{stats?.invoices || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Thanh toán</div>
            <div className="text-3xl font-bold text-gray-900">{stats?.payments || 0}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Yêu cầu hỗ trợ</div>
            <div className="text-3xl font-bold text-gray-900">{stats?.tickets || 0}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats?.role === 'LANDLORD' ? (
              <>
                <button
                  onClick={() => navigate('/listings')}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg transition"
                >
                  📋 Tin đăng
                </button>
                <button
                  onClick={() => navigate('/invoices')}
                  className="bg-green-50 hover:bg-green-100 text-green-700 font-medium py-3 px-4 rounded-lg transition"
                >
                  💰 Hóa đơn
                </button>
                <button
                  onClick={() => navigate('/tickets')}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-3 px-4 rounded-lg transition"
                >
                  🎫 Yêu cầu
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium py-3 px-4 rounded-lg transition"
                >
                  📊 Báo cáo
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/my-invoices')}
                  className="bg-green-50 hover:bg-green-100 text-green-700 font-medium py-3 px-4 rounded-lg transition"
                >
                  💰 Hóa đơn của tôi
                </button>
                <button
                  onClick={() => navigate('/my-payments')}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg transition"
                >
                  💳 Thanh toán
                </button>
                <button
                  onClick={() => navigate('/tickets')}
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-3 px-4 rounded-lg transition"
                >
                  🎫 Hỗ trợ
                </button>
                <button
                  onClick={() => navigate('/my-agreements')}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium py-3 px-4 rounded-lg transition"
                >
                  📄 Hợp đồng
                </button>
              </>
            )}
          </div>
        </div>

        {/* API Status */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Trạng thái hệ thống</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700">Backend API: Đã kết nối</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700">Xác thực: Hoạt động</span>
            </div>
            <div className="text-xs text-gray-500 mt-4">
              API: http://localhost:3000/api/v1
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
