import { useState, useEffect } from 'react';

interface NodeFormModalProps {
  mode: 'create' | 'edit';
  initialData?: any;
  nodes: any[];
  parentId?: string;
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export default function NodeFormModal({ mode, initialData, nodes, parentId, onSubmit, onClose }: NodeFormModalProps) {
  const [step, setStep] = useState<'select-type' | 'fill-form'>(mode === 'edit' ? 'fill-form' : 'select-type');
  const [formData, setFormData] = useState({
    name: '',
    node_type: 'floor',
    parent_id: parentId || '',
    attrs: {} as any,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        node_type: initialData.node_type || 'floor',
        parent_id: initialData.parent_id || '',
        attrs: initialData.attrs || {},
      });
    }
  }, [initialData]);

  const handleTypeSelect = (type: string) => {
    setFormData({
      ...formData,
      node_type: type,
    });
    setStep('fill-form');
  };

  const updateAttr = (key: string, value: any) => {
    setFormData({
      ...formData,
      attrs: {
        ...formData.attrs,
        [key]: value,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên node');
      return;
    }
    onSubmit(formData);
  };

  const renderFieldsByType = () => {
    switch (formData.node_type) {
      case 'building':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã tòa nhà
                </label>
                <input
                  type="text"
                  value={formData.attrs.code || ''}
                  onChange={(e) => updateAttr('code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: B1, B2..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tầng
                </label>
                <input
                  type="number"
                  value={formData.attrs.total_floors || ''}
                  onChange={(e) => updateAttr('total_floors', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <input
                type="text"
                value={formData.attrs.address || ''}
                onChange={(e) => updateAttr('address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="123 Nguyễn Văn A"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phường/Xã
                </label>
                <input
                  type="text"
                  value={formData.attrs.ward || ''}
                  onChange={(e) => updateAttr('ward', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Phường 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quận/Huyện
                </label>
                <input
                  type="text"
                  value={formData.attrs.district || ''}
                  onChange={(e) => updateAttr('district', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Quận 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tỉnh/TP
                </label>
                <input
                  type="text"
                  value={formData.attrs.city || ''}
                  onChange={(e) => updateAttr('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="TP.HCM"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diện tích đất (m²)
                </label>
                <input
                  type="number"
                  value={formData.attrs.land_area || ''}
                  onChange={(e) => updateAttr('land_area', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Năm xây dựng
                </label>
                <input
                  type="number"
                  value={formData.attrs.year_built || ''}
                  onChange={(e) => updateAttr('year_built', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="2020"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={formData.attrs.status || 'active'}
                onChange={(e) => updateAttr('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="active">Đang hoạt động</option>
                <option value="maintenance">Đang bảo trì</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>
          </>
        );

      case 'floor':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã tầng
              </label>
              <input
                type="text"
                value={formData.attrs.code || ''}
                onChange={(e) => updateAttr('code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="VD: F1, F2..."
              />
            </div>
          </>
        );

      case 'unit':
      case 'room':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã phòng
                </label>
                <input
                  type="text"
                  value={formData.attrs.code || ''}
                  onChange={(e) => updateAttr('code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: P101, R201..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diện tích (m²)
                </label>
                <input
                  type="number"
                  value={formData.attrs.area || ''}
                  onChange={(e) => updateAttr('area', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="25"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại phòng
                </label>
                <select
                  value={formData.attrs.room_type || ''}
                  onChange={(e) => updateAttr('room_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Chọn loại</option>
                  <option value="studio">Studio</option>
                  <option value="1pn">1 Phòng ngủ</option>
                  <option value="2pn">2 Phòng ngủ</option>
                  <option value="3pn">3 Phòng ngủ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số giường tối đa
                </label>
                <input
                  type="number"
                  value={formData.attrs.max_beds || ''}
                  onChange={(e) => updateAttr('max_beds', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá thuê cơ bản (VNĐ)
                </label>
                <input
                  type="number"
                  value={formData.attrs.base_price || ''}
                  onChange={(e) => updateAttr('base_price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="5000000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={formData.attrs.status || 'available'}
                  onChange={(e) => updateAttr('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="available">Trống</option>
                  <option value="occupied">Đang cho thuê</option>
                  <option value="maintenance">Đang sửa chữa</option>
                </select>
              </div>
            </div>
          </>
        );

      case 'bed':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã giường
                </label>
                <input
                  type="text"
                  value={formData.attrs.bed_code || ''}
                  onChange={(e) => updateAttr('bed_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: A1, B2..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại giường
                </label>
                <select
                  value={formData.attrs.bed_type || ''}
                  onChange={(e) => updateAttr('bed_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Chọn loại</option>
                  <option value="single">Giường đơn</option>
                  <option value="double">Giường đôi</option>
                  <option value="bunk">Giường tầng</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kích thước
                </label>
                <input
                  type="text"
                  value={formData.attrs.size || ''}
                  onChange={(e) => updateAttr('size', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="1m x 2m"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá thuê (VNĐ)
                </label>
                <input
                  type="number"
                  value={formData.attrs.price || ''}
                  onChange={(e) => updateAttr('price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="2000000"
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const nodeTypes = [
    { value: 'building', label: 'Tòa nhà', icon: '🏢', description: 'Toàn bộ tòa nhà/căn nhà' },
    { value: 'floor', label: 'Tầng', icon: '🏬', description: 'Tầng trong tòa nhà' },
    { value: 'unit', label: 'Căn hộ', icon: '🚪', description: 'Căn hộ/phòng độc lập' },
    { value: 'room', label: 'Phòng', icon: '🛏️', description: 'Phòng trong căn hộ' },
    { value: 'bed', label: 'Giường', icon: '🛌', description: 'Giường trong phòng' },
    { value: 'slot', label: 'Slot', icon: '📦', description: 'Chỗ đỗ xe, kho, tủ...' },
  ];

  // Step 1: Select Node Type
  if (step === 'select-type' && mode === 'create') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-3xl w-full">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Chọn loại node</h2>
            <p className="text-gray-600 mt-1">Bạn muốn tạo loại không gian nào?</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {nodeTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleTypeSelect(type.value)}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{type.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                      {type.label}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Fill Form
  const selectedTypeInfo = nodeTypes.find(t => t.value === formData.node_type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {mode === 'create' && (
              <button
                onClick={() => setStep('select-type')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Quay lại
              </button>
            )}
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {selectedTypeInfo?.icon} {mode === 'create' ? 'Thêm' : 'Chỉnh sửa'} {selectedTypeInfo?.label}
            </h2>
          </div>
          <p className="text-gray-600">{selectedTypeInfo?.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên {selectedTypeInfo?.label} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={`VD: ${
                formData.node_type === 'building' ? 'Tòa nhà A' :
                formData.node_type === 'floor' ? 'Tầng 1' :
                formData.node_type === 'unit' ? 'Phòng 101' :
                formData.node_type === 'room' ? 'Phòng ngủ 1' :
                formData.node_type === 'bed' ? 'Giường A1' : 'Slot 1'
              }`}
              required
            />
          </div>

          {mode === 'create' && nodes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Node cha (tùy chọn)
              </label>
              <select
                value={formData.parent_id}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Root (không có parent) --</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name} ({node.node_type})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chi tiết</h3>
            {renderFieldsByType()}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {mode === 'create' ? '✓ Thêm' : '✓ Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}