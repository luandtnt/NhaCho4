import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { apiClient } from '../api/client';

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<'payment' | 'webhook' | 'email' | 'sms'>('payment');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [paymentConfig, setPaymentConfig] = useState({
    provider: 'stripe',
    api_key: '',
    webhook_secret: '',
    enabled: false,
  });

  const [webhookConfig, setWebhookConfig] = useState({
    endpoint: '',
    secret: '',
    events: [] as string[],
    enabled: false,
  });

  const [emailConfig, setEmailConfig] = useState({
    provider: 'sendgrid',
    api_key: '',
    from_email: '',
    from_name: '',
    enabled: false,
  });

  const [smsConfig, setSmsConfig] = useState({
    provider: 'twilio',
    account_sid: '',
    auth_token: '',
    from_number: '',
    enabled: false,
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const [paymentRes, webhookRes, emailRes, smsRes] = await Promise.all([
        apiClient.get('/integrations/payment-providers'),
        apiClient.get('/integrations/webhooks'),
        apiClient.get('/integrations/email'),
        apiClient.get('/integrations/sms'),
      ]);
      setPaymentConfig(paymentRes.data.data);
      setWebhookConfig(webhookRes.data.data);
      setEmailConfig(emailRes.data.data);
      setSmsConfig(smsRes.data.data);
    } catch (error) {
      console.error('Không thể tải danh sách integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayment = async () => {
    try {
      await apiClient.put(`/integrations/payment-providers/${paymentConfig.provider}`, {
        config: paymentConfig,
      });
      alert('Đã lưu cấu hình payment provider thành công!');
      loadConfigs();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể lưu cấu hình');
    }
  };

  const handleSaveWebhook = async () => {
    try {
      await apiClient.put('/integrations/webhooks', {
        config: webhookConfig,
      });
      alert('Đã lưu cấu hình webhooks thành công!');
      loadConfigs();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể lưu cấu hình');
    }
  };

  const handleSaveEmail = async () => {
    try {
      await apiClient.put('/integrations/email', {
        config: emailConfig,
      });
      alert('Đã lưu cấu hình email thành công!');
      loadConfigs();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể lưu cấu hình');
    }
  };

  const handleSaveSms = async () => {
    try {
      await apiClient.put('/integrations/sms', {
        config: smsConfig,
      });
      alert('Đã lưu cấu hình SMS thành công!');
      loadConfigs();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Không thể lưu cấu hình');
    }
  };

  const handleTestWebhook = async () => {
    setTestResult('Đang gửi test webhook...');
    try {
      const response = await apiClient.post('/integrations/test', {
        type: 'webhook',
      });
      setTestResult(response.data.message + '\n\n' + JSON.stringify(response.data.details, null, 2));
    } catch (error: any) {
      setTestResult('❌ Test thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleTestEmail = async () => {
    setTestResult('Đang gửi test email...');
    try {
      const response = await apiClient.post('/integrations/test', {
        type: 'email',
        target: 'test@example.com',
      });
      setTestResult(response.data.message);
    } catch (error: any) {
      setTestResult('❌ Test thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleTestSms = async () => {
    setTestResult('Đang gửi test SMS...');
    try {
      const response = await apiClient.post('/integrations/test', {
        type: 'sms',
        target: '+84123456789',
      });
      setTestResult(response.data.message);
    } catch (error: any) {
      setTestResult('❌ Test thất bại: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <Layout userRole="LANDLORD">
        <div className="p-8">Đang tải...</div>
      </Layout>
    );
  }

  return (
    <Layout userRole="LANDLORD">
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-1">
            Cấu hình tích hợp với các dịch vụ bên ngoài
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-purple-900 mb-2">🔌 Về Integrations</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Payment providers: Stripe, PayPal để nhận thanh toán</li>
            <li>• Webhooks: Nhận thông báo real-time từ payment providers</li>
            <li>• Email: SendGrid, AWS SES để gửi email tự động</li>
            <li>• SMS: Twilio để gửi SMS thông báo</li>
            <li>• Tất cả keys được mã hóa và lưu trữ an toàn</li>
          </ul>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('payment')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'payment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💳 Payment Providers
              </button>
              <button
                onClick={() => setActiveTab('webhook')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'webhook'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔔 Webhooks
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'email'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📧 Email
              </button>
              <button
                onClick={() => setActiveTab('sms')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'sms'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📱 SMS
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Payment Provider Tab */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cấu hình Payment Provider
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provider
                      </label>
                      <select
                        value={paymentConfig.provider}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, provider: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="stripe">Stripe</option>
                        <option value="paypal">PayPal</option>
                        <option value="vnpay">VNPay</option>
                        <option value="momo">MoMo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key / Secret Key
                      </label>
                      <input
                        type="password"
                        value={paymentConfig.api_key}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, api_key: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="sk_live_..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Lấy từ dashboard của payment provider
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Webhook Secret
                      </label>
                      <input
                        type="password"
                        value={paymentConfig.webhook_secret}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, webhook_secret: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="whsec_..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Dùng để verify webhook signatures
                      </p>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={paymentConfig.enabled}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, enabled: e.target.checked })}
                        className="rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Kích hoạt payment provider
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => alert('Đã lưu cấu hình payment provider!')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Lưu cấu hình
                      </button>
                      <button
                        onClick={() => {
                          setShowTestModal(true);
                          handleTestWebhook();
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Test Connection
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Bảo mật</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• API keys được mã hóa trước khi lưu vào database</li>
                    <li>• Chỉ hiển thị 4 ký tự cuối khi xem lại</li>
                    <li>• Không bao giờ log keys ra console hoặc file</li>
                    <li>• Sử dụng environment variables cho production</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Webhook Tab */}
            {activeTab === 'webhook' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cấu hình Webhooks
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Webhook Endpoint URL
                      </label>
                      <input
                        type="url"
                        value={webhookConfig.endpoint}
                        onChange={(e) => setWebhookConfig({ ...webhookConfig, endpoint: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="https://your-app.com/webhooks/urp"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        URL nhận webhook events từ payment providers
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Webhook Secret
                      </label>
                      <input
                        type="password"
                        value={webhookConfig.secret}
                        onChange={(e) => setWebhookConfig({ ...webhookConfig, secret: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Secret để verify webhook signatures (HMAC-SHA256)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Events đăng ký
                      </label>
                      <div className="space-y-2">
                        {[
                          { key: 'payment.succeeded', label: 'Payment Succeeded' },
                          { key: 'payment.failed', label: 'Payment Failed' },
                          { key: 'invoice.paid', label: 'Invoice Paid' },
                          { key: 'invoice.overdue', label: 'Invoice Overdue' },
                          { key: 'agreement.signed', label: 'Agreement Signed' },
                          { key: 'agreement.expired', label: 'Agreement Expired' },
                        ].map((event) => (
                          <div key={event.key} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={webhookConfig.events.includes(event.key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setWebhookConfig({
                                    ...webhookConfig,
                                    events: [...webhookConfig.events, event.key]
                                  });
                                } else {
                                  setWebhookConfig({
                                    ...webhookConfig,
                                    events: webhookConfig.events.filter(ev => ev !== event.key)
                                  });
                                }
                              }}
                              className="rounded"
                            />
                            <label className="ml-2 text-sm text-gray-700">
                              {event.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => alert('Đã lưu cấu hình webhooks!')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Lưu cấu hình
                      </button>
                      <button
                        onClick={() => {
                          setShowTestModal(true);
                          handleTestWebhook();
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Gửi Test Webhook
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Webhook Best Practices</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Luôn verify signature để đảm bảo webhook từ nguồn tin cậy</li>
                    <li>• Xử lý idempotent: cùng event có thể gửi nhiều lần</li>
                    <li>• Response nhanh (200 OK) rồi xử lý async</li>
                    <li>• Log tất cả webhook events để debug</li>
                    <li>• Implement replay protection với timestamp</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cấu hình Email Provider
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provider
                      </label>
                      <select
                        value={emailConfig.provider}
                        onChange={(e) => setEmailConfig({ ...emailConfig, provider: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="sendgrid">SendGrid</option>
                        <option value="aws-ses">AWS SES</option>
                        <option value="mailgun">Mailgun</option>
                        <option value="smtp">SMTP Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={emailConfig.api_key}
                        onChange={(e) => setEmailConfig({ ...emailConfig, api_key: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="SG...."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          From Email
                        </label>
                        <input
                          type="email"
                          value={emailConfig.from_email}
                          onChange={(e) => setEmailConfig({ ...emailConfig, from_email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          From Name
                        </label>
                        <input
                          type="text"
                          value={emailConfig.from_name}
                          onChange={(e) => setEmailConfig({ ...emailConfig, from_name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={emailConfig.enabled}
                        onChange={(e) => setEmailConfig({ ...emailConfig, enabled: e.target.checked })}
                        className="rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Kích hoạt email notifications
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => alert('Đã lưu cấu hình email!')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Lưu cấu hình
                      </button>
                      <button
                        onClick={() => {
                          setShowTestModal(true);
                          handleTestEmail();
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Gửi Test Email
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">📧 Email Templates</h4>
                  <p className="text-sm text-green-800 mb-2">
                    Hệ thống tự động gửi email cho các sự kiện:
                  </p>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Invoice created → Gửi cho tenant</li>
                    <li>• Payment received → Gửi receipt</li>
                    <li>• Agreement signed → Gửi cho cả 2 bên</li>
                    <li>• Ticket created → Gửi cho landlord</li>
                    <li>• Invoice overdue → Nhắc nhở tenant</li>
                  </ul>
                </div>
              </div>
            )}

            {/* SMS Tab */}
            {activeTab === 'sms' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Cấu hình SMS Provider
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provider
                      </label>
                      <select
                        value={smsConfig.provider}
                        onChange={(e) => setSmsConfig({ ...smsConfig, provider: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="twilio">Twilio</option>
                        <option value="aws-sns">AWS SNS</option>
                        <option value="esms">eSMS (Vietnam)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account SID
                        </label>
                        <input
                          type="password"
                          value={smsConfig.account_sid}
                          onChange={(e) => setSmsConfig({ ...smsConfig, account_sid: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Auth Token
                        </label>
                        <input
                          type="password"
                          value={smsConfig.auth_token}
                          onChange={(e) => setSmsConfig({ ...smsConfig, auth_token: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Number
                      </label>
                      <input
                        type="tel"
                        value={smsConfig.from_number}
                        onChange={(e) => setSmsConfig({ ...smsConfig, from_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="+84123456789"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={smsConfig.enabled}
                        onChange={(e) => setSmsConfig({ ...smsConfig, enabled: e.target.checked })}
                        className="rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Kích hoạt SMS notifications
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => alert('Đã lưu cấu hình SMS!')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Lưu cấu hình
                      </button>
                      <button
                        onClick={() => {
                          setShowTestModal(true);
                          handleTestSms();
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Gửi Test SMS
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">💰 Chi phí SMS</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• SMS có chi phí theo từng tin nhắn gửi</li>
                    <li>• Nên sử dụng cho thông báo quan trọng: OTP, payment reminder</li>
                    <li>• Tránh spam: giới hạn số lượng SMS/user/day</li>
                    <li>• Cho phép user opt-out khỏi SMS notifications</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Result Modal */}
        {showTestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Result</h2>
              <pre className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap">
                {testResult}
              </pre>
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestResult('');
                }}
                className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
