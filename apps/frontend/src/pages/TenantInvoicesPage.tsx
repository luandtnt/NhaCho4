import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function TenantInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState('vnpay');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await apiClient.get('/tenant/invoices?page=1&page_size=20');
      setInvoices(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải danh sách hóa đơn:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (invoiceId: string, amount: number) => {
    try {
      const idempotencyKey = `pay_${invoiceId}_${Date.now()}`;
      const response = await apiClient.post('/tenant/payments', {
        invoice_id: invoiceId,
        provider: paymentProvider,
        amount: amount,
        currency: 'VND',
        idempotency_key: idempotencyKey,
      });

      alert('Đang chuyển đến trang thanh toán...\n' + JSON.stringify(response.data, null, 2));
      setShowPaymentModal(false);
      loadInvoices();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Thanh toán thất bại');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      VOID: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const translateStatus = (status: string) => {
    const map: any = {
      DRAFT: 'Nháp',
      SENT: 'Đã gửi',
      PAID: 'Đã thanh toán',
      OVERDUE: 'Quá hạn',
      CANCELLED: 'Đã hủy',
      VOID: 'Vô hiệu',
    };
    return map[status] || status;
  };

  const isOverdue = (invoice: any) => {
    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') return false;
    return new Date(invoice.due_date) < new Date();
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Hóa đơn của tôi</h1>
          <p className="text-gray-600 mt-1">
            Quản lý và thanh toán các hóa đơn thuê nhà
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-sm text-blue-600">Chờ thanh toán</div>
            <div className="text-2xl font-bold text-blue-900">
              {invoices.filter(i => i.status === 'SENT').length}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-sm text-red-600">Quá hạn</div>
            <div className="text-2xl font-bold text-red-900">
              {invoices.filter(i => isOverdue(i)).length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-sm text-green-600">Đã thanh toán</div>
            <div className="text-2xl font-bold text-green-900">
              {invoices.filter(i => i.status === 'PAID').length}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-4">
            <div className="text-sm text-purple-600">Tổng tiền chờ</div>
            <div className="text-xl font-bold text-purple-900">
              {invoices
                .filter(i => i.status === 'SENT' || isOverdue(i))
                .reduce((sum, i) => sum + (i.total_amount || 0), 0)
                .toLocaleString('vi-VN')} ₫
            </div>
          </div>
        </div>

        {/* Invoices List */}
        {invoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có hóa đơn nào
            </h3>
            <p className="text-gray-600">
              Các hóa đơn thuê nhà của bạn sẽ hiển thị ở đây
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số hóa đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kỳ thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hạn thanh toán
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
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className={`hover:bg-gray-50 ${isOverdue(invoice) ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        #{invoice.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {invoice.period_start && invoice.period_end ? (
                        <>
                          {new Date(invoice.period_start).toLocaleDateString('vi-VN')}
                          {' - '}
                          {new Date(invoice.period_end).toLocaleDateString('vi-VN')}
                        </>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-gray-900">
                        {(invoice.total_amount || 0).toLocaleString('vi-VN')} ₫
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${isOverdue(invoice) ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                        {new Date(invoice.due_date).toLocaleDateString('vi-VN')}
                      </div>
                      {isOverdue(invoice) && (
                        <div className="text-xs text-red-600 mt-1">
                          ⚠️ Quá hạn
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {translateStatus(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Xem
                        </button>
                        {(invoice.status === 'SENT' || isOverdue(invoice)) && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowPaymentModal(true);
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                          >
                            💳 Thanh toán
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Chi tiết hóa đơn</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    #{selectedInvoice.id.slice(0, 12)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Trạng thái</label>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                          {translateStatus(selectedInvoice.status)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Hạn thanh toán</label>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(selectedInvoice.due_date).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Kỳ thanh toán</h3>
                  <div className="text-sm text-blue-800">
                    {selectedInvoice.period_start && selectedInvoice.period_end ? (
                      <>
                        {new Date(selectedInvoice.period_start).toLocaleDateString('vi-VN')}
                        {' đến '}
                        {new Date(selectedInvoice.period_end).toLocaleDateString('vi-VN')}
                      </>
                    ) : 'N/A'}
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Tổng tiền</h3>
                  <div className="text-3xl font-bold text-green-900">
                    {(selectedInvoice.total_amount || 0).toLocaleString('vi-VN')} ₫
                  </div>
                </div>

                {selectedInvoice.line_items && selectedInvoice.line_items.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Chi tiết các khoản</h3>
                    <div className="space-y-2">
                      {selectedInvoice.line_items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between py-2 border-b last:border-0">
                          <span className="text-sm text-gray-700">{item.description || item.item_type}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {(item.amount || 0).toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Đóng
                </button>
                {(selectedInvoice.status === 'SENT' || isOverdue(selectedInvoice)) && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowPaymentModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    💳 Thanh toán ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Thanh toán hóa đơn</h2>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-blue-700">Số tiền cần thanh toán</div>
                <div className="text-3xl font-bold text-blue-900">
                  {(selectedInvoice.total_amount || 0).toLocaleString('vi-VN')} ₫
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn phương thức thanh toán
                </label>
                <select
                  value={paymentProvider}
                  onChange={(e) => setPaymentProvider(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="vnpay">VNPay</option>
                  <option value="momo">MoMo</option>
                  <option value="zalopay">ZaloPay</option>
                  <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Bạn sẽ được chuyển đến trang thanh toán của {paymentProvider}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handlePayment(selectedInvoice.id, selectedInvoice.total_amount)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Xác nhận thanh toán
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
