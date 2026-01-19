import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function AgreementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Terminate modal
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminateData, setTerminateData] = useState({
    terminated_at: new Date().toISOString().split('T')[0],
    termination_reason: '',
    termination_type: 'MUTUAL',
    termination_penalty: 0,
    deposit_refund_amount: 0,
    notes: '',
  });

  useEffect(() => {
    loadAgreement();
  }, [id]);

  const loadAgreement = async () => {
    try {
      const response = await apiClient.get(`/agreements/${id}`);
      setAgreement(response.data);
      
      // Auto-fill deposit refund
      if (response.data.deposit_amount) {
        setTerminateData(prev => ({
          ...prev,
          deposit_refund_amount: response.data.deposit_amount,
        }));
      }
    } catch (error) {
      console.error('Không thể tải hợp đồng:', error);
      alert('Không tìm thấy hợp đồng');
      navigate('/agreements');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!confirm('Gửi hợp đồng này cho khách thuê?')) return;
    
    try {
      setActionLoading(true);
      await apiClient.post(`/agreements/${id}/send`);
      alert('Đã gửi hợp đồng cho khách thuê!');
      loadAgreement();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể gửi hợp đồng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!confirm('Kích hoạt hợp đồng này? Tài sản sẽ chuyển sang trạng thái OCCUPIED.')) return;
    
    try {
      setActionLoading(true);
      await apiClient.post(`/agreements/${id}/activate`);
      alert('Đã kích hoạt hợp đồng!');
      loadAgreement();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể kích hoạt hợp đồng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminate = async () => {
    if (!terminateData.termination_reason) {
      alert('Vui lòng nhập lý do chấm dứt');
      return;
    }
    
    try {
      setActionLoading(true);
      await apiClient.post(`/agreements/${id}/terminate`, terminateData);
      alert('Đã chấm dứt hợp đồng!');
      setShowTerminateModal(false);
      loadAgreement();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể chấm dứt hợp đồng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Xóa hợp đồng này? Chỉ có thể xóa hợp đồng ở trạng thái DRAFT.')) return;
    
    try {
      setActionLoading(true);
      await apiClient.delete(`/agreements/${id}`);
      alert('Đã xóa hợp đồng!');
      navigate('/agreements');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể xóa hợp đồng');
      setActionLoading(false);
    }
  };

  const getStateColor = (state: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      PENDING_CONFIRM: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-orange-100 text-orange-800',
      TERMINATED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-600',
    };
    return colors[state] || 'bg-gray-100 text-gray-800';
  };

  const translateState = (state: string) => {
    const map: any = {
      DRAFT: 'Nháp',
      SENT: 'Đã gửi',
      PENDING_CONFIRM: 'Chờ xác nhận',
      ACTIVE: 'Đang hoạt động',
      EXPIRED: 'Hết hạn',
      TERMINATED: 'Đã chấm dứt',
      CANCELLED: 'Đã hủy',
    };
    return map[state] || state;
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

  if (!agreement) {
    return (
      <Layout userRole="LANDLORD">
        <div className="p-8">Không tìm thấy hợp đồng</div>
      </Layout>
    );
  }

  return (
    <Layout userRole="LANDLORD">
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/agreements')}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Quay lại danh sách
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Hợp đồng #{agreement.id.slice(0, 8)}
              </h1>
              <p className="text-gray-600 mt-1">
                {agreement.rentable_item?.space_node?.name || 'N/A'}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStateColor(agreement.state)}`}>
              {translateState(agreement.state)}
            </span>
          </div>
        </div>

        {/* State Machine Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Hành động</h2>
          <div className="flex gap-3 flex-wrap">
            {/* View Contract Button - Available for all states */}
            <button
              onClick={() => navigate(`/agreements/${id}/contract`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              📄 Xem hợp đồng
            </button>
            
            {agreement.state === 'DRAFT' && (
              <>
                <button
                  onClick={() => navigate(`/agreements/${id}/edit`)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  disabled={actionLoading}
                >
                  ✏️ Chỉnh sửa
                </button>
                <button
                  onClick={handleSend}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={actionLoading}
                >
                  📤 Gửi cho khách thuê
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  disabled={actionLoading}
                >
                  🗑️ Xóa
                </button>
              </>
            )}
            
            {agreement.state === 'SENT' && (
              <div className="text-blue-600">
                ⏳ Đang chờ khách thuê xác nhận...
              </div>
            )}
            
            {agreement.state === 'PENDING_CONFIRM' && (
              <>
                <button
                  onClick={handleActivate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  disabled={actionLoading}
                >
                  ✅ Kích hoạt hợp đồng
                </button>
                <div className="text-yellow-600">
                  ✓ Khách thuê đã xác nhận
                </div>
              </>
            )}
            
            {agreement.state === 'ACTIVE' && (
              <>
                <button
                  onClick={() => navigate(`/agreements/${id}/renew`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={actionLoading}
                >
                  🔄 Gia hạn
                </button>
                <button
                  onClick={() => setShowTerminateModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  disabled={actionLoading}
                >
                  ⛔ Chấm dứt
                </button>
              </>
            )}
            
            {agreement.state === 'EXPIRED' && (
              <button
                onClick={() => navigate(`/agreements/${id}/renew`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={actionLoading}
              >
                🔄 Gia hạn
              </button>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-600">Loại hợp đồng</label>
              <div className="font-medium">
                {agreement.agreement_type === 'LONG_TERM' ? 'Dài hạn' : 'Ngắn hạn'}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Chu kỳ thanh toán</label>
              <div className="font-medium">
                {agreement.payment_cycle === 'MONTHLY' ? 'Hàng tháng' : agreement.payment_cycle}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Ngày bắt đầu</label>
              <div className="font-medium">{formatDate(agreement.start_at)}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Ngày kết thúc</label>
              <div className="font-medium">
                {agreement.end_at ? formatDate(agreement.end_at) : 'Không xác định'}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Thông tin giá</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <label className="text-sm text-blue-700">Giá thuê cơ bản</label>
              <div className="text-2xl font-bold text-blue-900">
                {formatPrice(agreement.base_price || 0)}
              </div>
              <div className="text-sm text-blue-700">/tháng</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <label className="text-sm text-green-700">Tiền cọc</label>
              <div className="text-2xl font-bold text-green-900">
                {formatPrice(agreement.deposit_amount || 0)}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Phí dịch vụ</label>
              <div className="font-medium">{formatPrice(agreement.service_fee || 0)}/tháng</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Phí quản lý</label>
              <div className="font-medium">{formatPrice(agreement.building_mgmt_fee || 0)}/tháng</div>
            </div>
          </div>
          
          {agreement.price_increase_percent > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <div className="text-sm text-yellow-800">
                📈 Tăng giá {agreement.price_increase_percent}% mỗi {agreement.price_increase_frequency}
              </div>
            </div>
          )}
        </div>

        {/* Utilities */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tiện ích</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-600">Tính tiền điện</label>
              <div className="font-medium">
                {agreement.electricity_billing === 'ACTUAL' ? 'Theo thực tế' :
                 agreement.electricity_billing === 'FIXED' ? 'Cố định' : 'Đã bao gồm'}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Tính tiền nước</label>
              <div className="font-medium">
                {agreement.water_billing === 'ACTUAL' ? 'Theo thực tế' :
                 agreement.water_billing === 'FIXED' ? 'Cố định' : 'Đã bao gồm'}
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Lịch sử</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tạo lúc:</span>
              <span className="font-medium">{formatDate(agreement.created_at)}</span>
            </div>
            {agreement.sent_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Gửi lúc:</span>
                <span className="font-medium">{formatDate(agreement.sent_at)}</span>
              </div>
            )}
            {agreement.confirmed_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Xác nhận lúc:</span>
                <span className="font-medium">{formatDate(agreement.confirmed_at)}</span>
              </div>
            )}
            {agreement.activated_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Kích hoạt lúc:</span>
                <span className="font-medium">{formatDate(agreement.activated_at)}</span>
              </div>
            )}
            {agreement.terminated_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Chấm dứt lúc:</span>
                <span className="font-medium">{formatDate(agreement.terminated_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {agreement.landlord_notes && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Ghi chú nội bộ</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{agreement.landlord_notes}</p>
          </div>
        )}

        {/* Terminate Modal */}
        {showTerminateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-6">Chấm dứt hợp đồng</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày chấm dứt *
                  </label>
                  <input
                    type="date"
                    value={terminateData.terminated_at}
                    onChange={(e) => setTerminateData({ ...terminateData, terminated_at: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại chấm dứt *
                  </label>
                  <select
                    value={terminateData.termination_type}
                    onChange={(e) => setTerminateData({ ...terminateData, termination_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="MUTUAL">Thỏa thuận chung</option>
                    <option value="LANDLORD_INITIATED">Chủ nhà chấm dứt</option>
                    <option value="TENANT_INITIATED">Khách thuê chấm dứt</option>
                    <option value="BREACH">Vi phạm hợp đồng</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do chấm dứt *
                  </label>
                  <textarea
                    value={terminateData.termination_reason}
                    onChange={(e) => setTerminateData({ ...terminateData, termination_reason: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phí phạt (₫)
                    </label>
                    <input
                      type="number"
                      value={terminateData.termination_penalty}
                      onChange={(e) => setTerminateData({ ...terminateData, termination_penalty: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hoàn trả cọc (₫)
                    </label>
                    <input
                      type="number"
                      value={terminateData.deposit_refund_amount}
                      onChange={(e) => setTerminateData({ ...terminateData, deposit_refund_amount: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    value={terminateData.notes}
                    onChange={(e) => setTerminateData({ ...terminateData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTerminateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={actionLoading}
                >
                  Hủy
                </button>
                <button
                  onClick={handleTerminate}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Đang xử lý...' : 'Chấm dứt hợp đồng'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
