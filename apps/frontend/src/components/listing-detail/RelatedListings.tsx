import { Home, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RelatedListingsProps {
  listings: any[];
}

export default function RelatedListings({ listings }: RelatedListingsProps) {
  const navigate = useNavigate();

  if (!listings || listings.length === 0) {
    return null;
  }

  const handleClick = (listingId: string) => {
    navigate(`/listings/${listingId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          🏠 Tin đăng tương tự
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div
              key={listing.id}
              onClick={() => handleClick(listing.id)}
              className="bg-white rounded-lg shadow hover:shadow-xl transition cursor-pointer overflow-hidden group"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={
                    listing.media?.find((m: any) => m.type === 'image')?.url ||
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'
                  }
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />

                {/* Badges */}
                {listing.rentable_items?.[0]?.rentable_item?.instant_booking && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Đặt ngay
                  </div>
                )}

                {listing.tags && listing.tags.length > 0 && (
                  <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {listing.tags[0]}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                  {listing.title}
                </h3>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {listing.description}
                </p>

                {/* Property Info */}
                {listing.rentable_items?.[0]?.rentable_item && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    {listing.rentable_items[0].rentable_item.area_sqm && (
                      <div className="flex items-center gap-1">
                        <Home className="w-4 h-4" />
                        <span>{listing.rentable_items[0].rentable_item.area_sqm}m²</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Price */}
                <div className="text-blue-600 font-bold text-lg">
                  {listing.pricing_display?.from_amount
                    ? `${listing.pricing_display.from_amount.toLocaleString('vi-VN')} ${listing.pricing_display.currency || 'VND'}/${listing.pricing_display.unit || 'tháng'}`
                    : 'Liên hệ'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
