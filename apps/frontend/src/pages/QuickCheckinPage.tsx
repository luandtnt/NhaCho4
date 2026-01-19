import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Users, Clock, FileText, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';

interface RentableItem {
  id: string;
  code: string;
  property_category: string;
  base_price: number;
  price_unit: string;
  metadata?: any;
}

export default function QuickCheckinPage() {
  const navigate = useNavigate();
  
  // Form states
  const [rentableItems, setRentableItems] = useState<RentableItem[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [guests, setGuests] = useState(1);
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [notes, setNotes] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchAvailableRooms();
  }, []);

  const fetchAvailableRooms = async () => {
    try {
      setLoadingRooms(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('http://localhost:3000/api/v1/rentable-items?page=1&page_size=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRentableItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Không thể tải danh sách phòng');
    } finally {
      setLoadingRooms(false);
    }
  };

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
        setSuccess(true);
        
        // Show success message
        alert(`✅ Check-in thành công!\n\nMã booking: ${result.booking_code}\nPhòng: ${result.rentable_item.code}\nSố khách: ${guests}\nDự kiến check-out: ${new Date(result.estimated_checkout).toLocaleString('vi-VN')}`);
        
        // Navigate to active bookings page
        setTimeout(() => {
          navigate('/active-bookings');
        }, 1000);
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
    <Layout userRole="LANDLORD">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Check-in Nhanh</h1>
                <p className="text-sm text-gray-600">Cho khách walk-in (không đặt qua app)</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            {/* Room Selection */}
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

            {/* Guests */}
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

            {/* Estimated Duration */}
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

            {/* Notes */}
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

            {/* Price Estimate */}
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Lỗi</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-900">✅ Check-in thành công!</p>
                <p className="text-sm text-green-700">Đang chuyển đến trang quản lý...</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || !selectedRoomId}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
