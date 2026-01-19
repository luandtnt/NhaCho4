/**
 * Booking Fields Component
 * Booking-specific fields for SHORT_TERM properties
 */

import React from 'react';

interface BookingFieldsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export default function BookingFields({ formData, onChange }: BookingFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">📅 Thông tin đặt phòng</h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giờ nhận phòng <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            value={formData.checkin_time || ''}
            onChange={(e) => onChange('checkin_time', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giờ trả phòng <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            value={formData.checkout_time || ''}
            onChange={(e) => onChange('checkout_time', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sức chứa tối đa <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.max_occupancy || ''}
            onChange={(e) => onChange('max_occupancy', parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="2"
            required
          />
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-700">
          💡 <strong>Lưu ý:</strong> Giờ nhận/trả phòng chuẩn thường là 14:00 - 12:00
        </p>
      </div>
    </div>
  );
}
