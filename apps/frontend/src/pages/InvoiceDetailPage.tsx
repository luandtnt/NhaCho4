import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/invoices/${id}`);
      setInvoice(response.data);
    } catch (error) {
      console.error('Failed to load invoice:', error);
      alert('Không thể tải hóa đơn');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!confirm('Phát hành hóa đơn này? Sau khi phát hành sẽ không thể chỉnh sửa.')) return;
    
    try {
      await apiClient.post(`/invoices/${id}/issue`, { send_notification: true });
      alert('Đã phát hành hóa đơn thành công!');
      loadInvoice();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể phát hành hóa đơn');
    }
  };

  const handleVoid = async () => {
    const reason = prompt('Lý do hủy hóa đơn:');
    if (!reason) return;
    
    try {
      await apiClient.post(`/invoices/${id}/void`, { reason });
      alert('Đã hủy hóa đơn thành công!');
      loadInvoice();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể hủy hóa đơn');
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'ISSUED': return 'bg-yellow-100 text-yellow-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-600';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const translateState = (state: string) => {
    const map: any = {
      DRAFT: 'Nháp',
      ISSUED: 'Đã phát hành',
      PAID: 'Đã thanh toán',
      PARTIALLY_PAID: 'Thanh toán một phần',
      OVERDUE: 'Quá hạn',
      CANCELLED: 'Đã hủy',
    };
    return map[state] || state;
  };

  const translateLineItemType = (type: string) => {
    const map: any = {
      RENT: 'Tiền thuê',
      SERVICE_FEE: 'Phí dịch vụ',
      MGMT_FEE: 'Phí quản lý',
      ELECTRICITY: 'Tiền điện',
      WATER: 'Tiền nước',
      PARKING: 'Phí gửi xe',
      INTERNET: 'Phí internet',
      OTHER: 'Khác',
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

  if (!invoice) {
    return (
      <Layout userRole="LANDLORD">
        <div className="p-8">Không tìm thấy hóa đơn</div>
      </Layout>
    );
  }

  return (
    <Layout userRole="LANDLORD">
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/invoices')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Quay lại danh sách
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {invoice.invoice_code || `Hóa đơn #${invoice.id.slice(0, 8)}`}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStateColor(invoice.state)}`}>
                  {translateState(invoice.state)}
                </span>
                {invoice.issued_at && (
                  <span className="text-sm text-gray-600">
                    Phát hành: {new Date(invoice.issued_at).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {invoice.state === 'DRAFT' && (
                <>
                  <button
                    onClick={() => navigate(`/invoices/${id}/edit`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    onClick={handleIssue}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    📤 Phát hành
                  </button>
                </>
              )}
              {(invoice.state === 'DRAFT' || invoice.state === 'ISSUED') && (
                <button
                  onClick={handleVoid}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                >
                  ❌ Hủy
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Invoice Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin hóa đơn</h2>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Mã hóa đơn</div>
                  <div className="font-medium">{invoice.invoice_code}</div>
                </div>
                
                <div>
                  <div className="text-gray-600">Kỳ hóa đơn</div>
                  <div className="font-medium">
                    {new Date(invoice.period_start).toLocaleDateString('vi-VN')} - {new Date(invoice.period_end).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                
                {invoice.due_at && (
                  <div>
                    <div className="text-gray-600">Hạn thanh toán</div>
                    <div className="font-medium">{new Date(invoice.due_at).toLocaleDateString('vi-VN')}</div>
                  </div>
                )}
                
                <div>
                  <div className="text-gray-600">Ngày tạo</div>
                  <div className="font-medium">{new Date(invoice.created_at).toLocaleDateString('vi-VN')}</div>
                </div>
              </div>
            </div>

            {/* Agreement & Tenant Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin hợp đồng</h2>
              
              {invoice.agreement && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Hợp đồng</div>
                  <div className="font-medium">{invoice.agreement.contract_code}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {new Date(invoice.agreement.start_at).toLocaleDateString('vi-VN')} - {new Date(invoice.agreement.end_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              )}
              
              {invoice.tenant_party && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Khách thuê</div>
                  <div className="font-medium">{invoice.tenant_party.name}</div>
                  {invoice.tenant_party.phone && (
                    <div className="text-sm text-gray-600">{invoice.tenant_party.phone}</div>
                  )}
                  {invoice.tenant_party.email && (
                    <div className="text-sm text-gray-600">{invoice.tenant_party.email}</div>
                  )}
                </div>
              )}
              
              {invoice.rentable_item && (
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-sm text-gray-600">Bất động sản</div>
                  <div className="font-medium">{invoice.rentable_item.code}</div>
                  <div className="text-sm text-gray-600">{invoice.rentable_item.address_full}</div>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết các khoản thu</h2>
              
              <div className="space-y-3">
                {invoice.line_items_table && invoice.line_items_table.length > 0 ? (
                  invoice.line_items_table.map((item: any, index: number) => (
                    <div key={item.id || index} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{item.description}</div>
                        <div className="text-sm text-gray-600">
                          {translateLineItemType(item.type)} • {item.qty} x {item.unit_price?.toLocaleString('vi-VN')} ₫
                        </div>
                      </div>
                      <div className="font-semibold">
                        {item.amount?.toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Không có chi tiết khoản thu
                  </div>
                )}
              </div>
              
              {/* Totals */}
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tổng phụ</span>
                  <span className="font-medium">{invoice.subtotal_amount?.toLocaleString('vi-VN')} ₫</span>
                </div>
                
                {invoice.tax_enabled && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Thuế ({invoice.tax_rate}%)</span>
                    <span className="font-medium">{invoice.tax_amount?.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">{invoice.total_amount?.toLocaleString('vi-VN')} ₫</span>
                </div>
                
                {invoice.balance_due > 0 && invoice.state !== 'PAID' && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Còn nợ</span>
                    <span className="font-semibold">{invoice.balance_due?.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ghi chú</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử thanh toán</h2>
              
              {invoice.payments && invoice.payments.length > 0 ? (
                <div className="space-y-3">
                  {invoice.payments.map((payment: any) => (
                    <div key={payment.id} className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium">{payment.amount?.toLocaleString('vi-VN')} ₫</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          payment.status === 'SUCCEEDED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(payment.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Chưa có thanh toán
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác</h2>
              
              <div className="space-y-2">
                <button
                  onClick={() => alert('Chức năng xuất PDF đang phát triển')}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                  📄 Xuất PDF
                </button>
                
                <button
                  onClick={() => alert('Chức năng gửi email đang phát triển')}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                  📧 Gửi email
                </button>
                
                <button
                  onClick={() => navigate(`/agreements/${invoice.agreement_id}`)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                  📋 Xem hợp đồng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
