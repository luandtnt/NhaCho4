import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function RenewAgreementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [oldAgreement, setOldAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    new_start_at: '',
    new_end_at: '',
    new_base_price: 0,
    new_deposit_amount: 0,
    new_service_fee: 0,
    new_terms_json: {},
    notes: '',
  });

  useEffect(() => {
    loadOldAgreement();
  }, [id]);

  const loadOldAgreement = async () => {
    try {
      const response = await apiClient.get(`/agreements/${id}`);
      const agreement = response.data;
      setOldAgreement(agreement);
      
      // Auto-fill with old values
      const oldEndDate = new Date(agreement.end_at || agreement.start_at);
      const newStartDate = new Date(oldEndDate);
      newStartDate.setDate(newStartDate.getDate() + 1);
      
      const newEndDate = new Date(newStartDate);
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      
      // Apply price increase if configured
      let newPrice = agreement.base_price;
      if (agreement.price_increase_percent > 0) {
        newPrice = agreement.base_price * (1 + agreement.price_increase_percent / 100);
      }
      
      setFormData({
        new_start_at: newStartDate.toISOString().split('T')[0],
        new_end_at: newEndDate.toISOString().split('T')[0],
        new_base_price: Math.round(newPrice),
        new_deposit_amount: agreement.deposit_amount,
        new_service_fee: agreement.service_fee,
        new_terms_json: agreement.terms_json || {},
        notes: '',
      });
    } catch (error) {
      console.error('Không thể tải hợp đồng:', error);
      alert('Không tìm thấy hợp đồng');
      navigate('/agreements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirm('Tạo hợp đồng gia hạn mới? Hợp đồng cũ sẽ được đánh dấu là đã gia hạn.')) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post(`/agreements/${id}/renew`, formData);
      alert('Đã tạo hợp đồng gia hạn thành công!');
      navigate(`/agreements/${response.data.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể gia hạn hợp đồng');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' ₫';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <Layout userRole="LANDLORD">
        <div className="p-8">Đang tải...</div>
      </Layout>
    );
  }

  if (!oldAgreement) {
    return (
      <Layout userRole="LANDLORD">
        <div className="p-8">Không tìm thấy hợp đồng</div>
      </Layout>
    );
  }

  return (
    <Layout userRole="LANDLORD">
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/agreements/${id}`)}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Quay lại chi tiết hợp đồng
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Gia hạn hợp đồng</h1>
          <p className="text-gray-600 mt-1">
            Tạo hợp đồng mới dựa trên hợp đồng #{oldAgreement.id.slice(0, 8)}
          </p>
        </div>

        {/* Old Agreement Summary */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Hợp đồng hiện tại</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-blue-700">Thời gian</div>
              <div className="font-medium text-blue-900">
                {formatDate(oldAgreement.start_at)} → {oldAgreement.end_at ? formatDate(oldAgreement.end_at) : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-blue-700">Giá thuê</div>
              <div className="font-medium text-blue-900">
                {formatPrice(oldAgreement.base_price)}/tháng
              </div>
            </div>
            <div>
              <div className="text-blue-700">Tiền cọc</div>
              <div className="font-medium text-blue-900">
                {formatPrice(oldAgreement.deposit_amount)}
              </div>
            </div>
          </div>
          
          {oldAgreement.price_increase_percent > 0 && (
            <div className="mt-3 p-3 bg-yellow-100 rounded text-sm text-yellow-800">
              📈 Tăng giá tự động: {oldAgreement.price_increase_percent}% đã được áp dụng
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Period */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Thời gian hợp đồng mới</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  value={formData.new_start_at}
                  onChange={(e) => setFormData({ ...formData, new_start_at: e.target.value })}
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
                  value={formData.new_end_at}
                  onChange={(e) => setFormData({ ...formData, new_end_at: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>
          </div>

          {/* New Pricing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Giá mới</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá thuê cơ bản (₫/tháng) *
                </label>
                <input
                  type="number"
                  value={formData.new_base_price}
                  onChange={(e) => setFormData({ ...formData, new_base_price: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <div className="text-sm text-gray-600 mt-1">
                  {formatPrice(formData.new_base_price)}
                </div>
                {formData.new_base_price !== oldAgreement.base_price && (
                  <div className="text-sm text-blue-600 mt-1">
                    {formData.new_base_price > oldAgreement.base_price ? '↑' : '↓'} 
                    {' '}
                    {Math.abs(((formData.new_base_price - oldAgreement.base_price) / oldAgreement.base_price * 100)).toFixed(1)}%
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiền cọc (₫) *
                </label>
                <input
                  type="number"
                  value={formData.new_deposit_amount}
                  onChange={(e) => setFormData({ ...formData, new_deposit_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <div className="text-sm text-gray-600 mt-1">
                  {formatPrice(formData.new_deposit_amount)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phí dịch vụ (₫/tháng)
                </label>
                <input
                  type="number"
                  value={formData.new_service_fee}
                  onChange={(e) => setFormData({ ...formData, new_service_fee: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Ghi chú</h2>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="Ghi chú về việc gia hạn (nếu có)"
            />
          </div>

          {/* Summary */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-3">Tóm tắt</h3>
            <div className="space-y-2 text-sm text-green-800">
              <div>✓ Hợp đồng cũ sẽ được đánh dấu là "đã gia hạn"</div>
              <div>✓ Hợp đồng mới sẽ được tạo ở trạng thái DRAFT</div>
              <div>✓ Bạn cần gửi hợp đồng mới cho khách thuê để xác nhận</div>
              <div>✓ Tài sản vẫn giữ nguyên trạng thái OCCUPIED</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(`/agreements/${id}`)}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Đang tạo...' : 'Tạo hợp đồng gia hạn'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
