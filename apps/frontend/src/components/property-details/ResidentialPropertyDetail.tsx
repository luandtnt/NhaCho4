import { Bed, Bath, Home, Calendar, Check, Wind, Zap, Droplet, Wifi, Car, Building2 } from 'lucide-react';

interface ResidentialPropertyDetailProps {
  rentableItem: any;
}

export default function ResidentialPropertyDetail({ rentableItem }: ResidentialPropertyDetailProps) {
  const metadata = rentableItem.metadata?.details || {};
  const isMidTerm = rentableItem.rental_duration_type === 'MEDIUM_TERM';
  const isLongTerm = rentableItem.rental_duration_type === 'LONG_TERM';

  const getDirectionLabel = (direction: string) => {
    const labels: Record<string, string> = {
      EAST: 'Đông', WEST: 'Tây', SOUTH: 'Nam', NORTH: 'Bắc',
      NORTHEAST: 'Đông Bắc', NORTHWEST: 'Tây Bắc',
      SOUTHEAST: 'Đông Nam', SOUTHWEST: 'Tây Nam'
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

  const getBillingLabel = (billing: string) => {
    const labels: Record<string, string> = {
      METER_PRIVATE: 'Đồng hồ riêng',
      SHARED: 'Chia theo người',
      OWNER_RATE: 'Giá chủ nhà',
      STATE_RATE: 'Giá nhà nước'
    };
    return labels[billing] || billing;
  };
  return (
    <div className="space-y-6">
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
        
        {rentableItem.apartment_floor && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Building2 className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-gray-900">Tầng {rentableItem.apartment_floor}</div>
            <div className="text-sm text-gray-600">Vị trí</div>
          </div>
        )}

        {rentableItem.floors && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Building2 className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-gray-900">{rentableItem.floors} tầng</div>
            <div className="text-sm text-gray-600">Số tầng</div>
          </div>
        )}

        {rentableItem.direction && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Wind className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-lg font-bold text-gray-900">{getDirectionLabel(rentableItem.direction)}</div>
            <div className="text-sm text-gray-600">Hướng</div>
          </div>
        )}

        {rentableItem.balcony && (
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl mb-2">🏞️</div>
            <div className="text-lg font-bold text-gray-900">Ban công</div>
            <div className="text-sm text-blue-600">Có</div>
          </div>
        )}

        {rentableItem.parking_slots > 0 && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Car className="w-6 h-6 mx-auto mb-2 text-gray-600" />
            <div className="text-2xl font-bold text-gray-900">{rentableItem.parking_slots}</div>
            <div className="text-sm text-gray-600">Chỗ đỗ xe</div>
          </div>
        )}
      </div>

      {/* Pricing & Contract */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">💰 Giá & Điều kiện thuê</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Giá thuê</div>
            <div className="text-2xl font-bold text-blue-600">
              {rentableItem.base_price?.toLocaleString('vi-VN')}đ
              <span className="text-sm text-gray-600 ml-1">/tháng</span>
            </div>
          </div>

          {rentableItem.deposit_amount && (
            <div className="p-4 bg-amber-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Tiền cọc</div>
              <div className="text-2xl font-bold text-amber-600">
                {rentableItem.deposit_amount.toLocaleString('vi-VN')}đ
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-600">Thời hạn thuê</div>
              <div className="font-medium">
                {isMidTerm ? 'Trung hạn (1-6 tháng)' : 'Dài hạn (> 6 tháng)'}
              </div>
            </div>
          </div>

          {rentableItem.min_rent_duration && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Thuê tối thiểu</div>
                <div className="font-medium">{rentableItem.min_rent_duration} tháng</div>
              </div>
            </div>
          )}

          {isLongTerm && metadata.yearly_increase_percent && (
            <div className="flex items-center gap-3 col-span-2 p-3 bg-yellow-50 rounded-lg">
              <span className="text-2xl">📈</span>
              <div>
                <div className="text-sm text-gray-600">Tăng giá hàng năm</div>
                <div className="font-medium">{metadata.yearly_increase_percent}%</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Utilities & Fees */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">⚡ Phí dịch vụ & Tiện ích</h3>
        <div className="space-y-3">
          {rentableItem.electricity_billing && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Tiền điện</div>
                <div className="text-sm text-gray-600">{getBillingLabel(rentableItem.electricity_billing)}</div>
              </div>
            </div>
          )}

          {rentableItem.water_billing && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Droplet className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Tiền nước</div>
                <div className="text-sm text-gray-600">{getBillingLabel(rentableItem.water_billing)}</div>
              </div>
            </div>
          )}

          {metadata.internet_fee && (
            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
              <Wifi className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Internet/Wifi</div>
                <div className="text-sm text-gray-600">{metadata.internet_fee.toLocaleString('vi-VN')}đ/tháng</div>
              </div>
            </div>
          )}

          {rentableItem.service_fee && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Building2 className="w-5 h-5 text-gray-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Phí dịch vụ</div>
                <div className="text-sm text-gray-600">{rentableItem.service_fee.toLocaleString('vi-VN')}đ/tháng</div>
              </div>
            </div>
          )}

          {rentableItem.building_management_fee && (
            <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg">
              <Building2 className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Phí quản lý tòa nhà</div>
                <div className="text-sm text-gray-600">{rentableItem.building_management_fee.toLocaleString('vi-VN')}đ/tháng</div>
              </div>
            </div>
          )}

          {metadata.parking_fee_motorbike && (
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <Car className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Phí gửi xe máy</div>
                <div className="text-sm text-gray-600">{metadata.parking_fee_motorbike.toLocaleString('vi-VN')}đ/tháng</div>
              </div>
            </div>
          )}

          {metadata.parking_fee_car && (
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <Car className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Phí gửi ô tô</div>
                <div className="text-sm text-gray-600">{metadata.parking_fee_car.toLocaleString('vi-VN')}đ/tháng</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* House Rules */}
      {(rentableItem.house_rules_text || metadata.allow_pets !== undefined || metadata.allow_smoking !== undefined || metadata.allow_guests_overnight !== undefined) && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">📋 Nội quy nhà ở</h3>
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
            {metadata.allow_guests_overnight !== undefined && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{metadata.allow_guests_overnight ? '👥' : '🚫'}</span>
                <span className="text-gray-700">
                  {metadata.allow_guests_overnight ? 'Cho phép khách qua đêm' : 'Không cho phép khách qua đêm'}
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

      {/* Furnishing */}
      {rentableItem.furnishing_level && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">🛋️ Nội thất</h3>
          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="font-medium text-gray-900">{getFurnishingLabel(rentableItem.furnishing_level)}</div>
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

      {/* Garden */}
      {metadata.garden_area_m2 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">🌳 Sân vườn</h3>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="font-medium text-gray-900">Diện tích sân vườn: {metadata.garden_area_m2}m²</div>
            <div className="text-sm text-gray-600 mt-1">Không gian xanh riêng tư</div>
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
