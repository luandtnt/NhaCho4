import { MapPin, Navigation } from 'lucide-react';

interface LocationSectionProps {
  address_full: string;
  province?: string;
  district?: string;
  ward?: string;
  geo_lat?: number;
  geo_lng?: number;
  nearby_places?: Array<{ name: string; distance: string; type: string }>;
}

export default function LocationSection({
  address_full,
  province,
  district,
  ward,
  geo_lat,
  geo_lng,
  nearby_places
}: LocationSectionProps) {
  const hasCoordinates = geo_lat && geo_lng;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">📍 Vị trí</h3>

      {/* Address */}
      <div className="mb-6">
        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
          <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <div className="font-medium text-gray-900 mb-1">Địa chỉ</div>
            <div className="text-gray-700">{address_full}</div>
            {(ward || district || province) && (
              <div className="text-sm text-gray-600 mt-1">
                {[ward, district, province].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      {hasCoordinates ? (
        <div className="mb-6">
          <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps?q=${geo_lat},${geo_lng}&hl=vi&z=15&output=embed`}
              allowFullScreen
            />
          </div>
          <a
            href={`https://www.google.com/maps?q=${geo_lat},${geo_lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-blue-600 hover:text-blue-700 font-medium"
          >
            <Navigation className="w-4 h-4" />
            <span>Xem trên Google Maps</span>
          </a>
        </div>
      ) : (
        <div className="mb-6 p-8 bg-gray-100 rounded-lg text-center text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Chưa có tọa độ bản đồ</p>
        </div>
      )}

      {/* Nearby Places */}
      {nearby_places && nearby_places.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Gần tiện ích</h4>
          <div className="space-y-2">
            {nearby_places.map((place, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {place.type === 'school' && '🏫'}
                    {place.type === 'hospital' && '🏥'}
                    {place.type === 'market' && '🏪'}
                    {place.type === 'transport' && '🚌'}
                    {!['school', 'hospital', 'market', 'transport'].includes(place.type) && '📍'}
                  </span>
                  <span className="text-gray-700">{place.name}</span>
                </div>
                <span className="text-sm text-gray-600">{place.distance}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
