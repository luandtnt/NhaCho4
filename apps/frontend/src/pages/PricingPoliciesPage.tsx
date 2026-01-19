import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function PricingPoliciesPage() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'active' | 'archived'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    policy_type: 'monthly_rent',
    config: {
      base_amount: 0,
      currency: 'VND',
      unit: 'month',
      proration_rule: 'daily',
      late_fee_percent: 0,
      grace_period_days: 0,
    },
    effective_from: '',
    effective_to: '',
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const response = await apiClient.get('/pricing-policies', {
        params: { page: 1, limit: 100 },
      });
      setPolicies(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải chính sách giá:', error);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên chính sách');
      return;
    }
    
    if (!formData.policy_type || formData.policy_type.trim() === '') {
      alert('Vui lòng chọn loại chính sách');
      return;
    }
    
    if (formData.config.base_amount <= 0) {
      alert('Vui lòng nhập giá trị hợp lệ');
      return;
    }

    console.log('Submitting formData:', formData);

    try {
      if (editingPolicy) {
        await apiClient.put(`/pricing-policies/${editingPolicy.id}`, formData);
        alert('Cập nhật thành công!');
      } else {
        await apiClient.post('/pricing-policies', formData);
        alert('Tạo chính sách giá thành công!');
      }
      setShowCreateModal(false);
      setEditingPolicy(null);
      resetForm();
      loadPolicies();
    } catch (error: any) {
      console.error('Error:', error.response?.data);
      alert(error.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      policy_type: 'monthly_rent',
      config: {
        base_amount: 0,
        currency: 'VND',
        unit: 'month',
        proration_rule: 'daily',
        late_fee_percent: 0,
        grace_period_days: 0,
      },
      effective_from: '',
      effective_to: '',
    });
  };

  const handleEdit = (policy: any) => {
    setEditingPolicy(policy);
    
    // Backend structure: policy.config contains the actual data
    const policyData = policy.config || {};
    const pricingConfig = policyData.config || {};
    
    setFormData({
      name: policyData.name || '',
      policy_type: policyData.policy_type || 'monthly_rent',
      config: {
        base_amount: pricingConfig.base_amount || 0,
        currency: pricingConfig.currency || 'VND',
        unit: pricingConfig.unit || 'month',
        proration_rule: pricingConfig.proration_rule || 'daily',
        late_fee_percent: pricingConfig.late_fee_percent || 0,
        grace_period_days: pricingConfig.grace_period_days || 0,
      },
      effective_from: policyData.effective_from || '',
      effective_to: policyData.effective_to || '',
    });
    setShowCreateModal(true);
  };

  const handleActivate = async (id: string) => {
    if (!confirm('Kích hoạt chính sách giá này? Các chính sách ACTIVE khác sẽ bị chuyển sang ARCHIVED.')) return;

    try {
      await apiClient.post(`/pricing-policies/${id}/activate`);
      alert('Đã kích hoạt chính sách giá thành công!');
      loadPolicies();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể kích hoạt chính sách giá');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Vô hiệu hóa chính sách giá này? Chính sách sẽ chuyển về trạng thái DRAFT.')) return;

    try {
      await apiClient.post(`/pricing-policies/${id}/deactivate`);
      alert('Đã vô hiệu hóa chính sách giá thành công!');
      loadPolicies();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể vô hiệu hóa chính sách giá');
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Lưu trữ chính sách giá này? Chính sách sẽ không thể sử dụng cho hợp đồng mới.')) return;

    try {
      await apiClient.post(`/pricing-policies/${id}/archive`);
      alert('Đã lưu trữ chính sách giá thành công!');
      loadPolicies();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể lưu trữ chính sách giá');
    }
  };

  const handleDelete = async (id: string, status: string) => {
    // Validation: Cannot delete ACTIVE policies
    if (status === 'ACTIVE') {
      alert('Không thể xóa chính sách đang hoạt động! Vui lòng vô hiệu hóa hoặc lưu trữ trước.');
      return;
    }

    if (!confirm('⚠️ XÓA VĨNH VIỄN chính sách giá này?\n\nHành động này KHÔNG THỂ HOÀN TÁC!\n\nBạn có chắc chắn muốn tiếp tục?')) return;

    try {
      await apiClient.delete(`/pricing-policies/${id}`);
      alert('Đã xóa chính sách giá thành công!');
      loadPolicies();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể xóa chính sách giá');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-green-100 text-green-800',
      ARCHIVED: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const translateStatus = (status: string) => {
    const map: any = {
      DRAFT: 'Nháp',
      ACTIVE: 'Đang hoạt động',
      ARCHIVED: 'Đã lưu trữ',
    };
    return map[status] || status;
  };

  const translatePolicyType = (type: string) => {
    const map: any = {
      monthly_rent: 'Thuê theo tháng',
      daily_rent: 'Thuê theo ngày',
      hourly_rent: 'Thuê theo giờ',
      deposit: 'Tiền đặt cọc',
      service_fee: 'Phí dịch vụ',
      utility: 'Tiện ích',
    };
    return map[type] || type;
  };

  const formatCurrency = (amount: number, currency: string = 'VND') => {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const filteredPolicies = policies.filter(p => {
    if (filter === 'all') return true;
    return p.status?.toUpperCase() === filter.toUpperCase();
  });

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
              <h1 className="text-3xl font-bold text-gray-900">Chính sách giá</h1>
              <p className="text-gray-600 mt-1">
                Quản lý các chính sách giá cho thuê với versioning
              </p>
            </div>
            <button
              onClick={() => {
                setEditingPolicy(null);
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ➕ Tạo chính sách mới
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả ({policies.length})
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'draft'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Nháp ({policies.filter(p => p.status === 'DRAFT').length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đang hoạt động ({policies.filter(p => p.status === 'ACTIVE').length})
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'archived'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã lưu trữ ({policies.filter(p => p.status === 'ARCHIVED').length})
            </button>
          </div>
        </div>

        {/* Policies List */}
        {filteredPolicies.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có chính sách giá nào
            </h3>
            <p className="text-gray-600 mb-4">
              Tạo chính sách giá để áp dụng cho các hợp đồng thuê
            </p>
            <button
              onClick={() => {
                setEditingPolicy(null);
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tạo chính sách đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPolicies.map((policy) => {
              const policyData = policy.config || {};
              const pricingConfig = policyData.config || {};
              
              return (
              <div key={policy.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {policyData.name || 'Chính sách giá'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {translatePolicyType(policyData.policy_type)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Version {policy.version || 1}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(policy.status)}`}>
                    {translateStatus(policy.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Giá cơ bản:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(pricingConfig.base_amount || 0, pricingConfig.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Đơn vị:</span>
                    <span className="text-gray-900">{pricingConfig.unit || 'N/A'}</span>
                  </div>
                  {pricingConfig.late_fee_percent > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phí trễ hạn:</span>
                      <span className="text-red-600">{pricingConfig.late_fee_percent}%</span>
                    </div>
                  )}
                  {pricingConfig.grace_period_days > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Thời gian ân hạn:</span>
                      <span className="text-gray-900">{pricingConfig.grace_period_days} ngày</span>
                    </div>
                  )}
                </div>

                {policyData.effective_from && (
                  <div className="text-xs text-gray-500 mb-4">
                    <div>Hiệu lực từ: {new Date(policyData.effective_from).toLocaleDateString('vi-VN')}</div>
                    {policyData.effective_to && (
                      <div>Đến: {new Date(policyData.effective_to).toLocaleDateString('vi-VN')}</div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {/* Nút Xem chi tiết */}
                  <button
                    onClick={() => {
                      setEditingPolicy(policy);
                      setShowDetailModal(true);
                    }}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium border border-gray-300"
                  >
                    👁️ Xem chi tiết
                  </button>

                  {policy.status === 'DRAFT' && (
                    <button
                      onClick={() => handleActivate(policy.id)}
                      className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-2 rounded-lg text-sm font-medium"
                    >
                      ✓ Kích hoạt
                    </button>
                  )}
                  {policy.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleDeactivate(policy.id)}
                      className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-2 rounded-lg text-sm font-medium"
                    >
                      ⏸ Vô hiệu hóa
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(policy)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-medium"
                    >
                      ✏️ Sửa
                    </button>
                    {(policy.status === 'DRAFT' || policy.status === 'ACTIVE') && (
                      <button
                        onClick={() => handleArchive(policy.id)}
                        className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 py-2 rounded-lg text-sm font-medium"
                      >
                        📦 Lưu trữ
                      </button>
                    )}
                  </div>
                  {(policy.status === 'DRAFT' || policy.status === 'ARCHIVED') && (
                    <button
                      onClick={() => handleDelete(policy.id, policy.status)}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-lg text-sm font-medium"
                    >
                      🗑️ Xóa vĩnh viễn
                    </button>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingPolicy ? 'Chỉnh sửa chính sách giá' : 'Tạo chính sách giá mới'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên chính sách *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="VD: Giá thuê căn hộ 2PN - Quận 1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại chính sách *
                  </label>
                  <select
                    value={formData.policy_type}
                    onChange={(e) => setFormData({ ...formData, policy_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="monthly_rent">Thuê theo tháng</option>
                    <option value="daily_rent">Thuê theo ngày</option>
                    <option value="hourly_rent">Thuê theo giờ</option>
                    <option value="deposit">Tiền đặt cọc</option>
                    <option value="service_fee">Phí dịch vụ</option>
                    <option value="utility">Tiện ích (điện, nước...)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá cơ bản *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.config.base_amount}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, base_amount: parseFloat(e.target.value) }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đơn vị tiền tệ
                    </label>
                    <select
                      value={formData.config.currency}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, currency: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="VND">VND (₫)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đơn vị tính
                    </label>
                    <select
                      value={formData.config.unit}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, unit: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="month">Tháng</option>
                      <option value="day">Ngày</option>
                      <option value="hour">Giờ</option>
                      <option value="unit">Đơn vị</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quy tắc tính tỷ lệ
                    </label>
                    <select
                      value={formData.config.proration_rule}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, proration_rule: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="daily">Theo ngày</option>
                      <option value="none">Không tính tỷ lệ</option>
                      <option value="hourly">Theo giờ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phí trễ hạn (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.config.late_fee_percent}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, late_fee_percent: parseFloat(e.target.value) }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Phí phạt khi thanh toán trễ hạn
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian ân hạn (ngày)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.config.grace_period_days}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: { ...formData.config, grace_period_days: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Số ngày được trễ hạn không bị phạt
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hiệu lực từ
                    </label>
                    <input
                      type="date"
                      value={formData.effective_from}
                      onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hiệu lực đến
                    </label>
                    <input
                      type="date"
                      value={formData.effective_to}
                      onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Lưu ý về Versioning</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Chính sách mới được tạo ở trạng thái DRAFT</li>
                    <li>• Kích hoạt để áp dụng cho hợp đồng mới</li>
                    <li>• Chỉ có 1 chính sách ACTIVE cùng loại tại một thời điểm</li>
                    <li>• Khi kích hoạt, chính sách cũ sẽ chuyển sang ARCHIVED</li>
                    <li>• Hợp đồng cũ vẫn giữ nguyên chính sách đã áp dụng</li>
                  </ul>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingPolicy(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingPolicy ? 'Cập nhật' : 'Tạo chính sách'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && editingPolicy && (() => {
          const policyData = editingPolicy.config || {};
          const pricingConfig = policyData.config || {};
          
          return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {policyData.name || 'Chi tiết chính sách giá'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {translatePolicyType(policyData.policy_type)} • Version {editingPolicy.version || 1}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Trạng thái */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Trạng thái</h3>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(editingPolicy.status)}`}>
                    {translateStatus(editingPolicy.status)}
                  </span>
                </div>

                {/* Thông tin giá */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin giá</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giá cơ bản:</span>
                      <span className="font-semibold text-gray-900 text-lg">
                        {formatCurrency(pricingConfig.base_amount || 0, pricingConfig.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Đơn vị tiền tệ:</span>
                      <span className="text-gray-900">{pricingConfig.currency || 'VND'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Đơn vị tính:</span>
                      <span className="text-gray-900">{pricingConfig.unit || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quy tắc tính tỷ lệ:</span>
                      <span className="text-gray-900">
                        {pricingConfig.proration_rule === 'daily' ? 'Theo ngày' :
                         pricingConfig.proration_rule === 'hourly' ? 'Theo giờ' :
                         pricingConfig.proration_rule === 'none' ? 'Không tính tỷ lệ' : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phí và ân hạn */}
                {(pricingConfig.late_fee_percent > 0 || pricingConfig.grace_period_days > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Phí và ân hạn</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {pricingConfig.late_fee_percent > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phí trễ hạn:</span>
                          <span className="text-red-600 font-semibold">{pricingConfig.late_fee_percent}%</span>
                        </div>
                      )}
                      {pricingConfig.grace_period_days > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Thời gian ân hạn:</span>
                          <span className="text-gray-900">{pricingConfig.grace_period_days} ngày</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Thời gian hiệu lực */}
                {(policyData.effective_from || policyData.effective_to) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Thời gian hiệu lực</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {policyData.effective_from && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hiệu lực từ:</span>
                          <span className="text-gray-900">
                            {new Date(policyData.effective_from).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      )}
                      {policyData.effective_to && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hiệu lực đến:</span>
                          <span className="text-gray-900">
                            {new Date(policyData.effective_to).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Thông tin hệ thống */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin hệ thống</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="text-gray-900 font-mono text-xs">{editingPolicy.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày tạo:</span>
                      <span className="text-gray-900">
                        {new Date(editingPolicy.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    {editingPolicy.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cập nhật lần cuối:</span>
                        <span className="text-gray-900">
                          {new Date(editingPolicy.updated_at).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEdit(editingPolicy);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ✏️ Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </Layout>
  );
}
