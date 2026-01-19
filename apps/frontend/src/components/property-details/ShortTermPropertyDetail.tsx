import { Bed, Bath, Calendar, Check, Zap, RotateCcw, Users, Home, Wind, Waves, Utensils } from 'lucide-react';
import { useState } from 'react';

interface ShortTermPropertyDetailProps {
  rentableItem: any;
  listingId: string;
  onBookingRequest?: (bookingData: any) => void;
}

export default function ShortTermPropertyDetail({ rentableItem, listingId, onBookingRequest }: ShortTermPropertyDetailProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const metadata = rentableItem.metadata?.details || {};

  const getCancellationPolicyText = (policy: string) => {
    switch (policy) {
      case 'FLEXIBLE':
        return { text: 'Linh hoạt', desc: 'Hoàn tiền 100% nếu hủy trước 24h', color: 'text-green-600' };
      case 'MODERATE':
        return { text: 'Trung bình', desc: 'Hoàn tiền 50% nếu hủy trước 5 ngày', color: 'text-yellow-600' };
      case 'STRICT':
        return { text: 'Nghiêm ngặt', desc: 'Không hoàn tiền', color: 'text-red-600' };
      default:
        return { text: policy, desc: '', color: 'text-gray-600' };
    }
  };

  const cancellationPolicy = getCancellationPolicyText(rentableItem.cancellation_policy || 'MODERATE');

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    if (nights > 0 && rentableItem.base_price) {
      let total = nights * rentableItem.base_price;
      
      // Add extra guest fee if applicable
      if (metadata.extra_guest_fee && guests > (rentableItem.max_occupancy || 2)) {
        const extraGuests = guests - (rentableItem.max_occupancy || 2);
        total += extraGuests * metadata.extra_guest_fee * nights;
      }
      
      // Add cleaning fee
      if (metadata.cleaning_fee) {
        total += metadata.cleaning_fee;
      }
      
      return total;
    }
    return null;
  };

  const handleDateChange = () => {
    calculateTotal();
  };

  const handleBookNow = () => {
    const nights = calculateNights();
    if (nights < (rentableItem.min_rent_duration || 1)) {
      alert(`Số đêm tối thiểu là ${rentableItem.min_rent_duration || 1} đêm`);
      return;
    }

    if (guests > (rentableItem.max_occupancy || 10)) {
      alert(`Số khách tối đa là ${rentableItem.max_occupancy || 10} người`);
      return;
    }

    if (onBookingRequest) {
      onBookingRequest({
        rentableItemId: rentableItem.id,
        listingId,
        checkIn,
        checkOut,
        guests,
        nights,
        totalPrice: calculateTotal(),
      });
    }
  };

  const getDirectionLabel = (direction: string) => {
    const labels: Record<string, string> = {
      EAST: 'Đông',
      WEST: 'Tây',
      SOUTH: 'Nam',
      NORTH: 'Bắc',
      NORTHEAST: 'Đông Bắc',
      NORTHWEST: 'Tây Bắc',
      SOUTHEAST: 'Đông Nam',
      SOUTHWEST: 'Tây Nam'
    };
    return labels[direction] || direction;
  };

  const getFurnishingLabel = (level: string) => {
    const labels: Record<string, string> = {
      FULL: 'Đầy đủ nội thất',
      PARTIAL: 'Nội thất cơ bản',
      NONE: 'Không nội thất'
    };
    return labels[level] || level;
  };

  return (
    <div className="space-y-6">
      {/* Booking Form - Prominent for short-term */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">📅 Đặt phòng ngay</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhận phòng
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  setTimeout(handleDateChange, 100);
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trả phòng
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => {
                  setCheckOut(e.target.value);
                  setTimeout(handleDateChange, 100);
                }}
                min={checkIn || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              {Array.from({ length: rentableItem.max_occupancy || 8 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num} khách</option>
              ))}
            </select>
            {rentableItem.max_occupancy && (
              <p className="text-xs text-gray-500 mt-1">Tối đa {rentableItem.max_occupancy} khách</p>
            )}
          </div>

          {checkIn && checkOut && (
            <div className="bg-white rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {rentableItem.base_price?.toLocaleString('vi-VN')}đ x {calculateNights()} đêm
                </span>
                <span className="font-medium">
                  {(calculateNights() * (rentableItem.base_price || 0)).toLocaleString('vi-VN')}đ
                </span>
              </div>
              {metadata.extra_guest_fee && guests > (rentableItem.max_occupancy || 2) && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Phụ thu {guests - (rentableItem.max_occupancy || 2)} khách thêm
                  </span>
                  <span className="font-medium">
                    {((guests - (rentableItem.max_occupancy || 2)) * metadata.extra_guest_fee * calculateNights()).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}
              {metadata.cleaning_fee && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí dọn dẹp</span>
                  <span className="font-medium">{metadata.cleaning_fee.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span className="text-blue-600">
                  {calculateTotal()?.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleBookNow}
            disabled={!checkIn || !checkOut || calculateNights() < (rentableItem.min_rent_duration || 1)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {rentableItem.instant_booking ? '⚡ Đặt ngay lập tức' : '📩 Gửi yêu cầu đặt phòng'}
          </button>

          {rentableItem.instant_booking && (
            <p className="text-xs text-center text-gray-600">
              Xác nhận tự động - Không cần chờ duyệt
            </p>
          )}
          
          {metadata.booking_hold_deposit && (
            <p className="text-xs text-center text-gray-600">
              Cọc giữ chỗ: {metadata.booking_hold_deposit.toLocaleString('vi-VN')}đ
            </p>
          )}
        </div>
      </div>
      {/* Instant Booking Badge */}
      {rentableItem.instant_booking && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg flex items-center gap-3">
          <Zap className="w-6 h-6" />
          <div>
            <div className="font-semibold text-lg">Đặt phòng ngay lập tức</div>
            <div className="text-sm text-green-100">Xác nhận tự động, không cần chờ duyệt</div>
          </div>
        </div>
      )}

      {/* Key Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rentableItem.area_sqm && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Home className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-gray-900">{rentableItem.area_sqm}m²</div>
            <div className="text-sm text-gray-600">Diện tích</div>
          </div>
        )}
        
        {rentableItem.bedrooms > 0 && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Bed className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-gray-900">{rentableItem.bedrooms}</div>
            <div className="text-sm text-gray-600">Phòng ngủ</div>
          </div>
        )}
        
        {rentableItem.bathrooms > 0 && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Bath className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-gray-900">{rentableItem.bathrooms}</div>
            <div className="text-sm text-gray-600">Phòng tắm</div>
          </div>
        )}

        {rentableItem.max_occupancy && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-gray-900">{rentableItem.max_occupancy}</div>
            <div className="text-sm text-gray-600">Khách tối đa</div>
          </div>
        )}

        {metadata.dorm_beds && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Bed className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-gray-900">{metadata.dorm_beds}</div>
            <div className="text-sm text-gray-600">Giường dorm</div>
          </div>
        )}

        {rentableItem.direction && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Wind className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-lg font-bold text-gray-900">{getDirectionLabel(rentableItem.direction)}</div>
            <div className="text-sm text-gray-600">Hướng</div>
          </div>
        )}

        {metadata.private_pool && (
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
            <Waves className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-lg font-bold text-gray-900">Hồ bơi riêng</div>
            <div className="text-sm text-blue-600">Luxury</div>
          </div>
        )}
      </div>

      {/* Booking Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">📅 Thông tin đặt phòng</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <RotateCcw className={`w-5 h-5 mt-0.5 ${cancellationPolicy.color}`} />
            <div>
              <div className="font-medium text-gray-900">
                Chính sách hủy: <span className={cancellationPolicy.color}>{cancellationPolicy.text}</span>
              </div>
              {cancellationPolicy.desc && (
                <div className="text-sm text-gray-600 mt-1">{cancellationPolicy.desc}</div>
              )}
            </div>
          </div>

          {rentableItem.advance_booking_days && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Đặt trước</div>
                <div className="font-medium">Tối thiểu {rentableItem.advance_booking_days} ngày</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Check-in/Check-out Rules */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">🕐 Giờ nhận/trả phòng</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Nhận phòng</div>
            <div className="font-medium text-gray-900">
              {rentableItem.checkin_time ? `Từ ${rentableItem.checkin_time}` : 'Từ 14:00'}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Trả phòng</div>
            <div className="font-medium text-gray-900">
              {rentableItem.checkout_time ? `Trước ${rentableItem.checkout_time}` : 'Trước 12:00'}
            </div>
          </div>
        </div>
        {metadata.quiet_hours && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600">Giờ yên tĩnh</div>
            <div className="font-medium text-gray-900">{metadata.quiet_hours}</div>
          </div>
        )}
      </div>

      {/* House Rules */}
      {(rentableItem.house_rules_text || metadata.allow_pets !== undefined || metadata.allow_smoking !== undefined) && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">📋 Nội quy</h3>
          <div className="space-y-3">
            {metadata.allow_pets !== undefined && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{metadata.allow_pets ? '🐕' : '🚫'}</span>
                <span className="text-gray-700">
                  {metadata.allow_pets ? 'Cho phép thú cưng' : 'Không cho phép thú cưng'}
                </span>
              </div>
            )}
            {metadata.allow_smoking !== undefined && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{metadata.allow_smoking ? '🚬' : '🚭'}</span>
                <span className="text-gray-700">
                  {metadata.allow_smoking ? 'Cho phép hút thuốc' : 'Không cho phép hút thuốc'}
                </span>
              </div>
            )}
            {rentableItem.house_rules_text && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-700 whitespace-pre-line">{rentableItem.house_rules_text}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Services & Amenities for Hotels/Serviced Apartments */}
      {(metadata.housekeeping_frequency || metadata.laundry_service || metadata.premium_services) && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">🏨 Dịch vụ</h3>
          <div className="space-y-3">
            {metadata.housekeeping_frequency && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-2xl">🧹</span>
                <div>
                  <div className="font-medium text-gray-900">Dọn phòng</div>
                  <div className="text-sm text-gray-600">
                    {metadata.housekeeping_frequency === 'DAILY' && 'Hàng ngày'}
                    {metadata.housekeeping_frequency === 'WEEKLY' && 'Hàng tuần'}
                    {metadata.housekeeping_frequency === 'ON_REQUEST' && 'Theo yêu cầu'}
                  </div>
                </div>
              </div>
            )}
            {metadata.laundry_service && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-2xl">👔</span>
                <span className="text-gray-700">Dịch vụ giặt ủi</span>
              </div>
            )}
            {metadata.premium_services && metadata.premium_services.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                <div className="font-medium text-gray-900 mb-2">✨ Dịch vụ cao cấp</div>
                <div className="grid grid-cols-2 gap-2">
                  {metadata.premium_services.map((service: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-gray-700">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Co-living Features */}
      {(metadata.shared_areas || metadata.gender_policy || metadata.community_events) && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">🏘️ Đặc điểm Co-living</h3>
          <div className="space-y-3">
            {metadata.shared_areas && metadata.shared_areas.length > 0 && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2">Khu vực chung</div>
                <div className="grid grid-cols-2 gap-2">
                  {metadata.shared_areas.map((area: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-700">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {metadata.gender_policy && (
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                <span className="text-2xl">👥</span>
                <div>
                  <div className="font-medium text-gray-900">Chính sách giới tính</div>
                  <div className="text-sm text-gray-600">
                    {metadata.gender_policy === 'MALE' && 'Chỉ nam'}
                    {metadata.gender_policy === 'FEMALE' && 'Chỉ nữ'}
                    {metadata.gender_policy === 'MIXED' && 'Nam nữ'}
                  </div>
                </div>
              </div>
            )}
            {metadata.membership_fee && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <span className="text-2xl">💳</span>
                <div>
                  <div className="font-medium text-gray-900">Phí thành viên</div>
                  <div className="text-sm text-gray-600">{metadata.membership_fee.toLocaleString('vi-VN')}đ</div>
                </div>
              </div>
            )}
            {metadata.community_events && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-1">🎉 Sự kiện cộng đồng</div>
                <div className="text-sm text-gray-700">{metadata.community_events}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Villa/Luxury Features */}
      {(metadata.private_pool || metadata.bbq_area || metadata.garden_area_m2) && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">🏰 Tiện ích cao cấp</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metadata.private_pool && (
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                <Waves className="w-6 h-6 text-blue-600 mb-2" />
                <div className="font-medium text-gray-900">Hồ bơi riêng</div>
                <div className="text-sm text-gray-600">Riêng tư, sang trọng</div>
              </div>
            )}
            {metadata.bbq_area && (
              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border-2 border-orange-200">
                <Utensils className="w-6 h-6 text-orange-600 mb-2" />
                <div className="font-medium text-gray-900">Khu BBQ</div>
                <div className="text-sm text-gray-600">Tiệc ngoài trời</div>
              </div>
            )}
            {metadata.garden_area_m2 && (
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                <Home className="w-6 h-6 text-green-600 mb-2" />
                <div className="font-medium text-gray-900">Sân vườn</div>
                <div className="text-sm text-gray-600">{metadata.garden_area_m2}m²</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Building Amenities */}
      {metadata.building_amenities && metadata.building_amenities.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">🏢 Tiện ích tòa nhà</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {metadata.building_amenities.map((amenity: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
                <Check className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-gray-700">{amenity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Furnishing Level */}
      {rentableItem.furnishing_level && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">🛋️ Nội thất</h3>
          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="font-medium text-gray-900">{getFurnishingLabel(rentableItem.furnishing_level)}</div>
          </div>
        </div>
      )}

      {/* Amenities */}
      {rentableItem.amenities && rentableItem.amenities.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">✨ Tiện nghi</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {rentableItem.amenities.map((amenity: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Check className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">{amenity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
