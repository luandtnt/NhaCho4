import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { MessageSquare, Calendar, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Lead {
  id: string;
  listing_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  message: string;
  status: string;
  created_at: string;
  metadata: any;
  listing?: {
    id: string;
    title: string;
    media: any[];
    pricing_display: any;
  };
}

export default function MyInquiriesPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchMyInquiries();
  }, []);

  const fetchMyInquiries = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/api/v1/leads?my_inquiries=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        setLeads(result.data || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải yêu cầu:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      NEW: 'bg-blue-100 text-blue-800',
      CONTACTED: 'bg-yellow-100 text-yellow-800',
      QUALIFIED: 'bg-purple-100 text-purple-800',
      VIEWING_SCHEDULED: 'bg-indigo-100 text-indigo-800',
      CONVERTED: 'bg-green-100 text-green-800',
      LOST: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: any = {
      NEW: 'Mới gửi',
      CONTACTED: 'Đã liên hệ',
      QUALIFIED: 'Đã xác nhận',
      VIEWING_SCHEDULED: 'Đã đặt lịch xem',
      CONVERTED: 'Đã chuyển đổi',
      LOST: 'Đã hủy',
    };
    return texts[status] || status;
  };

  const getFirstImage = (media: any[]) => {
    const image = media?.find(m => m.type === 'image');
    return image?.url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect width="200" height="150" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  const formatPrice = (pricing: any) => {
    if (!pricing || !pricing.from_amount) return 'Liên hệ';
    return `${pricing.from_amount.toLocaleString('vi-VN')} ${pricing.currency || 'VND'}/${pricing.unit || 'tháng'}`;
  };

  return (
    <Layout userRole="TENANT">
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Yêu cầu của tôi</h1>
          <p className="text-gray-600 mt-1">
            Quản lý các yêu cầu xem nhà đã gửi
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Đang tải...</div>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có yêu cầu nào
            </h3>
            <p className="text-gray-600 mb-4">
              Bạn chưa gửi yêu cầu xem nhà nào
            </p>
            <button
              onClick={() => navigate('/discover')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Khám phá bất động sản
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-4"
              >
                <div className="flex gap-4">
                  {/* Listing Image */}
                  {lead.listing && (
                    <div
                      onClick={() => navigate(`/listings/${lead.listing_id}`)}
                      className="flex-shrink-0 cursor-pointer"
                    >
                      <img
                        src={getFirstImage(lead.listing.media)}
                        alt={lead.listing.title}
                        className="w-32 h-24 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        {lead.listing && (
                          <h3
                            onClick={() => navigate(`/listings/${lead.listing_id}`)}
                            className="font-semibold text-lg text-gray-900 hover:text-blue-600 cursor-pointer mb-1"
                          >
                            {lead.listing.title}
                          </h3>
                        )}
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(lead.created_at).toLocaleDateString('vi-VN')}
                          </span>
                          {lead.listing && (
                            <span className="font-semibold text-blue-600">
                              {formatPrice(lead.listing.pricing_display)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
                        {getStatusText(lead.status)}
                      </span>
                    </div>

                    {lead.message && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {lead.message}
                      </p>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                      
                      {lead.listing && (
                        <button
                          onClick={() => navigate(`/listings/${lead.listing_id}`)}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Xem bất động sản →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Chi tiết yêu cầu</h3>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedLead.status)}`}>
                    {getStatusText(selectedLead.status)}
                  </span>
                </div>

                {selectedLead.listing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bất động sản
                    </label>
                    <div
                      onClick={() => {
                        setSelectedLead(null);
                        navigate(`/listings/${selectedLead.listing_id}`);
                      }}
                      className="flex gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    >
                      <img
                        src={getFirstImage(selectedLead.listing.media)}
                        alt={selectedLead.listing.title}
                        className="w-20 h-16 object-cover rounded"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{selectedLead.listing.title}</div>
                        <div className="text-sm text-blue-600 font-semibold">
                          {formatPrice(selectedLead.listing.pricing_display)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thông tin liên hệ
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div><span className="font-medium">Tên:</span> {selectedLead.contact_name}</div>
                    <div><span className="font-medium">Email:</span> {selectedLead.contact_email}</div>
                    <div><span className="font-medium">SĐT:</span> {selectedLead.contact_phone}</div>
                  </div>
                </div>

                {selectedLead.metadata?.move_in_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày dự kiến chuyển vào
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {new Date(selectedLead.metadata.move_in_date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                )}

                {selectedLead.message && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lời nhắn
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg whitespace-pre-line">
                      {selectedLead.message}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày gửi
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {new Date(selectedLead.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
