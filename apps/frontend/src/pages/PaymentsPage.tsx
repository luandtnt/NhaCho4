import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const loadPayments = async () => {
    try {
      let url = '/payments?page=1&page_size=50';
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }
      const response = await apiClient.get(url);
      setPayments(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải danh sách thanh toán:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      SUCCEEDED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
      PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const translateStatus = (status: string) => {
    const map: any = {
      PENDING: 'Đang xử lý',
      SUCCEEDED: 'Thành công',
      FAILED: 'Thất bại',
      REFUNDED: 'Đã hoàn tiền',
      PARTIALLY_REFUNDED: 'Hoàn một phần',
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý thanh toán</h1>
          <p className="text-gray-600 mt-1">Xem tất cả giao dịch thanh toán trong hệ thống</p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('SUCCEEDED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'SUCCEEDED'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Thành công
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'PENDING'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đang xử lý
            </button>
            <button
              onClick={() => setFilter('FAILED')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'FAILED'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Thất bại
            </button>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có thanh toán nào</h3>
            <p className="text-gray-600">Các giao dịch thanh toán sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      Thanh toán #{payment.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Nhà cung cấp: {payment.provider?.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(payment.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                    {translateStatus(payment.status)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Số tiền:</span>
                      <div className="font-bold text-lg text-gray-900 mt-1">
                        {payment.amount?.toLocaleString()} {payment.currency}
                      </div>
                    </div>
                    {payment.refunded_amount > 0 && (
                      <div>
                        <span className="text-gray-600">Đã hoàn:</span>
                        <div className="font-semibold text-lg text-red-600 mt-1">
                          -{payment.refunded_amount?.toLocaleString()} {payment.currency}
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Hóa đơn:</span>
                      <div className="font-medium text-sm text-blue-600 mt-1">
                        #{payment.invoice_id?.slice(0, 8)}
                      </div>
                    </div>
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
