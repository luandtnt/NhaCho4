import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface NodeDetailModalProps {
  nodeId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface SpaceNode {
  id: string;
  name: string;
  node_type: string;
  parent_id: string | null;
  asset_id: string;
  path: string;
  attrs: any;
  created_at: string;
  updated_at: string;
  asset?: any;
  parent?: any;
  children?: any[];
  rentable_items?: any[];
}

export default function NodeDetailModal({ nodeId, onClose, onUpdate }: NodeDetailModalProps) {
  const [node, setNode] = useState<SpaceNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'amenities' | 'images' | 'items'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadNodeDetail();
  }, [nodeId]);

  const loadNodeDetail = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/space-nodes/${nodeId}`);
      setNode(response.data);
      setFormData({
        name: response.data.name,
        attrs: response.data.attrs || {},
      });
    } catch (error) {
      console.error('Không thể tải chi tiết node:', error);
      alert('Không thể tải thông tin chi tiết');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await apiClient.put(`/space-nodes/${nodeId}`, formData);
      alert('Cập nhật thành công!');
      setIsEditing(false);
      loadNodeDetail();
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể cập nhật');
    }
  };

  const updateAttrs = (key: string, value: any) => {
    setFormData({
      ...formData,
      attrs: {
        ...formData.attrs,
        [key]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!node) return null;

  const nodeTypeLabels: Record<string, string> = {
    building: 'Tòa nhà',
    floor: 'Tầng',
    unit: 'Căn hộ/Phòng',
    room: 'Phòng',
    bed: 'Giường',
    slot: 'Slot',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{node.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {nodeTypeLabels[node.node_type] || node.node_type} • {node.path}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50 px-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-3 font-medium ${
              activeTab === 'info'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Thông tin chung
          </button>
          <button
            onClick={() => setActiveTab('amenities')}
            className={`px-4 py-3 font-medium ${
              activeTab === 'amenities'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Tiện nghi & Đặc điểm
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-3 font-medium ${
              activeTab === 'images'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Hình ảnh
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-3 font-medium ${
              activeTab === 'items'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Rentable Items ({node.rentable_items?.length || 0})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <InfoTab
              node={node}
              isEditing={isEditing}
              formData={formData}
              setFormData={setFormData}
              updateAttrs={updateAttrs}
            />
          )}
          {activeTab === 'amenities' && (
            <AmenitiesTab
              node={node}
              isEditing={isEditing}
              formData={formData}
              updateAttrs={updateAttrs}
            />
          )}
          {activeTab === 'images' && (
            <ImagesTab
              node={node}
              isEditing={isEditing}
              formData={formData}
              updateAttrs={updateAttrs}
            />
          )}
          {activeTab === 'items' && <ItemsTab node={node} />}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          {!isEditing ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Đóng
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Chỉnh sửa
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: node.name,
                    attrs: node.attrs || {},
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Lưu thay đổi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Tab Components
function InfoTab({ node, isEditing, formData, setFormData, updateAttrs }: any) {
  const renderField = (label: string, value: any, editable = false, key?: string) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {isEditing && editable && key ? (
        <input
          type="text"
          value={formData.attrs[key] || ''}
          onChange={(e) => updateAttrs(key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{value || '-'}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Thông tin cơ bản</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{node.name}</p>
            )}
          </div>
          {renderField('Mã code', node.attrs.code, true, 'code')}
          {renderField('Loại', node.node_type)}
          {renderField('Path', node.path)}
        </div>
      </div>

      {node.node_type === 'building' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Thông tin tòa nhà</h3>
          <div className="grid grid-cols-2 gap-4">
            {renderField('Địa chỉ', node.attrs.address, true, 'address')}
            {renderField('Phường/Xã', node.attrs.ward, true, 'ward')}
            {renderField('Quận/Huyện', node.attrs.district, true, 'district')}
            {renderField('Tỉnh/Thành phố', node.attrs.city, true, 'city')}
            {renderField('Số tầng', node.attrs.total_floors, true, 'total_floors')}
            {renderField('Diện tích đất (m²)', node.attrs.land_area, true, 'land_area')}
            {renderField('Năm xây dựng', node.attrs.year_built, true, 'year_built')}
            {renderField('Trạng thái', node.attrs.status, true, 'status')}
          </div>
        </div>
      )}

      {(node.node_type === 'unit' || node.node_type === 'room') && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Thông tin phòng</h3>
          <div className="grid grid-cols-2 gap-4">
            {renderField('Diện tích (m²)', node.attrs.area, true, 'area')}
            {renderField('Loại phòng', node.attrs.room_type, true, 'room_type')}
            {renderField('Số giường tối đa', node.attrs.max_beds, true, 'max_beds')}
            {renderField('Giá thuê cơ bản (VNĐ)', node.attrs.base_price, true, 'base_price')}
            {renderField('Trạng thái', node.attrs.status, true, 'status')}
          </div>
        </div>
      )}

      {node.node_type === 'bed' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Thông tin giường</h3>
          <div className="grid grid-cols-2 gap-4">
            {renderField('Mã giường', node.attrs.bed_code, true, 'bed_code')}
            {renderField('Loại giường', node.attrs.bed_type, true, 'bed_type')}
            {renderField('Kích thước', node.attrs.size, true, 'size')}
            {renderField('Giá thuê (VNĐ)', node.attrs.price, true, 'price')}
            {renderField('Trạng thái', node.attrs.status, true, 'status')}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Thông tin hệ thống</h3>
        <div className="grid grid-cols-2 gap-4">
          {renderField('ID', node.id)}
          {renderField('Asset ID', node.asset_id)}
          {renderField('Parent ID', node.parent_id || 'Root')}
          {renderField('Ngày tạo', new Date(node.created_at).toLocaleString('vi-VN'))}
          {renderField('Cập nhật lần cuối', new Date(node.updated_at).toLocaleString('vi-VN'))}
        </div>
      </div>
    </div>
  );
}

function AmenitiesTab({ node, isEditing, formData, updateAttrs }: any) {
  const amenitiesByType: Record<string, string[]> = {
    building: ['Thang máy', 'Bãi đỗ xe', 'An ninh 24/7', 'Camera giám sát', 'Phòng gym', 'Hồ bơi'],
    floor: ['WC chung', 'Phòng giặt', 'Khu vực chung', 'Ban công chung'],
    unit: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh', 'Máy giặt', 'Bếp', 'Ban công', 'WiFi', 'Giường', 'Tủ quần áo'],
    room: ['Điều hòa', 'Cửa sổ', 'Ban công', 'Tủ quần áo'],
  };

  const availableAmenities = amenitiesByType[node.node_type] || [];
  const currentAmenities = formData.attrs.amenities || [];

  const toggleAmenity = (amenity: string) => {
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a: string) => a !== amenity)
      : [...currentAmenities, amenity];
    updateAttrs('amenities', newAmenities);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Tiện nghi</h3>
        <div className="grid grid-cols-3 gap-3">
          {availableAmenities.map((amenity) => (
            <label
              key={amenity}
              className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                currentAmenities.includes(amenity)
                  ? 'bg-blue-50 border-blue-500'
                  : 'bg-gray-50 border-gray-300'
              } ${!isEditing ? 'cursor-default' : 'hover:bg-blue-50'}`}
            >
              <input
                type="checkbox"
                checked={currentAmenities.includes(amenity)}
                onChange={() => isEditing && toggleAmenity(amenity)}
                disabled={!isEditing}
                className="mr-2"
              />
              <span className="text-sm">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Ghi chú</h3>
        {isEditing ? (
          <textarea
            value={formData.attrs.notes || ''}
            onChange={(e) => updateAttrs('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Ghi chú về bảo trì, sửa chữa, hoặc thông tin khác..."
          />
        ) : (
          <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg whitespace-pre-wrap">
            {node.attrs.notes || 'Chưa có ghi chú'}
          </p>
        )}
      </div>
    </div>
  );
}

function ImagesTab({ node, isEditing, formData, updateAttrs }: any) {
  const images = formData.attrs.images || [];

  const addImageUrl = () => {
    const url = prompt('Nhập URL hình ảnh:');
    if (url) {
      updateAttrs('images', [...images, url]);
    }
  };

  const removeImage = (index: number) => {
    updateAttrs('images', images.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Hình ảnh</h3>
        {isEditing && (
          <button
            onClick={addImageUrl}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Thêm hình ảnh
          </button>
        )}
      </div>

      {images.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Chưa có hình ảnh</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {images.map((url: string, index: number) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect width="300" height="200" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EImage Error%3C/text%3E%3C/svg%3E';
                }}
              />
              {isEditing && (
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemsTab({ node }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Rentable Items</h3>
      {!node.rentable_items || node.rentable_items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Chưa có rentable items</p>
      ) : (
        <div className="space-y-3">
          {node.rentable_items.map((item: any, index: number) => (
            <div key={item.id || index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{item.code}</h4>
                  <p className="text-sm text-gray-600">
                    Loại: {item.allocation_type} • Trạng thái: {item.status}
                  </p>
                  {item.capacity && (
                    <p className="text-sm text-gray-600">Sức chứa: {item.capacity}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
