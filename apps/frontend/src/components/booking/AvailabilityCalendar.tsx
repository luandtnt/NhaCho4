import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

type ViewMode = 'hour' | 'day' | 'week' | 'month';

interface Booking {
  id: string;
  booking_code: string;
  start_at: string;
  end_at: string;
  status: string;
  guest_name: string;
}

interface AvailabilityCalendarProps {
  rentableItemId: string;
}

export default function AvailabilityCalendar({ rentableItemId }: AvailabilityCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [rentableItemId, currentDate, viewMode]);

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (viewMode) {
      case 'hour':
        // Current day
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'day':
        // Current week (7 days)
        start.setDate(start.getDate() - start.getDay());
        end.setDate(start.getDate() + 6);
        break;
      case 'week':
        // Current month (4-5 weeks)
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
        break;
      case 'month':
        // Current year (12 months)
        start.setMonth(0, 1);
        end.setMonth(11, 31);
        break;
    }

    return { start, end };
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      
      const response = await fetch(
        `http://localhost:3000/api/v1/bookings/timeline/${rentableItemId}?start_date=${start.toISOString()}&end_date=${end.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate booking percentage for a time slot
  const getBookingPercentage = (slotStart: Date, slotEnd: Date) => {
    const slotDuration = slotEnd.getTime() - slotStart.getTime();
    let bookedDuration = 0;

    bookings.forEach(booking => {
      const bookingStart = new Date(booking.start_at);
      const bookingEnd = new Date(booking.end_at);
      
      // Calculate overlap
      const overlapStart = new Date(Math.max(slotStart.getTime(), bookingStart.getTime()));
      const overlapEnd = new Date(Math.min(slotEnd.getTime(), bookingEnd.getTime()));
      
      if (overlapStart < overlapEnd) {
        bookedDuration += overlapEnd.getTime() - overlapStart.getTime();
      }
    });

    return Math.min(100, Math.round((bookedDuration / slotDuration) * 100));
  };

  // Get color based on booking percentage and status
  const getAvailabilityColor = (percentage: number, booking?: Booking) => {
    // Check if booking is currently checked-in (walk-in customer using room)
    if (booking && booking.status === 'CHECKED_IN') {
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        dot: 'bg-orange-500',
        text: 'text-orange-700',
        label: '🚶 Đang sử dụng',
        isActive: true
      };
    }
    
    if (percentage === 0) {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        dot: 'bg-green-500',
        text: 'text-green-700',
        label: 'Còn trống',
        isActive: false
      };
    } else if (percentage < 100) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        dot: 'bg-yellow-500',
        text: 'text-yellow-700',
        label: `${percentage}% đã đặt`,
        isActive: false
      };
    } else {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        dot: 'bg-red-500',
        text: 'text-red-700',
        label: 'Đã full',
        isActive: false
      };
    }
  };

  const getBookingForSlot = (slotStart: Date, slotEnd: Date) => {
    return bookings.find(booking => {
      const bookingStart = new Date(booking.start_at);
      const bookingEnd = new Date(booking.end_at);
      
      return (
        (slotStart >= bookingStart && slotStart < bookingEnd) ||
        (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
        (slotStart <= bookingStart && slotEnd >= bookingEnd)
      );
    });
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'hour':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'week':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'month':
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'hour':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'week':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'month':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const renderHourView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="space-y-1">
        {hours.map(hour => {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setHours(hour + 1, 0, 0, 0);
          
          const booking = getBookingForSlot(slotStart, slotEnd);
          const percentage = getBookingPercentage(slotStart, slotEnd);
          const colors = getAvailabilityColor(percentage, booking);
          
          return (
            <div
              key={hour}
              className={`flex items-center gap-3 p-3 rounded-lg border transition ${colors.bg} ${colors.border} ${colors.isActive ? 'ring-2 ring-orange-400' : ''}`}
            >
              <div className="w-20 font-medium text-sm">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${colors.text}`}>{colors.label}</span>
                  {booking && (
                    <span className={`text-xs ${colors.text}`}>
                      ({booking.guest_name})
                    </span>
                  )}
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${colors.dot} ${colors.isActive ? 'animate-pulse' : ''}`} />
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      return day;
    });
    
    return (
      <div className="space-y-1">
        {days.map((day, idx) => {
          const slotStart = new Date(day);
          slotStart.setHours(0, 0, 0, 0);
          const slotEnd = new Date(day);
          slotEnd.setHours(23, 59, 59, 999);
          
          const percentage = getBookingPercentage(slotStart, slotEnd);
          const colors = getAvailabilityColor(percentage);
          const booking = getBookingForSlot(slotStart, slotEnd);
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-lg border transition ${colors.bg} ${colors.border} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="w-32 font-medium text-sm">
                <div className="flex items-center gap-2">
                  <span>{day.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                  <span className="text-gray-400">-</span>
                  <span>{day.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${colors.text}`}>{colors.label}</span>
                  {booking && (
                    <span className={`text-xs ${colors.text}`}>
                      ({booking.guest_name})
                    </span>
                  )}
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const weeks = [];
    let currentWeekStart = new Date(startOfMonth);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    
    while (currentWeekStart <= endOfMonth) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      weeks.push({ start: new Date(currentWeekStart), end: new Date(weekEnd) });
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return (
      <div className="space-y-2">
        {weeks.map((week, idx) => {
          const percentage = getBookingPercentage(week.start, week.end);
          const colors = getAvailabilityColor(percentage);
          const booking = getBookingForSlot(week.start, week.end);
          
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 p-4 rounded-lg border transition ${colors.bg} ${colors.border}`}
            >
              <div className="flex-1">
                <div className="font-medium text-sm mb-1">
                  Tuần {idx + 1}
                </div>
                <div className="text-xs text-gray-600">
                  {week.start.toLocaleDateString('vi-VN')} - {week.end.toLocaleDateString('vi-VN')}
                </div>
              </div>
              <div className="text-right">
                <div>
                  <span className={`text-sm font-medium ${colors.text}`}>{colors.label}</span>
                  {booking && (
                    <div className={`text-xs ${colors.text} mt-1`}>
                      {booking.guest_name}
                    </div>
                  )}
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full ${colors.dot}`} />
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    
    return (
      <div className="grid grid-cols-3 gap-3">
        {months.map(month => {
          const slotStart = new Date(currentDate.getFullYear(), month, 1);
          const slotEnd = new Date(currentDate.getFullYear(), month + 1, 0, 23, 59, 59);
          
          const percentage = getBookingPercentage(slotStart, slotEnd);
          const colors = getAvailabilityColor(percentage);
          const booking = getBookingForSlot(slotStart, slotEnd);
          const isCurrentMonth = month === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
          
          return (
            <div
              key={month}
              className={`p-4 rounded-lg border text-center transition ${colors.bg} ${colors.border} ${isCurrentMonth ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="font-medium mb-2">
                Tháng {month + 1}
              </div>
              <div className={`w-full h-3 rounded-full ${colors.dot}`} />
              <div className={`text-xs ${colors.text} mt-2 font-medium`}>
                {colors.label}
              </div>
              {booking && (
                <div className={`text-xs ${colors.text} mt-1 truncate`}>
                  {booking.guest_name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'hour':
        return currentDate.toLocaleDateString('vi-VN', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'day':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('vi-VN')} - ${endOfWeek.toLocaleDateString('vi-VN')}`;
      case 'week':
        return currentDate.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' });
      case 'month':
        return `Năm ${currentDate.getFullYear()}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Lịch trống</h2>
        </div>
        
        {/* View Mode Selector */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('hour')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              viewMode === 'hour'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Giờ
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              viewMode === 'day'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Ngày
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              viewMode === 'week'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tuần
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded text-sm font-medium transition ${
              viewMode === 'month'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tháng
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={navigatePrevious}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h3 className="text-base font-medium text-gray-900">
          {getViewTitle()}
        </h3>
        
        <button
          onClick={navigateNext}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600">Còn trống (0%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-600">Đặt 1 phần (1-99%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-gray-600">🚶 Đang sử dụng</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600">Đã full (100%)</span>
        </div>
      </div>

      {/* Calendar Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto">
          {viewMode === 'hour' && renderHourView()}
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
        </div>
      )}
    </div>
  );
}
