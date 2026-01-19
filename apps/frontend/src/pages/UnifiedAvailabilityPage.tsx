import { useState, useEffect } from 'react';
import { Calendar, Clock, UserCheck, List, Users, DollarSign, LogOut, Plus, RefreshCw, AlertCircle, FileText, Search, CheckCircle, XCircle, Eye, Download } from 'lucide-react';
import Layout from '../components/Layout';
import AvailabilityCalendar from '../components/booking/AvailabilityCalendar';
import { apiClient } from '../api/client';

type TabType = 'calendar' | 'active' | 'checkin' | 'all';

interface RentableItem {
  id: string;
  code: string;
  property_category: string;
  base_price: number;
  price_unit: string;
  metadata?: any;
}

interface ActiveBooking {
  booking_id: string;
  booking_code: string;
  rentable_item: {
    id: string;
    code: string;
    property_category: string;
    base_price: number;
    price_unit: string;
  };
  checked_in_at: string;
  estimated_checkout: string;
  duration: {
    hours: number;
    minutes: number;
    total_hours: number;
  };
  current_price: number;
  guests: number;
  notes?: string;
  is_walk_in: boolean;
}

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

export default function UnifiedAvailabilityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [rentableItems, setRentableItems] = useState<RentableItem[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    fetchRentableItems();
  }, []);

  const fetchRentableItems = async () => {
    try {
      setLoadingRooms(true);
      const token = localStorage.getItem('access_token');
      
      // Only fetch SHORT_TERM rental items for booking functionality
      const response = await fetch('http://localhost:3000/api/v1/rentable-items?page=1&page_size=100&rental_duration_type=SHORT_TERM', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Short-term rentable items response:', result);
        
        // API returns { data: [...], meta: {...} }
        const items = result.data || [];
        console.log('Extracted short-term items:', items);
        
        setRentableItems(items);
      } else {
        console.error('Failed to fetch rentable items:', response.status);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const tabs = [
    { id: 'calendar' as TabType, label: 'Lịch Trống', icon: Calendar, color: 'blue' },
    { id: 'active' as TabType, label: 'Đang Sử Dụng', icon: Clock, color: 'orange' },
    { id: 'checkin' as TabType, label: 'Check-in Nhanh', icon: UserCheck, color: 'green' },
    { id: 'all' as TabType, label: 'Tất Cả Bookings', icon: List, color: 'purple' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn phòng để xem lịch
              </label>
              {loadingRooms ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : (
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Chọn phòng --</option>
                  {rentableItems.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.code} - {room.property_category}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedRoomId && (
              <AvailabilityCalendar rentableItemId={selectedRoomId} />
            )}

            {!selectedRoomId && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chọn phòng để xem lịch
                </h3>
                <p className="text-gray-600">
                  Vui lòng chọn một phòng từ dropdown bên trên
                </p>
              </div>
            )}
          </div>
        );

      case 'active':
        return <ActiveBookingsContent onSwitchToCheckin={() => setActiveTab('checkin')} />;

      case 'checkin':
        return <QuickCheckinContent rentableItems={rentableItems} loadingRooms={loadingRooms} onSuccess={() => setActiveTab('active')} />;

      case 'all':
        return <AllBookingsContent />;

      default:
        return null;
    }
  };

  return (
    <Layout userRole="LANDLORD">
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Quản Lý Đặt Phòng
            </h1>

            <div className="flex gap-2 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition whitespace-nowrap ${
                      isActive
                        ? `bg-${tab.color}-600 text-white shadow-md`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {renderContent()}
        </div>
      </div>
    </Layout>
  );
}

// Active Bookings Content Component
function ActiveBookingsContent({ onSwitchToCheckin }: { onSwitchToCheckin: () => void }) {
  const [bookings, setBookings] = useState<ActiveBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [extending, setExtending] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveBookings();
    const interval = setInterval(fetchActiveBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveBookings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('http://localhost:3000/api/v1/bookings/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
        setError('');
      } else {
        setError('Không thể tải danh sách phòng đang sử dụng');
      }
    } catch (error) {
      console.error('Error fetching active bookings:', error);
      setError('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (bookingId: string, bookingCode: string) => {
    if (!confirm(`Xác nhận check-out cho booking ${bookingCode}?`)) {
      return;
    }

    try {
      setCheckingOut(bookingId);
      const token = localStorage.getItem('access_token');

      const response = await fetch('http://localhost:3000/api/v1/bookings/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: bookingId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Check-out thành công!\n\nMã booking: ${result.booking_code}\nThời gian sử dụng: ${result.duration_hours} giờ\nTổng tiền: ${result.total_price.toLocaleString('vi-VN')} ₫`);
        fetchActiveBookings();
      } else {
        const errorData = await response.json();
        alert(`❌ Lỗi: ${errorData.message || 'Không thể check-out'}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Có lỗi xảy ra khi check-out');
    } finally {
      setCheckingOut(null);
    }
  };

  const handleExtend = async (bookingId: string) => {
    const additionalHours = prompt('Gia hạn thêm bao nhiêu giờ?', '2');
    if (!additionalHours) return;

    const hours = parseInt(additionalHours);
    if (isNaN(hours) || hours < 1 || hours > 24) {
      alert('Vui lòng nhập số giờ hợp lệ (1-24)');
      return;
    }

    try {
      setExtending(bookingId);
      const token = localStorage.getItem('access_token');

      const response = await fetch('http://localhost:3000/api/v1/bookings/extend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: bookingId,
          additional_hours: hours,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Gia hạn thành công!\n\nThời gian mới: ${new Date(result.new_estimated_checkout).toLocaleString('vi-VN')}\nTổng dự kiến: ${result.total_estimated_hours} giờ`);
        fetchActiveBookings();
      } else {
        const errorData = await response.json();
        alert(`❌ Lỗi: ${errorData.message || 'Không thể gia hạn'}`);
      }
    } catch (error) {
      console.error('Extend error:', error);
      alert('Có lỗi xảy ra khi gia hạn');
    } finally {
      setExtending(null);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-600">
            {bookings.length} phòng đang có khách
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchActiveBookings}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Làm mới</span>
          </button>
          <button
            onClick={onSwitchToCheckin}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Check-in Mới</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Lỗi</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không có phòng nào đang sử dụng
          </h3>
          <p className="text-gray-600 mb-6">
            Tất cả phòng hiện đang trống
          </p>
          <button
            onClick={onSwitchToCheckin}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Check-in Khách Mới</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map(booking => (
            <div
              key={booking.booking_id}
              className="bg-white rounded-lg shadow-sm border-2 border-orange-200 overflow-hidden"
            >
              <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {booking.rentable_item.code}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {booking.booking_code}
                    </p>
                  </div>
                  <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Đang sử dụng
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Thời gian sử dụng</p>
                    <p className="font-bold text-xl text-gray-900">
                      {booking.duration.hours}h {booking.duration.minutes}m
                    </p>
                    <p className="text-xs text-gray-500">
                      Check-in: {new Date(booking.checked_in_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Số khách</p>
                    <p className="font-semibold text-gray-900">
                      {booking.guests} người
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Tạm tính</p>
                    <p className="font-bold text-xl text-purple-600">
                      {formatPrice(booking.current_price)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatPrice(booking.rentable_item.base_price)}/{booking.rentable_item.price_unit === 'HOUR' ? 'giờ' : 'đêm'}
                    </p>
                  </div>
                </div>

                {booking.notes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Ghi chú:</p>
                    <p className="text-sm text-gray-900">{booking.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleExtend(booking.booking_id)}
                    disabled={extending === booking.booking_id}
                    className="flex-1 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition font-medium disabled:opacity-50"
                  >
                    {extending === booking.booking_id ? 'Đang xử lý...' : '⏰ Gia hạn'}
                  </button>
                  <button
                    onClick={() => handleCheckout(booking.booking_id, booking.booking_code)}
                    disabled={checkingOut === booking.booking_id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {checkingOut === booking.booking_id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4" />
                        <span>Check-out</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Quick Check-in Content Component
function QuickCheckinContent({ rentableItems, loadingRooms, onSuccess }: { rentableItems: RentableItem[], loadingRooms: boolean, onSuccess: () => void }) {
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [guests, setGuests] = useState(1);
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoomId) {
      setError('Vui lòng chọn phòng');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access_token');

      const response = await fetch('http://localhost:3000/api/v1/bookings/quick-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rentable_item_id: selectedRoomId,
          guests,
          estimated_duration_hours: estimatedHours,
          notes: notes || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Check-in thành công!\n\nMã booking: ${result.booking_code}\nPhòng: ${result.rentable_item.code}\nSố khách: ${guests}\nDự kiến check-out: ${new Date(result.estimated_checkout).toLocaleString('vi-VN')}`);
        
        // Reset form
        setSelectedRoomId('');
        setGuests(1);
        setEstimatedHours(2);
        setNotes('');
        
        // Switch to active bookings tab
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Không thể check-in');
      }
    } catch (error: any) {
      console.error('Check-in error:', error);
      setError('Có lỗi xảy ra khi check-in');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoom = rentableItems.find(r => r.id === selectedRoomId);
  const estimatedPrice = selectedRoom ? Number(selectedRoom.base_price) * estimatedHours : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Check-in Nhanh</h2>
            <p className="text-sm text-gray-600">Cho khách walk-in (không đặt qua app)</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chọn phòng *
          </label>
          {loadingRooms ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">-- Chọn phòng --</option>
              {rentableItems.map(room => (
                <option key={room.id} value={room.id}>
                  {room.code} - {room.property_category} ({Number(room.base_price).toLocaleString('vi-VN')} ₫/{room.price_unit === 'HOUR' ? 'giờ' : room.price_unit === 'NIGHT' ? 'đêm' : 'tháng'})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Số khách *
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition"
            >
              -
            </button>
            <input
              type="number"
              value={guests}
              onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 text-center text-xl font-semibold border border-gray-300 rounded-lg py-2"
              min="1"
              max="50"
            />
            <button
              type="button"
              onClick={() => setGuests(guests + 1)}
              className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition"
            >
              +
            </button>
            <span className="text-gray-600">người</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Thời gian dự kiến *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 6, 8, 12, 24].map(hours => (
              <button
                key={hours}
                type="button"
                onClick={() => setEstimatedHours(hours)}
                className={`py-3 rounded-lg border-2 font-medium transition ${
                  estimatedHours === hours
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                {hours}h
              </button>
            ))}
          </div>
          <input
            type="number"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(Math.max(1, parseInt(e.target.value) || 1))}
            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Hoặc nhập số giờ khác"
            min="1"
            max="720"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Ghi chú
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Yêu cầu đặc biệt, ghi chú..."
          />
        </div>

        {selectedRoom && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Giá dự kiến:</span>
              <span className="text-xl font-bold text-blue-600">
                {estimatedPrice.toLocaleString('vi-VN')} ₫
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {Number(selectedRoom.base_price).toLocaleString('vi-VN')} ₫ × {estimatedHours} giờ
            </p>
            <p className="text-xs text-orange-600 mt-2">
              ⚠️ Giá cuối cùng sẽ được tính dựa trên thời gian thực tế khi check-out
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Lỗi</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedRoomId}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <UserCheck className="w-5 h-5" />
              <span>Check-in Ngay</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// All Bookings Content Component
function AllBookingsContent() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

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

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.id.toLowerCase().includes(query) ||
        b.rentable_item?.code?.toLowerCase().includes(query) ||
        b.rentable_item?.space_node?.name?.toLowerCase().includes(query) ||
        (b.metadata?.contact?.full_name || '').toLowerCase().includes(query)
      );
    }

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
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  return (
    <div>
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
  );
}
