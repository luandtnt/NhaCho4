import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';
import EnhancedPropertyForm from '../components/EnhancedPropertyForm';

export default function RentableItemsPage() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAssetFilter, setSelectedAssetFilter] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [spaceNodes, setSpaceNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    if (assetId) {
      loadAsset();
      loadSpaceNodes();
    } else {
      loadAllAssets();
    }
    loadItems();
  }, [assetId, selectedAssetFilter]);

  const loadAllAssets = async () => {
    try {
      const response = await apiClient.get('/assets?page=1&page_size=100');
      const allAssets = response.data.data || [];
      const activeAssets = allAssets.filter((a: any) => a.status !== 'ARCHIVED');
      setAssets(activeAssets);
    } catch (error) {
      console.error('Không thể tải danh sách assets:', error);
    }
  };

  const loadAsset = async () => {
    if (!assetId) return;
    try {
      const response = await apiClient.get(`/assets/${assetId}`);
      setAsset(response.data);
    } catch (error) {
      console.error('Không thể tải tài sản:', error);
    }
  };

  const loadItems = async () => {
    try {
      // Determine which asset_id to use for filtering
      const filterAssetId = assetId || selectedAssetFilter;
      const url = filterAssetId 
        ? `/rentable-items?asset_id=${filterAssetId}&page=1&page_size=500`
        : `/rentable-items?page=1&page_size=500`;
      const response = await apiClient.get(url);
      const allItems = response.data.data || [];
      // Filter out INACTIVE items (soft deleted)
      const activeItems = allItems.filter((item: any) => item.status !== 'INACTIVE');
      setItems(activeItems);
    } catch (error) {
      console.error('Không thể tải danh sách rentable items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSpaceNodes = async () => {
    if (!assetId) return;
    try {
      const response = await apiClient.get(`/space-nodes?asset_id=${assetId}&page_size=1000`);
      setSpaceNodes(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải danh sách space nodes:', error);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (editingItem) {
        console.log('📤 Updating item:', editingItem.id);
        console.log('📦 Form data:', formData);
        await apiClient.put(`/rentable-items/${editingItem.id}`, formData);
        alert('Cập nhật thành công!');
      } else {
        console.log('📤 Creating new item');
        console.log('📦 Form data:', formData);
        await apiClient.post('/rentable-items', formData);
        alert('Tạo rentable item thành công!');
      }
      setShowCreateModal(false);
      setEditingItem(null);
      loadItems();
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      console.error('❌ Error response:', error.response?.data);
      alert(error.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowCreateModal(true);
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: string) => {
    const item = items.find(i => i.id === id);
    const itemName = item?.code || 'item này';
    
    if (!confirm(`⚠️ Bạn có chắc muốn XÓA (deactivate) rentable item "${itemName}"?\n\nLưu ý: Item sẽ được chuyển sang trạng thái INACTIVE, không bị xóa vĩnh viễn.`)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/rentable-items/${id}`);
      alert(`✅ ${response.data.message || 'Đã deactivate rentable item thành công!'}`);
      loadItems();
    } catch (error: any) {
      console.error('Delete error:', error);
      const errorData = error.response?.data;
      const errorCode = errorData?.error_code;
      const errorMsg = errorData?.message || error.message || 'Không thể xóa';
      
      if (errorCode === 'HAS_ACTIVE_BOOKINGS') {
        const count = errorData?.details?.active_bookings || 0;
        alert(`❌ Không thể xóa!\n\nItem này có ${count} booking đang hoạt động.\nVui lòng hủy hoặc hoàn thành các booking trước khi xóa.`);
      } else if (errorCode === 'HAS_ACTIVE_LISTINGS') {
        const count = errorData?.details?.active_listings || 0;
        alert(`❌ Không thể xóa!\n\nItem này có ${count} listing đang được publish.\nVui lòng unpublish các listing trước khi xóa.`);
      } else if (error.response?.status === 403) {
        alert('❌ Lỗi: Bạn không có quyền xóa rentable item này.');
      } else if (error.response?.status === 404) {
        alert('❌ Không tìm thấy rentable item này.');
      } else {
        alert(`❌ Lỗi: ${errorMsg}`);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      AVAILABLE: 'bg-green-100 text-green-800',
      OCCUPIED: 'bg-blue-100 text-blue-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const translateStatus = (status: string) => {
    const map: any = {
      AVAILABLE: 'Có sẵn',
      OCCUPIED: 'Đã thuê',
      MAINTENANCE: 'Bảo trì',
      INACTIVE: 'Không hoạt động',
    };
    return map[status] || status;
  };

  const translateAllocationType = (type: string) => {
    const map: any = {
      exclusive: 'Độc quyền',
      capacity: 'Theo sức chứa',
      slot: 'Theo slot',
    };
    return map[type] || type;
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
          <button
            onClick={() => navigate('/assets')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Quay lại danh sách tài sản
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {assetId ? `Rentable Items: ${asset?.name || 'Asset'}` : 'Tất cả Rentable Items'}
              </h1>
              <p className="text-gray-600 mt-1">
                {assetId 
                  ? 'Quản lý các đơn vị cho thuê của tài sản này'
                  : 'Quản lý tất cả các đơn vị cho thuê'
                }
              </p>
            </div>
            {assetId && (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowCreateModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ➕ Tạo Rentable Item
              </button>
            )}
          </div>
        </div>

        {/* Asset Filter - Only show when viewing all items */}
        {!assetId && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏢 Lọc theo tài sản
            </label>
            <select
              value={selectedAssetFilter}
              onChange={(e) => setSelectedAssetFilter(e.target.value)}
              className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả tài sản ({items.length} items)</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Items List */}
        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có rentable item nào
            </h3>
            <p className="text-gray-600 mb-4">
              Tạo rentable items để có thể cho thuê
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tạo item đầu tiên
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mã
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Space Node
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Loại phân bổ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sức chứa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.code}</div>
                      <div className="text-xs text-gray-500">ID: {item.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.space_node_id ? (
                        <span className="text-blue-600">
                          {spaceNodes.find(n => n.id === item.space_node_id)?.name || 
                           `Node ${item.space_node_id.slice(0, 8)}`}
                        </span>
                      ) : (
                        <span className="text-gray-400">Chưa gắn</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {translateAllocationType(item.allocation_type)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.capacity || 1}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {translateStatus(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingItem ? 'Chỉnh sửa Rentable Item' : 'Tạo Rentable Item mới'}
              </h2>
              
              <EnhancedPropertyForm
                initialData={editingItem}
                spaceNodes={spaceNodes}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
