/**
 * Property Data Generator
 * Generates realistic property data with all enhanced fields
 */

import { PriceUnit, Direction, FurnishingLevel, UtilityBilling } from '@prisma/client';
import { PropertyMetadata } from '../../src/modules/ops/rentable-item/interfaces/property-metadata.interface';

// Vietnam provinces
const PROVINCES = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Đà Lạt', 'Phú Quốc'];
const DISTRICTS_HCM = ['Quận 1', 'Quận 2', 'Quận 7', 'Bình Thạnh', 'Thủ Đức'];
const WARDS_HCM = ['Phường Bến Nghé', 'Phường Thảo Điền', 'Phường Tân Phú', 'Phường 25'];

// Amenities by category
const BASIC_AMENITIES = ['WIFI', 'AC', 'WATER_HEATER'];
const KITCHEN_AMENITIES = ['KITCHEN', 'FRIDGE', 'MICROWAVE'];
const COMFORT_AMENITIES = ['WASHER', 'TV', 'BALCONY'];
const BUILDING_AMENITIES = ['ELEVATOR', 'PARKING', 'SECURITY_24_7', 'GYM', 'POOL'];

export interface PropertyDataConfig {
  propertyCategory: string;
  rentalDurationType: string;
  assetName: string;
  baseAddress: string;
  priceRange: [number, number];
  areaRange: [number, number];
  bedroomsRange?: [number, number];
  bathroomsRange?: [number, number];
}

export function generateLocation(baseAddress: string) {
  return {
    address_full: baseAddress,
    province: 'TP. Hồ Chí Minh',
    district: DISTRICTS_HCM[Math.floor(Math.random() * DISTRICTS_HCM.length)],
    ward: WARDS_HCM[Math.floor(Math.random() * WARDS_HCM.length)],
    geo_lat: 10.7 + Math.random() * 0.2,
    geo_lng: 106.6 + Math.random() * 0.2,
  };
}

export function generatePricing(
  priceRange: [number, number],
  priceUnit: PriceUnit,
  leaseGroup: 'SHORT' | 'MID' | 'LONG'
) {
  const basePrice = priceRange[0] + Math.random() * (priceRange[1] - priceRange[0]);
  
  const pricing: any = {
    base_price: Math.round(basePrice),
    price_unit: priceUnit,
    currency: 'VND',
    min_rent_duration: priceUnit === 'HOUR' ? 3 : priceUnit === 'NIGHT' ? 1 : 1,
  };

  if (leaseGroup === 'SHORT') {
    pricing.booking_hold_deposit = Math.round(basePrice * 0.3);
  } else {
    pricing.deposit_amount = Math.round(basePrice * 2);
    pricing.electricity_billing = 'METER_PRIVATE' as UtilityBilling;
    pricing.water_billing = 'METER_PRIVATE' as UtilityBilling;
  }

  pricing.service_fee = Math.round(basePrice * 0.05);
  
  return pricing;
}

export function generatePhysicalDetails(
  areaRange: [number, number],
  bedroomsRange?: [number, number],
  bathroomsRange?: [number, number],
  propertyCategory?: string
) {
  const area = areaRange[0] + Math.random() * (areaRange[1] - areaRange[0]);
  
  const details: any = {
    area_sqm: Math.round(area * 10) / 10,
    furnishing_level: ['FULL', 'PARTIAL', 'NONE'][Math.floor(Math.random() * 3)] as FurnishingLevel,
  };

  if (bedroomsRange) {
    details.bedrooms = bedroomsRange[0] + Math.floor(Math.random() * (bedroomsRange[1] - bedroomsRange[0] + 1));
  }

  if (bathroomsRange) {
    details.bathrooms = bathroomsRange[0] + Math.floor(Math.random() * (bathroomsRange[1] - bathroomsRange[0] + 1));
  }

  // Add apartment-specific fields
  if (propertyCategory?.includes('APARTMENT') || propertyCategory?.includes('SERVICED')) {
    details.apartment_floor = 10 + Math.floor(Math.random() * 20);
    details.direction = ['EAST', 'WEST', 'SOUTH', 'NORTH'][Math.floor(Math.random() * 4)] as Direction;
    details.balcony = Math.random() > 0.3;
    details.building_mgmt_fee = Math.round(area * 15000);
  }

  // Add house-specific fields
  if (propertyCategory?.includes('HOUSE') || propertyCategory?.includes('VILLA')) {
    details.floors = 2 + Math.floor(Math.random() * 3);
    details.parking_slots = 1 + Math.floor(Math.random() * 3);
  }

  // Add commercial-specific fields
  if (propertyCategory?.includes('SHOP') || propertyCategory?.includes('COMMERCIAL')) {
    details.frontage_m = 4 + Math.random() * 8;
  }

  return details;
}

export function generateAmenities(propertyCategory: string): string[] {
  const amenities = [...BASIC_AMENITIES];
  
  if (Math.random() > 0.3) {
    amenities.push(...KITCHEN_AMENITIES);
  }
  
  if (Math.random() > 0.5) {
    amenities.push(...COMFORT_AMENITIES);
  }

  if (propertyCategory.includes('APARTMENT') || propertyCategory.includes('HOTEL')) {
    amenities.push(...BUILDING_AMENITIES.slice(0, 3));
  }

  return [...new Set(amenities)];
}

export function generateShortTermBooking() {
  return {
    checkin_time: '14:00',
    checkout_time: '12:00',
    max_occupancy: 2 + Math.floor(Math.random() * 4),
  };
}

export function generateShortTermMetadata(propertyCategory: string): PropertyMetadata {
  const metadata: PropertyMetadata = {
    version: 1,
    property_type: propertyCategory,
    lease_group: 'SHORT',
    details: {
      cancellation_policy: ['FLEXIBLE', 'MODERATE', 'STRICT'][Math.floor(Math.random() * 3)] as any,
      cancellation_fee_percent: Math.random() > 0.5 ? 20 : 50,
      allow_pets: Math.random() > 0.7,
      allow_smoking: Math.random() > 0.8,
      quiet_hours: '22:00-06:00',
    }
  };

  if (propertyCategory === 'HOTEL' || propertyCategory.includes('SERVICED')) {
    metadata.details = {
      ...metadata.details,
      housekeeping_frequency: 'DAILY' as any,
      laundry_service: true,
      premium_services: ['BREAKFAST', 'POOL'],
    };
  }

  if (propertyCategory === 'VILLA_RESORT') {
    metadata.details = {
      ...metadata.details,
      private_pool: true,
      bbq_area: true,
      garden_area_m2: 100 + Math.random() * 200,
    };
  }

  if (propertyCategory === 'COLIVING_SHORT') {
    metadata.details = {
      ...metadata.details,
      dorm_beds: 4 + Math.floor(Math.random() * 4),
      shared_areas: ['SHARED_KITCHEN', 'WORKSPACE', 'LIVING_ROOM'],
      gender_policy: 'MIXED' as any,
      membership_fee: 500000,
    };
  }

  return metadata;
}

export function generateMidTermMetadata(propertyCategory: string): PropertyMetadata {
  const metadata: PropertyMetadata = {
    version: 1,
    property_type: propertyCategory,
    lease_group: 'MID',
    details: {
      internet_fee: 200000,
      parking_fee_motorbike: 100000,
      parking_fee_car: 1000000,
      allow_pets: Math.random() > 0.6,
      allow_smoking: Math.random() > 0.7,
      allow_guests_overnight: Math.random() > 0.5,
    }
  };

  if (propertyCategory.includes('WAREHOUSE')) {
    metadata.details = {
      ...metadata.details,
      warehouse_area_m2: 200 + Math.random() * 500,
      ceiling_height_m: 4 + Math.random() * 4,
      truck_access: true,
      allowed_goods: 'Hàng tiêu dùng, điện tử, may mặc',
    };
  }

  if (propertyCategory.includes('RETAIL') || propertyCategory.includes('SHOP')) {
    metadata.details = {
      ...metadata.details,
      business_purpose: 'SHOP',
      foot_traffic_per_day: 500 + Math.floor(Math.random() * 2000),
    };
  }

  return metadata;
}

export function generateLongTermMetadata(propertyCategory: string): PropertyMetadata {
  const metadata: PropertyMetadata = {
    version: 1,
    property_type: propertyCategory,
    lease_group: 'LONG',
    details: {
      yearly_increase_percent: 5 + Math.random() * 5,
      internet_fee: 300000,
      parking_fee_car: 1500000,
      allow_pets: Math.random() > 0.5,
      allow_smoking: Math.random() > 0.6,
    }
  };

  if (propertyCategory === 'OFFICE') {
    metadata.details = {
      ...metadata.details,
      business_purpose: 'OFFICE',
      allow_business_registration: true,
      operating_hours: '08:00-18:00',
      fire_safety_compliance: true,
    };
  }

  if (propertyCategory === 'FACTORY') {
    metadata.details = {
      ...metadata.details,
      warehouse_area_m2: 500 + Math.random() * 1500,
      ceiling_height_m: 6 + Math.random() * 4,
      truck_access: true,
      power_capacity_kw: 100 + Math.random() * 400,
      three_phase_power: true,
      fire_safety_compliance: true,
      environment_fee: 2000000,
    };
  }

  if (propertyCategory === 'LAND_PLOT') {
    metadata.legal_documents = {
      land_use_certificate: 'https://example.com/land-cert.pdf',
    };
  }

  if (propertyCategory === 'SHOPHOUSE') {
    metadata.details = {
      ...metadata.details,
      business_purpose: 'RETAIL',
      allow_business_registration: true,
      tax_estimate_per_year: 10000000 + Math.random() * 20000000,
    };
  }

  return metadata;
}
