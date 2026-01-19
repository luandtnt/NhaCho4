import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Layout from '../components/Layout';

// Import all detail components
import ListingHeader from '../components/listing-detail/ListingHeader';
import ImageGallery from '../components/listing-detail/ImageGallery';
import KeyFacts from '../components/listing-detail/KeyFacts';
import PricingSection from '../components/listing-detail/PricingSection';
import CTASection from '../components/listing-detail/CTASection';
import DescriptionSection from '../components/listing-detail/DescriptionSection';
import AmenitiesSection from '../components/listing-detail/AmenitiesSection';
import HouseRulesSection from '../components/listing-detail/HouseRulesSection';
import SpecialFeatures from '../components/listing-detail/SpecialFeatures';
import LocationSection from '../components/listing-detail/LocationSection';
import OwnerInfoSection from '../components/listing-detail/OwnerInfoSection';
import RelatedListings from '../components/listing-detail/RelatedListings';

interface Listing {
  id: string;
  title: string;
  description: string;
  media: any[];
  tags: string[];
  pricing_display: any;
  rentable_items: any[];
  organization: any;
}

export default function ListingDetailPageEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [relatedListings, setRelatedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (!listing) {
    return (
      <Layout userRole="TENANT">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🏠</div>
            <p className="text-xl text-gray-600">Không tìm thấy bất động sản</p>
          </div>
        </div>
      </Layout>
    );
  }

  const rentableItem = listing.rentable_items?.[0]?.rentable_item;
  if (!rentableItem) {
    return (
      <Layout userRole="TENANT">
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">Không có thông tin bất động sản</p>
        </div>
      </Layout>
    );
  }

  const metadata = rentableItem.metadata?.details || {};
  const images = listing.media?.filter((m: any) => m.type === 'image').map((m: any) => ({
    url: m.url,
    alt: m.alt || listing.title
  })) || [];

  return (
    <Layout userRole="TENANT">
      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <div className="bg-white border-b">
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

        {/* Header */}
        <ListingHeader
          title={listing.title}
          address={{
            ward: rentableItem.ward,
            district: rentableItem.district,
            province: rentableItem.province
          }}
          tags={listing.tags}
          onSave={() => alert('Tính năng lưu tin đang phát triển')}
          onShare={() => {
            if (navigator.share) {
              navigator.share({
                title: listing.title,
                url: window.location.href
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('Đã sao chép link!');
            }
          }}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <ImageGallery images={images} title={listing.title} />

              {/* Key Facts */}
              <KeyFacts
                area_sqm={rentableItem.area_sqm}
                bedrooms={rentableItem.bedrooms}
                bathrooms={rentableItem.bathrooms}
                max_occupancy={rentableItem.max_occupancy}
                property_category={rentableItem.property_category}
                property_type_label={rentableItem.property_category}
                rental_duration_type={rentableItem.rental_duration_type}
              />

              {/* Description */}
              <DescriptionSection
                description={listing.description}
              />

              {/* Special Features */}
              <SpecialFeatures
                property_category={rentableItem.property_category}
                metadata={metadata}
                {...rentableItem}
              />

              {/* Amenities */}
              {rentableItem.amenities && rentableItem.amenities.length > 0 && (
                <AmenitiesSection
                  amenities={rentableItem.amenities}
                  building_amenities={metadata.building_amenities}
                />
              )}

              {/* House Rules */}
              <HouseRulesSection
                allow_pets={metadata.allow_pets}
                allow_smoking={metadata.allow_smoking}
                allow_guests_overnight={metadata.allow_guests_overnight}
                quiet_hours={metadata.quiet_hours}
                house_rules_text={rentableItem.house_rules_text}
                cancellation_policy={metadata.cancellation_policy}
                cancellation_fee_percent={metadata.cancellation_fee_percent}
                checkin_time={rentableItem.checkin_time}
                checkout_time={rentableItem.checkout_time}
                rental_duration_type={rentableItem.rental_duration_type}
              />

              {/* Location */}
              <LocationSection
                address_full={rentableItem.address_full}
                province={rentableItem.province}
                district={rentableItem.district}
                ward={rentableItem.ward}
                geo_lat={rentableItem.geo_lat}
                geo_lng={rentableItem.geo_lng}
              />

              {/* Owner Info */}
              <OwnerInfoSection
                owner_name={listing.organization.name}
                is_verified={true}
                onSendInquiry={() => alert('Tính năng gửi yêu cầu đang phát triển')}
                onMessage={() => alert('Tính năng nhắn tin đang phát triển')}
                onCall={() => alert('Tính năng gọi điện đang phát triển')}
              />
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Pricing */}
              <PricingSection
                base_price={rentableItem.base_price}
                price_unit={rentableItem.price_unit}
                deposit_amount={rentableItem.deposit_amount}
                booking_hold_deposit={metadata.booking_hold_deposit}
                service_fee={rentableItem.service_fee}
                building_management_fee={rentableItem.building_management_fee}
                electricity_billing={rentableItem.electricity_billing}
                water_billing={rentableItem.water_billing}
                internet_fee={metadata.internet_fee}
                extra_guest_fee={metadata.extra_guest_fee}
                weekend_surcharge={metadata.weekend_surcharge}
                cleaning_fee={metadata.cleaning_fee}
                yearly_increase_percent={metadata.yearly_increase_percent}
                rental_duration_type={rentableItem.rental_duration_type}
              />

              {/* CTA */}
              <CTASection
                rental_duration_type={rentableItem.rental_duration_type}
                instant_booking={rentableItem.instant_booking}
                rentableItemId={rentableItem.id}
                onBookNow={(data) => alert('Tính năng đặt phòng đang phát triển')}
                onSendInquiry={() => alert('Tính năng gửi yêu cầu đang phát triển')}
                onScheduleViewing={() => alert('Tính năng đặt lịch xem đang phát triển')}
                onContact={() => alert('Tính năng liên hệ đang phát triển')}
              />
            </div>
          </div>
        </div>

        {/* Related Listings */}
        <RelatedListings listings={relatedListings} />
      </div>
    </Layout>
  );
}
