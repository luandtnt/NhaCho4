import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import Layout from '../components/Layout';

export default function AgreementContractPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('LANDLORD');

  useEffect(() => {
    // Get user role from localStorage or API
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || 'LANDLORD');
    loadContractData();
  }, [id]);

  const loadContractData = async () => {
    try {
      const response = await apiClient.get(`/agreements/${id}/contract-data`);
      setData(response.data);
    } catch (error) {
      console.error('Không thể tải dữ liệu hợp đồng:', error);
      alert('Không thể tải dữ liệu hợp đồng');
      // Navigate back based on role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.role === 'Tenant') {
        navigate(`/my-agreements/${id}`);
      } else {
        navigate(`/agreements/${id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (price: number) => {
    if (!price) return '0 ₫';
    return price.toLocaleString('vi-VN') + ' ₫';
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const formatDateLong = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return `ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  };

  const numberToWords = (num: number): string => {
    // Simple Vietnamese number to words (basic implementation)
    if (num === 0) return 'không';
    
    const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const tens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
    
    if (num < 10) return units[num];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      return tens[ten] + (unit > 0 ? ' ' + units[unit] : '');
    }
    
    // For larger numbers, just return the number
    return num.toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <Layout userRole={userRole as any}>
        <div className="p-8">Đang tải...</div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout userRole={userRole as any}>
        <div className="p-8">Không tìm thấy dữ liệu</div>
      </Layout>
    );
  }

  const { agreement, landlord, tenant, property } = data;
  
  // Determine back URL based on role
  const backUrl = userRole === 'Tenant' ? `/my-agreements/${id}` : `/agreements/${id}`;

  return (
    <Layout userRole={userRole as any}>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Action Buttons - Hidden when printing */}
        <div className="mb-6 print:hidden flex gap-3">
          <button
            onClick={() => navigate(backUrl)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Quay lại
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🖨️ In hợp đồng
          </button>
        </div>

        {/* Contract Document */}
        <div className="bg-white p-12 shadow-lg" id="contract-content">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-sm mb-2">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div className="text-sm font-bold mb-6">Độc lập - Tự do - Hạnh phúc</div>
            <div className="border-t-2 border-black w-16 mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold mb-2">HỢP ĐỒNG THUÊ NHÀ</h1>
            {agreement.contract_code && (
              <div className="text-lg">Số: {agreement.contract_code}</div>
            )}
            {agreement.contract_title && (
              <div className="text-base text-gray-700 mt-2">{agreement.contract_title}</div>
            )}
          </div>

          {/* Introduction */}
          <div className="mb-6 text-justify leading-relaxed">
            <p className="mb-4">
              Hôm nay, {formatDateLong(agreement.created_at)}, tại {property?.address || '[Địa chỉ]'}, 
              chúng tôi gồm có:
            </p>
          </div>

          {/* Party A - Landlord */}
          <div className="mb-6">
            <h2 className="font-bold text-lg mb-3">BÊN CHO THUÊ (Bên A):</h2>
            <div className="ml-6 space-y-2">
              <p><strong>Ông/Bà:</strong> {landlord?.name || '[Tên chủ nhà]'}</p>
              {landlord?.id_number && (
                <p><strong>CCCD/CMND:</strong> {landlord.id_number}</p>
              )}
              {landlord?.phone && (
                <p><strong>Điện thoại:</strong> {landlord.phone}</p>
              )}
              {landlord?.email && (
                <p><strong>Email:</strong> {landlord.email}</p>
              )}
            </div>
          </div>

          {/* Party B - Tenant */}
          <div className="mb-6">
            <h2 className="font-bold text-lg mb-3">BÊN THUÊ (Bên B):</h2>
            <div className="ml-6 space-y-2">
              <p><strong>Ông/Bà:</strong> {tenant?.name || '[Tên khách thuê]'}</p>
              {(agreement.tenant_id_number || tenant?.id_number) && (
                <p><strong>CCCD/CMND:</strong> {agreement.tenant_id_number || tenant.id_number}</p>
              )}
              {tenant?.phone && (
                <p><strong>Điện thoại:</strong> {tenant.phone}</p>
              )}
              {tenant?.email && (
                <p><strong>Email:</strong> {tenant.email}</p>
              )}
            </div>
          </div>

          {/* Agreement */}
          <div className="mb-6 text-justify leading-relaxed">
            <p className="mb-4">
              Sau khi bàn bạc, hai bên thống nhất ký kết hợp đồng thuê nhà với các điều khoản sau:
            </p>
          </div>

          {/* Article 1 - Property */}
          <div className="mb-6">
            <h3 className="font-bold mb-3">ĐIỀU 1: ĐỐI TƯỢNG CỦA HỢP ĐỒNG</h3>
            <div className="ml-6 space-y-2">
              <p><strong>Tên tài sản:</strong> {property?.name || '[Tên tài sản]'}</p>
              <p><strong>Địa chỉ:</strong> {property?.address || '[Địa chỉ]'}</p>
              {property?.area_sqm && (
                <p><strong>Diện tích:</strong> {property.area_sqm} m²</p>
              )}
              {property?.bedrooms && (
                <p><strong>Số phòng ngủ:</strong> {property.bedrooms}</p>
              )}
              {property?.bathrooms && (
                <p><strong>Số phòng tắm:</strong> {property.bathrooms}</p>
              )}
              {agreement.handover_condition && (
                <p><strong>Tình trạng:</strong> {agreement.handover_condition}</p>
              )}
            </div>
          </div>

          {/* Article 2 - Term */}
          <div className="mb-6">
            <h3 className="font-bold mb-3">ĐIỀU 2: THỜI HẠN THUÊ</h3>
            <div className="ml-6 space-y-2">
              <p><strong>Ngày bắt đầu:</strong> {formatDate(agreement.start_at)}</p>
              {agreement.end_at && (
                <p><strong>Ngày kết thúc:</strong> {formatDate(agreement.end_at)}</p>
              )}
              {!agreement.end_at && (
                <p><strong>Thời hạn:</strong> Không xác định (có thể chấm dứt theo thỏa thuận)</p>
              )}
              {agreement.handover_date && (
                <p><strong>Ngày bàn giao:</strong> {formatDate(agreement.handover_date)}</p>
              )}
            </div>
          </div>

          {/* Article 3 - Price */}
          <div className="mb-6">
            <h3 className="font-bold mb-3">ĐIỀU 3: GIÁ THUÊ VÀ PHƯƠNG THỨC THANH TOÁN</h3>
            <div className="ml-6 space-y-2">
              <p>
                <strong>Giá thuê:</strong> {formatPrice(agreement.base_price || 0)}/tháng 
                (Bằng chữ: {numberToWords(agreement.base_price || 0)} đồng)
              </p>
              
              {agreement.deposit_amount > 0 && (
                <p>
                  <strong>Tiền cọc:</strong> {formatPrice(agreement.deposit_amount)} 
                  (Bằng chữ: {numberToWords(agreement.deposit_amount)} đồng)
                </p>
              )}
              
              {agreement.service_fee > 0 && (
                <p><strong>Phí dịch vụ:</strong> {formatPrice(agreement.service_fee)}/tháng</p>
              )}
              
              {agreement.building_mgmt_fee > 0 && (
                <p><strong>Phí quản lý:</strong> {formatPrice(agreement.building_mgmt_fee)}/tháng</p>
              )}
              
              {agreement.parking_fee_motorbike > 0 && (
                <p><strong>Phí gửi xe máy:</strong> {formatPrice(agreement.parking_fee_motorbike)}/tháng</p>
              )}
              
              {agreement.parking_fee_car > 0 && (
                <p><strong>Phí gửi xe ô tô:</strong> {formatPrice(agreement.parking_fee_car)}/tháng</p>
              )}
              
              {agreement.internet_fee > 0 && (
                <p><strong>Phí internet:</strong> {formatPrice(agreement.internet_fee)}/tháng</p>
              )}
              
              <p className="mt-3">
                <strong>Chu kỳ thanh toán:</strong> {
                  agreement.payment_cycle === 'MONTHLY' ? 'Hàng tháng' :
                  agreement.payment_cycle === 'QUARTERLY' ? 'Hàng quý' :
                  agreement.payment_cycle === 'YEARLY' ? 'Hàng năm' : agreement.payment_cycle
                }
              </p>
              
              {agreement.billing_day && (
                <p><strong>Ngày chốt hóa đơn:</strong> Ngày {agreement.billing_day} hàng tháng</p>
              )}
              
              {agreement.payment_due_days && (
                <p><strong>Hạn thanh toán:</strong> Trong vòng {agreement.payment_due_days} ngày kể từ ngày chốt</p>
              )}
            </div>
          </div>

          {/* Article 4 - Utilities */}
          <div className="mb-6">
            <h3 className="font-bold mb-3">ĐIỀU 4: ĐIỆN, NƯỚC VÀ CÁC DỊCH VỤ KHÁC</h3>
            <div className="ml-6 space-y-2">
              <p>
                <strong>Tiền điện:</strong> {
                  agreement.electricity_billing === 'METER_PRIVATE' ? 'Theo đồng hồ riêng' :
                  agreement.electricity_billing === 'SHARED' ? 'Chia sẻ theo số người' :
                  agreement.electricity_billing === 'OWNER_RATE' ? `Theo giá chủ nhà: ${formatPrice(agreement.electricity_rate || 0)}/kWh` :
                  agreement.electricity_billing === 'STATE_RATE' ? 'Theo giá nhà nước' :
                  agreement.electricity_billing === 'INCLUDED' ? 'Đã bao gồm trong giá thuê' : 'Chưa xác định'
                }
              </p>
              
              <p>
                <strong>Tiền nước:</strong> {
                  agreement.water_billing === 'METER_PRIVATE' ? 'Theo đồng hồ riêng' :
                  agreement.water_billing === 'SHARED' ? 'Chia sẻ theo số người' :
                  agreement.water_billing === 'OWNER_RATE' ? `Theo giá chủ nhà: ${formatPrice(agreement.water_rate || 0)}/m³` :
                  agreement.water_billing === 'STATE_RATE' ? 'Theo giá nhà nước' :
                  agreement.water_billing === 'INCLUDED' ? 'Đã bao gồm trong giá thuê' : 'Chưa xác định'
                }
              </p>
              
              {agreement.initial_electricity > 0 && (
                <p><strong>Chỉ số điện ban đầu:</strong> {agreement.initial_electricity} kWh</p>
              )}
              
              {agreement.initial_water > 0 && (
                <p><strong>Chỉ số nước ban đầu:</strong> {agreement.initial_water} m³</p>
              )}
            </div>
          </div>

          {/* Article 5 - Rules */}
          {(agreement.house_rules || agreement.allow_pets !== null || agreement.allow_smoking !== null) && (
            <div className="mb-6">
              <h3 className="font-bold mb-3">ĐIỀU 5: NỘI QUY VÀ QUY ĐỊNH</h3>
              <div className="ml-6 space-y-2">
                {agreement.house_rules && (
                  <p className="whitespace-pre-wrap">{agreement.house_rules}</p>
                )}
                
                <div className="mt-3">
                  <p><strong>Thú cưng:</strong> {agreement.allow_pets ? 'Được phép' : 'Không được phép'}</p>
                  <p><strong>Hút thuốc:</strong> {agreement.allow_smoking ? 'Được phép' : 'Không được phép'}</p>
                  <p><strong>Khách qua đêm:</strong> {agreement.allow_guests ? 'Được phép' : 'Không được phép'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Article 6 - Termination */}
          {agreement.termination_clause && (
            <div className="mb-6">
              <h3 className="font-bold mb-3">ĐIỀU 6: CHẤM DỨT HỢP ĐỒNG</h3>
              <div className="ml-6">
                <p className="whitespace-pre-wrap">{agreement.termination_clause}</p>
                {agreement.violation_penalty > 0 && (
                  <p className="mt-2">
                    <strong>Phí phạt vi phạm:</strong> {formatPrice(agreement.violation_penalty)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Article 7 - General */}
          <div className="mb-6">
            <h3 className="font-bold mb-3">ĐIỀU 7: ĐIỀU KHOẢN CHUNG</h3>
            <div className="ml-6 space-y-2">
              <p>- Hai bên cam kết thực hiện đúng các điều khoản đã thỏa thuận trong hợp đồng này.</p>
              <p>- Mọi tranh chấp phát sinh sẽ được giải quyết thông qua thương lượng. Nếu không thỏa thuận được, sẽ đưa ra cơ quan có thẩm quyền giải quyết theo quy định của pháp luật.</p>
              <p>- Hợp đồng này có hiệu lực kể từ ngày ký.</p>
              <p>- Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-12 grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="font-bold mb-16">ĐẠI DIỆN BÊN A</p>
              <p className="italic">(Ký và ghi rõ họ tên)</p>
              <div className="mt-16">
                <p className="font-semibold">{landlord?.name || '[Tên chủ nhà]'}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="font-bold mb-16">ĐẠI DIỆN BÊN B</p>
              <p className="italic">(Ký và ghi rõ họ tên)</p>
              <div className="mt-16">
                <p className="font-semibold">{tenant?.name || '[Tên khách thuê]'}</p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          {agreement.landlord_notes && (
            <div className="mt-8 p-4 bg-gray-50 rounded print:hidden">
              <p className="text-sm text-gray-600"><strong>Ghi chú nội bộ:</strong></p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{agreement.landlord_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          #contract-content {
            box-shadow: none;
            padding: 2cm;
          }
        }
      `}</style>
    </Layout>
  );
}
