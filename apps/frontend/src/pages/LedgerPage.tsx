import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function LedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    entry_type: 'all',
    start_date: '',
    end_date: '',
    ref_id: '',
  });
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [reconcileForm, setReconcileForm] = useState({
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('page_size', '100');
      
      if (filters.entry_type !== 'all') {
        params.append('entry_type', filters.entry_type);
      }
      if (filters.start_date) {
        params.append('start_date', filters.start_date);
      }
      if (filters.end_date) {
        params.append('end_date', filters.end_date);
      }

      const response = await apiClient.get(`/ledger?${params.toString()}`);
      setEntries(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải sổ cái:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setLoading(true);
    loadEntries();
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await apiClient.get(`/ledger/export?${params.toString()}`);
      
      // Create download
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(response.data, null, 2) : response.data],
        { type: format === 'json' ? 'application/json' : 'text/csv' }
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ledger_${Date.now()}.${format}`;
      a.click();
      
      alert(`Đã export ${entries.length} giao dịch thành công!`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể export dữ liệu');
    }
  };

  const handleReconcile = async () => {
    if (!reconcileForm.start_date || !reconcileForm.end_date) {
      alert('Vui lòng chọn khoảng thời gian');
      return;
    }

    try {
      const response = await apiClient.post('/ledger/reconcile', reconcileForm);
      alert('Đối soát thành công!\n' + JSON.stringify(response.data, null, 2));
      setShowReconcileModal(false);
      setReconcileForm({ start_date: '', end_date: '' });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể thực hiện đối soát');
    }
  };

  const getEntryTypeColor = (type: string) => {
    const colors: any = {
      DEBIT: 'bg-red-100 text-red-800',
      CREDIT: 'bg-green-100 text-green-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const translateEntryType = (type: string) => {
    const map: any = {
      DEBIT: 'Nợ (Chi)',
      CREDIT: 'Có (Thu)',
    };
    return map[type] || type;
  };

  const filteredEntries = entries.filter(entry => {
    if (filters.ref_id && !entry.ref_id?.includes(filters.ref_id)) {
      return false;
    }
    return true;
  });

  const calculateBalance = () => {
    return filteredEntries.reduce((balance, entry) => {
      if (entry.entry_type === 'CREDIT') {
        return balance + (entry.amount || 0);
      } else if (entry.entry_type === 'DEBIT') {
        return balance - (entry.amount || 0);
      }
      return balance;
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
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sổ cái (Ledger)</h1>
              <p className="text-gray-600 mt-1">
                Xem tất cả giao dịch tài chính (append-only, không thể sửa/xóa)
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReconcileModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                🔄 Đối soát
              </button>
              <button
                onClick={() => handleExport('json')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                📥 Export JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                📥 Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Bộ lọc</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại giao dịch
              </label>
              <select
                value={filters.entry_type}
                onChange={(e) => setFilters({ ...filters, entry_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Tất cả</option>
                <option value="CREDIT">Có (Thu)</option>
                <option value="DEBIT">Nợ (Chi)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm theo Ref ID
              </label>
              <input
                type="text"
                value={filters.ref_id}
                onChange={(e) => setFilters({ ...filters, ref_id: e.target.value })}
                placeholder="Invoice ID, Payment ID..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleApplyFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Áp dụng bộ lọc
            </button>
          </div>
        </div>

        {/* Balance Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-sm text-green-600">Tổng thu (Credit)</div>
            <div className="text-2xl font-bold text-green-900">
              {filteredEntries
                .filter(e => e.entry_type === 'CREDIT')
                .reduce((sum, e) => sum + (e.amount || 0), 0)
                .toLocaleString('vi-VN')} ₫
            </div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <div className="text-sm text-red-600">Tổng chi (Debit)</div>
            <div className="text-2xl font-bold text-red-900">
              {filteredEntries
                .filter(e => e.entry_type === 'DEBIT')
                .reduce((sum, e) => sum + (e.amount || 0), 0)
                .toLocaleString('vi-VN')} ₫
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-sm text-blue-600">Số dư</div>
            <div className={`text-2xl font-bold ${calculateBalance() >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
              {calculateBalance().toLocaleString('vi-VN')} ₫
            </div>
          </div>
        </div>

        {/* Ledger Entries Table */}
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có giao dịch nào
            </h3>
            <p className="text-gray-600">
              Các giao dịch tài chính sẽ được ghi vào sổ cái tự động
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Số tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ref ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mô tả
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(entry.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEntryTypeColor(entry.entry_type)}`}>
                          {translateEntryType(entry.entry_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${
                          entry.entry_type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {entry.entry_type === 'CREDIT' ? '+' : '-'}
                          {entry.amount?.toLocaleString('vi-VN')} ₫
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="font-mono text-xs">
                          {entry.ref_id ? entry.ref_id.slice(0, 12) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {entry.description || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedEntry(entry);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          Xem chi tiết →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="text-sm text-gray-600">
                Hiển thị {filteredEntries.length} giao dịch
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Về Ledger (Sổ cái)</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ledger là append-only: chỉ thêm mới, không sửa/xóa</li>
            <li>• Mọi giao dịch tài chính đều được ghi lại tự động</li>
            <li>• CREDIT (Có): Tiền vào (thu tiền từ khách)</li>
            <li>• DEBIT (Nợ): Tiền ra (chi phí, hoàn tiền)</li>
            <li>• Đối soát để kiểm tra tính nhất quán của dữ liệu</li>
            <li>• Export để lưu trữ hoặc phân tích ngoài hệ thống</li>
          </ul>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Chi tiết giao dịch</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedEntry(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Thông tin cơ bản</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">ID giao dịch</label>
                      <div className="font-mono text-sm text-gray-900 break-all">
                        {selectedEntry.id}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Thời gian</label>
                      <div className="text-sm text-gray-900">
                        {new Date(selectedEntry.created_at).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Loại giao dịch</label>
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEntryTypeColor(selectedEntry.entry_type)}`}>
                          {translateEntryType(selectedEntry.entry_type)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Số tiền</label>
                      <div className={`text-lg font-bold ${
                        selectedEntry.entry_type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedEntry.entry_type === 'CREDIT' ? '+' : '-'}
                        {selectedEntry.amount?.toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reference Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Thông tin tham chiếu</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm text-blue-700">Reference ID</label>
                      <div className="font-mono text-sm text-blue-900 break-all">
                        {selectedEntry.ref_id || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-blue-700">Mô tả</label>
                      <div className="text-sm text-blue-900">
                        {selectedEntry.description || 'Không có mô tả'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-900 mb-3">Metadata (Dữ liệu bổ sung)</h3>
                    <div className="space-y-2">
                      {Object.entries(selectedEntry.metadata).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between items-start py-2 border-b border-purple-100 last:border-0">
                          <span className="text-sm font-medium text-purple-700 capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className="text-sm text-purple-900 text-right ml-4">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw JSON (collapsible) */}
                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600">
                    📋 Xem dữ liệu JSON gốc
                  </summary>
                  <pre className="mt-3 p-3 bg-white rounded border border-gray-200 text-xs overflow-auto max-h-64">
                    {JSON.stringify(selectedEntry, null, 2)}
                  </pre>
                </details>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedEntry(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reconcile Modal */}
        {showReconcileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Đối soát sổ cái</h2>
              <p className="text-sm text-gray-600 mb-4">
                Kiểm tra tính nhất quán của dữ liệu trong khoảng thời gian
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Từ ngày *
                  </label>
                  <input
                    type="date"
                    value={reconcileForm.start_date}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đến ngày *
                  </label>
                  <input
                    type="date"
                    value={reconcileForm.end_date}
                    onChange={(e) => setReconcileForm({ ...reconcileForm, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Đối soát sẽ kiểm tra:
                  </p>
                  <ul className="text-xs text-yellow-700 mt-2 space-y-1">
                    <li>• Tổng Credit = Tổng tiền thu từ invoices</li>
                    <li>• Tổng Debit = Tổng tiền chi/hoàn</li>
                    <li>• Phát hiện giao dịch thiếu hoặc trùng lặp</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowReconcileModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleReconcile}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Chạy đối soát
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
