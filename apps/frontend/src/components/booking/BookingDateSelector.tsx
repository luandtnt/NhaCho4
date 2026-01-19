import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface BookingDateSelectorProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  checkinTime?: string;
  checkoutTime?: string;
  minRentDuration?: number;
  rentalDurationType?: string;
  availability?: any;
  checkingAvailability?: boolean;
}

export default function BookingDateSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  checkinTime,
  checkoutTime,
  minRentDuration,
  rentalDurationType,
  availability,
  checkingAvailability,
}: BookingDateSelectorProps) {
  
  const calculateNights = () => {
    if (!startDate || !endDate) return 0;
    const diff = endDate.getTime() - startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    onStartDateChange(date);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    onEndDateChange(date);
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const today = new Date().toISOString().split('T')[0];
  const minEndDate = startDate ? new Date(startDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : today;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Chọn thời gian</h2>
      </div>

      <div className="space-y-4">
        {/* Check-in */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày nhận phòng
          </label>
          <input
            type="date"
            value={formatDateForInput(startDate)}
            onChange={handleStartDateChange}
            min={today}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {checkinTime && (
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Giờ nhận phòng: {checkinTime}
            </p>
          )}
        </div>

        {/* Check-out */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngày trả phòng
          </label>
          <input
            type="date"
            value={formatDateForInput(endDate)}
            onChange={handleEndDateChange}
            min={minEndDate}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {checkoutTime && (
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Giờ trả phòng: {checkoutTime}
            </p>
          )}
        </div>

        {/* Nights Display */}
        {nights > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900">
              Tổng số đêm: <span className="text-lg font-bold">{nights}</span> đêm
            </p>
          </div>
        )}

        {/* Min Duration Warning */}
        {minRentDuration && nights > 0 && nights < minRentDuration && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Thời gian thuê tối thiểu
              </p>
              <p className="text-sm text-yellow-700">
                Phải thuê tối thiểu {minRentDuration} đêm
              </p>
            </div>
          </div>
        )}

        {/* Availability Status */}
        {checkingAvailability && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            <p className="text-sm text-gray-600">Đang kiểm tra tình trạng...</p>
          </div>
        )}

        {availability && !checkingAvailability && (
          <div className={`border rounded-lg p-3 flex items-start gap-2 ${
            availability.available 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            {availability.available ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Còn trống</p>
                  <p className="text-sm text-green-700">{availability.message}</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Không còn trống</p>
                  <p className="text-sm text-red-700">{availability.message}</p>
                  
                  {availability.suggested_dates && availability.suggested_dates.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-900 mb-1">Gợi ý ngày khác:</p>
                      <ul className="text-sm text-red-700 space-y-1">
                        {availability.suggested_dates.map((suggestion: any, idx: number) => (
                          <li key={idx}>
                            {new Date(suggestion.start_date).toLocaleDateString('vi-VN')} - {new Date(suggestion.end_date).toLocaleDateString('vi-VN')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
