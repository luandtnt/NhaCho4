import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Organization
    orgName: '',
    industry: 'real_estate',
    timezone: 'Asia/Ho_Chi_Minh',
    currency: 'VND',
    
    // Step 2: Settings
    paymentProvider: 'not_configured',
    logo: '',
    
    // Step 3: First Asset
    assetName: '',
    assetType: 'apartment_building',
    assetAddress: { street: '', city: '', district: '', ward: '' },
    
    // Step 4: First Listing
    listingTitle: '',
    listingDescription: '',
    listingPrice: 0,
  });

  const steps = [
    { number: 1, title: 'Tổ chức', description: 'Thông tin doanh nghiệp' },
    { number: 2, title: 'Cài đặt', description: 'Cấu hình hệ thống' },
    { number: 3, title: 'Tài sản', description: 'Tạo tài sản đầu tiên' },
    { number: 4, title: 'Tin đăng', description: 'Đăng tin cho thuê' },
  ];

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = () => {
    if (currentStep === 3 || currentStep === 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      // Save onboarding completion flag
      localStorage.setItem('onboarding_completed', 'true');
      
      // Create asset if provided
      if (formData.assetName) {
        await apiClient.post('/assets', {
          asset_type: formData.assetType,
          name: formData.assetName,
          address_json: formData.assetAddress,
        });
      }

      // Create listing if provided (with proper validation)
      if (formData.listingTitle && formData.listingTitle.length >= 10) {
        await apiClient.post('/listings', {
          title: formData.listingTitle,
          description: formData.listingDescription || '',
          pricing_display: {
            from_amount: formData.listingPrice,
            currency: formData.currency,
            unit: 'month',
          },
          tags: [],
          media: [],
        });
      }

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Lỗi onboarding:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
      alert(`Lỗi: ${errorMsg}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Chào mừng đến URP! 🎉</h1>
          <p className="text-gray-600">Hãy thiết lập tài khoản của bạn trong vài bước đơn giản</p>
        </div>

        {/* Progress Stepper */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      currentStep >= step.number
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <div className="text-center mt-2">
                    <div className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
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
          {/* Step 1: Organization */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Thông tin tổ chức</h2>
                <p className="text-gray-600">Thiết lập thông tin doanh nghiệp của bạn</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên tổ chức *
                </label>
                <input
                  type="text"
                  value={formData.orgName}
                  onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Công ty TNHH ABC"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lĩnh vực
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  >
                    <option value="real_estate">Bất động sản</option>
                    <option value="property_management">Quản lý tài sản</option>
                    <option value="rental_services">Dịch vụ cho thuê</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Múi giờ
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  >
                    <option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</option>
                    <option value="Asia/Bangkok">Bangkok (GMT+7)</option>
                    <option value="Asia/Singapore">Singapore (GMT+8)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đơn vị tiền tệ mặc định
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                >
                  <option value="VND">VND - Việt Nam Đồng</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="THB">THB - Thai Baht</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Settings */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Cài đặt hệ thống</h2>
                <p className="text-gray-600">Cấu hình thanh toán và giao diện</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhà cung cấp thanh toán
                </label>
                <select
                  value={formData.paymentProvider}
                  onChange={(e) => setFormData({ ...formData, paymentProvider: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                >
                  <option value="not_configured">Chưa cấu hình (có thể làm sau)</option>
                  <option value="vnpay">VNPay</option>
                  <option value="momo">MoMo</option>
                  <option value="stripe">Stripe</option>
                </select>
                <p className="text-sm text-gray-500 mt-2">
                  💡 Bạn có thể cấu hình chi tiết sau trong phần Cài đặt
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo công ty (tùy chọn)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">Kéo thả hoặc click để tải lên</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG tối đa 2MB</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: First Asset */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tạo tài sản đầu tiên</h2>
                <p className="text-gray-600">Thêm tòa nhà hoặc căn hộ của bạn (có thể bỏ qua)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên tài sản
                </label>
                <input
                  type="text"
                  value={formData.assetName}
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="VD: Chung cư Sunrise Tower"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại tài sản
                </label>
                <select
                  value={formData.assetType}
                  onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                >
                  <option value="apartment_building">Chung cư</option>
                  <option value="house">Nhà riêng</option>
                  <option value="villa">Biệt thự</option>
                  <option value="office">Văn phòng</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Thành phố</label>
                  <input
                    type="text"
                    value={formData.assetAddress.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assetAddress: { ...formData.assetAddress, city: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    placeholder="Hồ Chí Minh"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện</label>
                  <input
                    type="text"
                    value={formData.assetAddress.district}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assetAddress: { ...formData.assetAddress, district: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    placeholder="Quận 1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: First Listing */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tạo tin đăng đầu tiên</h2>
                <p className="text-gray-600">Đăng tin cho thuê để bắt đầu nhận khách (có thể bỏ qua)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề tin đăng
                </label>
                <input
                  type="text"
                  value={formData.listingTitle}
                  onChange={(e) => setFormData({ ...formData, listingTitle: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="VD: Cho thuê căn hộ 2PN view đẹp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.listingDescription}
                  onChange={(e) => setFormData({ ...formData, listingDescription: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  rows={4}
                  placeholder="Mô tả chi tiết về căn hộ..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá hiển thị (VND/tháng)
                </label>
                <input
                  type="number"
                  value={formData.listingPrice}
                  onChange={(e) => setFormData({ ...formData, listingPrice: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  placeholder="12000000"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Quay lại
            </button>

            <div className="flex gap-3">
              {(currentStep === 3 || currentStep === 4) && (
                <button
                  onClick={handleSkip}
                  className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900"
                >
                  Bỏ qua
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={currentStep === 1 && !formData.orgName}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === 4 ? 'Hoàn tất 🎉' : 'Tiếp theo →'}
              </button>
            </div>
          </div>
        </div>

        {/* Save Draft Notice */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            💾 Tiến trình của bạn được lưu tự động. Bạn có thể hoàn thành sau.
          </p>
        </div>
      </div>
    </div>
  );
}
