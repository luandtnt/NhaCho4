import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    actor: '',
    action: 'all',
    resource: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('page_size', '100');
      
      if (filters.actor) {
        params.append('actor', filters.actor);
      }
      if (filters.action !== 'all') {
        params.append('action', filters.action);
      }
      if (filters.resource) {
        params.append('resource', filters.resource);
      }
      if (filters.start_date) {
        params.append('start_date', filters.start_date);
      }
      if (filters.end_date) {
        params.append('end_date', filters.end_date);
      }

      const response = await apiClient.get(`/audit-logs?${params.toString()}`);
      setLogs(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setLoading(true);
    loadLogs();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.actor) params.append('actor', filters.actor);
      if (filters.action !== 'all') params.append('action', filters.action);

      const response = await apiClient.get(`/audit-logs/export?${params.toString()}`);
      
      // Create download
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${Date.now()}.json`;
      a.click();
      
      alert(`Đã export ${logs.length} audit logs thành công!`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể export dữ liệu');
    }
  };

  const getActionColor = (action: string) => {
    const colors: any = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      READ: 'bg-gray-100 text-gray-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-purple-100 text-purple-800',
      APPROVE: 'bg-teal-100 text-teal-800',
      REJECT: 'bg-orange-100 text-orange-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const translateAction = (action: string) => {
    const map: any = {
      CREATE: 'Tạo mới',
      UPDATE: 'Cập nhật',
      DELETE: 'Xóa',
      READ: 'Xem',
      LOGIN: 'Đăng nhập',
      LOGOUT: 'Đăng xuất',
      APPROVE: 'Phê duyệt',
      REJECT: 'Từ chối',
    };
    return map[action] || action;
  };

  const getActionIcon = (action: string) => {
    const icons: any = {
      CREATE: '➕',
      UPDATE: '✏️',
      DELETE: '🗑️',
      READ: '👁️',
      LOGIN: '🔓',
      LOGOUT: '🔒',
      APPROVE: '✅',
      REJECT: '❌',
    };
    return icons[action] || '📝';
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
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nhật ký Audit (Audit Logs)</h1>
              <p className="text-gray-600 mt-1">
                Theo dõi tất cả các thao tác của người dùng trong hệ thống
              </p>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              📥 Export JSON
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Bộ lọc</h3>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Người thực hiện
              </label>
              <input
                type="text"
                value={filters.actor}
                onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
                placeholder="Email hoặc User ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hành động
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Tất cả</option>
                <option value="CREATE">Tạo mới</option>
                <option value="UPDATE">Cập nhật</option>
                <option value="DELETE">Xóa</option>
                <option value="READ">Xem</option>
                <option value="LOGIN">Đăng nhập</option>
                <option value="LOGOUT">Đăng xuất</option>
                <option value="APPROVE">Phê duyệt</option>
                <option value="REJECT">Từ chối</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tài nguyên
              </label>
              <input
                type="text"
                value={filters.resource}
                onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
                placeholder="listing, invoice, user..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleApplyFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Áp dụng bộ lọc
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-sm text-green-600">Tạo mới</div>
            <div className="text-2xl font-bold text-green-900">
              {logs.filter(l => l.action === 'CREATE').length}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-sm text-blue-600">Cập nhật</div>
            <div className="text-2xl font-bold text-blue-900">
              {logs.filter(l => l.action === 'UPDATE').length}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-sm text-red-600">Xóa</div>
            <div className="text-2xl font-bold text-red-900">
              {logs.filter(l => l.action === 'DELETE').length}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-4">
            <div className="text-sm text-purple-600">Tổng số</div>
            <div className="text-2xl font-bold text-purple-900">
              {logs.length}
            </div>
          </div>
        </div>

        {/* Timeline */}
        {logs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có audit log nào
            </h3>
            <p className="text-gray-600">
              Các thao tác của người dùng sẽ được ghi lại tự động
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Timeline thao tác</h3>
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <div key={log.id} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                      }`}>
                        {getActionIcon(log.action)}
                      </div>
                      {index < logs.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                              {translateAction(log.action)}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {log.resource || 'N/A'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        <div className="text-sm text-gray-700 mb-2">
                          <span className="font-medium">{log.actor || 'System'}</span>
                          {' '}đã{' '}
                          <span className="font-medium">{translateAction(log.action).toLowerCase()}</span>
                          {' '}{log.resource}
                          {log.resource_id && (
                            <span className="font-mono text-xs text-gray-500 ml-2">
                              (ID: {log.resource_id.slice(0, 8)}...)
                            </span>
                          )}
                        </div>

                        {log.description && (
                          <div className="text-sm text-gray-600 mb-2">
                            📝 {log.description}
                          </div>
                        )}

                        {log.ip_address && (
                          <div className="text-xs text-gray-500">
                            🌐 IP: {log.ip_address}
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailModal(true);
                          }}
                          className="mt-2 text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Xem chi tiết →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="text-sm text-gray-600">
                Hiển thị {logs.length} audit logs
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Về Audit Logs</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Audit logs ghi lại tất cả thao tác của người dùng</li>
            <li>• Giúp theo dõi ai đã làm gì, khi nào, ở đâu</li>
            <li>• Hỗ trợ điều tra sự cố và đảm bảo tuân thủ</li>
            <li>• Dữ liệu không thể sửa/xóa để đảm bảo tính toàn vẹn</li>
            <li>• Export để lưu trữ hoặc phân tích bên ngoài</li>
          </ul>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Chi tiết Audit Log</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedLog(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Thông tin cơ bản</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Log ID</label>
                      <div className="font-mono text-sm text-gray-900 break-all">
                        {selectedLog.id}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Thời gian</label>
                      <div className="text-sm text-gray-900">
                        {new Date(selectedLog.created_at).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Hành động</label>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(selectedLog.action)}`}>
                          {getActionIcon(selectedLog.action)} {translateAction(selectedLog.action)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Người thực hiện</label>
                      <div className="text-sm text-gray-900 font-medium">
                        {selectedLog.actor || 'System'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resource Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Tài nguyên</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-blue-700">Loại tài nguyên</label>
                      <div className="text-sm text-blue-900 font-medium">
                        {selectedLog.resource || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-blue-700">Resource ID</label>
                      <div className="font-mono text-sm text-blue-900 break-all">
                        {selectedLog.resource_id || 'N/A'}
                      </div>
                    </div>
                    {selectedLog.description && (
                      <div>
                        <label className="text-sm text-blue-700">Mô tả</label>
                        <div className="text-sm text-blue-900">
                          {selectedLog.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Network Info */}
                {selectedLog.ip_address && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-3">Thông tin mạng</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm text-purple-700">IP Address</label>
                        <div className="font-mono text-sm text-purple-900">
                          {selectedLog.ip_address}
                        </div>
                      </div>
                      {selectedLog.user_agent && (
                        <div>
                          <label className="text-sm text-purple-700">User Agent</label>
                          <div className="text-xs text-purple-900 break-all">
                            {selectedLog.user_agent}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Changes (before/after) */}
                {(selectedLog.old_values || selectedLog.new_values) && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-3">Thay đổi dữ liệu</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedLog.old_values && (
                        <div>
                          <label className="text-sm text-yellow-700 font-medium">Giá trị cũ</label>
                          <pre className="mt-1 p-2 bg-white rounded border border-yellow-200 text-xs overflow-auto max-h-32">
                            {JSON.stringify(selectedLog.old_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedLog.new_values && (
                        <div>
                          <label className="text-sm text-yellow-700 font-medium">Giá trị mới</label>
                          <pre className="mt-1 p-2 bg-white rounded border border-yellow-200 text-xs overflow-auto max-h-32">
                            {JSON.stringify(selectedLog.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3">Metadata</h3>
                    <div className="space-y-2">
                      {Object.entries(selectedLog.metadata).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between items-start py-2 border-b border-green-100 last:border-0">
                          <span className="text-sm font-medium text-green-700 capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="text-sm text-green-900 text-right ml-4">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw JSON (collapsible) */}
                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                    📋 Xem dữ liệu JSON gốc
                  </summary>
                  <pre className="mt-3 p-3 bg-white rounded border border-gray-200 text-xs overflow-auto max-h-64">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </details>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedLog(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
