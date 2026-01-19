import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, CheckCircle, XCircle, Clock, Eye, Download } from 'lucide-react';
import Layout from '../components/Layout';
import { apiClient } from '../api/client';

interface Booking {
  id: string;
  rentable_item_id: string;
  start_at: string;
  end_at: string;
  status: string;
  quantity: number;
  created_at: string;
  metadata?: any;
  rentable_item?: {
    id: string;
    code: string;
    space_node?: {
      name: string;
    };
  };
}

export default function LandlordBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, statusFilter, searchQuery, dateFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/bookings?page=1&page_size=1000');
      const data = response.data.data || [];
      setBookings(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Booking[]) => {
    setStats({
      total: data.length,
      pending: data.filter(b => b.status === 'PENDING').length,
      confirmed: data.filter(b => b.status === 'CONFIRMED').length,
      cancelled: data.filter(b => b.status === 'CANCELLED').length,
    });
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.id.toLowerCase().includes(query) ||
        b.rentable_item?.code?.toLowerCase().includes(query) ||
        b.rentable_item?.space_node?.name?.toLowerCase().includes(query) ||
        (b.metadata?.contact?.full_name || '').toLowerCase().includes(query)
      );
    }

    // Date filter
    if (dateFilter !== 'ALL') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(b => {
        const startDate = new Date(b.start_at);
        
        switch (dateFilter) {
          case 'TODAY':
            return startDate >= today && startDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          case 'WEEK':
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            return startDate >= today && startDate < weekFromNow;
          case 'MONTH':
            const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            return startDate >= today && startDate < monthFromNow;
          default:
            return true;
        }
      });
    }

    // Sort by start date (newest first)
    filtered.sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

    setFilteredBookings(filtered);
  };

  const handleConfirm = async (id: string) => {
    if (!confirm('Xác nhận booking này?')) return;
    
    try {
      await apiClient.post(`/bookings/${id}/confirm`);
      alert('✅ Đã xác nhận booking thành công!');
      loadBookings();
    } catch (error: any) {
      alert(`❌ Lỗi: ${error.response?.data?.message || 'Không thể xác nhận booking'}`);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Hủy booking này?')) return;
    
    try {
      await apiClient.post(`/bookings/${id}/cancel`);
      alert('✅ Đã hủy booking thành công!');
      loadBookings();
    } catch (error: any) {
      alert(`❌ Lỗi: ${error.response?.data?.message || 'Không thể hủy booking'}`);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Rentable Item', 'Guest Name', 'Start Date', 'End Date', 'Status', 'Quantity', 'Created At'].join(','),
      ...filteredBookings.map(b => [
        b.id,
        b.rentable_item?.code || '',
        b.metadata?.contact?.full_name || '',
        new Date(b.start_at).toLocaleString('vi-VN'),
        new Date(b.end_at).toLocaleString('vi-VN'),
        b.status,
        b.quantity,
        new Date(b.created_at).toLocaleString('vi-VN'),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      CONFIRMED: 'bg-green-100 text-green-800 border-green-300',
      CANCELLED: 'bg-red-100 text-red-800 border-red-300',
    };
    
    const labels: Record<string, string> = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      CANCELLED: 'Đã hủy',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout userRole="LANDLORD">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole="LANDLORD">
      <div className="min-h-screen bg-gray-50 p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Bookings</h1>
          <p className="text-gray-600 mt-1">Xem và quản lý tất cả bookings của bạn</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chờ xác nhận</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã xác nhận</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đã hủy</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.cancelled}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo ID, tên khách, rentable item..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tất cả</option>
                <option value="PENDING">Chờ xác nhận</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tất cả</option>
                <option value="TODAY">Hôm nay</option>
                <option value="WEEK">7 ngày tới</option>
                <option value="MONTH">30 ngày tới</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Hiển thị <span className="font-medium">{filteredBookings.length}</span> / {stats.total} bookings
            </p>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Không có booking nào</p>
              <p className="text-gray-500 text-sm mt-1">
                {searchQuery || statusFilter !== 'ALL' || dateFilter !== 'ALL'
                  ? 'Thử thay đổi bộ lọc'
                  : 'Chưa có booking nào được tạo'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rentable Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            #{booking.id.substring(0, 8)}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {new Date(booking.created_at).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {booking.rentable_item?.code || 'N/A'}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {booking.rentable_item?.space_node?.name || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {booking.metadata?.contact?.full_name || 'N/A'}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {booking.metadata?.contact?.phone || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div>{new Date(booking.start_at).toLocaleDateString('vi-VN')}</div>
                          <div className="text-gray-500 text-xs">
                            đến {new Date(booking.end_at).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(booking)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Xem
                          </button>
                          {booking.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleConfirm(booking.id)}
                                className="text-green-600 hover:text-green-900 text-sm font-medium flex items-center gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Xác nhận
                              </button>
                              <button
                                onClick={() => handleCancel(booking.id)}
                                className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                Hủy
                              </button>
                            </>
                          )}
                          {booking.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleCancel(booking.id)}
                              className="text-red-600 hover:text-red-900 text-sm font-medium flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Hủy
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
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Chi tiết Booking</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Booking Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Thông tin booking</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Booking ID:</span>
                      <p className="font-medium">{selectedBooking.id}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Trạng thái:</span>
                      <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Ngày tạo:</span>
                      <p className="font-medium">{new Date(selectedBooking.created_at).toLocaleString('vi-VN')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Số lượng:</span>
                      <p className="font-medium">{selectedBooking.quantity}</p>
                    </div>
                  </div>
                </div>

                {/* Time Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Thời gian</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Nhận phòng:</span>
                      <p className="font-medium">{new Date(selectedBooking.start_at).toLocaleString('vi-VN')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Trả phòng:</span>
                      <p className="font-medium">{new Date(selectedBooking.end_at).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                </div>

                {/* Guest Info */}
                {selectedBooking.metadata?.contact && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Thông tin khách</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Họ tên:</span>
                        <p className="font-medium">{selectedBooking.metadata.contact.full_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Số điện thoại:</span>
                        <p className="font-medium">{selectedBooking.metadata.contact.phone}</p>
                      </div>
                      {selectedBooking.metadata.contact.email && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Email:</span>
                          <p className="font-medium">{selectedBooking.metadata.contact.email}</p>
                        </div>
                      )}
                      {selectedBooking.metadata.contact.special_requests && (
                        <div className="col-span-2">
                          <span className="text-gray-600">Yêu cầu đặc biệt:</span>
                          <p className="font-medium">{selectedBooking.metadata.contact.special_requests}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Guests Count */}
                {selectedBooking.metadata?.guests && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Số khách</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Người lớn:</span>
                        <p className="font-medium">{selectedBooking.metadata.guests.adults}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Trẻ em:</span>
                        <p className="font-medium">{selectedBooking.metadata.guests.children || 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Em bé:</span>
                        <p className="font-medium">{selectedBooking.metadata.guests.infants || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pricing */}
                {selectedBooking.metadata?.pricing && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Giá</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tổng tiền:</span>
                        <span className="text-xl font-bold text-blue-600">
                          {new Intl.NumberFormat('vi-VN').format(selectedBooking.metadata.pricing.total)} ₫
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedBooking.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => {
                          handleConfirm(selectedBooking.id);
                          setShowDetailModal(false);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Xác nhận
                      </button>
                      <button
                        onClick={() => {
                          handleCancel(selectedBooking.id);
                          setShowDetailModal(false);
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        Hủy
                      </button>
                    </>
                  )}
                  {selectedBooking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => {
                        handleCancel(selectedBooking.id);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Hủy booking
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
