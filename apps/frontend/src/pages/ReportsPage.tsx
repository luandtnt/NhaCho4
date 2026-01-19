import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export default function ReportsPage() {
  const [reports, setReports] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [occupancy, revenue, tickets] = await Promise.all([
        apiClient.get('/reports/occupancy?start_date=2026-01-01&end_date=2026-12-31').catch(() => ({ data: {} })),
        apiClient.get('/reports/revenue?start_date=2026-01-01&end_date=2026-12-31').catch(() => ({ data: {} })),
        apiClient.get('/reports/tickets-summary').catch(() => ({ data: {} })),
      ]);

      setReports({
        occupancy: occupancy.data,
        revenue: revenue.data,
        tickets: tickets.data,
      });
    } catch (error) {
      console.error('Không thể tải báo cáo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Báo cáo & Phân tích</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Occupancy Report */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tỷ lệ lấp đầy</h2>
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {reports.occupancy?.occupancy_rate || 0}%
            </div>
            <div className="text-sm text-gray-600">
              {reports.occupancy?.occupied_count || 0} / {reports.occupancy?.total_count || 0} đơn vị đã cho thuê
            </div>
          </div>

          {/* Revenue Report */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tổng quan doanh thu</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng hóa đơn:</span>
                <span className="font-semibold">{reports.revenue?.total_invoiced || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Đã thanh toán:</span>
                <span className="font-semibold text-green-600">{reports.revenue?.total_paid || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quá hạn:</span>
                <span className="font-semibold text-red-600">{reports.revenue?.total_overdue || 0}</span>
              </div>
            </div>
          </div>

          {/* Tickets Summary */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tổng quan yêu cầu</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {reports.tickets?.by_status?.OPEN || 0}
                </div>
                <div className="text-sm text-gray-600">Mở</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {reports.tickets?.by_status?.IN_PROGRESS || 0}
                </div>
                <div className="text-sm text-gray-600">Đang xử lý</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {reports.tickets?.by_status?.CLOSED || 0}
                </div>
                <div className="text-sm text-gray-600">Đã đóng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {reports.tickets?.total || 0}
                </div>
                <div className="text-sm text-gray-600">Tổng cộng</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
