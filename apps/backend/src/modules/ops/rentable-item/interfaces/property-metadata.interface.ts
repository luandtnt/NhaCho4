/**
 * Property Metadata Interfaces
 * Version: 1.0
 * 
 * Structured metadata for different property types
 * All metadata must include version, property_type, and lease_group
 */

// ============================================================================
// Base Metadata Structure
// ============================================================================

export interface PropertyMetadata {
  version: number;                    // Schema version (currently 1)
  property_type: string;              // Property category code
  lease_group: 'SHORT' | 'MID' | 'LONG';
  details: ShortTermDetails | MidTermDetails | LongTermDetails;
  legal_documents?: LegalDocuments;
  custom_fields?: Record<string, any>;
}

// ============================================================================
// Legal Documents
// ============================================================================

export interface LegalDocuments {
  hotel_business_license?: string;      // REQUIRED for HOTEL
  short_stay_license?: string;
  warehouse_license?: string;
  industrial_license?: string;
  land_use_certificate?: string;        // REQUIRED for LAND_PLOT
  commercial_license?: string;
}

// ============================================================================
// SHORT_TERM Details
// ============================================================================

export interface ShortTermDetails {
  // Pricing extras
  extra_guest_fee?: number;             // VND per person
  weekend_surcharge?: number;           // VND
  cleaning_fee?: number;                // VND
  
  // Cancellation
  cancellation_policy?: 'FLEXIBLE' | 'MODERATE' | 'STRICT';
  cancellation_fee_percent?: number;    // 0-100
  
  // House rules
  allow_pets?: boolean;
  allow_smoking?: boolean;
  quiet_hours?: string;                 // "22:00-06:00"
  house_rules_text?: string;
  
  // Service-based (HOTEL, SERVICED_APT_SHORT)
  housekeeping_frequency?: 'DAILY' | 'WEEKLY' | 'ON_REQUEST';
  laundry_service?: boolean;
  premium_services?: string[];          // ['BREAKFAST', 'SPA', 'POOL']
  
  // Co-living specific (COLIVING_SHORT)
  dorm_beds?: number;
  shared_areas?: string[];              // ['SHARED_KITCHEN', 'WORKSPACE']
  gender_policy?: 'MALE' | 'FEMALE' | 'MIXED';
  membership_fee?: number;
  community_events?: string;
  
  // Villa/Luxury
  private_pool?: boolean;
  bbq_area?: boolean;
  garden_area_m2?: number;
  
  // Building amenities (for apartments/hotels)
  building_amenities?: string[];        // ['GYM', 'POOL', 'SECURITY_24_7']
}

// ============================================================================
// MID_TERM Details
// ============================================================================

export interface MidTermDetails {
  // Utilities & Fees
  internet_fee?: number;                // VND/month
  parking_fee_motorbike?: number;       // VND/month
  parking_fee_car?: number;             // VND/month
  
  // House rules
  allow_pets?: boolean;
  allow_smoking?: boolean;
  allow_guests_overnight?: boolean;
  house_rules_text?: string;
  
  // Physical extras
  garden_area_m2?: number;
  
  // Building amenities (apartments)
  building_amenities?: string[];
  
  // Business (SMALL_SHOP, TEMP_WAREHOUSE)
  business_purpose?: string;            // SHOP, RESTAURANT, OFFICE
  foot_traffic_per_day?: number;
  allowed_goods?: string;               // for TEMP_WAREHOUSE
  
  // Warehouse specific
  warehouse_area_m2?: number;
  ceiling_height_m?: number;
  truck_access?: boolean;
}

// ============================================================================
// LONG_TERM Details
// ============================================================================

export interface LongTermDetails {
  // Contract terms
  yearly_increase_percent?: number;     // 0-100
  
  // Utilities & Fees
  internet_fee?: number;
  parking_fee_car?: number;
  environment_fee?: number;             // for FACTORY
  tax_estimate_per_year?: number;       // for SHOPHOUSE
  
  // House rules
  allow_pets?: boolean;
  allow_smoking?: boolean;
  house_rules_text?: string;
  
  // Physical extras
  garden_area_m2?: number;
  
  // Business/Commercial (OFFICE, COMMERCIAL_SPACE, SHOPHOUSE)
  business_purpose?: string;
  foot_traffic_per_day?: number;
  allow_business_registration?: boolean;
  operating_hours?: string;
  
  // Industrial (FACTORY, WAREHOUSE)
  warehouse_area_m2?: number;
  ceiling_height_m?: number;
  truck_access?: boolean;
  power_capacity_kw?: number;
  three_phase_power?: boolean;
  fire_safety_compliance?: boolean;
  
  // Villa/Luxury
  private_pool?: boolean;
  bbq_area?: boolean;
  
  // Building amenities
  building_amenities?: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

export function createDefaultMetadata(
  propertyType: string,
  leaseGroup: 'SHORT' | 'MID' | 'LONG'
): PropertyMetadata {
  return {
    version: 1,
    property_type: propertyType,
    lease_group: leaseGroup,
    details: {}
  };
}

export function validateMetadataVersion(metadata: any): boolean {
  return metadata && 
         typeof metadata === 'object' && 
         metadata.version === 1 &&
         metadata.property_type &&
         metadata.lease_group;
}

export function getLeaseGroup(rentalDurationType: string): 'SHORT' | 'MID' | 'LONG' {
  if (rentalDurationType === 'SHORT_TERM') return 'SHORT';
  if (rentalDurationType === 'MEDIUM_TERM') return 'MID';
  if (rentalDurationType === 'LONG_TERM') return 'LONG';
  return 'MID'; // default
}
