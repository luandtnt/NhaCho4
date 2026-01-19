import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function AssetsPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [formData, setFormData] = useState({
    asset_type: 'apartment_building',
    name: '',
    address_json: { street: '', city: '', district: '', ward: '' },
    attrs: {},
  });

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const response = await apiClient.get('/assets?page=1&page_size=50');
      const allAssets = response.data.data || [];
      // Filter out ARCHIVED assets (soft deleted)
      const activeAssets = allAssets.filter((asset: any) => asset.status !== 'ARCHIVED');
      setAssets(activeAssets);
    } catch (error) {
      console.error('Không thể tải danh sách tài sản:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        await apiClient.put(`/assets/${editingAsset.id}`, formData);
      } else {
        await apiClient.post('/assets', formData);
      }
      setShowCreateForm(false);
      setEditingAsset(null);
      setFormData({
        asset_type: 'apartment_building',
        name: '',
        address_json: { street: '', city: '', district: '', ward: '' },
        attrs: {},
      });
      loadAssets();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể thực hiện thao tác');
    }
  };

  const handleEdit = (asset: any) => {
    setEditingAsset(asset);
    setFormData({
      asset_type: asset.asset_type,
      name: asset.name,
      address_json: asset.address_json || { street: '', city: '', district: '', ward: '' },
      attrs: asset.attrs || {},
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    const asset = assets.find(a => a.id === id);
    const assetName = asset?.name || 'tài sản này';
    
    if (!confirm(`⚠️ Bạn có chắc muốn XÓA tài sản "${assetName}"?\n\nCảnh báo: Tất cả space nodes và rentable items liên quan cũng sẽ bị ảnh hưởng!`)) {
      return;
    }
    
    try {
      const response = await apiClient.delete(`/assets/${id}`);
      alert(`✅ ${response.data?.message || 'Đã xóa tài sản thành công!'}`);
      loadAssets();
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorData = error.response?.data;
      const errorMsg = errorData?.message || error.message || 'Không thể xóa tài sản';
      
      if (error.response?.status === 403) {
        alert('❌ Lỗi: Bạn không có quyền xóa tài sản này.');
      } else if (error.response?.status === 409 || errorMsg.includes('constraint') || errorMsg.includes('foreign key')) {
        alert('❌ Không thể xóa!\n\nTài sản này có dữ liệu liên quan (space nodes, rentable items, bookings...).\nVui lòng xóa các dữ liệu liên quan trước.');
      } else if (error.response?.status === 404) {
        alert('❌ Không tìm thấy tài sản này.');
      } else {
        alert(`❌ Lỗi: ${errorMsg}`);
      }
    }
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý tài sản</h1>
            <p className="text-gray-600 mt-1">Quản lý các tòa nhà, căn hộ và tài sản cho thuê</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/rentable-items')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              🏠 Xem tất cả Rentable Items
            </button>
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setEditingAsset(null);
                setFormData({
                  asset_type: 'apartment_building',
                  name: '',
                  address_json: { street: '', city: '', district: '', ward: '' },
                  attrs: {},
                });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              {showCreateForm ? '✕ Hủy' : '+ Thêm tài sản'}
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingAsset ? 'Chỉnh sửa tài sản' : 'Thêm tài sản mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại tài sản
                  </label>
                  <select
                    value={formData.asset_type}
                    onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="apartment_building">Chung cư</option>
                    <option value="house">Nhà riêng</option>
                    <option value="villa">Biệt thự</option>
                    <option value="office">Văn phòng</option>
                    <option value="warehouse">Kho bãi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên tài sản *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đường</label>
                  <input
                    type="text"
                    value={formData.address_json.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address_json: { ...formData.address_json, street: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã</label>
                  <input
                    type="text"
                    value={formData.address_json.ward}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address_json: { ...formData.address_json, ward: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                  <input
                    type="text"
                    value={formData.address_json.district}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address_json: { ...formData.address_json, district: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
                  <input
                    type="text"
                    value={formData.address_json.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address_json: { ...formData.address_json, city: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
              >
                {editingAsset ? 'Cập nhật' : 'Tạo tài sản'}
              </button>
            </form>
          </div>
        )}

        {assets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có tài sản nào</h3>
            <p className="text-gray-600">Bắt đầu bằng cách thêm tài sản đầu tiên của bạn</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <div key={asset.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{asset.name}</h3>
                    <p className="text-sm text-gray-500">{asset.asset_type}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Hoạt động
                  </span>
                </div>

                {asset.address_json && (
                  <div className="text-sm text-gray-600 mb-4">
                    <p>📍 {asset.address_json.street}</p>
                    <p className="ml-4">
                      {[asset.address_json.ward, asset.address_json.district, asset.address_json.city]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  <button
                    onClick={() => navigate(`/assets/${asset.id}/space-graph`)}
                    className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-2 rounded-lg text-sm font-medium"
                  >
                    🌳 Xem cây không gian
                  </button>
                  <button
                    onClick={() => navigate(`/assets/${asset.id}/rentable-items`)}
                    className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 py-2 rounded-lg text-sm font-medium"
                  >
                    🏠 Quản lý Rentable Items
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(asset)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg text-sm font-medium"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-lg text-sm font-medium"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
