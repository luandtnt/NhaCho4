import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function TenantPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const response = await apiClient.get('/tenant/payments?page=1&page_size=20');
      setPayments(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải danh sách thanh toán:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      SUCCEEDED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const translateStatus = (status: string) => {
    const map: any = {
      SUCCEEDED: 'Thành công',
      PENDING: 'Đang xử lý',
      FAILED: 'Thất bại',
      REFUNDED: 'Đã hoàn tiền',
      PROCESSING: 'Đang xử lý',
    };
    return map[status] || status;
  };

  if (loading) {
    return (
      <Layout userRole="TENANT">
        <div className="p-8">Đang tải...</div>
      </Layout>
    );
  }

  return (
    <Layout userRole="TENANT">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Lịch sử thanh toán</h1>
          <p className="text-gray-600 mt-1">
            Xem tất cả các giao dịch thanh toán của bạn
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-sm text-green-600">Thành công</div>
            <div className="text-2xl font-bold text-green-900">
              {payments.filter(p => p.status === 'SUCCEEDED').length}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-sm text-yellow-600">Đang xử lý</div>
            <div className="text-2xl font-bold text-yellow-900">
              {payments.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING').length}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-sm text-red-600">Thất bại</div>
            <div className="text-2xl font-bold text-red-900">
              {payments.filter(p => p.status === 'FAILED').length}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-4">
            <div className="text-sm text-purple-600">Tổng đã trả</div>
            <div className="text-xl font-bold text-purple-900">
              {payments
                .filter(p => p.status === 'SUCCEEDED')
                .reduce((sum, p) => sum + (p.amount || 0), 0)
                .toLocaleString('vi-VN')} ₫
            </div>
          </div>
        </div>

        {/* Payments List */}
        {payments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có giao dịch nào
            </h3>
            <p className="text-gray-600">
              Lịch sử thanh toán của bạn sẽ hiển thị ở đây
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mã giao dịch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phương thức
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày thanh toán
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
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-gray-900">
                        #{payment.id.slice(0, 12)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-gray-900">
                        {(payment.amount || 0).toLocaleString('vi-VN')} ₫
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {payment.provider || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(payment.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {translateStatus(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Chi tiết thanh toán</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    #{selectedPayment.id}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedPayment(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Số tiền</h3>
                  <div className="text-3xl font-bold text-green-900">
                    {(selectedPayment.amount || 0).toLocaleString('vi-VN')} ₫
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Trạng thái</label>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                          {translateStatus(selectedPayment.status)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Phương thức</label>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedPayment.provider || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Ngày thanh toán</label>
                      <div className="text-sm text-gray-900">
                        {new Date(selectedPayment.created_at).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Mã giao dịch</label>
                      <div className="text-sm font-mono text-gray-900">
                        {selectedPayment.provider_transaction_id || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedPayment.invoice_id && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <label className="text-sm text-blue-700">Hóa đơn liên quan</label>
                    <div className="text-sm font-mono text-blue-900">
                      {selectedPayment.invoice_id}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedPayment(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
