import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { apiClient } from '../api/client';

export default function UsersRolesPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'Landlord',
    data_scope: 'org',
  });
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/users/roles'),
      ]);
      setUsers(usersRes.data.data || []);
      setRoles(rolesRes.data.data || []);
    } catch (error) {
      console.error('Không thể tải danh sách người dùng/vai trò:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/users/invite', {
        email: inviteForm.email,
        role: inviteForm.role,
        scopes: [],
        assigned_asset_ids: [],
      });
      alert('Đã mời người dùng thành công! Họ sẽ nhận email với mật khẩu tạm thời.');
      setShowInviteModal(false);
      setInviteForm({ email: '', role: 'Landlord', data_scope: 'org' });
      loadData(); // Reload users list
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể mời người dùng');
    }
  };

  const getRoleColor = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    const colors: any = {
      purple: 'bg-purple-100 text-purple-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colors[role?.data_scope || 'gray'];
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
              <h1 className="text-3xl font-bold text-gray-900">Users & Roles (RBAC)</h1>
              <p className="text-gray-600 mt-1">
                Quản lý người dùng và phân quyền truy cập
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ➕ Mời người dùng
            </button>
          </div>
        </div>

        {/* RBAC Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-900 mb-2">🔐 Role-Based Access Control (RBAC)</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Mỗi user có 1 role xác định quyền truy cập</li>
            <li>• Data scope: org (toàn tổ chức) hoặc self (chỉ dữ liệu của mình)</li>
            <li>• Deny-by-default: không có quyền thì không thấy UI</li>
            <li>• Backend kiểm tra quyền ở mọi API endpoint</li>
          </ul>
        </div>

        {/* Roles Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Các vai trò trong hệ thống</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div key={role.name} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{role.label}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(role.name)}`}>
                    {role.name}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Quyền:</div>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((perm, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {perm}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="text-xs text-gray-500">+{role.permissions.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users List */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Danh sách người dùng</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data Scope
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-semibold text-sm">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.data_scope === 'org' ? '🌐 Toàn tổ chức' : '👤 Chỉ của mình'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-900 text-sm font-medium mr-3">
                        Sửa
                      </button>
                      <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ma trận phân quyền</h2>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">
                    Chức năng
                  </th>
                  {roles.map(role => (
                    <th key={role.name} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      {role.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[
                  { feature: 'Quản lý tài sản', roles: ['PlatformAdmin', 'OrgAdmin', 'Landlord'] },
                  { feature: 'Quản lý tin đăng', roles: ['PlatformAdmin', 'OrgAdmin', 'Landlord'] },
                  { feature: 'Quản lý leads', roles: ['PlatformAdmin', 'OrgAdmin', 'Landlord', 'PropertyManager'] },
                  { feature: 'Quản lý hợp đồng', roles: ['PlatformAdmin', 'OrgAdmin', 'Landlord'] },
                  { feature: 'Xem hợp đồng của mình', roles: ['Tenant'] },
                  { feature: 'Quản lý hóa đơn', roles: ['PlatformAdmin', 'OrgAdmin', 'Landlord'] },
                  { feature: 'Thanh toán hóa đơn', roles: ['Tenant'] },
                  { feature: 'Xem sổ cái', roles: ['PlatformAdmin', 'OrgAdmin', 'Landlord'] },
                  { feature: 'Quản lý tickets', roles: ['PlatformAdmin', 'OrgAdmin', 'Landlord', 'PropertyManager'] },
                  { feature: 'Tạo tickets', roles: ['Tenant'] },
                  { feature: 'Quản lý users', roles: ['PlatformAdmin', 'OrgAdmin'] },
                  { feature: 'Quản lý config', roles: ['PlatformAdmin', 'OrgAdmin'] },
                ].map((item, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 sticky left-0 bg-white">
                      {item.feature}
                    </td>
                    {roles.map(role => (
                      <td key={role.name} className="px-6 py-4 text-center">
                        {item.roles.includes(role.name) ? (
                          <span className="text-green-600 text-xl">✓</span>
                        ) : (
                          <span className="text-gray-300 text-xl">✗</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Scope Explanation */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">📊 Data Scope (Phạm vi dữ liệu)</h4>
          <div className="text-sm text-yellow-800 space-y-2">
            <div>
              <strong>🌐 Org (Organization):</strong> Xem tất cả dữ liệu trong tổ chức
              <ul className="ml-6 mt-1">
                <li>• Landlord, OrgAdmin, PlatformAdmin có scope này</li>
                <li>• Xem được tất cả assets, agreements, invoices...</li>
              </ul>
            </div>
            <div>
              <strong>👤 Self:</strong> Chỉ xem dữ liệu của chính mình
              <ul className="ml-6 mt-1">
                <li>• Tenant có scope này</li>
                <li>• Chỉ xem được agreements, invoices của mình</li>
                <li>• Backend filter tự động theo user_id</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Mời người dùng mới</h2>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {roles.map(role => (
                      <option key={role.name} value={role.name}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Scope *
                  </label>
                  <select
                    value={inviteForm.data_scope}
                    onChange={(e) => setInviteForm({ ...inviteForm, data_scope: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="org">Org - Toàn tổ chức</option>
                    <option value="self">Self - Chỉ của mình</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800">
                    💡 User sẽ nhận email mời với link đăng ký. Sau khi đăng ký, họ sẽ có quyền theo role đã chọn.
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Gửi lời mời
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
