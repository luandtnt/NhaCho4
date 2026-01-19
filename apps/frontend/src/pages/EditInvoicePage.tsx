import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

const LINE_ITEM_TYPES = [
  { value: 'RENT', label: 'Tiền thuê' },
  { value: 'SERVICE_FEE', label: 'Phí dịch vụ' },
  { value: 'MGMT_FEE', label: 'Phí quản lý' },
  { value: 'ELECTRICITY', label: 'Tiền điện' },
  { value: 'WATER', label: 'Tiền nước' },
  { value: 'PARKING', label: 'Phí gửi xe' },
  { value: 'INTERNET', label: 'Phí internet' },
  { value: 'OTHER', label: 'Khác' },
];

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    period_start: '',
    period_end: '',
    due_date: '',
    line_items: [] as any[],
    notes: '',
  });

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/invoices/${id}`);
      const invoice = response.data;
      
      // Check if DRAFT
      if (invoice.state !== 'DRAFT') {
        alert('Chỉ có thể sửa hóa đơn ở trạng thái Nháp');
        navigate(`/invoices/${id}`);
        return;
      }
      
      // Map line items
      const lineItems = invoice.line_items_table?.map((item: any) => ({
        type: item.type,
        description: item.description,
        qty: item.qty,
        unit_price: item.unit_price,
      })) || [];
      
      setFormData({
        period_start: invoice.period_start?.split('T')[0] || '',
        period_end: invoice.period_end?.split('T')[0] || '',
        due_date: invoice.due_at?.split('T')[0] || '',
        line_items: lineItems,
        notes: invoice.notes || '',
      });
    } catch (error) {
      console.error('Failed to load invoice:', error);
      alert('Không thể tải hóa đơn');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate
      if (formData.line_items.length === 0) {
        alert('Vui lòng thêm ít nhất một khoản thu');
        return;
      }
      
      await apiClient.patch(`/invoices/${id}`, formData);
      alert('Đã lưu thay đổi thành công!');
      navigate(`/invoices/${id}`);
    } catch (error: any) {
      console.error('Failed to save invoice:', error);
      alert(error.response?.data?.message || 'Không thể lưu thay đổi');
    } finally {
      setSaving(false);
    }
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [
        ...formData.line_items,
        { type: 'RENT', description: '', qty: 1, unit_price: 0 }
      ]
    });
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.line_items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, line_items: newItems });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      line_items: formData.line_items.filter((_, i) => i !== index)
    });
  };

  const calculateTotal = () => {
    return formData.line_items.reduce((sum, item) => {
      const amount = (item.unit_price || 0) * (item.qty || 1);
      return sum + amount;
    }, 0);
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
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/invoices/${id}`)}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Quay lại
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Sửa hóa đơn</h1>
          <p className="text-gray-600 mt-1">
            Chỉnh sửa thông tin hóa đơn nháp
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Period */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Kỳ hóa đơn</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  value={formData.period_start}
                  onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày kết thúc *
                </label>
                <input
                  type="date"
                  value={formData.period_end}
                  onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hạn thanh toán
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Các khoản thu</h2>
              <button
                type="button"
                onClick={addLineItem}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ➕ Thêm khoản
              </button>
            </div>

            {formData.line_items.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <p>Chưa có khoản thu nào. Click "Thêm khoản" để bắt đầu.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.line_items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Loại</label>
                        <select
                          value={item.type}
                          onChange={(e) => updateLineItem(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        >
                          {LINE_ITEM_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-span-4">
                        <label className="block text-xs text-gray-600 mb-1">Mô tả *</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          placeholder="VD: Tiền thuê tháng 1"
                          required
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Số lượng</label>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateLineItem(index, 'qty', parseFloat(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <div className="col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">Đơn giá (₫)</label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          min="0"
                          step="1000"
                        />
                      </div>
                      
                      <div className="col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="w-full px-2 py-2 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100"
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-right text-sm text-gray-600">
                      Thành tiền: <span className="font-semibold">{((item.unit_price || 0) * (item.qty || 1)).toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {calculateTotal().toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="Ghi chú thêm cho hóa đơn..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate(`/invoices/${id}`)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || formData.line_items.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
