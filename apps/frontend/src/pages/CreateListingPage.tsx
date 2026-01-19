import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [rentableItems, setRentableItems] = useState<any[]>([]);
  const [showCreateRentableModal, setShowCreateRentableModal] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: '',
    description: '',
    tags: [] as string[],
    category: 'apartment',
    location: {
      address: '',
      city: '',
      district: '',
      ward: '',
      lat: 0,
      lng: 0,
    },
    
    // Step 2: Rentable Items
    rentable_item_ids: [] as string[],
    
    // Step 3: Pricing Display
    pricing_display: {
      from_amount: 0,
      currency: 'VND',
      unit: 'month',
    },
    
    // Step 4: Media
    media: [] as any[],
    cover_image_index: 0,
    
    // Status
    status: 'DRAFT',
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadRentableItems();
  }, []);

  const loadRentableItems = async () => {
    try {
      const response = await apiClient.get('/rentable-items?page=1&page_size=100');
      setRentableItems(response.data.data || []);
    } catch (error) {
      console.error('Không thể tải danh sách rentable items:', error);
    }
  };

  const steps = [
    { number: 1, title: 'Thông tin cơ bản', icon: '📝' },
    { number: 2, title: 'Gắn tài sản', icon: '🏠' },
    { number: 3, title: 'Giá hiển thị', icon: '💰' },
    { number: 4, title: 'Hình ảnh', icon: '📸' },
    { number: 5, title: 'Xem trước', icon: '👁️' },
  ];

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleToggleRentableItem = (id: string) => {
    const ids = formData.rentable_item_ids;
    if (ids.includes(id)) {
      setFormData({ ...formData, rentable_item_ids: ids.filter(i => i !== id) });
    } else {
      setFormData({ ...formData, rentable_item_ids: [...ids, id] });
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Validation
      if (!formData.title || formData.title.length < 10) {
        alert('Tiêu đề phải có ít nhất 10 ký tự');
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description || '',
        tags: formData.tags,
        pricing_display: formData.pricing_display,
        rentable_item_ids: formData.rentable_item_ids,
        media: formData.media,
      };

      await apiClient.post('/listings', payload);
      alert('Đã lưu nháp thành công!');
      navigate('/listings');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Không thể lưu nháp';
      alert(`Lỗi: ${errorMsg}`);
      console.error('Lỗi lưu nháp:', error.response?.data);
    }
  };

  const handlePublish = async () => {
    try {
      // Validation
      if (!formData.title || formData.title.length < 10) {
        alert('Tiêu đề phải có ít nhất 10 ký tự');
        setCurrentStep(1);
        return;
      }
      
      if (!formData.location.city) {
        alert('Vui lòng nhập thành phố');
        setCurrentStep(1);
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description || '',
        tags: formData.tags,
        pricing_display: formData.pricing_display,
        rentable_item_ids: formData.rentable_item_ids,
        media: formData.media,
      };

      const response = await apiClient.post('/listings', payload);
      
      // Publish the listing
      if (response.data.id) {
        await apiClient.post(`/listings/${response.data.id}/publish`);
      }

      alert('Đăng tin thành công! 🎉');
      navigate('/listings');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Không thể đăng tin';
      alert(`Lỗi: ${errorMsg}`);
      console.error('Lỗi đăng tin:', error.response?.data);
    }
  };

  const canPublish = formData.title.length >= 10 && formData.location.city;

  return (
    <Layout userRole="LANDLORD">
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Tạo tin đăng mới</h1>
            <p className="text-gray-600 mt-2">Hoàn thành 5 bước để đăng tin cho thuê</p>
          </div>

          {/* Progress Stepper */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                        currentStep >= step.number
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {currentStep > step.number ? '✓' : step.icon}
                    </div>
                    <div className="text-center mt-2">
                      <div className={`text-sm font-medium ${
                        currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-4 ${
                        currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Thông tin cơ bản</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề tin đăng * (tối thiểu 10 ký tự)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    placeholder="VD: Cho thuê căn hộ 2PN view đẹp tại Quận 1"
                    required
                    minLength={10}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.title.length}/10 ký tự
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    rows={6}
                    placeholder="Mô tả chi tiết về căn hộ, tiện ích, vị trí..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Danh mục
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  >
                    <option value="apartment">Căn hộ</option>
                    <option value="house">Nhà riêng</option>
                    <option value="villa">Biệt thự</option>
                    <option value="office">Văn phòng</option>
                    <option value="room">Phòng trọ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (từ khóa)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Nhập tag và nhấn Enter"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Thêm
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="text-blue-700 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thành phố *
                    </label>
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          location: { ...formData.location, city: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      placeholder="Hồ Chí Minh"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quận/Huyện
                    </label>
                    <input
                      type="text"
                      value={formData.location.district}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          location: { ...formData.location, district: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      placeholder="Quận 1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ cụ thể
                  </label>
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: { ...formData.location, address: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    placeholder="123 Đường ABC"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Rentable Items */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gắn tài sản cho thuê</h2>
                    <p className="text-gray-600 mt-1">Chọn các đơn vị cho thuê (có thể bỏ qua)</p>
                  </div>
                  <button
                    onClick={() => setShowCreateRentableModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    + Tạo mới
                  </button>
                </div>

                {rentableItems.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">Chưa có tài sản cho thuê nào</p>
                    <button
                      onClick={() => navigate('/assets')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Tạo tài sản trước →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {rentableItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleRentableItem(item.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                          formData.rentable_item_ids.includes(item.id)
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.code}</h3>
                            <p className="text-sm text-gray-600">{item.allocation_type}</p>
                            {item.capacity && (
                              <p className="text-xs text-gray-500 mt-1">
                                Sức chứa: {item.capacity}
                              </p>
                            )}
                          </div>
                          {formData.rentable_item_ids.includes(item.id) && (
                            <span className="text-blue-600 text-xl">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Lưu ý:</strong> Nếu không gắn tài sản, tin đăng sẽ chỉ nhận inquiry (liên hệ) mà không thể booking trực tiếp.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Pricing Display */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Giá hiển thị</h2>
                  <p className="text-gray-600">Giá hiển thị trên tin đăng (giá thực tế sẽ tính theo chính sách)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá từ (VND)
                  </label>
                  <input
                    type="number"
                    value={formData.pricing_display.from_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing_display: {
                          ...formData.pricing_display,
                          from_amount: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg"
                    placeholder="12000000"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Hiển thị: {formData.pricing_display.from_amount.toLocaleString()} VND/tháng
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đơn vị tiền tệ
                    </label>
                    <select
                      value={formData.pricing_display.currency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pricing_display: { ...formData.pricing_display, currency: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    >
                      <option value="VND">VND</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đơn vị thời gian
                    </label>
                    <select
                      value={formData.pricing_display.unit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pricing_display: { ...formData.pricing_display, unit: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    >
                      <option value="month">Tháng</option>
                      <option value="day">Ngày</option>
                      <option value="year">Năm</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Media */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Hình ảnh & Video</h2>
                  <p className="text-gray-600">Tải lên ảnh và video của tài sản</p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-lg text-gray-700 mb-2">Kéo thả hoặc click để tải lên</p>
                  <p className="text-sm text-gray-500">PNG, JPG, MP4 tối đa 10MB mỗi file</p>
                  <button className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Chọn file
                  </button>
                </div>

                {formData.media.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Đã tải lên ({formData.media.length})</h3>
                    <div className="grid grid-cols-4 gap-4">
                      {formData.media.map((media, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={media.url}
                            alt={`Media ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          {index === formData.cover_image_index && (
                            <span className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                              Ảnh bìa
                            </span>
                          )}
                          <button className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition">
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Yêu cầu:</strong> Cần ít nhất 1 ảnh để có thể đăng tin
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Preview */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Xem trước tin đăng</h2>
                  <p className="text-gray-600">Kiểm tra lại thông tin trước khi đăng</p>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{formData.title}</h3>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {formData.category}
                    </span>
                    <span className="text-gray-600">
                      📍 {formData.location.district}, {formData.location.city}
                    </span>
                  </div>

                  <div className="text-3xl font-bold text-blue-600 mb-4">
                    {formData.pricing_display.from_amount.toLocaleString()} {formData.pricing_display.currency}/{formData.pricing_display.unit}
                  </div>

                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">{formData.description}</p>

                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {formData.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {formData.rentable_item_ids.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Gắn {formData.rentable_item_ids.length} tài sản cho thuê
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    ✅ Tin đăng đã sẵn sàng để {canPublish ? 'đăng' : 'lưu nháp'}!
                  </p>
                  {!canPublish && (
                    <p className="text-sm text-orange-600 mt-2">
                      ⚠️ Cần thêm ảnh để có thể đăng tin công khai
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Quay lại
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50"
                >
                  💾 Lưu nháp
                </button>
                
                {currentStep < 5 ? (
                  <button
                    onClick={handleNext}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Tiếp theo →
                  </button>
                ) : (
                  <button
                    onClick={handlePublish}
                    disabled={!canPublish}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🚀 Đăng tin
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
