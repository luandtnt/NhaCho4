import { User, CheckCircle, Clock, Home, Phone, MessageCircle } from 'lucide-react';

interface OwnerInfoSectionProps {
  owner_name: string;
  owner_avatar?: string;
  is_verified?: boolean;
  total_listings?: number;
  response_time?: string;
  onMessage?: () => void;
  onCall?: () => void;
  onSendInquiry?: () => void;
}

export default function OwnerInfoSection({
  owner_name,
  owner_avatar,
  is_verified,
  total_listings,
  response_time,
  onMessage,
  onCall,
  onSendInquiry
}: OwnerInfoSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">👤 Thông tin chủ nhà</h3>

      <div className="flex items-start gap-4 mb-6">
        {/* Avatar */}
        <div className="relative">
          {owner_avatar ? (
            <img
              src={owner_avatar}
              alt={owner_name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
          {is_verified && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-lg font-semibold text-gray-900">{owner_name}</h4>
            {is_verified && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                Đã xác minh
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            {total_listings !== undefined && (
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span>{total_listings} tin đang đăng</span>
              </div>
            )}

            {response_time && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Phản hồi trong {response_time}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onSendInquiry}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Gửi yêu cầu</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onMessage}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Nhắn tin</span>
          </button>

          <button
            onClick={onCall}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Phone className="w-4 h-4" />
            <span>Gọi điện</span>
          </button>
        </div>
      </div>
    </div>
  );
}
