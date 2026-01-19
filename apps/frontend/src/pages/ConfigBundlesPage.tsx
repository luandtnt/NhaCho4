import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function ConfigBundlesPage() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    config: {
      asset_types: [] as any[],
      node_types: [] as any[],
      pricing_policy_types: [] as any[],
      custom_fields: {} as any,
    },
  });

  useEffect(() => {
    loadBundles();
  }, []);

  const loadBundles = async () => {
    try {
      const response = await apiClient.get('/configs/bundles');
      setBundles(response.data || []);
    } catch (error) {
      console.error('Không thể tải danh sách config bundles:', error);
      setBundles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/configs/bundles', formData);
      alert('Đã tạo config bundle thành công!');
      setShowCreateModal(false);
      resetForm();
      loadBundles();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể tạo config bundle');
    }
  };

  const handleActivate = async (id: string) => {
    if (!confirm('Kích hoạt bundle này? Bundle hiện tại sẽ bị vô hiệu hóa.')) return;
    try {
      await apiClient.post(`/configs/bundles/${id}/activate`);
      alert('Đã kích hoạt bundle thành công!');
      loadBundles();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể kích hoạt bundle');
    }
  };

  const handleRollback = async (id: string) => {
    if (!confirm('Khôi phục bundle này? Bundle hiện tại sẽ bị vô hiệu hóa.')) return;
    try {
      await apiClient.post(`/configs/bundles/${id}/rollback`);
      alert('Đã khôi phục bundle thành công!');
      loadBundles();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể khôi phục bundle');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      config: {
        asset_types: [],
        node_types: [],
        pricing_policy_types: [],
        custom_fields: {},
      },
    });
  };

  const addAssetType = () => {
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        asset_types: [
          ...formData.config.asset_types,
          { key: '', label: '', fields: [] }
        ]
      }
    });
  };

  const addNodeType = () => {
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        node_types: [
          ...formData.config.node_types,
          { key: '', label: '', parent_types: [] }
        ]
      }
    });
  };

  const addPricingType = () => {
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        pricing_policy_types: [
          ...formData.config.pricing_policy_types,
          { key: '', label: '', default_config: {} }
        ]
      }
    });
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      ACTIVE: 'bg-green-100 text-green-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      ARCHIVED: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const translateStatus = (status: string) => {
    const map: any = {
      ACTIVE: 'Đang hoạt động',
      DRAFT: 'Nháp',
      ARCHIVED: 'Đã lưu trữ',
    };
    return map[status] || status;
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
              <h1 className="text-3xl font-bold text-gray-900">Config Bundles</h1>
              <p className="text-gray-600 mt-1">
                Quản lý cấu hình động - mở rộng hệ thống không cần rebuild
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ➕ Tạo Bundle mới
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-purple-900 mb-2">🎯 Config Bundle là gì?</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Định nghĩa các loại tài sản (asset_types): chung cư, nhà riêng, văn phòng...</li>
            <li>• Định nghĩa cấu trúc không gian (node_types): tầng, phòng, giường...</li>
            <li>• Định nghĩa loại chính sách giá (pricing_policy_types)</li>
            <li>• Custom fields động cho từng loại</li>
            <li>• Chỉ có 1 bundle ACTIVE tại một thời điểm</li>
            <li>• Có thể rollback về bundle cũ nếu cần</li>
          </ul>
        </div>

        {/* Bundles List */}
        {bundles.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có config bundle nào
            </h3>
            <p className="text-gray-600 mb-4">
              Tạo bundle đầu tiên để cấu hình hệ thống
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tạo bundle đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{bundle.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {bundle.description || 'Không có mô tả'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bundle.status)}`}>
                    {translateStatus(bundle.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Asset types:</span>
                    <span className="font-semibold text-gray-900">
                      {bundle.config?.asset_types?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Node types:</span>
                    <span className="font-semibold text-gray-900">
                      {bundle.config?.node_types?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pricing types:</span>
                    <span className="font-semibold text-gray-900">
                      {bundle.config?.pricing_policy_types?.length || 0}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Tạo: {new Date(bundle.created_at).toLocaleDateString('vi-VN')}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedBundle(bundle);
                      setShowDetailModal(true);
                    }}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-medium"
                  >
                    👁️ Xem chi tiết
                  </button>
                  {bundle.status === 'DRAFT' && (
                    <button
                      onClick={() => handleActivate(bundle.id)}
                      className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-2 rounded-lg text-sm font-medium"
                    >
                      ✓ Kích hoạt
                    </button>
                  )}
                  {bundle.status === 'ARCHIVED' && (
                    <button
                      onClick={() => handleRollback(bundle.id)}
                      className="w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-2 rounded-lg text-sm font-medium"
                    >
                      ↩️ Khôi phục
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedBundle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedBundle.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedBundle.description}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedBundle(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Asset Types */}
                {selectedBundle.config?.asset_types?.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">
                      Loại tài sản ({selectedBundle.config.asset_types.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedBundle.config.asset_types.map((type: any, index: number) => (
                        <div key={index} className="bg-white rounded p-3">
                          <div className="font-medium text-gray-900">{type.label || type.key}</div>
                          <div className="text-xs text-gray-500">Key: {type.key}</div>
                          {type.fields && type.fields.length > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              Fields: {type.fields.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Node Types */}
                {selectedBundle.config?.node_types?.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-3">
                      Loại không gian ({selectedBundle.config.node_types.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedBundle.config.node_types.map((type: any, index: number) => (
                        <div key={index} className="bg-white rounded p-3">
                          <div className="font-medium text-gray-900">{type.label || type.key}</div>
                          <div className="text-xs text-gray-500">Key: {type.key}</div>
                          {type.parent_types && type.parent_types.length > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                              Parent types: {type.parent_types.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing Policy Types */}
                {selectedBundle.config?.pricing_policy_types?.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-3">
                      Loại chính sách giá ({selectedBundle.config.pricing_policy_types.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedBundle.config.pricing_policy_types.map((type: any, index: number) => (
                        <div key={index} className="bg-white rounded p-3">
                          <div className="font-medium text-gray-900">{type.label || type.key}</div>
                          <div className="text-xs text-gray-500">Key: {type.key}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw JSON */}
                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                    📋 Xem cấu hình JSON đầy đủ
                  </summary>
                  <pre className="mt-3 p-3 bg-white rounded border border-gray-200 text-xs overflow-auto max-h-96">
                    {JSON.stringify(selectedBundle.config, null, 2)}
                  </pre>
                </details>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedBundle(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Tạo Config Bundle mới</h2>
              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên bundle *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                </div>

                {/* Asset Types */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-blue-900">Loại tài sản</h3>
                    <button
                      type="button"
                      onClick={addAssetType}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      ➕ Thêm
                    </button>
                  </div>
                  {formData.config.asset_types.length === 0 ? (
                    <p className="text-sm text-blue-700">Chưa có loại tài sản nào</p>
                  ) : (
                    <div className="space-y-2">
                      {formData.config.asset_types.map((type, index) => (
                        <div key={index} className="bg-white rounded p-3">
                          <input
                            type="text"
                            placeholder="Key (VD: apartment_building)"
                            value={type.key}
                            onChange={(e) => {
                              const newTypes = [...formData.config.asset_types];
                              newTypes[index].key = e.target.value;
                              setFormData({ ...formData, config: { ...formData.config, asset_types: newTypes } });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2"
                          />
                          <input
                            type="text"
                            placeholder="Label (VD: Chung cư)"
                            value={type.label}
                            onChange={(e) => {
                              const newTypes = [...formData.config.asset_types];
                              newTypes[index].label = e.target.value;
                              setFormData({ ...formData, config: { ...formData.config, asset_types: newTypes } });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Node Types */}
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-green-900">Loại không gian</h3>
                    <button
                      type="button"
                      onClick={addNodeType}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      ➕ Thêm
                    </button>
                  </div>
                  {formData.config.node_types.length === 0 ? (
                    <p className="text-sm text-green-700">Chưa có loại không gian nào</p>
                  ) : (
                    <div className="space-y-2">
                      {formData.config.node_types.map((type, index) => (
                        <div key={index} className="bg-white rounded p-3">
                          <input
                            type="text"
                            placeholder="Key (VD: floor)"
                            value={type.key}
                            onChange={(e) => {
                              const newTypes = [...formData.config.node_types];
                              newTypes[index].key = e.target.value;
                              setFormData({ ...formData, config: { ...formData.config, node_types: newTypes } });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2"
                          />
                          <input
                            type="text"
                            placeholder="Label (VD: Tầng)"
                            value={type.label}
                            onChange={(e) => {
                              const newTypes = [...formData.config.node_types];
                              newTypes[index].label = e.target.value;
                              setFormData({ ...formData, config: { ...formData.config, node_types: newTypes } });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pricing Types */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-purple-900">Loại chính sách giá</h3>
                    <button
                      type="button"
                      onClick={addPricingType}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      ➕ Thêm
                    </button>
                  </div>
                  {formData.config.pricing_policy_types.length === 0 ? (
                    <p className="text-sm text-purple-700">Chưa có loại chính sách giá nào</p>
                  ) : (
                    <div className="space-y-2">
                      {formData.config.pricing_policy_types.map((type, index) => (
                        <div key={index} className="bg-white rounded p-3">
                          <input
                            type="text"
                            placeholder="Key (VD: monthly_rent)"
                            value={type.key}
                            onChange={(e) => {
                              const newTypes = [...formData.config.pricing_policy_types];
                              newTypes[index].key = e.target.value;
                              setFormData({ ...formData, config: { ...formData.config, pricing_policy_types: newTypes } });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-2"
                          />
                          <input
                            type="text"
                            placeholder="Label (VD: Thuê theo tháng)"
                            value={type.label}
                            onChange={(e) => {
                              const newTypes = [...formData.config.pricing_policy_types];
                              newTypes[index].label = e.target.value;
                              setFormData({ ...formData, config: { ...formData.config, pricing_policy_types: newTypes } });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Tạo Bundle
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
