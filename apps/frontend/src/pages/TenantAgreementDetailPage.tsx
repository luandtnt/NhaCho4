import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function TenantAgreementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({
    request_type: 'RENEWAL',
    reason: '',
    desired_date: '',
    desired_extension_months: 12,
    desired_price: 0,
    notes: '',
  });

  useEffect(() => {
    loadAgreement();
  }, [id]);

  const loadAgreement = async () => {
    try {
      const response = await apiClient.get(`/agreements/${id}`);
      setAgreement(response.data);
      if (response.data.base_price) {
        setRequestData(prev => ({ ...prev, desired_price: response.data.base_price }));
      }
    } catch (error) {
      console.error('Không thể tải hợp đồng:', error);
      alert('Không tìm thấy hợp đồng');
      navigate('/my-agreements');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm('Xác nhận hợp đồng này?')) return;
    try {
      setActionLoading(true);
      await apiClient.post(`/agreements/${id}/confirm`);
      alert('Đã xác nhận hợp đồng!');
      loadAgreement();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể xác nhận');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      setActionLoading(true);
      await apiClient.post(`/agreements/${id}/reject`, { rejection_reason: rejectReason });
      alert('Đã từ chối hợp đồng!');
      setShowRejectModal(false);
      loadAgreement();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể từ chối');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestAction = async () => {
    if (!requestData.reason.trim()) {
      alert('Vui lòng nhập lý do yêu cầu');
      return;
    }
    try {
      setActionLoading(true);
      await apiClient.post(`/agreements/${id}/request`, requestData);
      alert('Đã gửi yêu cầu!');
      setShowRequestModal(false);
      loadAgreement();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể gửi yêu cầu');
    } finally {
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
      SENT: 'Chờ xác nhận',
      PENDING_CONFIRM: 'Đã xác nhận',
      ACTIVE: 'Đang hoạt động',
      EXPIRED: 'Hết hạn',
      TERMINATED: 'Đã kết thúc',
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
      <Layout userRole="TENANT">
        <div className="p-8">Đang tải...</div>
      </Layout>
    );
  }

  if (!agreement) {
    return (
      <Layout userRole="TENANT">
        <div className="p-8">Không tìm thấy hợp đồng</div>
      </Layout>
    );
  }

  return (
    <Layout userRole="TENANT">
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <button onClick={() => navigate('/my-agreements')} className="text-blue-600 hover:text-blue-700 mb-4">
            ← Quay lại
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {agreement.rentable_item?.space_node?.name || `Hợp đồng #${agreement.id.slice(0, 8)}`}
              </h1>
              <p className="text-gray-600 mt-1">Hợp đồng thuê nhà</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStateColor(agreement.state)}`}>
              {translateState(agreement.state)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Hành động</h2>
          <div className="flex gap-3 flex-wrap">
            {/* View Contract Button - Available for all states */}
            <button
              onClick={() => navigate(`/my-agreements/${id}/contract`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              📄 Xem hợp đồng
            </button>
            
            {agreement.state === 'SENT' && (
              <>
                <button onClick={handleConfirm} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700" disabled={actionLoading}>
                  ✅ Xác nhận
                </button>
                <button onClick={() => setShowRejectModal(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700" disabled={actionLoading}>
                  ❌ Từ chối
                </button>
              </>
            )}
            {agreement.state === 'PENDING_CONFIRM' && (
              <div className="text-blue-600">✓ Đã xác nhận. Chờ chủ nhà kích hoạt...</div>
            )}
            {agreement.state === 'ACTIVE' && (
              <>
                <button onClick={() => { setRequestData({ ...requestData, request_type: 'RENEWAL' }); setShowRequestModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  🔄 Yêu cầu gia hạn
                </button>
                <button onClick={() => { setRequestData({ ...requestData, request_type: 'TERMINATION' }); setShowRequestModal(true); }} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                  ⛔ Yêu cầu chấm dứt
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-600">Ngày bắt đầu</label>
              <div className="font-medium">{formatDate(agreement.start_at)}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Ngày kết thúc</label>
              <div className="font-medium">{agreement.end_at ? formatDate(agreement.end_at) : 'Không xác định'}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Chi phí</h2>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">Tiền thuê</span>
              <span className="text-2xl font-bold text-blue-900">{formatPrice(agreement.base_price || 0)}</span>
            </div>
            <div className="flex justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="font-medium">Tiền cọc</span>
              <span className="text-xl font-bold text-yellow-900">{formatPrice(agreement.deposit_amount || 0)}</span>
            </div>
          </div>
        </div>

        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">Từ chối hợp đồng</h2>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full px-4 py-2 border rounded-lg" rows={4} placeholder="Lý do từ chối..." />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Hủy</button>
                <button onClick={handleReject} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">Từ chối</button>
              </div>
            </div>
          </div>
        )}

        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-6">{requestData.request_type === 'RENEWAL' ? 'Yêu cầu gia hạn' : 'Yêu cầu chấm dứt'}</h2>
              <div className="space-y-4">
                <textarea value={requestData.reason} onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows={3} placeholder="Lý do..." />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowRequestModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Hủy</button>
                <button onClick={handleRequestAction} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Gửi yêu cầu</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
