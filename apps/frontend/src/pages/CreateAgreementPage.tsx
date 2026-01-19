import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function CreateAgreementPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [rentableItems, setRentableItems] = useState<any[]>([]);
  const [pricingPolicies, setPricingPolicies] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    // Yêu cầu 1: Identity
    contract_title: '',
    
    // Yêu cầu 3: Tenant
    tenant_party_id: '',
    tenant_id_number: '', // CCCD tenant
    
    // Yêu cầu 2: Rentable Item
    rentable_item_id: '',
    agreement_type: 'lease',
    
    // Yêu cầu 4: Dates & Billing
    start_at: '',
    end_at: '',
    billing_day: 1,
    payment_due_days: 5,
    payment_cycle: 'MONTHLY',
    
    // Yêu cầu 5: Pricing
    base_price: 0,
    deposit_amount: 0,
    service_fee: 0,
    building_mgmt_fee: 0,
    parking_fee_motorbike: 0,
    parking_fee_car: 0,
    internet_fee: 0,
    price_increase_percent: 0,
    price_increase_frequency: 'YEARLY',
    
    // Yêu cầu 6: Utilities
    electricity_billing: 'METER_PRIVATE',
    electricity_rate: 0,
    water_billing: 'METER_PRIVATE',
    water_rate: 0,
    
    // Yêu cầu 7: Terms & Rules
    house_rules: '',
    termination_clause: '',
    violation_penalty: 0,
    allow_pets: false,
    allow_smoking: false,
    allow_guests: true,
    
    // Yêu cầu 8: Handover
    handover_date: '',
    handover_condition: '',
    initial_electricity: 0,
    initial_water: 0,
    
    landlord_notes: '',
  });

  useEffect(() => {
    loadRentableItems();
    loadPricingPolicies();
  }, []);

  const loadRentableItems = async () => {
    try {
      setLoadingItems(true);
      // Try different endpoints
      let response;
      try {
        response = await apiClient.get('/rentable-items?page=1&page_size=100');
      } catch (err) {
        // Fallback to without pagination
        response = await apiClient.get('/rentable-items');
      }
      
      const items = response.data.data || response.data || [];
      console.log('Loaded rentable items:', items);
      
      // Filter AVAILABLE or ACTIVE items (not OCCUPIED)
      const availableItems = items.filter((item: any) => 
        item.status === 'AVAILABLE' || item.status === 'ACTIVE'
      );
      setRentableItems(availableItems);
      
      if (availableItems.length === 0) {
        console.warn('No AVAILABLE/ACTIVE rentable items found');
      }
    } catch (error) {
      console.error('Không thể tải danh sách tài sản:', error);
      alert('Không thể tải danh sách tài sản. Vui lòng kiểm tra backend.');
    } finally {
      setLoadingItems(false);
    }
  };

  const loadPricingPolicies = async () => {
    try {
      setLoadingPolicies(true);
      
      // Try different endpoints
      let response;
      try {
        // Try with pagination
        response = await apiClient.get('/pricing-policies?page=1&page_size=100');
      } catch (err: any) {
        console.warn('Pagination failed, trying without params:', err.message);
        try {
          // Try without pagination
          response = await apiClient.get('/pricing-policies');
        } catch (err2: any) {
          console.warn('Direct call failed, trying config-bundles:', err2.message);
          // Fallback to config-bundles endpoint
          response = await apiClient.get('/config-bundles?type=pricing_policy&page=1&page_size=100');
        }
      }
      
      const policies = response.data.data || response.data || [];
      console.log('Loaded pricing policies:', policies);
      
      // Filter ACTIVE policies
      const activePolicies = policies.filter((p: any) => p.status === 'ACTIVE');
      setPricingPolicies(activePolicies);
    } catch (error) {
      console.error('Không thể tải danh sách chính sách giá:', error);
      // Don't alert, just log - pricing policy is optional
      setPricingPolicies([]);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const handlePolicySelect = async (policyId: string) => {
    if (!policyId) {
      setSelectedPolicy(null);
      return;
    }

    const policy = pricingPolicies.find(p => p.id === policyId);
    setSelectedPolicy(policy);
    
    if (policy) {
      console.log('Full policy object:', policy);
      
      // Data is at root level, not in config!
      // And values are strings, need to convert to numbers
      const basePrice = Number(policy.base_price) || 0;
      const depositAmount = Number(policy.deposit_amount) || 0;
      const serviceFee = Number(policy.service_fee) || 0;
      const buildingMgmtFee = Number(policy.building_management_fee) || 0;
      
      // Map electricity_billing values
      let electricityBilling = 'METER_PRIVATE';
      if (policy.electricity_billing === 'METERED') electricityBilling = 'METER_PRIVATE';
      else if (policy.electricity_billing === 'FIXED') electricityBilling = 'OWNER_RATE';
      else if (policy.electricity_billing === 'INCLUDED') electricityBilling = 'INCLUDED';
      
      // Map water_billing values
      let waterBilling = 'METER_PRIVATE';
      if (policy.water_billing === 'METERED') waterBilling = 'METER_PRIVATE';
      else if (policy.water_billing === 'FIXED') waterBilling = 'OWNER_RATE';
      else if (policy.water_billing === 'INCLUDED') waterBilling = 'INCLUDED';
      
      const priceIncreasePercent = Number(policy.price_increase_percent) || 0;
      const priceIncreaseFrequency = policy.price_increase_frequency || 'YEARLY';
      
      // Auto-fill from policy
      setFormData(prev => ({
        ...prev,
        base_price: basePrice,
        deposit_amount: depositAmount,
        service_fee: serviceFee,
        building_mgmt_fee: buildingMgmtFee,
        electricity_billing: electricityBilling,
        water_billing: waterBilling,
        price_increase_percent: priceIncreasePercent,
        price_increase_frequency: priceIncreaseFrequency,
      }));
      
      console.log('Auto-filled values:', {
        basePrice,
        depositAmount,
        serviceFee,
        buildingMgmtFee,
        electricityBilling,
        waterBilling,
      });
    }
  };

  const handleItemSelect = (itemId: string) => {
    const item = rentableItems.find(i => i.id === itemId);
    setSelectedItem(item);
    setFormData(prev => ({ ...prev, rentable_item_id: itemId }));
    
    // If item has a pricing policy, auto-select it
    if (item?.pricing_policy_id) {
      handlePolicySelect(item.pricing_policy_id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Yêu cầu 11: Validation
    if (!formData.tenant_party_id) {
      alert('Vui lòng nhập ID khách thuê');
      return;
    }
    
    if (!formData.rentable_item_id) {
      alert('Vui lòng chọn tài sản');
      return;
    }

    if (!formData.base_price || formData.base_price <= 0) {
      alert('Vui lòng nhập giá thuê');
      return;
    }
    
    // Validate dates
    if (formData.end_at && new Date(formData.start_at) >= new Date(formData.end_at)) {
      alert('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }
    
    // Validate electricity rate if OWNER_RATE
    if (formData.electricity_billing === 'OWNER_RATE' && (!formData.electricity_rate || formData.electricity_rate <= 0)) {
      alert('Vui lòng nhập giá điện khi chọn "Giá chủ nhà"');
      return;
    }
    
    // Validate water rate if OWNER_RATE
    if (formData.water_billing === 'OWNER_RATE' && (!formData.water_rate || formData.water_rate <= 0)) {
      alert('Vui lòng nhập giá nước khi chọn "Giá chủ nhà"');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data - remove empty strings and convert to proper types
      const submitData: any = {
        tenant_party_id: formData.tenant_party_id,
        rentable_item_id: formData.rentable_item_id,
        agreement_type: formData.agreement_type,
        start_at: formData.start_at,
        base_price: Number(formData.base_price),
        deposit_amount: Number(formData.deposit_amount),
        service_fee: Number(formData.service_fee),
        building_mgmt_fee: Number(formData.building_mgmt_fee),
        parking_fee_motorbike: Number(formData.parking_fee_motorbike),
        parking_fee_car: Number(formData.parking_fee_car),
        internet_fee: Number(formData.internet_fee),
        electricity_billing: formData.electricity_billing,
        water_billing: formData.water_billing,
        price_increase_percent: Number(formData.price_increase_percent),
        price_increase_frequency: formData.price_increase_frequency,
        payment_cycle: formData.payment_cycle,
        billing_day: Number(formData.billing_day),
        payment_due_days: Number(formData.payment_due_days),
        violation_penalty: Number(formData.violation_penalty),
        allow_pets: formData.allow_pets,
        allow_smoking: formData.allow_smoking,
        allow_guests: formData.allow_guests,
        initial_electricity: Number(formData.initial_electricity),
        initial_water: Number(formData.initial_water),
      };
      
      // Add optional fields only if they have values
      if (formData.contract_title) submitData.contract_title = formData.contract_title;
      if (formData.tenant_id_number) submitData.tenant_id_number = formData.tenant_id_number;
      if (formData.end_at) submitData.end_at = formData.end_at;
      if (formData.electricity_rate) submitData.electricity_rate = Number(formData.electricity_rate);
      if (formData.water_rate) submitData.water_rate = Number(formData.water_rate);
      if (formData.house_rules) submitData.house_rules = formData.house_rules;
      if (formData.termination_clause) submitData.termination_clause = formData.termination_clause;
      if (formData.handover_date) submitData.handover_date = formData.handover_date;
      if (formData.handover_condition) submitData.handover_condition = formData.handover_condition;
      if (formData.landlord_notes) submitData.landlord_notes = formData.landlord_notes;
      
      console.log('Submitting agreement data:', submitData); // Debug
      
      const response = await apiClient.post('/agreements', submitData);
      alert(`Tạo hợp đồng thành công!\nMã hợp đồng: ${response.data.contract_code || response.data.id}`);
      navigate(`/agreements/${response.data.id}`);
    } catch (error: any) {
      console.error('Create agreement error:', error.response?.data); // Debug
      console.error('Full error:', error); // Debug
      
      // Show detailed error message
      let errorMsg = 'Không thể tạo hợp đồng';
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMsg = error.response.data.message.join('\n');
        } else {
          errorMsg = error.response.data.message;
        }
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      }
      
      alert(`Lỗi: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' ₫';
  };

  // Calculate total monthly cost
  const calculateTotalMonthlyCost = () => {
    return (
      formData.base_price +
      formData.service_fee +
      formData.building_mgmt_fee +
      formData.parking_fee_motorbike +
      formData.parking_fee_car +
      formData.internet_fee
    );
  };

  return (
    <Layout userRole="LANDLORD">
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/agreements')}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Quay lại danh sách
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Tạo hợp đồng mới</h1>
          <p className="text-gray-600 mt-1">Tạo hợp đồng thuê dài hạn với khách thuê</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Yêu cầu 1: Contract Identity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Thông tin định danh hợp đồng</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã hợp đồng
                </label>
                <input
                  type="text"
                  value="(Tự động sinh khi tạo)"
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  💡 Hệ thống sẽ tự động tạo mã: AG-2026-00001
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề hợp đồng
                </label>
                <input
                  type="text"
                  value={formData.contract_title}
                  onChange={(e) => setFormData({ ...formData, contract_title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: HĐ thuê căn 2PN Vinhomes Q9"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Tiêu đề giúp dễ dàng tra cứu và quản lý
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại hợp đồng
                </label>
                <select
                  value={formData.agreement_type}
                  onChange={(e) => setFormData({ ...formData, agreement_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="lease">Dài hạn (Lease)</option>
                  <option value="booking">Ngắn hạn (Booking)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tenant Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">👤 Thông tin khách thuê</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Khách thuê (tenant_party_id) *
                </label>
                <input
                  type="text"
                  value={formData.tenant_party_id}
                  onChange={(e) => setFormData({ ...formData, tenant_party_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nhập User ID của khách thuê"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  💡 Khách thuê có thể xem ID của mình tại trang "Tài khoản của tôi"
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số CCCD/Passport của khách thuê
                </label>
                <input
                  type="text"
                  value={formData.tenant_id_number}
                  onChange={(e) => setFormData({ ...formData, tenant_id_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="001234567890"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Số CCCD/Passport để lưu vào hợp đồng (tùy chọn)
                </p>
              </div>
            </div>
          </div>

          {/* Rentable Item */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Chọn tài sản cho thuê</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tài sản *
              </label>
              {loadingItems ? (
                <div className="text-gray-500">Đang tải danh sách tài sản...</div>
              ) : rentableItems.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    ⚠️ Không có tài sản nào ở trạng thái AVAILABLE hoặc ACTIVE.
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Vui lòng tạo tài sản mới hoặc kiểm tra trạng thái tài sản hiện có.
                  </p>
                </div>
              ) : (
                <>
                  <select
                    value={formData.rentable_item_id}
                    onChange={(e) => handleItemSelect(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">-- Chọn tài sản ({rentableItems.length} tài sản) --</option>
                    {rentableItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.space_node?.name || item.name || item.id} - {item.status}
                      </option>
                    ))}
                  </select>
                  
                  {selectedItem && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-900">
                        <strong>{selectedItem.space_node?.name || selectedItem.name}</strong>
                      </div>
                      <div className="text-sm text-blue-700 mt-1">
                        Trạng thái: {selectedItem.status}
                      </div>
                      {selectedItem.pricing_policy_id && (
                        <div className="text-sm text-blue-700">
                          ✓ Có chính sách giá (sẽ tự động chọn bên dưới)
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Pricing Policy Selector */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Chính sách giá (tùy chọn)</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn chính sách giá
              </label>
              {loadingPolicies ? (
                <div className="text-gray-500">Đang tải chính sách giá...</div>
              ) : (
                <>
                  <select
                    value={selectedPolicy?.id || ''}
                    onChange={(e) => handlePolicySelect(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Không chọn (nhập thủ công) --</option>
                    {pricingPolicies.map(policy => {
                      const policyName = policy.config?.name || policy.name || `Policy #${policy.id.slice(0, 8)}`;
                      const basePrice = policy.config?.base_price || 0;
                      return (
                        <option key={policy.id} value={policy.id}>
                          {policyName} - {formatPrice(basePrice)}
                        </option>
                      );
                    })}
                  </select>
                  
                  {selectedPolicy && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-green-900 font-semibold">
                        ✓ Đã áp dụng chính sách: {selectedPolicy.config?.name}
                      </div>
                      <div className="text-sm text-green-700 mt-1">
                        Các trường có giá trị sẽ được tự động điền. Bạn vẫn có thể chỉnh sửa.
                      </div>
                    </div>
                  )}
                </>
              )}
              <p className="text-sm text-gray-500 mt-2">
                💡 Chọn chính sách giá để tự động điền thông tin. Nếu không chọn, bạn cần nhập thủ công.
              </p>
            </div>
          </div>

          {/* Yêu cầu 4: Agreement Period & Billing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📅 Thời hạn thuê & Lịch thanh toán</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Để trống nếu không xác định
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chu kỳ thanh toán
                </label>
                <select
                  value={formData.payment_cycle}
                  onChange={(e) => setFormData({ ...formData, payment_cycle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="MONTHLY">Hàng tháng</option>
                  <option value="QUARTERLY">Hàng quý</option>
                  <option value="YEARLY">Hàng năm</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày chốt hóa đơn
                </label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={formData.billing_day}
                  onChange={(e) => setFormData({ ...formData, billing_day: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Ngày 1-28 hàng tháng
                </p>
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hạn thanh toán (số ngày)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.payment_due_days}
                  onChange={(e) => setFormData({ ...formData, payment_due_days: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  VD: 5 ngày = phải thanh toán trong vòng 5 ngày kể từ ngày chốt
                </p>
              </div>
            </div>
          </div>

          {/* Yêu cầu 5: Pricing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">💰 Thông tin giá & Phí</h2>
            
            {/* Total Preview */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-blue-900">Tổng chi phí dự kiến/tháng:</span>
                <span className="text-2xl font-bold text-blue-600">{formatPrice(calculateTotalMonthlyCost())}</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                = Giá thuê + Phí dịch vụ + Phí quản lý + Phí gửi xe + Internet
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá thuê cơ bản (₫/tháng) *
                </label>
                <input
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <div className="text-sm text-gray-600 mt-1">
                  {formatPrice(formData.base_price)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiền cọc (₫) *
                </label>
                <input
                  type="number"
                  value={formData.deposit_amount}
                  onChange={(e) => setFormData({ ...formData, deposit_amount: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <div className="text-sm text-gray-600 mt-1">
                  {formatPrice(formData.deposit_amount)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phí dịch vụ (₫/tháng)
                </label>
                <input
                  type="number"
                  value={formData.service_fee}
                  onChange={(e) => setFormData({ ...formData, service_fee: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phí quản lý (₫/tháng)
                </label>
                <input
                  type="number"
                  value={formData.building_mgmt_fee}
                  onChange={(e) => setFormData({ ...formData, building_mgmt_fee: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phí gửi xe máy (₫/tháng)
                </label>
                <input
                  type="number"
                  value={formData.parking_fee_motorbike}
                  onChange={(e) => setFormData({ ...formData, parking_fee_motorbike: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <div className="text-sm text-gray-600 mt-1">
                  {formatPrice(formData.parking_fee_motorbike)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phí gửi ô tô (₫/tháng)
                </label>
                <input
                  type="number"
                  value={formData.parking_fee_car}
                  onChange={(e) => setFormData({ ...formData, parking_fee_car: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <div className="text-sm text-gray-600 mt-1">
                  {formatPrice(formData.parking_fee_car)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phí Internet (₫/tháng)
                </label>
                <input
                  type="number"
                  value={formData.internet_fee}
                  onChange={(e) => setFormData({ ...formData, internet_fee: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <div className="text-sm text-gray-600 mt-1">
                  {formatPrice(formData.internet_fee)}
                </div>
              </div>
            </div>
          </div>

          {/* Yêu cầu 6: Utilities */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">⚡ Điện/Nước & Chi phí vận hành</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cách tính tiền điện *
                </label>
                <select
                  value={formData.electricity_billing}
                  onChange={(e) => setFormData({ ...formData, electricity_billing: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="METER_PRIVATE">Đồng hồ riêng</option>
                  <option value="SHARED">Chia sẻ</option>
                  <option value="OWNER_RATE">Giá chủ nhà</option>
                  <option value="STATE_RATE">Giá nhà nước</option>
                  <option value="INCLUDED">Đã bao gồm</option>
                </select>
              </div>
              
              {formData.electricity_billing === 'OWNER_RATE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá điện (₫/kWh) *
                  </label>
                  <input
                    type="number"
                    value={formData.electricity_rate}
                    onChange={(e) => setFormData({ ...formData, electricity_rate: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="VD: 3500"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Bắt buộc khi chọn "Giá chủ nhà"
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cách tính tiền nước *
                </label>
                <select
                  value={formData.water_billing}
                  onChange={(e) => setFormData({ ...formData, water_billing: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="METER_PRIVATE">Đồng hồ riêng</option>
                  <option value="SHARED">Chia sẻ</option>
                  <option value="OWNER_RATE">Giá chủ nhà</option>
                  <option value="STATE_RATE">Giá nhà nước</option>
                  <option value="INCLUDED">Đã bao gồm</option>
                </select>
              </div>
              
              {formData.water_billing === 'OWNER_RATE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá nước (₫/m³) *
                  </label>
                  <input
                    type="number"
                    value={formData.water_rate}
                    onChange={(e) => setFormData({ ...formData, water_rate: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="VD: 15000"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Bắt buộc khi chọn "Giá chủ nhà"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Price Increase */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Tăng giá định kỳ</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tỷ lệ tăng (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.price_increase_percent}
                  onChange={(e) => setFormData({ ...formData, price_increase_percent: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tần suất
                </label>
                <select
                  value={formData.price_increase_frequency}
                  onChange={(e) => setFormData({ ...formData, price_increase_frequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="YEARLY">Hàng năm</option>
                  <option value="HALF_YEARLY">6 tháng/lần</option>
                  <option value="QUARTERLY">3 tháng/lần</option>
                </select>
              </div>
            </div>
          </div>

          {/* Yêu cầu 7: Terms & Rules */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📜 Điều khoản & Nội quy</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội quy chung
                </label>
                <textarea
                  value={formData.house_rules}
                  onChange={(e) => setFormData({ ...formData, house_rules: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="VD: Không gây ồn sau 22h, giữ vệ sinh chung..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Điều khoản chấm dứt trước hạn
                </label>
                <textarea
                  value={formData.termination_clause}
                  onChange={(e) => setFormData({ ...formData, termination_clause: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="VD: Phạt 1 tháng tiền thuê nếu chấm dứt trước hạn..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phí phạt vi phạm (₫)
                </label>
                <input
                  type="number"
                  value={formData.violation_penalty}
                  onChange={(e) => setFormData({ ...formData, violation_penalty: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: 1000000"
                />
                <div className="text-sm text-gray-600 mt-1">
                  {formatPrice(formData.violation_penalty)}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allow_pets"
                    checked={formData.allow_pets}
                    onChange={(e) => setFormData({ ...formData, allow_pets: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="allow_pets" className="ml-2 text-sm text-gray-700">
                    Cho phép thú cưng
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allow_smoking"
                    checked={formData.allow_smoking}
                    onChange={(e) => setFormData({ ...formData, allow_smoking: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="allow_smoking" className="ml-2 text-sm text-gray-700">
                    Cho phép hút thuốc
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allow_guests"
                    checked={formData.allow_guests}
                    onChange={(e) => setFormData({ ...formData, allow_guests: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="allow_guests" className="ml-2 text-sm text-gray-700">
                    Cho khách ở qua đêm
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Yêu cầu 8: Handover */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🔑 Bàn giao & Tài sản</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày bàn giao
                </label>
                <input
                  type="date"
                  value={formData.handover_date}
                  onChange={(e) => setFormData({ ...formData, handover_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Thường trùng với ngày bắt đầu
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tình trạng hiện tại
                </label>
                <input
                  type="text"
                  value={formData.handover_condition}
                  onChange={(e) => setFormData({ ...formData, handover_condition: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: Mới 100%, đã qua sử dụng..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chỉ số điện ban đầu (kWh)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.initial_electricity}
                  onChange={(e) => setFormData({ ...formData, initial_electricity: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: 1234.5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chỉ số nước ban đầu (m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.initial_water}
                  onChange={(e) => setFormData({ ...formData, initial_water: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="VD: 567.8"
                />
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>Gợi ý:</strong> Chụp ảnh đồng hồ điện/nước và upload vào phần "File đính kèm" bên dưới
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📝 Ghi chú</h2>
            <textarea
              value={formData.landlord_notes}
              onChange={(e) => setFormData({ ...formData, landlord_notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="Ghi chú nội bộ (khách thuê không thấy)"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/agreements')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || loadingItems}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Tạo hợp đồng (DRAFT)'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
