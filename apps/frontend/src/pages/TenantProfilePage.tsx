import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

export default function TenantProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState('');
  const [userRole, setUserRole] = useState('');
  const [orgId, setOrgId] = useState('');
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    emergency_contact: '',
  });

  const [securityForm, setSecurityForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [preferences, setPreferences] = useState({
    email_invoice: true,
    email_payment_reminder: true,
    email_ticket_update: true,
    email_promotion: false,
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
  });

  useEffect(() => {
    fetchProfile();
    fetchPreferences();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/api/v1/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserId(data.id || '');
        setUserRole(data.role || '');
        setOrgId(data.org_id || '');
        setProfileForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          emergency_contact: data.emergency_contact || '',
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin cá nhân:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/api/v1/users/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(prev => ({ ...prev, ...data.preferences }));
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải tùy chọn:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/api/v1/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone,
          emergency_contact: profileForm.emergency_contact,
        }),
      });
      if (response.ok) {
        alert('Cập nhật thông tin thành công!');
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.message}`);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      alert('Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityForm.new_password !== securityForm.confirm_password) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/api/v1/users/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: securityForm.current_password,
          new_password: securityForm.new_password,
        }),
      });
      if (response.ok) {
        alert('Đổi mật khẩu thành công!');
        setSecurityForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.message}`);
      }
    } catch (error) {
      console.error('Lỗi khi đổi mật khẩu:', error);
      alert('Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/api/v1/users/preferences', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });
      if (response.ok) {
        alert('Lưu tùy chọn thành công!');
      } else {
        const error = await response.json();
        alert(`Lỗi: ${error.message}`);
      }
    } catch (error) {
      console.error('Lỗi khi lưu tùy chọn:', error);
      alert('Có lỗi xảy ra khi lưu tùy chọn');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout userRole="TENANT">
        <div className="p-8">
          <div className="text-center py-12 text-gray-500">Đang tải...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole="TENANT">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tài khoản của tôi</h1>
          <p className="text-gray-600 mt-1">
            Quản lý thông tin cá nhân và cài đặt bảo mật
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👤 Thông tin cá nhân
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'security'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔒 Bảo mật
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`px-6 py-3 font-medium ${
                  activeTab === 'preferences'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ⚙️ Tùy chọn
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateProfile} className="max-w-2xl space-y-4">
                {/* System Info Section */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">Thông tin hệ thống</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-blue-700 font-medium">User ID</div>
                      <div className="text-blue-900 font-mono bg-white px-2 py-1 rounded mt-1 break-all">
                        {userId || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-700 font-medium">Role</div>
                      <div className="text-blue-900 font-mono bg-white px-2 py-1 rounded mt-1">
                        {userRole || 'N/A'}
                      </div>
                    </div>
                    {orgId && (
                      <div className="col-span-2">
                        <div className="text-blue-700 font-medium">Organization ID</div>
                        <div className="text-blue-900 font-mono bg-white px-2 py-1 rounded mt-1 break-all">
                          {orgId}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-blue-600 mt-3">
                    💡 Sử dụng User ID này khi tạo hợp đồng hoặc liên hệ hỗ trợ
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="0912345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Liên hệ khẩn cấp
                  </label>
                  <input
                    type="tel"
                    value={profileForm.emergency_contact}
                    onChange={(e) => setProfileForm({ ...profileForm, emergency_contact: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Số điện thoại người thân"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="max-w-2xl space-y-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Đổi mật khẩu</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={securityForm.current_password}
                      onChange={(e) => setSecurityForm({ ...securityForm, current_password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={securityForm.new_password}
                      onChange={(e) => setSecurityForm({ ...securityForm, new_password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      value={securityForm.confirm_password}
                      onChange={(e) => setSecurityForm({ ...securityForm, confirm_password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
                  </button>
                </form>

                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Phiên đăng nhập</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">Phiên hiện tại</div>
                        <div className="text-sm text-gray-600">Đăng nhập lúc: {new Date().toLocaleString('vi-VN')}</div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Đang hoạt động
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="max-w-2xl space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông báo</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={preferences.email_invoice}
                        onChange={(e) => setPreferences({ ...preferences, email_invoice: e.target.checked })}
                        className="mr-3" 
                      />
                      <span className="text-sm text-gray-700">Email khi có hóa đơn mới</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={preferences.email_payment_reminder}
                        onChange={(e) => setPreferences({ ...preferences, email_payment_reminder: e.target.checked })}
                        className="mr-3" 
                      />
                      <span className="text-sm text-gray-700">Email nhắc nhở thanh toán</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={preferences.email_ticket_update}
                        onChange={(e) => setPreferences({ ...preferences, email_ticket_update: e.target.checked })}
                        className="mr-3" 
                      />
                      <span className="text-sm text-gray-700">Thông báo cập nhật yêu cầu hỗ trợ</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={preferences.email_promotion}
                        onChange={(e) => setPreferences({ ...preferences, email_promotion: e.target.checked })}
                        className="mr-3" 
                      />
                      <span className="text-sm text-gray-700">Thông báo khuyến mãi</span>
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Ngôn ngữ & Khu vực</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngôn ngữ
                      </label>
                      <select 
                        value={preferences.language}
                        onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Múi giờ
                      </label>
                      <select 
                        value={preferences.timezone}
                        onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {saving ? 'Đang lưu...' : 'Lưu tùy chọn'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
