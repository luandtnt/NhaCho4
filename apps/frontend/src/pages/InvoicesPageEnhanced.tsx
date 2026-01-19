import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function InvoicesPageEnhanced() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  
  // Status counts
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    draft: 0,
    issued: 0,
    paid: 0,
    overdue: 0,
  });

  useEffect(() => {
    loadInvoices();
    loadStatusCounts();
  }, [currentPage, stateFilter, monthFilter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      });
      
      if (stateFilter) params.append('state', stateFilter);
      if (monthFilter) params.append('month', monthFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await apiClient.get(`/invoices?${params.toString()}`);
      const data = response.data.data || [];
      setInvoices(data);
      
      const total = response.data.meta?.total || 0;
      setTotalCount(total);
      setTotalPages(Math.ceil(total / pageSize));
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatusCounts = async () => {
    try {
      const [allRes, draftRes, issuedRes, paidRes, overdueRes] = await Promise.all([
        apiClient.get('/invoices?page=1&page_size=1'),
        apiClient.get('/invoices?page=1&page_size=1&state=DRAFT'),
        apiClient.get('/invoices?page=1&page_size=1&state=ISSUED'),
        apiClient.get('/invoices?page=1&page_size=1&state=PAID'),
        apiClient.get('/invoices?page=1&page_size=1&state=OVERDUE'),
      ]);
      
      setStatusCounts({
        all: allRes.data.meta?.total || 0,
        draft: draftRes.data.meta?.total || 0,
        issued: issuedRes.data.meta?.total || 0,
        paid: paidRes.data.meta?.total || 0,
        overdue: overdueRes.data.meta?.total || 0,
      });
    } catch (error) {
      console.error('Failed to load status counts:', error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadInvoices();
  };

  const handleStateFilterChange = (state: string) => {
    setStateFilter(state);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (loading && invoices.length === 0) {
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
              onClick={() => navigate('/invoices/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ➕ Tạo hóa đơn mới
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
          {/* Search bar */}
          <div className="flex gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Tìm theo mã hóa đơn, tên khách, số điện thoại..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔍 Tìm kiếm
            </button>
          </div>

          {/* Status filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleStateFilterChange('')}
              className={`px-4 py-2 rounded-lg text-sm ${
                stateFilter === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả ({statusCounts.all})
            </button>
            <button
              onClick={() => handleStateFilterChange('DRAFT')}
              className={`px-4 py-2 rounded-lg text-sm ${
                stateFilter === 'DRAFT'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Nháp ({statusCounts.draft})
            </button>
            <button
              onClick={() => handleStateFilterChange('ISSUED')}
              className={`px-4 py-2 rounded-lg text-sm ${
                stateFilter === 'ISSUED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã phát hành ({statusCounts.issued})
            </button>
            <button
              onClick={() => handleStateFilterChange('OVERDUE')}
              className={`px-4 py-2 rounded-lg text-sm ${
                stateFilter === 'OVERDUE'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Quá hạn ({statusCounts.overdue})
            </button>
            <button
              onClick={() => handleStateFilterChange('PAID')}
              className={`px-4 py-2 rounded-lg text-sm ${
                stateFilter === 'PAID'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã thanh toán ({statusCounts.paid})
            </button>
          </div>

          {/* Month filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Lọc theo tháng:</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            />
            {monthFilter && (
              <button
                onClick={() => setMonthFilter('')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Invoices List */}
        {invoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || stateFilter || monthFilter ? 'Không tìm thấy hóa đơn' : 'Chưa có hóa đơn nào'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || stateFilter || monthFilter 
                ? 'Thử thay đổi bộ lọc hoặc tìm kiếm khác'
                : 'Tạo hóa đơn cho khách thuê để thu tiền'}
            </p>
            {!searchTerm && !stateFilter && !monthFilter && (
              <button
                onClick={() => navigate('/invoices/create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tạo hóa đơn đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div 
                key={invoice.id} 
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/invoices/${invoice.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {invoice.invoice_code || `#${invoice.id.slice(0, 8)}`}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStateColor(invoice.state)}`}>
                        {translateState(invoice.state)}
                      </span>
                    </div>
                    
                    {invoice.tenant_party && (
                      <p className="text-sm text-gray-600">
                        👤 {invoice.tenant_party.name}
                        {invoice.tenant_party.phone && ` • ${invoice.tenant_party.phone}`}
                      </p>
                    )}
                    
                    {invoice.rentable_item && (
                      <p className="text-sm text-gray-600">
                        🏠 {invoice.rentable_item.code} - {invoice.rentable_item.address_full}
                      </p>
                    )}
                    
                    <p className="text-sm text-gray-600 mt-1">
                      📅 Kỳ: {invoice.period_start ? new Date(invoice.period_start).toLocaleDateString('vi-VN') : 'N/A'} 
                      {' → '}
                      {invoice.period_end ? new Date(invoice.period_end).toLocaleDateString('vi-VN') : 'N/A'}
                    </p>
                    
                    {invoice.due_at && (
                      <p className="text-sm text-gray-600">
                        ⏰ Hạn thanh toán: {new Date(invoice.due_at).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Tổng tiền</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {invoice.total_amount?.toLocaleString('vi-VN')} ₫
                    </div>
                    {invoice.balance_due > 0 && invoice.state !== 'PAID' && (
                      <div className="text-sm text-red-600 mt-1">
                        Còn nợ: {invoice.balance_due?.toLocaleString('vi-VN')} ₫
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {invoice.line_items_table?.length || 0} khoản thu
                    {invoice.issued_at && ` • Phát hành: ${new Date(invoice.issued_at).toLocaleDateString('vi-VN')}`}
                  </div>
                  
                  <div className="flex gap-2">
                    {invoice.state === 'DRAFT' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/invoices/${invoice.id}/edit`);
                        }}
                        className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        ✏️ Sửa
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/invoices/${invoice.id}`);
                      }}
                      className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                    >
                      Xem chi tiết →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {invoices.length > 0 && totalPages > 1 && (
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
      </div>
    </Layout>
  );
}
