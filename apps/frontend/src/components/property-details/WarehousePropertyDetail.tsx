import { Ruler, Truck, Calendar, Check, Warehouse, Zap, Shield, DollarSign } from 'lucide-react';

interface WarehousePropertyDetailProps {
  rentableItem: any;
}

export default function WarehousePropertyDetail({ rentableItem }: WarehousePropertyDetailProps) {
  const metadata = rentableItem.metadata?.details || {};
  return (
    <div className="space-y-6">
      {/* Key Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rentableItem.area_sqm && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Warehouse className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-gray-900">{rentableItem.area_sqm}m²</div>
            <div className="text-sm text-gray-600">Diện tích</div>
          </div>
        )}
        
        {metadata.warehouse_area_m2 && (
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <Warehouse className="w-6 h-6 mx-auto mb-2 text-cyan-600" />
            <div className="text-2xl font-bold text-gray-900">{metadata.warehouse_area_m2}m²</div>
            <div className="text-sm text-gray-600">Diện tích kho</div>
          </div>
        )}

        {metadata.ceiling_height_m && (
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Ruler className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-gray-900">{metadata.ceiling_height_m}m</div>
            <div className="text-sm text-gray-600">Chiều cao trần</div>
          </div>
        )}

        {rentableItem.power_capacity_kw && (
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold text-gray-900">{rentableItem.power_capacity_kw}</div>
            <div className="text-sm text-gray-600">kW điện</div>
          </div>
        )}

        {metadata.truck_access !== undefined && (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <Truck className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-lg font-bold text-gray-900">
              {metadata.truck_access ? 'Có' : 'Không'}
            </div>
            <div className="text-sm text-gray-600">Xe tải vào được</div>
          </div>
        )}

        {rentableItem.three_phase_power && (
          <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <Zap className="w-6 h-6 mx-auto mb-2 text-amber-600" />
            <div className="text-lg font-bold text-gray-900">Điện 3 pha</div>
            <div className="text-sm text-amber-600">Có</div>
          </div>
        )}
      </div>

      {/* Technical Specifications */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">🏗️ Thông số kỹ thuật</h3>
        <div className="space-y-3">
          {metadata.ceiling_height_m && (
            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
              <Ruler className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Chiều cao trần</div>
                <div className="text-sm text-gray-600">
                  {metadata.ceiling_height_m}m - Phù hợp cho việc xếp hàng nhiều tầng và vận hành xe nâng
                </div>
              </div>
            </div>
          )}

          {rentableItem.power_capacity_kw && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Công suất điện</div>
                <div className="text-sm text-gray-600">
                  {rentableItem.power_capacity_kw} kW - Đủ cho hoạt động công nghiệp
                </div>
              </div>
            </div>
          )}

          {rentableItem.three_phase_power && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
              <Zap className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Điện 3 pha</div>
                <div className="text-sm text-gray-600">
                  Có sẵn điện 3 pha - Phù hợp cho máy móc công nghiệp
                </div>
              </div>
            </div>
          )}

          {metadata.truck_access && (
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <Truck className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Xe tải/Container</div>
                <div className="text-sm text-gray-600">
                  Xe tải và container vào được - Thuận tiện bốc xếp hàng hóa
                </div>
              </div>
            </div>
          )}

          {rentableItem.fire_safety_compliance && (
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
              <Shield className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Hệ thống PCCC</div>
                <div className="text-sm text-gray-600">
                  Đạt chuẩn an toàn phòng cháy chữa cháy
                </div>
              </div>
            </div>
          )}

          {metadata.allowed_goods && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Check className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Loại hàng hóa cho phép</div>
                <div className="text-sm text-gray-600">{metadata.allowed_goods}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rental Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">📅 Thông tin thuê</h3>
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

          {metadata.environment_fee && (
            <div className="flex items-center gap-3 col-span-2 p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm text-gray-600">Phí xử lý môi trường</div>
                <div className="font-medium">{metadata.environment_fee.toLocaleString('vi-VN')}đ/tháng</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Facilities & Services */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">🎯 Tiện ích & Dịch vụ</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Hệ thống điện 3 pha công suất lớn</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Hệ thống PCCC đạt chuẩn</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Bảo vệ 24/7, camera giám sát</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Bãi đỗ xe container rộng rãi</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Khu vực bốc xếp hàng hóa thuận tiện</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Gần cảng biển, sân bay, quốc lộ</span>
          </li>
        </ul>
      </div>

      {/* Amenities */}
      {rentableItem.amenities && rentableItem.amenities.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">✨ Tiện nghi bổ sung</h3>
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
