import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/auth';

interface LayoutProps {
  children: ReactNode;
  userRole?: 'LANDLORD' | 'TENANT';
}

export default function Layout({ children, userRole }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr && userStr !== 'undefined' ? JSON.parse(userStr) : { email: 'user@example.com' };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const landlordMenu = [
    { path: '/dashboard', label: '🏠 Trang chủ', icon: '🏠' },
    { path: '/listings', label: '📋 Tin đăng', icon: '📋' },
    { path: '/leads', label: '👥 Khách hàng', icon: '👥' },
    { path: '/assets', label: '🏢 Tài sản', icon: '🏢' },
    { path: '/availability', label: '📅 Lịch & Booking', icon: '📅' },
    { path: '/agreements', label: '📄 Hợp đồng', icon: '📄' },
    { path: '/pricing-policies-new', label: '💵 Chính sách giá', icon: '💵' },
    { path: '/invoices', label: '💰 Hóa đơn', icon: '💰' },
    { path: '/payments', label: '💳 Thanh toán', icon: '💳' },
    { path: '/ledger', label: '📒 Sổ cái', icon: '📒' },
    { path: '/tickets', label: '🎫 Yêu cầu', icon: '🎫' },
    { path: '/reports', label: '📊 Báo cáo', icon: '📊' },
    { path: '/users-roles', label: '👤 Users & Roles', icon: '👤' },
    { path: '/integrations', label: '🔌 Integrations', icon: '🔌' },
    { path: '/config-bundles', label: '⚙️ Cấu hình', icon: '⚙️' },
    { path: '/audit-logs', label: '📋 Audit Logs', icon: '📋' },
    { path: '/landlord-profile', label: '👤 Tài khoản', icon: '👤' },
  ];

  const tenantMenu = [
    { path: '/dashboard', label: '🏠 Trang chủ', icon: '🏠' },
    { path: '/discover', label: '🔍 Khám phá', icon: '🔍' },
    { path: '/my-inquiries', label: '💬 Yêu cầu của tôi', icon: '💬' },
    { path: '/my-bookings', label: '📅 Đặt chỗ', icon: '📅' },
    { path: '/my-agreements', label: '📄 Hợp đồng', icon: '📄' },
    { path: '/my-invoices', label: '💰 Hóa đơn', icon: '💰' },
    { path: '/my-payments', label: '💳 Thanh toán', icon: '💳' },
    { path: '/my-tickets', label: '🔧 Yêu cầu hỗ trợ', icon: '🔧' },
    { path: '/notifications', label: '🔔 Thông báo', icon: '🔔' },
    { path: '/my-profile', label: '👤 Tài khoản', icon: '👤' },
  ];

  const menu = userRole === 'TENANT' ? tenantMenu : landlordMenu;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg fixed h-full flex flex-col">
        <div className="p-6 border-b flex-shrink-0">
          <h1 className="text-2xl font-bold text-blue-600">URP Platform</h1>
          <p className="text-xs text-gray-500 mt-1">Hệ thống quản lý cho thuê</p>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto">
          {menu.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label.replace(/^[^\s]+ /, '')}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t bg-white flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              <p className="text-xs text-gray-500">
                {userRole === 'TENANT' ? 'Người thuê' : 'Chủ nhà'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1">
        {children}
      </main>
    </div>
  );
}
