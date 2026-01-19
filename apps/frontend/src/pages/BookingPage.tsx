import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import BookingDateSelector from '../components/booking/BookingDateSelector';
import BookingGuestSelector from '../components/booking/BookingGuestSelector';
import BookingPriceBreakdown from '../components/booking/BookingPriceBreakdown';
import BookingContactForm from '../components/booking/BookingContactForm';
import BookingPolicies from '../components/booking/BookingPolicies';
import BookingSummaryCard from '../components/booking/BookingSummaryCard';
import AvailabilityCalendar from '../components/booking/AvailabilityCalendar';

interface RentableItem {
  id: string;
  code: string;
  property_category: string;
  base_price: number;
  price_unit: string;
  max_occupancy: number;
  instant_booking: boolean;
  checkin_time?: string;
  checkout_time?: string;
  min_rent_duration?: number;
  house_rules_text?: string;
  metadata?: any;
  area_sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  address_full?: string;
  province?: string;
  district?: string;
  ward?: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  media: any[];
  rentable_items: any[];
}

export default function BookingPage() {
  const { listingId, rentableItemId } = useParams();
  const navigate = useNavigate();

  // Data states
  const [listing, setListing] = useState<Listing | null>(null);
  const [rentableItem, setRentableItem] = useState<RentableItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Booking form states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);

  // Contact form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Policies
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [cancellationAccepted, setCancellationAccepted] = useState(false);

  // Price calculation
  const [priceData, setPriceData] = useState<any>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Availability
  const [availability, setAvailability] = useState<any>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Booking submission
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [listingId, rentableItemId]);

  useEffect(() => {
    if (startDate && endDate && rentableItem) {
      checkAvailability();
      calculatePrice();
    }
  }, [startDate, endDate, guests]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch listing
      const listingRes = await fetch(`http://localhost:3000/api/v1/marketplace/listings/${listingId}`);
      if (!listingRes.ok) throw new Error('Không tìm thấy tin đăng');
      const listingData = await listingRes.json();
      setListing(listingData);

      // Find rentable item
      const item = listingData.rentable_items?.find(
        (ri: any) => ri.rentable_item.id === rentableItemId
      )?.rentable_item;
      
      if (!item) throw new Error('Không tìm thấy bất động sản');
      setRentableItem(item);

    } catch (error: any) {
      console.error('Lỗi:', error);
      alert(error.message || 'Có lỗi xảy ra');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!startDate || !endDate || !rentableItem) return;

    try {
      setCheckingAvailability(true);
      const response = await fetch('http://localhost:3000/api/v1/bookings/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentable_item_id: rentableItem.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          quantity: 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error('Lỗi kiểm tra tình trạng:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const calculatePrice = async () => {
    if (!startDate || !endDate || !rentableItem) return;

    try {
      setLoadingPrice(true);
      const response = await fetch('http://localhost:3000/api/v1/bookings/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentable_item_id: rentableItem.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          guests: {
            adults: guests,
            children: 0,
            infants: 0,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPriceData(data);
      }
    } catch (error) {
      console.error('Lỗi tính giá:', error);
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleSubmitBooking = async () => {
    // Validation
    if (!startDate || !endDate) {
      alert('Vui lòng chọn ngày nhận và trả phòng');
      return;
    }

    if (!fullName || !phone) {
      alert('Vui lòng điền đầy đủ thông tin liên hệ');
      return;
    }

    if (!policiesAccepted || !cancellationAccepted) {
      alert('Vui lòng đồng ý với chính sách và nội quy');
      return;
    }

    if (availability && !availability.available) {
      alert('Phòng không còn trống trong thời gian này');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        alert('Vui lòng đăng nhập để đặt phòng');
        navigate('/login');
        return;
      }
      
      const requestBody = {
        rentable_item_id: rentableItem!.id,
        listing_id: listingId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        guests: {
          adults: guests,
          children: 0,
          infants: 0,
        },
        contact: {
          full_name: fullName,
          phone,
          email: email || undefined,
          special_requests: specialRequests || undefined,
        },
        pricing: {
          total: priceData?.total || 0,
          breakdown: priceData ? {
            base_price: priceData.base_price,
            nights: priceData.nights,
            subtotal: priceData.subtotal,
            fees: priceData.fees || {},
            discounts: priceData.discounts || {},
          } : {},
        },
        policies_accepted: true,
      };
      
      console.log('Booking request:', requestBody);
      
      const response = await fetch('http://localhost:3000/api/v1/bookings/create-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
        localStorage.removeItem('access_token');
        navigate('/login');
        return;
      }

      if (response.ok) {
        const booking = await response.json();
        alert(`✅ Đặt phòng thành công!\n\nMã đặt chỗ: ${booking.booking_code}\nTrạng thái: ${booking.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Chờ xác nhận'}`);
        navigate('/my-bookings');
      } else {
        const error = await response.json();
        console.error('Booking error:', error);
        
        // Show detailed error message
        let errorMessage = 'Không thể đặt phòng';
        if (error.message) {
          errorMessage = error.message;
        } else if (Array.isArray(error.message)) {
          errorMessage = error.message.join(', ');
        } else if (error.error) {
          errorMessage = error.error;
        }
        
        alert(`❌ Lỗi: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Lỗi đặt phòng:', error);
      alert('Có lỗi xảy ra khi đặt phòng');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout userRole="TENANT">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing || !rentableItem) {
    return (
      <Layout userRole="TENANT">
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Không tìm thấy thông tin</p>
        </div>
      </Layout>
    );
  }

  const metadata = rentableItem.metadata?.details || {};
  const mainImage = listing.media?.find((m: any) => m.type === 'image')?.url;

  return (
    <Layout userRole="TENANT">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Quay lại</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Booking Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Đặt phòng
                </h1>
                <p className="text-gray-600">{listing.title}</p>
              </div>

              {/* Date Selection */}
              <BookingDateSelector
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                checkinTime={rentableItem.checkin_time}
                checkoutTime={rentableItem.checkout_time}
                minRentDuration={rentableItem.min_rent_duration}
                rentalDurationType={rentableItem.property_category}
                availability={availability}
                checkingAvailability={checkingAvailability}
              />

              {/* Availability Calendar */}
              <AvailabilityCalendar rentableItemId={rentableItem.id} />

              {/* Guest Selection */}
              <BookingGuestSelector
                guests={guests}
                onGuestsChange={setGuests}
                maxOccupancy={rentableItem.max_occupancy}
              />

              {/* Price Breakdown */}
              {priceData && (
                <BookingPriceBreakdown
                  priceData={priceData}
                  loading={loadingPrice}
                />
              )}

              {/* Contact Form */}
              <BookingContactForm
                fullName={fullName}
                phone={phone}
                email={email}
                specialRequests={specialRequests}
                onFullNameChange={setFullName}
                onPhoneChange={setPhone}
                onEmailChange={setEmail}
                onSpecialRequestsChange={setSpecialRequests}
              />

              {/* Policies */}
              <BookingPolicies
                houseRules={rentableItem.house_rules_text}
                cancellationPolicy={metadata.cancellation_policy}
                allowPets={metadata.allow_pets}
                allowSmoking={metadata.allow_smoking}
                quietHours={metadata.quiet_hours}
                policiesAccepted={policiesAccepted}
                cancellationAccepted={cancellationAccepted}
                onPoliciesAcceptedChange={setPoliciesAccepted}
                onCancellationAcceptedChange={setCancellationAccepted}
              />

              {/* Submit Button */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <button
                  onClick={handleSubmitBooking}
                  disabled={submitting || !availability?.available || !policiesAccepted || !cancellationAccepted}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : rentableItem.instant_booking ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Đặt ngay</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Gửi yêu cầu đặt phòng</span>
                    </>
                  )}
                </button>
                
                {rentableItem.instant_booking && (
                  <p className="text-sm text-gray-600 text-center mt-3">
                    ⚡ Đặt phòng tức thì - Xác nhận ngay lập tức
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <BookingSummaryCard
                  listing={listing}
                  rentableItem={rentableItem}
                  mainImage={mainImage}
                  startDate={startDate}
                  endDate={endDate}
                  guests={guests}
                  priceData={priceData}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
