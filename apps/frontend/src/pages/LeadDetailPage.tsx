import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);

  useEffect(() => {
    loadLead();
    loadNotes();
  }, [id]);

  const loadLead = async () => {
    try {
      const response = await apiClient.get(`/leads/${id}`);
      setLead(response.data);
    } catch (error) {
      console.error('Không thể tải thông tin khách hàng:', error);
      alert('Không tìm thấy lead');
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const response = await apiClient.get(`/leads/${id}/notes`);
      setNotes(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải ghi chú:', error);
      setNotes([]);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      alert('Vui lòng nhập nội dung note');
      return;
    }

    try {
      await apiClient.post(`/leads/${id}/notes`, {
        content: newNote,
      });
      setNewNote('');
      loadNotes(); // Reload notes
      alert('Đã thêm note thành công!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể thêm note');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await apiClient.put(`/leads/${id}`, { status });
      loadLead();
      alert('Đã cập nhật trạng thái thành công!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleAssign = async () => {
    const assigneeId = prompt('Nhập ID người được gán:');
    if (!assigneeId) return;

    try {
      await apiClient.post(`/leads/${id}/assign`, { assignee_id: assigneeId });
      loadLead();
      alert('Đã gán người phụ trách thành công!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể gán người phụ trách');
    }
  };

  const handleConvert = async () => {
    try {
      await apiClient.post(`/leads/${id}/convert`);
      alert('Đã chuyển đổi lead thành công! Đã tạo booking/agreement draft.');
      navigate('/agreements');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể chuyển đổi lead');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      NEW: 'bg-blue-100 text-blue-800',
      CONTACTED: 'bg-yellow-100 text-yellow-800',
      QUALIFIED: 'bg-green-100 text-green-800',
      CONVERTED: 'bg-purple-100 text-purple-800',
      LOST: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const translateStatus = (status: string) => {
    const map: any = {
      NEW: 'Mới',
      CONTACTED: 'Đã liên hệ',
      QUALIFIED: 'Đủ điều kiện',
      CONVERTED: 'Đã chuyển đổi',
      LOST: 'Mất khách',
    };
    return map[status] || status;
  };

  if (loading) {
    return (
      <Layout userRole="LANDLORD">
        <div className="p-8">Đang tải...</div>
      </Layout>
    );
  }

  if (!lead) {
    return (
      <Layout userRole="LANDLORD">
        <div className="p-8">Không tìm thấy lead</div>
      </Layout>
    );
  }

  return (
    <Layout userRole="LANDLORD">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/leads')}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Quay lại danh sách
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{lead.name || 'Lead không tên'}</h1>
              <p className="text-gray-600 mt-1">ID: {lead.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
              {translateStatus(lead.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Lead Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin khách hàng</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <div className="font-medium text-gray-900">{lead.email || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Điện thoại</label>
                  <div className="font-medium text-gray-900">{lead.phone || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-gray-600">Tin nhắn</label>
                  <div className="font-medium text-gray-900 whitespace-pre-wrap">
                    {lead.message || 'Không có tin nhắn'}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Tin đăng</label>
                  <div className="font-medium text-gray-900">
                    {lead.listing_id ? `#${lead.listing_id.slice(0, 8)}` : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Ngày tạo</label>
                  <div className="font-medium text-gray-900">
                    {new Date(lead.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Lịch sử hoạt động</h2>
              
              {/* Add Note */}
              <div className="mb-6">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Thêm ghi chú nội bộ..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Thêm ghi chú
                </button>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {note.actor.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">{note.actor}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(note.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-gray-700">{note.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
              <div className="space-y-3">
                <button
                  onClick={handleAssign}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  👤 Gán người phụ trách
                </button>
                
                {lead.status === 'NEW' && (
                  <button
                    onClick={() => handleUpdateStatus('CONTACTED')}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    ✓ Đánh dấu đã liên hệ
                  </button>
                )}

                {lead.status === 'CONTACTED' && (
                  <button
                    onClick={() => handleUpdateStatus('QUALIFIED')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    ✓ Đánh dấu đủ điều kiện
                  </button>
                )}

                {(lead.status === 'QUALIFIED' || lead.status === 'CONTACTED') && (
                  <button
                    onClick={() => setShowConvertModal(true)}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    🔄 Chuyển đổi thành khách hàng
                  </button>
                )}

                <button
                  onClick={() => handleUpdateStatus('LOST')}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  ✕ Đánh dấu mất khách
                </button>
              </div>
            </div>

            {/* Lead Score */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Điểm lead</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">75</div>
                <div className="text-sm text-gray-600">Tiềm năng cao</div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Có email:</span>
                  <span className="text-green-600">+25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Có SĐT:</span>
                  <span className="text-green-600">+25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tin nhắn chi tiết:</span>
                  <span className="text-green-600">+25</span>
                </div>
              </div>
            </div>

            {/* Assignee Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Người phụ trách</h3>
              {lead.assignee_id ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">U</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">User</div>
                    <div className="text-sm text-gray-500">ID: {lead.assignee_id.slice(0, 8)}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Chưa gán người phụ trách
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Convert Modal */}
        {showConvertModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Chuyển đổi lead</h2>
              <p className="text-gray-600 mb-6">
                Chuyển đổi lead này thành booking hoặc agreement draft?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConvert}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
