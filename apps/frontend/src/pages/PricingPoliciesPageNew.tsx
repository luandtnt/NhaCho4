/**
 * Pricing Policies Page (NEW - Property-based)
 * Management page for property-based pricing policies
 */

import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';
import CreatePricingPolicyForm from '../components/CreatePricingPolicyForm';

export default function PricingPoliciesPageNew() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);

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

  const handleSubmit = async (data: any) => {
    try {
      if (editingPolicy) {
        await apiClient.patch(`/pricing-policies/${editingPolicy.id}`, data);
        alert('Cập nhật chính sách giá thành công!');
      } else {
        await apiClient.post('/pricing-policies', data);
        alert('Tạo chính sách giá thành công!');
      }
      setShowCreateModal(false);
      setEditingPolicy(null);
      loadPolicies();
    } catch (error: any) {
      console.error('Error:', error.response?.data);
      alert(error.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleEdit = (policy: any) => {
    setEditingPolicy(policy);
    setShowCreateModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ XÓA VĨNH VIỄN chính sách giá này?\n\nHành động này KHÔNG THỂ HOÀN TÁC!')) return;

    try {
      await apiClient.delete(`/pricing-policies/${id}`);
      alert('Đã xóa chính sách giá thành công!');
      loadPolicies();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể xóa chính sách giá');
    }
  };

  const handleBulkApply = async (policyId: string) => {
    if (!confirm('Áp dụng chính sách giá này cho tất cả rentable items đang sử dụng nó?')) return;

    try {
      await apiClient.post(`/pricing-policies/${policyId}/bulk-apply`);
      alert('Đã áp dụng chính sách giá thành công!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể áp dụng chính sách giá');
    }
  };

  const handleViewVersions = async (policyId: string) => {
    try {
      const response = await apiClient.get(`/pricing-policies/${policyId}/versions`);
      const versions = response.data;
      
      // Show versions in modal
      setSelectedPolicy({ id: policyId, versions });
      setShowDetailModal(true);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể tải lịch sử phiên bản');
    }
  };

  const handleToggleStatus = async (policyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa';
    
    if (!confirm(`Bạn có chắc muốn ${action} chính sách giá này?`)) return;

    try {
      await apiClient.patch(`/pricing-policies/${policyId}/status`, { status: newStatus });
      alert(`Đã ${action} chính sách giá thành công!`);
      loadPolicies();
    } catch (error: any) {
      alert(error.response?.data?.message || `Không thể ${action} chính sách giá`);
    }
  };

  const filteredPolicies = filter === 'all' 
    ? policies 
    : policies.filter(p => p.status === filter);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Chính sách Giá</h1>
          <p className="mt-2 text-gray-600">
            Tạo và quản lý các chính sách giá cho tài sản cho thuê
          </p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả ({policies.length})
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'ACTIVE'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đang hoạt động ({policies.filter(p => p.status === 'ACTIVE').length})
            </button>
            <button
              onClick={() => setFilter('INACTIVE')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'INACTIVE'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Không hoạt động ({policies.filter(p => p.status === 'INACTIVE').length})
            </button>
          </div>

          <button
            onClick={() => {
              setEditingPolicy(null);
              setShowCreateModal(true);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            + Tạo Chính sách Giá
          </button>
        </div>

        {/* Policies List */}
        {filteredPolicies.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">Chưa có chính sách giá nào</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tạo chính sách đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPolicies.map((policy) => (
              <div
                key={policy.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Policy Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {policy.name}
                    </h3>
                    {policy.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {policy.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      policy.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {policy.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </div>

                {/* Policy Details */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giá cơ bản:</span>
                    <span className="font-medium text-gray-900">
                      {policy.basePrice?.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                  {policy.propertyType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loại tài sản:</span>
                      <span className="font-medium text-gray-900">
                        {policy.propertyType}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phiên bản:</span>
                    <span className="font-medium text-gray-900">
                      v{policy.version || 1}
                    </span>
                  </div>
                </div>

                {/* Modifiers Summary */}
                {policy.modifiers && policy.modifiers.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium mb-1">
                      Điều chỉnh giá:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {policy.modifiers.slice(0, 3).map((mod: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                        >
                          {mod.type}
                        </span>
                      ))}
                      {policy.modifiers.length > 3 && (
                        <span className="text-xs text-blue-600">
                          +{policy.modifiers.length - 3} khác
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedPolicy(policy);
                      setShowDetailModal(true);
                    }}
                    className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 text-sm font-medium transition-colors"
                  >
                    👁️ Xem
                  </button>
                  <button
                    onClick={() => handleEdit(policy)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm font-medium transition-colors"
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    onClick={() => handleToggleStatus(policy.id, policy.status)}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      policy.status === 'ACTIVE'
                        ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {policy.status === 'ACTIVE' ? 'Tạm dừng' : 'Kích hoạt'}
                  </button>
                  <button
                    onClick={() => handleViewVersions(policy.id)}
                    className="px-3 py-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 text-sm font-medium transition-colors"
                    title="Xem lịch sử phiên bản"
                  >
                    📜
                  </button>
                  <button
                    onClick={() => handleBulkApply(policy.id)}
                    className="px-3 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 text-sm font-medium transition-colors"
                    title="Áp dụng hàng loạt"
                  >
                    ⚡
                  </button>
                  <button
                    onClick={() => handleDelete(policy.id)}
                    className="px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm font-medium transition-colors"
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {editingPolicy ? 'Chỉnh sửa Chính sách Giá' : 'Tạo Chính sách Giá Mới'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPolicy(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <CreatePricingPolicyForm
                  onSubmit={handleSubmit}
                  initialData={editingPolicy}
                  onCancel={() => {
                    setShowCreateModal(false);
                    setEditingPolicy(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedPolicy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">Chi tiết Chính sách Giá</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedPolicy(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">📋 Thông tin cơ bản</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tên:</span>
                      <span className="font-medium">{selectedPolicy.name}</span>
                    </div>
                    {selectedPolicy.description && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mô tả:</span>
                        <span className="font-medium">{selectedPolicy.description}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedPolicy.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedPolicy.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phiên bản:</span>
                      <span className="font-medium">v{selectedPolicy.version || 1}</span>
                    </div>
                  </div>
                </div>

                {/* Classification */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">🏷️ Phân loại</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loại tài sản:</span>
                      <span className="font-medium">{selectedPolicy.property_category || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thời hạn thuê:</span>
                      <span className="font-medium">{selectedPolicy.rental_duration_type || 'N/A'}</span>
                    </div>
                    {selectedPolicy.scope_province && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phạm vi:</span>
                        <span className="font-medium">
                          {selectedPolicy.scope_province}
                          {selectedPolicy.scope_district && ` - ${selectedPolicy.scope_district}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">💰 Thông tin giá</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giá cơ bản:</span>
                      <span className="font-semibold text-lg text-blue-600">
                        {selectedPolicy.base_price?.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Đơn vị:</span>
                      <span className="font-medium">{selectedPolicy.price_unit || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thời gian thuê tối thiểu:</span>
                      <span className="font-medium">{selectedPolicy.min_rent_duration || 1} {selectedPolicy.price_unit}</span>
                    </div>
                  </div>
                </div>

                {/* Fees */}
                {(selectedPolicy.deposit_amount > 0 || selectedPolicy.booking_hold_deposit > 0 || 
                  selectedPolicy.service_fee > 0 || selectedPolicy.building_management_fee > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">💵 Các khoản phí</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {selectedPolicy.deposit_amount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tiền cọc:</span>
                          <span className="font-medium">{selectedPolicy.deposit_amount?.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                      )}
                      {selectedPolicy.booking_hold_deposit > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phí giữ chỗ:</span>
                          <span className="font-medium">{selectedPolicy.booking_hold_deposit?.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                      )}
                      {selectedPolicy.service_fee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phí dịch vụ:</span>
                          <span className="font-medium">{selectedPolicy.service_fee?.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                      )}
                      {selectedPolicy.building_management_fee > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phí quản lý:</span>
                          <span className="font-medium">{selectedPolicy.building_management_fee?.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Utilities */}
                {(selectedPolicy.electricity_billing || selectedPolicy.water_billing) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">⚡ Tiện ích</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {selectedPolicy.electricity_billing && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Điện:</span>
                          <span className="font-medium">{selectedPolicy.electricity_billing}</span>
                        </div>
                      )}
                      {selectedPolicy.water_billing && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nước:</span>
                          <span className="font-medium">{selectedPolicy.water_billing}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleViewVersions(selectedPolicy.id)}
                    className="flex-1 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
                  >
                    📜 Xem lịch sử phiên bản
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEdit(selectedPolicy);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                  >
                    ✏️ Chỉnh sửa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );

}
