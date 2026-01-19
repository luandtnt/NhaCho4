import { Heart, Share2, Eye, Star, MapPin } from 'lucide-react';

interface ListingHeaderProps {
  title: string;
  address: {
    ward?: string;
    district?: string;
    province?: string;
  };
  rating?: number;
  views?: number;
  saves?: number;
  tags?: string[];
  onSave?: () => void;
  onShare?: () => void;
}

export default function ListingHeader({
  title,
  address,
  rating,
  views,
  saves,
  tags,
  onSave,
  onShare
}: ListingHeaderProps) {
  const formatAddress = () => {
    const parts = [];
    if (address.ward) parts.push(address.ward);
    if (address.district) parts.push(address.district);
    if (address.province) parts.push(address.province);
    return parts.join(' – ');
  };

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex gap-2 mb-3">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>

        {/* Address & Stats */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-5 h-5" />
            <span>{formatAddress()}</span>
          </div>

          {rating && (
            <div className="flex items-center gap-1 text-amber-600">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-medium">{rating.toFixed(1)}</span>
            </div>
          )}

          {views && (
            <div className="flex items-center gap-1 text-gray-600">
              <Eye className="w-5 h-5" />
              <span>{views} lượt xem</span>
            </div>
          )}

          {saves && (
            <div className="flex items-center gap-1 text-gray-600">
              <Heart className="w-5 h-5" />
              <span>{saves} lượt lưu</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Heart className="w-5 h-5" />
            <span>Lưu tin</span>
          </button>
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Share2 className="w-5 h-5" />
            <span>Chia sẻ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
