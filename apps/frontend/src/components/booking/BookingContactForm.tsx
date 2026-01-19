import { User, Phone, Mail, MessageSquare } from 'lucide-react';

interface BookingContactFormProps {
  fullName: string;
  phone: string;
  email: string;
  specialRequests: string;
  onFullNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSpecialRequestsChange: (value: string) => void;
}

export default function BookingContactForm({
  fullName,
  phone,
  email,
  specialRequests,
  onFullNameChange,
  onPhoneChange,
  onEmailChange,
  onSpecialRequestsChange,
}: BookingContactFormProps) {
  
  const validatePhone = (value: string) => {
    const phoneRegex = /^(0[0-9]{9}|\+84[0-9]{9})$/;
    return phoneRegex.test(value);
  };

  const isPhoneValid = phone === '' || validatePhone(phone);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Thông tin liên hệ</h2>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="0912345678"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !isPhoneValid ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
          </div>
          {!isPhoneValid && (
            <p className="text-sm text-red-600 mt-1">
              Số điện thoại không đúng định dạng Việt Nam
            </p>
          )}
        </div>

        {/* Email (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-gray-400">(Tùy chọn)</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="email@example.com"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yêu cầu đặc biệt <span className="text-gray-400">(Tùy chọn)</span>
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              value={specialRequests}
              onChange={(e) => onSpecialRequestsChange(e.target.value)}
              placeholder="Ví dụ: Nhận phòng muộn, cần thêm gối..."
              rows={4}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Chủ nhà sẽ cố gắng đáp ứng yêu cầu của bạn
          </p>
        </div>
      </div>
    </div>
  );
}
