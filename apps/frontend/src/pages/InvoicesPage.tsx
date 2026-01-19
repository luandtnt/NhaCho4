import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue' | 'void'>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  
  // Status counts (for filter buttons)
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    void: 0,
  });
  
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [pricingPolicies, setPricingPolicies] = useState<any[]>([]);
  const [invoiceForm, setInvoiceForm] = useState({
    agreement_id: '',
    pricing_policy_id: '',
    period_start: '',
    period_end: '',
    due_date: '',
    line_items: [] as any[],
    notes: '',
  });

  useEffect(() => {
    loadInvoices();
    loadStatusCounts(); // Load counts for filter buttons
    loadAgreements();
    loadPricingPolicies();
  }, [currentPage, filter]); // Reload when page or filter changes

  const loadInvoices = async () => {
    try {
      setLoading(true);
      // Map UI filter to backend status
      const statusMap: any = {
        'all': '',
        'pending': 'ISSUED', // Backend uses ISSUED for pending invoices
        'paid': 'PAID',
        'overdue': 'OVERDUE',
        'void': 'VOID',
      };
      const statusParam = filter !== 'all' ? `&status=${statusMap[filter]}` : '';
      const response = await apiClient.get(`/invoices?page=${currentPage}&page_size=${pageSize}${statusParam}`);
      const data = response.data.data || [];
      setInvoices(data);
      
      // Backend returns: { data: [...], meta: { total, page, page_size, total_pages } }
      const total = response.data.meta?.total || response.data.total || data.length;
      setTotalCount(total);
      setTotalPages(Math.ceil(total / pageSize));
      
      console.log('Loaded invoices:', {
        page: currentPage,
        filter,
        status: statusMap[filter],
        count: data.length,
        total,
        totalPages: Math.ceil(total / pageSize)
      });
    } catch (error) {
      console.error('Không thể tải danh sách hóa đơn:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatusCounts = async () => {
    try {
      // Load counts for each status (without pagination)
      // Backend uses: ISSUED, PENDING, PAID, OVERDUE, VOID
      const [allRes, issuedRes, paidRes, overdueRes] = await Promise.all([
        apiClient.get('/invoices?page=1&page_size=1'), // Just to get total
        apiClient.get('/invoices?page=1&page_size=1&status=ISSUED'), // ISSUED = pending in UI
        apiClient.get('/invoices?page=1&page_size=1&status=PAID'),
        apiClient.get('/invoices?page=1&page_size=1&status=OVERDUE'),
      ]);
      
      setStatusCounts({
        all: allRes.data.meta?.total || 0,
        pending: issuedRes.data.meta?.total || 0, // ISSUED = pending
        paid: paidRes.data.meta?.total || 0,
        overdue: overdueRes.data.meta?.total || 0,
        void: 0, // Add if needed
      });
    } catch (error) {
      console.error('Không thể tải status counts:', error);
    }
  };

  const loadAgreements = async () => {
    try {
      const response = await apiClient.get('/agreements?page=1&page_size=100');
      setAgreements(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải danh sách hợp đồng:', error);
    }
  };

  const loadPricingPolicies = async () => {
    try {
      const response = await apiClient.get('/pricing-policies?page=1&limit=100');
      setPricingPolicies(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải chính sách giá:', error);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const payload = {
        agreement_id: invoiceForm.agreement_id,
        period_start: invoiceForm.period_start,
        period_end: invoiceForm.period_end,
        currency: 'VND',
        total_amount: calculateTotal(),
        line_items: invoiceForm.line_items,
      };
      
      await apiClient.post('/invoices', payload);
      alert('Đã tạo hóa đơn thành công!');
      setShowCreateWizard(false);
      setWizardStep(1);
      resetForm();
      loadInvoices();
    } catch (error: any) {
      console.error('Lỗi tạo hóa đơn:', error.response?.data);
      alert(error.response?.data?.message || 'Không thể tạo hóa đơn');
    }
  };

  const handleVoidInvoice = async (id: string) => {
    if (!confirm('Bạn có chắc muốn hủy hóa đơn này?')) return;
    try {
      await apiClient.post(`/invoices/${id}/void`);
      alert('Đã hủy hóa đơn thành công!');
      loadInvoices();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể hủy hóa đơn');
    }
  };

  const resetForm = () => {
    setInvoiceForm({
      agreement_id: '',
      pricing_policy_id: '',
      period_start: '',
      period_end: '',
      due_date: '',
      line_items: [],
      notes: '',
    });
  };

  const addLineItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      line_items: [
        ...invoiceForm.line_items,
        { description: '', amount: 0, quantity: 1 }
      ]
    });
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...invoiceForm.line_items];
    // Handle NaN for numeric fields
    if (field === 'amount' || field === 'quantity') {
      const numValue = parseFloat(value);
      newItems[index] = { ...newItems[index], [field]: isNaN(numValue) ? 0 : numValue };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setInvoiceForm({ ...invoiceForm, line_items: newItems });
  };

  const removeLineItem = (index: number) => {
    setInvoiceForm({
      ...invoiceForm,
      line_items: invoiceForm.line_items.filter((_, i) => i !== index)
    });
  };

  const calculateTotal = () => {
    return invoiceForm.line_items.reduce((sum, item) => {
      const amount = parseFloat(item.amount) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (amount * quantity);
    }, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'VOID': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const translateStatus = (status: string) => {
    const map: any = {
      PAID: 'Đã thanh toán',
      PENDING: 'Chờ thanh toán',
      OVERDUE: 'Quá hạn',
      VOID: 'Đã hủy',
    };
    return map[status] || status;
  };

  const filteredInvoices = invoices; // No client-side filtering, backend handles it
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to page 1 when filter changes
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quản lý hóa đơn</h1>
              <p className="text-gray-600 mt-1">
                Tạo và quản lý hóa đơn cho khách thuê
              </p>
            </div>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ➕ Tạo hóa đơn mới
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả ({statusCounts.all})
            </button>
            <button
              onClick={() => handleFilterChange('pending')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chờ thanh toán ({statusCounts.pending})
            </button>
            <button
              onClick={() => handleFilterChange('overdue')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'overdue'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Quá hạn ({statusCounts.overdue})
            </button>
            <button
              onClick={() => handleFilterChange('paid')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'paid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã thanh toán ({statusCounts.paid})
            </button>
          </div>
        </div>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có hóa đơn nào
            </h3>
            <p className="text-gray-600 mb-4">
              Tạo hóa đơn cho khách thuê để thu tiền
            </p>
            <button
              onClick={() => setShowCreateWizard(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tạo hóa đơn đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      Hóa đơn #{invoice.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Kỳ: {invoice.period_start ? new Date(invoice.period_start).toLocaleDateString('vi-VN') : 'N/A'} 
                      {' → '}
                      {invoice.period_end ? new Date(invoice.period_end).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                    {invoice.due_date && (
                      <p className="text-sm text-gray-600">
                        Hạn thanh toán: {new Date(invoice.due_date).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {translateStatus(invoice.status)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">Tổng tiền:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {invoice.total_amount?.toLocaleString('vi-VN')} {invoice.currency || 'VND'}
                    </span>
                  </div>
                  
                  {invoice.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVoidInvoice(invoice.id)}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium"
                      >
                        Hủy hóa đơn
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredInvoices.length > 0 && totalPages > 1 && (
          <div className="bg-white rounded-lg shadow p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} trong tổng số {totalCount} hóa đơn
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Trước
                </button>
                
                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 border rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Invoice Wizard */}
        {showCreateWizard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Tạo hóa đơn mới - Bước {wizardStep}/4
              </h2>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  <span className={`text-sm ${wizardStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    1. Chọn hợp đồng
                  </span>
                  <span className={`text-sm ${wizardStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    2. Kỳ hạn
                  </span>
                  <span className={`text-sm ${wizardStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    3. Chi tiết
                  </span>
                  <span className={`text-sm ${wizardStep >= 4 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    4. Xác nhận
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(wizardStep / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step 1: Select Agreement */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn hợp đồng *
                    </label>
                    <select
                      value={invoiceForm.agreement_id}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, agreement_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">-- Chọn hợp đồng --</option>
                      {agreements.map(agreement => (
                        <option key={agreement.id} value={agreement.id}>
                          {agreement.id.slice(0, 8)} - {agreement.status}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Chọn hợp đồng để tạo hóa đơn
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chính sách giá (tùy chọn)
                    </label>
                    <select
                      value={invoiceForm.pricing_policy_id}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, pricing_policy_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">-- Không áp dụng --</option>
                      {pricingPolicies.filter(p => p.status === 'ACTIVE').map(policy => (
                        <option key={policy.id} value={policy.id}>
                          {policy.policy_type} - {policy.config?.base_amount?.toLocaleString()} {policy.config?.currency}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 2: Period */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày bắt đầu kỳ *
                      </label>
                      <input
                        type="date"
                        value={invoiceForm.period_start}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, period_start: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày kết thúc kỳ *
                      </label>
                      <input
                        type="date"
                        value={invoiceForm.period_end}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, period_end: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hạn thanh toán *
                    </label>
                    <input
                      type="date"
                      value={invoiceForm.due_date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ngày khách hàng cần thanh toán
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Line Items */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Các khoản thu</h3>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      ➕ Thêm khoản
                    </button>
                  </div>

                  {invoiceForm.line_items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Chưa có khoản thu nào. Click "Thêm khoản" để bắt đầu.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invoiceForm.line_items.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-5">
                              <label className="block text-xs text-gray-600 mb-1">Mô tả</label>
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                placeholder="VD: Tiền thuê tháng 1"
                              />
                            </div>
                            <div className="col-span-3">
                              <label className="block text-xs text-gray-600 mb-1">Đơn giá</label>
                              <input
                                type="number"
                                value={item.amount || 0}
                                onChange={(e) => updateLineItem(index, 'amount', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                min="0"
                                step="1000"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs text-gray-600 mb-1">SL</label>
                              <input
                                type="number"
                                value={item.quantity || 1}
                                onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                min="1"
                              />
                            </div>
                            <div className="col-span-2 flex items-end">
                              <button
                                type="button"
                                onClick={() => removeLineItem(index)}
                                className="w-full px-3 py-2 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 text-right text-sm text-gray-600">
                            Thành tiền: <span className="font-semibold">{(item.amount * item.quantity).toLocaleString('vi-VN')} ₫</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {calculateTotal().toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú
                    </label>
                    <textarea
                      value={invoiceForm.notes}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                      placeholder="Ghi chú thêm cho hóa đơn..."
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">Xác nhận thông tin hóa đơn</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Hợp đồng:</span>
                        <span className="text-blue-900 font-medium">
                          {invoiceForm.agreement_id.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Kỳ hạn:</span>
                        <span className="text-blue-900 font-medium">
                          {invoiceForm.period_start} → {invoiceForm.period_end}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Hạn thanh toán:</span>
                        <span className="text-blue-900 font-medium">{invoiceForm.due_date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Số khoản thu:</span>
                        <span className="text-blue-900 font-medium">{invoiceForm.line_items.length}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-200">
                        <span className="text-blue-700 font-semibold">Tổng tiền:</span>
                        <span className="text-blue-900 font-bold text-lg">
                          {calculateTotal().toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Sau khi tạo, hóa đơn sẽ ở trạng thái PENDING. Khách hàng có thể thanh toán qua portal.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 1) {
                      setShowCreateWizard(false);
                      setWizardStep(1);
                      resetForm();
                    } else {
                      setWizardStep(wizardStep - 1);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {wizardStep === 1 ? 'Hủy' : '← Quay lại'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep === 4) {
                      handleCreateInvoice();
                    } else {
                      setWizardStep(wizardStep + 1);
                    }
                  }}
                  disabled={
                    (wizardStep === 1 && !invoiceForm.agreement_id) ||
                    (wizardStep === 2 && (!invoiceForm.period_start || !invoiceForm.period_end || !invoiceForm.due_date)) ||
                    (wizardStep === 3 && invoiceForm.line_items.length === 0)
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {wizardStep === 4 ? '✓ Tạo hóa đơn' : 'Tiếp theo →'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
