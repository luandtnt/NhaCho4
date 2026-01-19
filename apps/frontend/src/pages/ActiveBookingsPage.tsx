import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, DollarSign, LogOut, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';

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

export default function ActiveBookingsPage() {
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState<ActiveBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [extending, setExtending] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveBookings();
    
    // Auto-refresh every 30 seconds
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
        
        // Refresh list
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
        
        // Refresh list
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Phòng Đang Sử Dụng</h1>
              <p className="text-sm text-gray-600 mt-1">
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
                onClick={() => navigate('/quick-checkin')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Check-in Mới</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Lỗi</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Bookings List */}
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
                onClick={() => navigate('/quick-checkin')}
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
                  {/* Header */}
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

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Duration */}
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

                    {/* Guests */}
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

                    {/* Current Price */}
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

                    {/* Notes */}
                    {booking.notes && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Ghi chú:</p>
                        <p className="text-sm text-gray-900">{booking.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
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
      </div>
    </Layout>
  );
}
