import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  title: string;
  message: string;
  created_at: string;
  status: 'UNREAD' | 'READ';
}

export default function TenantNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/api/v1/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/api/v1/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Lỗi khi tải số lượng chưa đọc:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:3000/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, status: 'READ' as const } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/api/v1/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, status: 'READ' as const })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả đã đọc:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: any = {
      INFO: '📬',
      WARNING: '⚠️',
      SUCCESS: '✅',
      ERROR: '❌',
    };
    return icons[type] || '🔔';
  };

  const getTypeColor = (type: string) => {
    const colors: any = {
      INFO: 'bg-blue-50 border-blue-200',
      WARNING: 'bg-yellow-50 border-yellow-200',
      SUCCESS: 'bg-green-50 border-green-200',
      ERROR: 'bg-red-50 border-red-200',
    };
    return colors[type] || 'bg-gray-50 border-gray-200';
  };

  return (
    <Layout userRole="TENANT">
      <div className="p-8">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có thông báo nào
            </h3>
            <p className="text-gray-600">
              Các thông báo quan trọng sẽ hiển thị ở đây
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow hover:shadow-md transition p-4 border-l-4 ${
                  getTypeColor(notification.type)
                } ${notification.status === 'UNREAD' ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{getTypeIcon(notification.type)}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className={`font-semibold ${notification.status === 'UNREAD' ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                        {notification.status === 'UNREAD' && (
                          <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {notification.message}
                    </p>

                    <div className="flex gap-2">
                      {notification.status === 'UNREAD' && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Về thông báo</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Bạn sẽ nhận thông báo khi có hóa đơn mới</li>
            <li>• Nhắc nhở thanh toán trước hạn 3 ngày</li>
            <li>• Cập nhật trạng thái yêu cầu hỗ trợ</li>
            <li>• Thông báo quan trọng về hợp đồng</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
