import { Ruler, MapPin, Calendar, Check, Map } from 'lucide-react';

interface LandPropertyDetailProps {
  rentableItem: any;
}

export default function LandPropertyDetail({ rentableItem }: LandPropertyDetailProps) {
  const metadata = rentableItem.metadata?.details || {};
  return (
    <div className="space-y-6">
      {/* Key Features */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {rentableItem.area_sqm && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Map className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-gray-900">{rentableItem.area_sqm}m²</div>
            <div className="text-sm text-gray-600">Diện tích</div>
          </div>
        )}
        
        {rentableItem.frontage_m && (
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <Ruler className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-gray-900">{rentableItem.frontage_m}m</div>
            <div className="text-sm text-gray-600">Mặt tiền</div>
          </div>
        )}

        {metadata.land_type && (
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <MapPin className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-lg font-bold text-gray-900">{metadata.land_type}</div>
            <div className="text-sm text-gray-600">Loại đất</div>
          </div>
        )}
      </div>

      {/* Land Information */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">🏞️ Thông tin đất</h3>
        <div className="space-y-3">
          {rentableItem.area_sqm && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <Map className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Diện tích</div>
                <div className="text-sm text-gray-600">
                  {rentableItem.area_sqm}m² - Diện tích sử dụng rộng rãi, phù hợp nhiều mục đích
                </div>
              </div>
            </div>
          )}

          {rentableItem.frontage_m && (
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <Ruler className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Mặt tiền</div>
                <div className="text-sm text-gray-600">
                  {rentableItem.frontage_m}m - Mặt tiền rộng, thuận lợi cho kinh doanh và giao thông
                </div>
              </div>
            </div>
          )}

          {metadata.land_type && (
            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">Loại đất: {metadata.land_type}</div>
                <div className="text-sm text-gray-600">
                  {metadata.land_type === 'Thổ cư' && 'Đất ở, có thể xây dựng nhà ở, kinh doanh'}
                  {metadata.land_type === 'Nông nghiệp' && 'Đất nông nghiệp, phù hợp trồng trọt, chăn nuôi'}
                  {metadata.land_type === 'Công nghiệp' && 'Đất công nghiệp, phù hợp xây dựng nhà xưởng, kho bãi'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legal Status */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">📋 Pháp lý</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Sổ đỏ chính chủ, pháp lý rõ ràng</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Không tranh chấp, không vi phạm quy hoạch</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Có thể chuyển nhượng, thế chấp ngân hàng</span>
          </li>
        </ul>
      </div>

      {/* Location & Infrastructure */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">📍 Vị trí & Hạ tầng</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Mặt tiền đường lớn, giao thông thuận lợi</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Đầy đủ hạ tầng: điện, nước, đường</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Khu vực đông dân cư, tiềm năng phát triển</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Gần trường học, bệnh viện, chợ</span>
          </li>
        </ul>
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
              <div className="font-medium">Dài hạn (từ 1 năm trở lên)</div>
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
        </div>
      </div>

      {/* Suitable For */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">🎯 Phù hợp cho</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {metadata.land_type === 'Thổ cư' && (
            <>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-gray-900">🏠 Xây dựng nhà ở</div>
                <div className="text-sm text-gray-600">Nhà riêng, biệt thự</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-gray-900">🏪 Kinh doanh</div>
                <div className="text-sm text-gray-600">Cửa hàng, văn phòng</div>
              </div>
            </>
          )}
          {metadata.land_type === 'Nông nghiệp' && (
            <>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-gray-900">🌾 Trồng trọt</div>
                <div className="text-sm text-gray-600">Lúa, rau, cây ăn trái</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-gray-900">🐄 Chăn nuôi</div>
                <div className="text-sm text-gray-600">Trang trại, ao nuôi</div>
              </div>
            </>
          )}
          {metadata.land_type === 'Công nghiệp' && (
            <>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="font-medium text-gray-900">🏭 Nhà xưởng</div>
                <div className="text-sm text-gray-600">Sản xuất, gia công</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="font-medium text-gray-900">📦 Kho bãi</div>
                <div className="text-sm text-gray-600">Logistics, phân phối</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
