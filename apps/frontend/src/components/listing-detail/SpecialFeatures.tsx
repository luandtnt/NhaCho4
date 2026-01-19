import { Check, Star, Users, Utensils, Waves, Zap, Building2, Truck, MapPin } from 'lucide-react';

interface SpecialFeaturesProps {
  property_category: string;
  metadata: any;
  [key: string]: any;
}

export default function SpecialFeatures({ property_category, metadata, ...props }: SpecialFeaturesProps) {
  const renderShortTermFeatures = () => {
    if (!['HOMESTAY', 'GUESTHOUSE', 'HOTEL', 'SERVICED_APARTMENT_SHORT', 'VILLA_RESORT', 'AIRBNB_ROOM', 'COLIVING_SHORT'].includes(property_category)) {
      return null;
    }

    return (
      <div className="space-y-4">
        {/* Hotel Star Rating */}
        {property_category === 'HOTEL' && metadata.star_rating && (
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-amber-500 fill-current" />
              <span className="font-semibold text-gray-900">Hạng sao</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: metadata.star_rating }).map((_, i) => (
                <Star key={i} className="w-5 h-5 text-amber-500 fill-current" />
              ))}
            </div>
          </div>
        )}

        {/* Premium Services */}
        {metadata.premium_services && metadata.premium_services.length > 0 && (
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="font-semibold text-gray-900 mb-3">✨ Dịch vụ cao cấp</div>
            <div className="grid grid-cols-2 gap-2">
              {metadata.premium_services.map((service: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-gray-700">{service}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Villa Features */}
        {(metadata.private_pool || metadata.bbq_area || metadata.garden_area_m2) && (
          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <div className="font-semibold text-gray-900 mb-3">🏰 Tiện ích cao cấp</div>
            <div className="space-y-2">
              {metadata.private_pool && (
                <div className="flex items-center gap-2">
                  <Waves className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Hồ bơi riêng</span>
                </div>
              )}
              {metadata.bbq_area && (
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-600" />
                  <span className="text-gray-700">Khu BBQ</span>
                </div>
              )}
              {metadata.garden_area_m2 && (
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌳</span>
                  <span className="text-gray-700">Sân vườn {metadata.garden_area_m2}m²</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Co-living Features */}
        {property_category === 'COLIVING_SHORT' && (
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="font-semibold text-gray-900 mb-3">🏘️ Đặc điểm Co-living</div>
            <div className="space-y-2">
              {metadata.dorm_beds && (
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">{metadata.dorm_beds} giường dorm</span>
                </div>
              )}
              {metadata.gender_policy && (
                <div className="flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  <span className="text-gray-700">
                    {metadata.gender_policy === 'MALE' && 'Chỉ nam'}
                    {metadata.gender_policy === 'FEMALE' && 'Chỉ nữ'}
                    {metadata.gender_policy === 'MIXED' && 'Nam nữ'}
                  </span>
                </div>
              )}
              {metadata.membership_fee && (
                <div className="flex items-center gap-2">
                  <span className="text-xl">💳</span>
                  <span className="text-gray-700">
                    Phí thành viên: {metadata.membership_fee.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCommercialFeatures = () => {
    if (!['OFFICE', 'COMMERCIAL_SPACE', 'RETAIL_SPACE_SMALL', 'SHOPHOUSE'].includes(property_category)) {
      return null;
    }

    return (
      <div className="space-y-4">
        {/* Business Purpose */}
        {metadata.business_purpose && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="font-semibold text-gray-900 mb-2">💼 Mục đích kinh doanh</div>
            <div className="text-gray-700">{metadata.business_purpose}</div>
          </div>
        )}

        {/* Foot Traffic */}
        {metadata.foot_traffic_per_day && (
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-semibold text-gray-900">Lưu lượng người qua lại</div>
                <div className="text-gray-700">{metadata.foot_traffic_per_day} người/ngày</div>
              </div>
            </div>
          </div>
        )}

        {/* Business Registration */}
        {metadata.allow_business_registration !== undefined && (
          <div className={`p-4 rounded-lg border ${metadata.allow_business_registration ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              <Building2 className={`w-5 h-5 ${metadata.allow_business_registration ? 'text-green-600' : 'text-red-600'}`} />
              <span className="text-gray-700">
                {metadata.allow_business_registration ? 'Cho phép đăng ký kinh doanh' : 'Không cho phép đăng ký kinh doanh'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderIndustrialFeatures = () => {
    if (!['WAREHOUSE_TEMP', 'FACTORY'].includes(property_category)) {
      return null;
    }

    return (
      <div className="space-y-4">
        {/* Technical Specs */}
        {(metadata.ceiling_height_m || props.power_capacity_kw || props.three_phase_power) && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="font-semibold text-gray-900 mb-3">🏗️ Thông số kỹ thuật</div>
            <div className="space-y-2">
              {metadata.ceiling_height_m && (
                <div className="flex items-center gap-2">
                  <span className="text-xl">📏</span>
                  <span className="text-gray-700">Chiều cao trần: {metadata.ceiling_height_m}m</span>
                </div>
              )}
              {props.power_capacity_kw && (
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <span className="text-gray-700">Công suất điện: {props.power_capacity_kw} kW</span>
                </div>
              )}
              {props.three_phase_power && (
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <span className="text-gray-700">Điện 3 pha</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Truck Access */}
        {metadata.truck_access && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">Xe tải/container vào được</span>
            </div>
          </div>
        )}

        {/* Allowed Goods */}
        {metadata.allowed_goods && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="font-semibold text-gray-900 mb-2">📦 Loại hàng hóa cho phép</div>
            <div className="text-gray-700">{metadata.allowed_goods}</div>
          </div>
        )}
      </div>
    );
  };

  const renderLandFeatures = () => {
    if (property_category !== 'LAND_PLOT') {
      return null;
    }

    return (
      <div className="space-y-4">
        {/* Land Type */}
        {metadata.land_type && (
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Loại đất: {metadata.land_type}</span>
            </div>
            <div className="text-sm text-gray-600">
              {metadata.land_type === 'Thổ cư' && 'Đất ở, có thể xây dựng nhà ở, kinh doanh'}
              {metadata.land_type === 'Nông nghiệp' && 'Đất nông nghiệp, phù hợp trồng trọt, chăn nuôi'}
              {metadata.land_type === 'Công nghiệp' && 'Đất công nghiệp, phù hợp xây dựng nhà xưởng, kho bãi'}
            </div>
          </div>
        )}

        {/* Frontage */}
        {props.frontage_m && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="font-semibold text-gray-900 mb-1">Mặt tiền</div>
            <div className="text-2xl font-bold text-green-600">{props.frontage_m}m</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">⭐ Đặc điểm nổi bật</h3>
      
      {renderShortTermFeatures()}
      {renderCommercialFeatures()}
      {renderIndustrialFeatures()}
      {renderLandFeatures()}
    </div>
  );
}
