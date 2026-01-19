import { MapPin, Calendar, Users } from 'lucide-react';

interface BookingSummaryCardProps {
  listing: any;
  rentableItem: any;
  mainImage?: string;
  startDate: Date | null;
  endDate: Date | null;
  guests: number;
  priceData: any;
}

export default function BookingSummaryCard({
  listing,
  rentableItem,
  mainImage,
  startDate,
  endDate,
  guests,
  priceData,
}: BookingSummaryCardProps) {
  
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '--';
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Placeholder image data URL
  const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      {/* Image */}
      <div className="relative h-48 bg-gray-200">
        <img
          src={mainImage || placeholderImage}
          alt={listing.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = placeholderImage;
          }}
        />
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Title */}
        <div>
          <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
            {listing.title}
          </h3>
          <div className="flex items-start gap-1 mt-1 text-sm text-gray-600">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {rentableItem.ward}, {rentableItem.district}, {rentableItem.province}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Booking Details */}
        <div className="space-y-3">
          {/* Dates */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4" />
              <span>Thời gian</span>
            </div>
            <div className="text-sm text-gray-600 ml-6">
              <div className="flex justify-between">
                <span>Nhận phòng:</span>
                <span className="font-medium">{formatDate(startDate)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Trả phòng:</span>
                <span className="font-medium">{formatDate(endDate)}</span>
              </div>
              {priceData && priceData.nights > 0 && (
                <div className="flex justify-between mt-1 text-blue-600 font-medium">
                  <span>Tổng:</span>
                  <span>{priceData.nights} đêm</span>
                </div>
              )}
            </div>
          </div>

          {/* Guests */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Users className="w-4 h-4" />
              <span>Khách</span>
            </div>
            <div className="text-sm text-gray-600 ml-6">
              <div className="flex justify-between">
                <span>Số khách:</span>
                <span className="font-medium">{guests} người</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        {priceData && <div className="border-t border-gray-200"></div>}

        {/* Price Summary */}
        {priceData && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Giá phòng</span>
              <span className="text-gray-900">{formatPrice(priceData.subtotal)}</span>
            </div>
            
            {Object.keys(priceData.fees || {}).length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Phí dịch vụ</span>
                <span className="text-gray-900">
                  {formatPrice(Object.values(priceData.fees).reduce((a: number, b: any) => a + (Number(b) || 0), 0))}
                </span>
              </div>
            )}

            {Object.keys(priceData.discounts || {}).length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Giảm giá</span>
                <span className="text-green-600">
                  -{formatPrice(Object.values(priceData.discounts).reduce((a: number, b: any) => a + (Number(b) || 0), 0))}
                </span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900">Tổng cộng</span>
                <span className="font-bold text-xl text-blue-600">
                  {formatPrice(priceData.total)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Instant Booking Badge */}
        {rentableItem.instant_booking && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-sm font-medium text-green-900">
              ⚡ Đặt phòng tức thì
            </p>
            <p className="text-xs text-green-700 mt-1">
              Xác nhận ngay lập tức
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
