import { Check, Wifi, Wind, Droplet, Tv, Car, Shield, Utensils } from 'lucide-react';

interface AmenitiesSectionProps {
  amenities: string[];
  building_amenities?: string[];
}

export default function AmenitiesSection({ amenities, building_amenities }: AmenitiesSectionProps) {
  const getAmenityIcon = (amenity: string) => {
    const lower = amenity.toLowerCase();
    if (lower.includes('wifi') || lower.includes('internet')) return <Wifi className="w-5 h-5 text-blue-600" />;
    if (lower.includes('điều hòa') || lower.includes('ac')) return <Wind className="w-5 h-5 text-cyan-600" />;
    if (lower.includes('nước') || lower.includes('water')) return <Droplet className="w-5 h-5 text-blue-500" />;
    if (lower.includes('tv') || lower.includes('tivi')) return <Tv className="w-5 h-5 text-purple-600" />;
    if (lower.includes('xe') || lower.includes('parking')) return <Car className="w-5 h-5 text-gray-600" />;
    if (lower.includes('an ninh') || lower.includes('security')) return <Shield className="w-5 h-5 text-green-600" />;
    if (lower.includes('bếp') || lower.includes('kitchen')) return <Utensils className="w-5 h-5 text-orange-600" />;
    return <Check className="w-5 h-5 text-green-600" />;
  };

  if (!amenities || amenities.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">✨ Tiện nghi</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {amenities.map((amenity, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
          >
            {getAmenityIcon(amenity)}
            <span className="text-gray-700">{amenity}</span>
          </div>
        ))}
      </div>

      {building_amenities && building_amenities.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">🏢 Tiện ích tòa nhà</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {building_amenities.map((amenity, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition"
              >
                {getAmenityIcon(amenity)}
                <span className="text-gray-700">{amenity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
