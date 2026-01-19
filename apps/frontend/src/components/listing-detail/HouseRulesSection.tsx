import { Check, X, Clock, RotateCcw } from 'lucide-react';

interface HouseRulesSectionProps {
  allow_pets?: boolean;
  allow_smoking?: boolean;
  allow_guests_overnight?: boolean;
  quiet_hours?: string;
  house_rules_text?: string;
  cancellation_policy?: 'FLEXIBLE' | 'MODERATE' | 'STRICT';
  cancellation_fee_percent?: number;
  checkin_time?: string;
  checkout_time?: string;
  rental_duration_type?: string;
}

export default function HouseRulesSection(props: HouseRulesSectionProps) {
  const isShortTerm = props.rental_duration_type === 'SHORT_TERM';

  const getCancellationPolicyInfo = () => {
    switch (props.cancellation_policy) {
      case 'FLEXIBLE':
        return {
          label: 'Linh hoạt',
          desc: 'Hoàn tiền 100% nếu hủy trước 24h',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'MODERATE':
        return {
          label: 'Trung bình',
          desc: 'Hoàn tiền 50% nếu hủy trước 5 ngày',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'STRICT':
        return {
          label: 'Nghiêm ngặt',
          desc: 'Không hoàn tiền',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return null;
    }
  };

  const cancellationInfo = getCancellationPolicyInfo();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">📋 Quy định & Nội quy</h3>

      <div className="space-y-4">
        {/* Basic Rules */}
        {(props.allow_pets !== undefined || props.allow_smoking !== undefined || props.allow_guests_overnight !== undefined) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {props.allow_pets !== undefined && (
              <div className={`flex items-center gap-3 p-4 rounded-lg ${props.allow_pets ? 'bg-green-50' : 'bg-red-50'}`}>
                {props.allow_pets ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <X className="w-5 h-5 text-red-600" />
                )}
                <span className="text-gray-700">
                  {props.allow_pets ? 'Cho phép thú cưng' : 'Không cho phép thú cưng'}
                </span>
              </div>
            )}

            {props.allow_smoking !== undefined && (
              <div className={`flex items-center gap-3 p-4 rounded-lg ${props.allow_smoking ? 'bg-green-50' : 'bg-red-50'}`}>
                {props.allow_smoking ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <X className="w-5 h-5 text-red-600" />
                )}
                <span className="text-gray-700">
                  {props.allow_smoking ? 'Cho phép hút thuốc' : 'Không cho phép hút thuốc'}
                </span>
              </div>
            )}

            {props.allow_guests_overnight !== undefined && (
              <div className={`flex items-center gap-3 p-4 rounded-lg ${props.allow_guests_overnight ? 'bg-green-50' : 'bg-red-50'}`}>
                {props.allow_guests_overnight ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <X className="w-5 h-5 text-red-600" />
                )}
                <span className="text-gray-700">
                  {props.allow_guests_overnight ? 'Cho phép khách qua đêm' : 'Không cho phép khách qua đêm'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Check-in/Check-out times */}
        {isShortTerm && (props.checkin_time || props.checkout_time) && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
            {props.checkin_time && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Giờ nhận phòng</div>
                <div className="font-medium text-gray-900">Từ {props.checkin_time}</div>
              </div>
            )}
            {props.checkout_time && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Giờ trả phòng</div>
                <div className="font-medium text-gray-900">Trước {props.checkout_time}</div>
              </div>
            )}
          </div>
        )}

        {/* Quiet Hours */}
        {props.quiet_hours && (
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
            <Clock className="w-5 h-5 text-purple-600" />
            <div>
              <div className="font-medium text-gray-900">Giờ yên tĩnh</div>
              <div className="text-sm text-gray-600">{props.quiet_hours}</div>
            </div>
          </div>
        )}

        {/* Cancellation Policy */}
        {isShortTerm && cancellationInfo && (
          <div className={`p-4 rounded-lg border ${cancellationInfo.bgColor} ${cancellationInfo.borderColor}`}>
            <div className="flex items-start gap-3">
              <RotateCcw className={`w-5 h-5 mt-0.5 ${cancellationInfo.color}`} />
              <div>
                <div className="font-medium text-gray-900">
                  Chính sách hủy: <span className={cancellationInfo.color}>{cancellationInfo.label}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{cancellationInfo.desc}</div>
                {props.cancellation_fee_percent !== undefined && (
                  <div className="text-sm text-gray-600 mt-1">
                    Phí hủy: {props.cancellation_fee_percent}%
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Rules Text */}
        {props.house_rules_text && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium text-gray-900 mb-2">Nội quy chi tiết</div>
            <p className="text-gray-700 whitespace-pre-line text-sm">
              {props.house_rules_text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
