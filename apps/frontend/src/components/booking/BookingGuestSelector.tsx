import { Users, Plus, Minus, AlertCircle } from 'lucide-react';

interface BookingGuestSelectorProps {
  guests: number;
  onGuestsChange: (value: number) => void;
  maxOccupancy?: number;
}

export default function BookingGuestSelector({
  guests,
  onGuestsChange,
  maxOccupancy,
}: BookingGuestSelectorProps) {
  
  const exceedsCapacity = maxOccupancy && guests > maxOccupancy;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Số lượng khách</h2>
      </div>

      <div className="flex items-center justify-between py-4">
        <div>
          <p className="font-medium text-gray-900">Số khách</p>
          <p className="text-sm text-gray-600">Tổng số người</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onGuestsChange(Math.max(1, guests - 1))}
            disabled={guests <= 1}
            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <Minus className="w-5 h-5" />
          </button>
          <span className="w-12 text-center text-xl font-semibold">{guests}</span>
          <button
            onClick={() => onGuestsChange(guests + 1)}
            className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Capacity Info & Warning */}
      {maxOccupancy && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Sức chứa tối đa: <span className="font-medium text-gray-900">{maxOccupancy} người</span>
          </p>

          {exceedsCapacity && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Vượt quá sức chứa</p>
                <p className="text-sm text-red-700">
                  Số khách vượt quá giới hạn cho phép ({maxOccupancy} người)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
