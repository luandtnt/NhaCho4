import { Shield, FileText, AlertCircle } from 'lucide-react';

interface BookingPoliciesProps {
  houseRules?: string;
  cancellationPolicy?: string;
  allowPets?: boolean;
  allowSmoking?: boolean;
  quietHours?: string;
  policiesAccepted: boolean;
  cancellationAccepted: boolean;
  onPoliciesAcceptedChange: (value: boolean) => void;
  onCancellationAcceptedChange: (value: boolean) => void;
}

export default function BookingPolicies({
  houseRules,
  cancellationPolicy,
  allowPets,
  allowSmoking,
  quietHours,
  policiesAccepted,
  cancellationAccepted,
  onPoliciesAcceptedChange,
  onCancellationAcceptedChange,
}: BookingPoliciesProps) {
  
  const getCancellationPolicyText = (policy?: string) => {
    const policies: Record<string, string> = {
      'FLEXIBLE': 'Linh hoạt - Hoàn tiền 100% nếu hủy trước 24 giờ',
      'MODERATE': 'Trung bình - Hoàn tiền 50% nếu hủy trước 5 ngày',
      'STRICT': 'Nghiêm ngặt - Không hoàn tiền',
    };
    return policies[policy || 'MODERATE'] || 'Chính sách hủy theo quy định';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Chính sách & Nội quy</h2>
      </div>

      <div className="space-y-6">
        {/* House Rules */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Nội quy nhà
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {/* Quick Rules */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className={allowPets ? 'text-green-600' : 'text-red-600'}>
                  {allowPets ? '✓' : '✗'}
                </span>
                <span className="text-gray-700">Cho phép thú cưng</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={allowSmoking ? 'text-green-600' : 'text-red-600'}>
                  {allowSmoking ? '✓' : '✗'}
                </span>
                <span className="text-gray-700">Cho phép hút thuốc</span>
              </div>
            </div>

            {quietHours && (
              <div className="text-sm text-gray-700">
                <span className="font-medium">Giờ yên tĩnh:</span> {quietHours}
              </div>
            )}

            {houseRules && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {houseRules}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cancellation Policy */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Chính sách hủy
          </h3>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900 font-medium">
              {getCancellationPolicyText(cancellationPolicy)}
            </p>
          </div>
        </div>

        {/* Acceptance Checkboxes */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={policiesAccepted}
              onChange={(e) => onPoliciesAcceptedChange(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
              Tôi đồng ý với <span className="font-medium">nội quy nhà</span> và cam kết tuân thủ các quy định
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={cancellationAccepted}
              onChange={(e) => onCancellationAcceptedChange(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">
              Tôi hiểu và đồng ý với <span className="font-medium">chính sách hủy</span> của chỗ ở này
            </span>
          </label>
        </div>

        {/* Warning */}
        {(!policiesAccepted || !cancellationAccepted) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">
              Bạn cần đồng ý với tất cả chính sách để tiếp tục đặt phòng
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
