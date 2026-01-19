import { Home, Bed, Bath, Users, Tag, CheckCircle, Clock } from 'lucide-react';

interface KeyFactsProps {
  area_sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  max_occupancy?: number;
  property_category?: string;
  property_type_label?: string;
  status?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  rental_duration_type?: string;
  [key: string]: any;
}

export default function KeyFacts(props: KeyFactsProps) {
  const getStatusBadge = () => {
    switch (props.status) {
      case 'AVAILABLE':
        return { text: 'Còn phòng', color: 'bg-green-100 text-green-700' };
      case 'OCCUPIED':
        return { text: 'Đang bận', color: 'bg-red-100 text-red-700' };
      case 'MAINTENANCE':
        return { text: 'Bảo trì', color: 'bg-yellow-100 text-yellow-700' };
      default:
        return { text: 'Còn phòng', color: 'bg-green-100 text-green-700' };
    }
  };

  const getDurationLabel = () => {
    switch (props.rental_duration_type) {
      case 'SHORT_TERM':
        return 'Ngắn hạn';
      case 'MEDIUM_TERM':
        return 'Trung hạn';
      case 'LONG_TERM':
        return 'Dài hạn';
      default:
        return '';
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Thông tin nhanh</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {props.area_sqm && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
            <Home className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{props.area_sqm}</div>
              <div className="text-sm text-gray-600">m²</div>
            </div>
          </div>
        )}

        {props.bedrooms !== undefined && props.bedrooms > 0 && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
            <Bed className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{props.bedrooms}</div>
              <div className="text-sm text-gray-600">Phòng ngủ</div>
            </div>
          </div>
        )}

        {props.bathrooms !== undefined && props.bathrooms > 0 && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
            <Bath className="w-8 h-8 text-cyan-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{props.bathrooms}</div>
              <div className="text-sm text-gray-600">Phòng tắm</div>
            </div>
          </div>
        )}

        {props.max_occupancy && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
            <Users className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{props.max_occupancy}</div>
              <div className="text-sm text-gray-600">Khách tối đa</div>
            </div>
          </div>
        )}

        {props.property_type_label && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm col-span-2">
            <Tag className="w-8 h-8 text-amber-600" />
            <div>
              <div className="text-lg font-bold text-gray-900">{props.property_type_label}</div>
              <div className="text-sm text-gray-600">Loại hình</div>
            </div>
          </div>
        )}

        {props.rental_duration_type && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
            <Clock className="w-8 h-8 text-indigo-600" />
            <div>
              <div className="text-lg font-bold text-gray-900">{getDurationLabel()}</div>
              <div className="text-sm text-gray-600">Thời hạn</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <div>
            <div className={`text-sm font-bold px-3 py-1 rounded-full ${statusBadge.color}`}>
              {statusBadge.text}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
