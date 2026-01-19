import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Home, ChevronLeft, ChevronRight, X 
} from 'lucide-react';
import ResidentialPropertyDetail from '../components/property-details/ResidentialPropertyDetail';
import ShortTermPropertyDetail from '../components/property-details/ShortTermPropertyDetail';
import CommercialPropertyDetail from '../components/property-details/CommercialPropertyDetail';
import WarehousePropertyDetail from '../components/property-details/WarehousePropertyDetail';
import LandPropertyDetail from '../components/property-details/LandPropertyDetail';

interface Listing {
  id: string;
  title: string;
  description: string;
  media: any[];
  tags: string[];
  pricing_display: {
    from_amount: number;
    currency: string;
    unit: string;
  };
  rentable_items: any[];
  organization: {
    id: string;
    name: string;
  };
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [relatedListings, setRelatedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    move_in_date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchListingDetail();
    fetchRelatedListings();
  }, [id]);

  const fetchListingDetail = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/marketplace/listings/${id}`);
      if (response.ok) {
        const data = await response.json();
        setListing(data);
      } else {
        navigate('/discover');
      }
    } catch (error) {
      console.error('Lỗi khi tải tin đăng:', error);
      navigate('/discover');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedListings = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/marketplace/listings/${id}/related?limit=6`);
      if (response.ok) {
        const data = await response.json();
        setRelatedListings(data.data || []);
      }
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm liên quan:', error);
    }
  };

  const handleBookingRequest = async (bookingData: any) => {
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/api/v1/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentable_item_id: bookingData.rentableItemId,
          start_at: new Date(bookingData.checkIn).toISOString(),
          end_at: new Date(bookingData.checkOut).toISOString(),
          quantity: bookingData.guests || 1,
          metadata: {
            listing_id: bookingData.listingId,
            nights: bookingData.nights,
            total_price: bookingData.totalPrice,
          },
        }),
      });

      if (response.ok) {
        alert('✅ Đặt phòng thành công! Vui lòng kiểm tra email để xác nhận.');
        navigate('/tenant/bookings');
      } else {
        const error = await response.json();
        alert(`❌ Có lỗi xảy ra: ${error.message || 'Vui lòng thử lại'}`);
      }
    } catch (error) {
      console.error('Lỗi khi đặt phòng:', error);
      alert('❌ Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:3000/api/v1/leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: id,
          name: inquiryForm.name,
          email: inquiryForm.email,
          phone: inquiryForm.phone,
          message: inquiryForm.message,
          metadata: {
            move_in_date: inquiryForm.move_in_date,
          },
        }),
      });

      if (response.ok) {
        alert('Gửi yêu cầu thành công! Chúng tôi sẽ liên hệ với bạn sớm.');
        setShowInquiryForm(false);
        setInquiryForm({ name: '', email: '', phone: '', message: '', move_in_date: '' });
      } else {
        const error = await response.json();
        alert(`Có lỗi xảy ra: ${error.message || 'Vui lòng thử lại'}`);
      }
    } catch (error) {
      console.error('Lỗi khi gửi yêu cầu:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const getImages = () => {
    return listing?.media?.filter(m => m.type === 'image') || [];
  };

  const nextImage = () => {
    const images = getImages();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = getImages();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatPrice = (pricing: any) => {
    if (!pricing || !pricing.from_amount) return 'Liên hệ';
    return `${pricing.from_amount.toLocaleString('vi-VN')} ${pricing.currency || 'VND'}/${pricing.unit || 'tháng'}`;
  };

  if (loading) {
    return (
      <Layout userRole="TENANT">
        <div className="p-8 text-center">Đang tải...</div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout userRole="TENANT">
        <div className="p-8 text-center">Không tìm thấy bất động sản</div>
      </Layout>
    );
  }

  const images = getImages();

  return (
    <Layout userRole="TENANT">
      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
              Quay lại
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {images.length > 0 ? (
                  <div className="relative">
                    <img
                      src={images[currentImageIndex]?.url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect width="800" height="600" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'}
                      alt={listing.title}
                      className="w-full h-96 object-cover cursor-pointer"
                      onClick={() => setShowImageModal(true)}
                    />
                    
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow hover:bg-white"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow hover:bg-white"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="h-96 bg-gray-200 flex items-center justify-center">
                    <Home className="w-16 h-16 text-gray-400" />
                  </div>
                )}

                {/* Thumbnail Grid */}
                {images.length > 1 && (
                  <div className="p-4 grid grid-cols-6 gap-2">
                    {images.slice(0, 6).map((img: any, idx: number) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={`Thumbnail ${idx + 1}`}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-16 w-full object-cover rounded cursor-pointer ${
                          idx === currentImageIndex ? 'ring-2 ring-blue-600' : ''
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{listing.title}</h1>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPrice(listing.pricing_display)}
                  </div>
                </div>

                {listing.tags && listing.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-6">
                    {listing.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Mô tả</h2>
                  <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
                </div>

                {listing.rentable_items && listing.rentable_items.length > 0 && (
                  <div className="border-t pt-6 mt-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Thông tin chi tiết
                    </h2>
                    {listing.rentable_items.map((item: any, idx: number) => {
                      const rentableItem = item.rentable_item;
                      if (!rentableItem) return null;

                      const category = rentableItem.property_category;
                      
                      // Determine which detail component to use
                      const isShortTerm = ['HOMESTAY', 'GUESTHOUSE', 'HOTEL', 'VILLA_RESORT', 'AIRBNB_ROOM', 'COLIVING_SHORT', 'SERVICED_APARTMENT_SHORT'].includes(category);
                      const isResidential = ['APARTMENT', 'PRIVATE_HOUSE', 'VILLA', 'LUXURY_APARTMENT', 'WHOLE_HOUSE', 'SERVICED_APARTMENT_MEDIUM', 'ROOM_RENTAL'].includes(category);
                      const isCommercial = ['OFFICE', 'COMMERCIAL_SPACE', 'RETAIL_SPACE_SMALL', 'SHOPHOUSE'].includes(category);
                      const isWarehouse = ['WAREHOUSE', 'WAREHOUSE_TEMP'].includes(category);
                      const isLand = category === 'LAND';

                      return (
                        <div key={idx}>
                          {isShortTerm && <ShortTermPropertyDetail rentableItem={rentableItem} listingId={listing.id} onBookingRequest={handleBookingRequest} />}
                          {isResidential && <ResidentialPropertyDetail rentableItem={rentableItem} />}
                          {isCommercial && <CommercialPropertyDetail rentableItem={rentableItem} />}
                          {isWarehouse && <WarehousePropertyDetail rentableItem={rentableItem} />}
                          {isLand && <LandPropertyDetail rentableItem={rentableItem} />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Liên hệ với chủ nhà
                </h3>
                
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900">{listing.organization.name}</div>
                </div>

                <button
                  onClick={() => setShowInquiryForm(true)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Gửi yêu cầu xem nhà
                </button>

                <div className="mt-4 text-sm text-gray-600 text-center">
                  Chúng tôi sẽ liên hệ với bạn trong vòng 24h
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Modal */}
        {showImageModal && images.length > 0 && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img
              src={images[currentImageIndex]?.url}
              alt={listing.title}
              className="max-h-full max-w-full object-contain"
            />
            
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 p-3 rounded-full hover:bg-white/30"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 p-3 rounded-full hover:bg-white/30"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Inquiry Form Modal */}
        {showInquiryForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Gửi yêu cầu xem nhà</h3>
                <button
                  onClick={() => setShowInquiryForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitInquiry} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="0912345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày dự kiến chuyển vào
                  </label>
                  <input
                    type="date"
                    value={inquiryForm.move_in_date}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, move_in_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lời nhắn
                  </label>
                  <textarea
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Tôi quan tâm đến bất động sản này..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInquiryForm(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Related Listings */}
        {relatedListings.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 py-12 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🏠 Sản phẩm liên quan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedListings.map((relatedListing) => (
                <div
                  key={relatedListing.id}
                  onClick={() => {
                    navigate(`/listings/${relatedListing.id}`);
                    window.scrollTo(0, 0);
                  }}
                  className="bg-white rounded-lg shadow hover:shadow-xl transition cursor-pointer overflow-hidden group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={
                        relatedListing.media?.find((m: any) => m.type === 'image')?.url ||
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'
                      }
                      alt={relatedListing.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {relatedListing.rentable_items?.[0]?.rentable_item?.instant_booking && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        ⚡ Đặt ngay
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                      {relatedListing.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {relatedListing.description}
                    </p>

                    {relatedListing.rentable_items?.[0]?.rentable_item && (
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                        {relatedListing.rentable_items[0].rentable_item.area_sqm && (
                          <div className="flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            <span>{relatedListing.rentable_items[0].rentable_item.area_sqm}m²</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-blue-600 font-bold text-lg">
                      {relatedListing.pricing_display?.from_amount
                        ? `${relatedListing.pricing_display.from_amount.toLocaleString('vi-VN')} ${relatedListing.pricing_display.currency || 'VND'}/${relatedListing.pricing_display.unit || 'tháng'}`
                        : 'Liên hệ'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
