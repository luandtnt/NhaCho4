import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

interface Booking {
  id: string;
  rentable_item_id: string;
  start_time: string;
  end_time: string;
  status: string;
  quantity: number;
  created_at: string;
}

interface RentableItem {
  id: string;
  code: string;
  allocation_type: string;
  attrs: any;
}

export default function TenantBookingPage() {
  const [rentableItems, setRentableItems] = useState<RentableItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<RentableItem | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [showCreateBookingModal, setShowCreateBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    start_time: '',
    end_time: '',
    quantity: 1,
  });

  useEffect(() => {
    loadRentableItems();
    loadMyBookings();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      loadBookings();
    }
  }, [selectedItem, currentDate]);

  const loadRentableItems = async () => {
    try {
      // Load only published/available items
      const response = await apiClient.get('/rentable-items?page=1&page_size=100');
      const items = response.data.data || [];
      setRentableItems(items);
      if (items.length > 0 && !selectedItem) {
        setSelectedItem(items[0]);
      }
    } catch (error) {
      console.error('Không thể tải danh sách rentable items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await apiClient.get('/bookings?page=1&page_size=1000');
      const allBookings = response.data.data || [];
      // Filter by selected item - only show CONFIRMED bookings to see availability
      const filtered = allBookings.filter((b: Booking) => 
        b.rentable_item_id === selectedItem?.id && b.status === 'CONFIRMED'
      );
      setBookings(filtered);
    } catch (error) {
      console.error('Không thể tải danh sách booking:', error);
    }
  };

  const loadMyBookings = async () => {
    try {
      // Get current user's tenant party ID
      const userResponse = await apiClient.get('/users/me');
      const currentUser = userResponse.data;
      
      // Find tenant party for current user
      const partiesResponse = await apiClient.get('/parties');
      const tenantParty = partiesResponse.data.data?.find(
        (p: any) => p.party_type === 'Tenant' && p.metadata?.user_id === currentUser.id
      );
      
      if (tenantParty) {
        // Load bookings filtered by tenant_party_id
        const response = await apiClient.get(`/bookings?page=1&page_size=1000&tenant_party_id=${tenantParty.id}`);
        const filteredBookings = response.data.data || [];
        setMyBookings(filteredBookings);
      } else {
        // No tenant party found, show all bookings (fallback)
        const response = await apiClient.get('/bookings?page=1&page_size=1000');
        setMyBookings(response.data.data || []);
      }
    } catch (error) {
      console.error('Không thể tải booking của tôi:', error);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    try {
      await apiClient.post('/bookings', {
        rentable_item_id: selectedItem.id,
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
        quantity: bookingForm.quantity,
      });
      alert('Đã gửi yêu cầu booking! Chủ nhà sẽ xem xét và xác nhận.');
      setShowCreateBookingModal(false);
      setBookingForm({
        start_time: '',
        end_time: '',
        quantity: 1,
      });
      loadMyBookings();
      loadBookings();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể tạo booking');
    }
  };

  const handleCancelMyBooking = async (id: string) => {
    if (!confirm('Bạn có chắc muốn hủy booking này?')) return;
    try {
      await apiClient.post(`/bookings/${id}/cancel`);
      alert('Đã hủy booking thành công!');
      loadMyBookings();
      loadBookings();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể hủy booking');
    }
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const day = new Date(firstDay);
      day.setDate(day.getDate() - i - 1);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    return days;
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return checkDate >= start && checkDate <= end;
    });
  };

  const isDateAvailable = (date: Date) => {
    const dayBookings = getBookingsForDate(date);
    // Simple check: if there are confirmed bookings, mark as unavailable
    return dayBookings.length === 0;
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      CONFIRMED: 'bg-green-100 text-green-800 border-green-300',
      CANCELLED: 'bg-red-100 text-red-800 border-red-300',
      EXPIRED: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const translateStatus = (status: string) => {
    const map: any = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      CANCELLED: 'Đã hủy',
      EXPIRED: 'Hết hạn',
    };
    return map[status] || status;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
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
          <h1 className="text-3xl font-bold text-gray-900">Đặt chỗ</h1>
          <p className="text-gray-600 mt-1">Xem lịch trống và đặt chỗ thuê</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chọn phòng/chỗ
                </label>
                <select
                  value={selectedItem?.id || ''}
                  onChange={(e) => {
                    const item = rentableItems.find(i => i.id === e.target.value);
                    setSelectedItem(item || null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {rentableItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.allocation_type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chế độ xem
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-4 py-2 rounded-lg ${
                      viewMode === 'week'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Tuần
                  </button>
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-4 py-2 rounded-lg ${
                      viewMode === 'month'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Tháng
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCreateBookingModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              ➕ Đặt chỗ
            </button>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex justify-between items-center p-4 border-b">
            <button
              onClick={() => navigateDate('prev')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              ← Trước
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {viewMode === 'week' 
                ? `Tuần ${Math.ceil(currentDate.getDate() / 7)} - Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`
                : `Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`
              }
            </h2>
            <button
              onClick={() => navigateDate('next')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Sau →
            </button>
          </div>

          {/* Calendar Grid */}
          {viewMode === 'week' ? (
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, i) => (
                <div key={i} className="bg-gray-50 p-2 text-center font-semibold text-sm">
                  {day}
                </div>
              ))}
              {getWeekDays().map((date, i) => {
                const available = isDateAvailable(date);
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={i}
                    className={`bg-white p-3 min-h-[120px] ${
                      isToday ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="mt-2">
                      {available ? (
                        <div className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded">
                          ✓ Còn trống
                        </div>
                      ) : (
                        <div className="text-xs px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded">
                          ✗ Đã đặt
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, i) => (
                <div key={i} className="bg-gray-50 p-2 text-center font-semibold text-sm">
                  {day}
                </div>
              ))}
              {getMonthDays().map((item, i) => {
                const available = isDateAvailable(item.date);
                const isToday = item.date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={i}
                    className={`bg-white p-2 min-h-[80px] ${
                      !item.isCurrentMonth ? 'opacity-40' : ''
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className={`text-xs font-medium mb-1 ${
                      isToday ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {item.date.getDate()}
                    </div>
                    {item.isCurrentMonth && (
                      <div className="mt-1">
                        {available ? (
                          <div className="w-3 h-3 bg-green-400 rounded-full mx-auto"></div>
                        ) : (
                          <div className="w-3 h-3 bg-red-400 rounded-full mx-auto"></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Chú thích</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-700">Còn trống</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-400 rounded-full"></div>
              <span className="text-sm text-gray-700">Đã đặt</span>
            </div>
          </div>
        </div>

        {/* My Bookings List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">
              Booking của tôi ({myBookings.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            {myBookings.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="text-4xl mb-2">📅</div>
                <p>Bạn chưa có booking nào</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Phòng/Chỗ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Số lượng
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
                  {myBookings.map(booking => {
                    const item = rentableItems.find(i => i.id === booking.rentable_item_id);
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item?.code || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(booking.start_time).toLocaleDateString('vi-VN')}
                          </div>
                          <div className="text-xs text-gray-500">
                            đến {new Date(booking.end_time).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {booking.quantity}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {translateStatus(booking.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {booking.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancelMyBooking(booking.id)}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              Hủy
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Create Booking Modal */}
        {showCreateBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Đặt chỗ</h2>
              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phòng/Chỗ
                  </label>
                  <input
                    type="text"
                    value={selectedItem?.code || ''}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian bắt đầu *
                  </label>
                  <input
                    type="datetime-local"
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian kết thúc *
                  </label>
                  <input
                    type="datetime-local"
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bookingForm.quantity}
                    onChange={(e) => setBookingForm({ ...bookingForm, quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    💡 Booking của bạn sẽ ở trạng thái "Chờ xác nhận" cho đến khi chủ nhà xác nhận.
                  </p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateBookingModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Gửi yêu cầu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
