import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function LeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    listing: 'all',
    dateRange: 'all',
    assignee: 'all',
  });

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [filters, allLeads]);

  const loadLeads = async () => {
    try {
      const response = await apiClient.get('/leads?page=1&page_size=100');
      setAllLeads(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải danh sách khách hàng:', error);
      setAllLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = [...allLeads];

    if (filters.status !== 'all') {
      filtered = filtered.filter(l => l.status === filters.status);
    }

    if (filters.listing !== 'all') {
      filtered = filtered.filter(l => l.listing_id === filters.listing);
    }

    setLeads(filtered);
  };

  const handleSelectLead = (id: string) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(l => l !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(l => l.id));
    }
  };

  const handleBulkAssign = async () => {
    const assignee = prompt('Nhập ID người được gán:');
    if (!assignee) return;

    try {
      await Promise.all(
        selectedLeads.map(id => apiClient.post(`/leads/${id}/assign`, { assignee_id: assignee }))
      );
      alert('Đã gán người phụ trách thành công!');
      setSelectedLeads([]);
      loadLeads();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể gán người phụ trách');
    }
  };

  const handleBulkMarkContacted = async () => {
    try {
      await Promise.all(
        selectedLeads.map(id => apiClient.put(`/leads/${id}`, { status: 'CONTACTED' }))
      );
      alert('Đã đánh dấu đã liên hệ thành công!');
      setSelectedLeads([]);
      loadLeads();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['ID', 'Tên', 'Email', 'Điện thoại', 'Trạng thái', 'Ngày tạo'].join(','),
      ...leads.map(l => [
        l.id,
        l.name || '',
        l.email || '',
        l.phone || '',
        l.status,
        new Date(l.created_at).toLocaleDateString('vi-VN'),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${Date.now()}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      NEW: 'bg-blue-100 text-blue-800',
      CONTACTED: 'bg-yellow-100 text-yellow-800',
      QUALIFIED: 'bg-green-100 text-green-800',
      CONVERTED: 'bg-purple-100 text-purple-800',
      LOST: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const translateStatus = (status: string) => {
    const map: any = {
      NEW: 'Mới',
      CONTACTED: 'Đã liên hệ',
      QUALIFIED: 'Đủ điều kiện',
      CONVERTED: 'Đã chuyển đổi',
      LOST: 'Mất khách',
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
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý khách hàng tiềm năng</h1>
          <p className="text-gray-600 mt-1">Theo dõi và chuyển đổi leads thành khách hàng</p>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-3 flex-1">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="NEW">Mới</option>
                <option value="CONTACTED">Đã liên hệ</option>
                <option value="QUALIFIED">Đủ điều kiện</option>
                <option value="CONVERTED">Đã chuyển đổi</option>
                <option value="LOST">Mất khách</option>
              </select>

              <select
                value={filters.listing}
                onChange={(e) => setFilters({ ...filters, listing: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Tất cả tin đăng</option>
              </select>

              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="week">7 ngày qua</option>
                <option value="month">30 ngày qua</option>
              </select>

              <select
                value={filters.assignee}
                onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">Tất cả người phụ trách</option>
                <option value="unassigned">Chưa gán</option>
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              📥 Export CSV
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedLeads.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                Đã chọn {selectedLeads.length} leads
              </span>
              <button
                onClick={handleBulkAssign}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Gán người phụ trách
              </button>
              <button
                onClick={handleBulkMarkContacted}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Đánh dấu đã liên hệ
              </button>
              <button
                onClick={() => setSelectedLeads([])}
                className="px-3 py-1 text-gray-600 hover:text-gray-900 text-sm"
              >
                Bỏ chọn
              </button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Tổng leads</div>
            <div className="text-2xl font-bold text-gray-900">{allLeads.length}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <div className="text-sm text-blue-600">Mới</div>
            <div className="text-2xl font-bold text-blue-900">
              {allLeads.filter(l => l.status === 'NEW').length}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <div className="text-sm text-yellow-600">Đã liên hệ</div>
            <div className="text-2xl font-bold text-yellow-900">
              {allLeads.filter(l => l.status === 'CONTACTED').length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <div className="text-sm text-green-600">Đủ điều kiện</div>
            <div className="text-2xl font-bold text-green-900">
              {allLeads.filter(l => l.status === 'QUALIFIED').length}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-4">
            <div className="text-sm text-purple-600">Đã chuyển đổi</div>
            <div className="text-2xl font-bold text-purple-900">
              {allLeads.filter(l => l.status === 'CONVERTED').length}
            </div>
          </div>
        </div>

        {/* Leads Table */}
        {leads.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có leads nào</h3>
            <p className="text-gray-600">Leads từ tin đăng sẽ hiển thị ở đây</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === leads.length && leads.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Liên hệ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tin đăng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Người phụ trách
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => handleSelectLead(lead.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{lead.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{lead.message?.slice(0, 50)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{lead.email || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{lead.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {lead.listing_id ? `#${lead.listing_id.slice(0, 8)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {translateStatus(lead.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {lead.assignee_id ? `User ${lead.assignee_id.slice(0, 8)}` : 'Chưa gán'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Chi tiết →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
