import { Zap, Wifi, Calendar, Check, Building, Users, TrendingUp, DollarSign, FileText } from 'lucide-react';

interface CommercialPropertyDetailProps {
  rentableItem: any;
}

export default function CommercialPropertyDetail({ rentableItem }: CommercialPropertyDetailProps) {
  const metadata = rentableItem.metadata?.details || {};

  const getBusinessPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      SHOP: 'Cửa hàng',
      RESTAURANT: 'Nhà hàng',
      OFFICE: 'Văn phòng',
      SUPERMARKET: 'Siêu thị',
      RETAIL: 'Bán lẻ',
      OTHER: 'Khác'
    };
    return labels[purpose] || purpose;
  };
  return (
    <div className="space-y-6">
      {/* Key Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rentableItem.area_sqm && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Building className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-gray-900">{rentableItem.area_sqm}m²</div>
            <div className="text-sm text-gray-600">Diện tích</div>
          </div>
        )}
        
        {rentableItem.frontage_m && (
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="text-2xl mb-2">📏</div>
            <div className="text-2xl font-bold text-gray-900">{rentableItem.frontage_m}m</div>
            <div className="text-sm text-gray-600">Mặt tiền</div>
          </div>
        )}

        {metadata.foot_traffic_per_day && (
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-gray-900">{metadata.foot_traffic_per_day}</div>
            <div className="text-sm text-gray-600">Người/ngày</div>
          </div>
        )}
        
        {rentableItem.power_capacity_kw && (
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold text-gray-900">{rentableItem.power_capacity_kw}</div>
            <div className="text-sm text-gray-600">kW điện</div>
          </div>
        )}

        {rentableItem.apartment_floor && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">🏢</div>
            <div className="text-2xl font-bold text-gray-900">Tầng {rentableItem.apartment_floor}</div>
            <div className="text-sm text-gray-600">Vị trí</div>
          </div>
        )}
      </div>

      {/* Business Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">💼 Thông tin kinh doanh</h3>
        <div className="space-y-3">
          {metadata.business_purpose && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-medium text-gray-900 mb-1">Mục đích kinh doanh phù hợp</div>
              <div className="text-sm text-gray-600">{getBusinessPurposeLabel(metadata.business_purpose)}</div>
            </div>
          )}

          {metadata.allow_business_registration !== undefined && (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Đăng ký kinh doanh</div>
                <div className="text-sm text-gray-600">
                  {metadata.allow_business_registration ? 'Được phép đăng ký' : 'Không được phép'}
                </div>
              </div>
            </div>
          )}

          {metadata.foot_traffic_per_day && (
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">Lưu lượng người qua lại</div>
                <div className="text-sm text-gray-600">{metadata.foot_traffic_per_day} người/ngày</div>
              </div>
            </div>
          )}

          {metadata.operating_hours && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
              <div>
                <div className="font-medium text-gray-900">Giờ hoạt động</div>
                <div className="text-sm text-gray-600">{metadata.operating_hours}</div>
              </div>
            </div>
          )}

          {metadata.tax_estimate_per_year && (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-red-600" />
              <div>
                <div className="font-medium text-gray-900">Ước tính thuế/năm</div>
                <div className="text-sm text-gray-600">{metadata.tax_estimate_per_year.toLocaleString('vi-VN')}đ</div>
              </div>
            </div>
          )}
        </div>
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
                {rentableItem.rental_duration_type === 'MEDIUM_TERM' ? 'Trung hạn (1-6 tháng)' : 'Dài hạn (> 6 tháng)'}
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

          {metadata.yearly_increase_percent && (
            <div className="flex items-center gap-3 col-span-2 p-3 bg-yellow-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="text-sm text-gray-600">Tăng giá hàng năm</div>
                <div className="font-medium">{metadata.yearly_increase_percent}%</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Infrastructure Details */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">🏗️ Hạ tầng & Tiện ích</h3>
        <div className="space-y-3">
          {rentableItem.power_capacity_kw && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Công suất điện</div>
                <div className="text-sm text-gray-600">
                  {rentableItem.power_capacity_kw} kW - Đủ cho hoạt động văn phòng và thiết bị công nghệ
                </div>
              </div>
            </div>
          )}

          {metadata.internet_fee && (
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <Wifi className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Internet</div>
                <div className="text-sm text-gray-600">
                  {metadata.internet_fee.toLocaleString('vi-VN')}đ/tháng - Kết nối ổn định
                </div>
              </div>
            </div>
          )}

          {rentableItem.fire_safety_compliance && (
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
              <Check className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Hệ thống PCCC</div>
                <div className="text-sm text-gray-600">Đạt chuẩn an toàn phòng cháy chữa cháy</div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <Building className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900">Điều kiện kinh doanh</div>
              <div className="text-sm text-gray-600">
                Phù hợp mọi loại hình doanh nghiệp
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Additional Services */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">🎯 Dịch vụ bổ sung</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Hỗ trợ đăng ký kinh doanh</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Bảo trì định kỳ hệ thống điện, nước</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Bảo vệ 24/7</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Dịch vụ vệ sinh chung</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
