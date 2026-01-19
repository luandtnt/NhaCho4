import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Send, Phone, MessageCircle, Zap } from 'lucide-react';

interface CTASectionProps {
  rental_duration_type: string;
  instant_booking?: boolean;
  rentableItemId?: string;
  onBookNow?: (data: any) => void;
  onSendInquiry?: () => void;
  onScheduleViewing?: () => void;
  onContact?: () => void;
}

export default function CTASection({
  rental_duration_type,
  instant_booking,
  rentableItemId,
  onBookNow,
  onSendInquiry,
  onScheduleViewing,
  onContact
}: CTASectionProps) {
  const navigate = useNavigate();
  const { id: listingId } = useParams();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const isShortTerm = rental_duration_type === 'SHORT_TERM';
  const isMidTerm = rental_duration_type === 'MEDIUM_TERM';
  const isLongTerm = rental_duration_type === 'LONG_TERM';

  const handleBooking = () => {
    // Navigate to booking page
    if (listingId && rentableItemId) {
      navigate(`/booking/${listingId}/${rentableItemId}`);
    } else if (onBookNow) {
      onBookNow({ checkIn, checkOut, guests });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        {isShortTerm ? '📅 Đặt phòng' : '📋 Liên hệ thuê'}
      </h3>

      {/* Short-term booking form */}
      {isShortTerm && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày nhận phòng
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày trả phòng
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số khách
            </label>
            <select
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} khách</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleBooking}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              instant_booking
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            {instant_booking ? (
              <span className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                Đặt ngay lập tức
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                Gửi yêu cầu đặt phòng
              </span>
            )}
          </button>

          {instant_booking && (
            <p className="text-xs text-center text-gray-600">
              ⚡ Xác nhận tự động - Không cần chờ duyệt
            </p>
          )}
        </div>
      )}

      {/* Mid/Long-term actions */}
      {(isMidTerm || isLongTerm) && (
        <div className="space-y-3 mb-6">
          <button
            onClick={onScheduleViewing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition"
          >
            <Calendar className="w-5 h-5" />
            Đặt lịch xem nhà
          </button>

          <button
            onClick={onSendInquiry}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition"
          >
            <Send className="w-5 h-5" />
            Gửi yêu cầu thuê
          </button>
        </div>
      )}

      {/* Contact options */}
      <div className="border-t pt-4 space-y-2">
        <button
          onClick={onContact}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Phone className="w-4 h-4" />
          <span>Gọi điện</span>
        </button>

        <button
          onClick={onContact}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Nhắn tin</span>
        </button>
      </div>

      <div className="mt-4 text-xs text-center text-gray-600">
        Chúng tôi sẽ liên hệ với bạn trong vòng 24h
      </div>
    </div>
  );
}
