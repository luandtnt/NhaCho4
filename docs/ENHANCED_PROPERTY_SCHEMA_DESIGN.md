# Enhanced Property Schema Design
**Version**: 1.1 (Production-Grade Final)  
**Date**: 2026-01-16  
**Approach**: Hybrid (Core Columns + Structured Metadata)  
**Status**: ✅ APPROVED - Ready for Implementation

---

## 🎯 PRODUCTION-GRADE REQUIREMENTS (v1.1 Updates)

### ✅ Confirmed Decisions

1. **RentableItem = Property Unit** (Current Model)
   - `rentable_items`: Physical property units (rooms, apartments, offices)
   - `listings`: Marketing layer (many-to-many with rentable_items)
   - ✅ This allows: 1 item → multiple listings with different prices/terms
   - ✅ Separation of concerns: property data vs. marketing data

2. **ENUMs over VARCHAR** (Data Integrity)
   - All categorical fields use Prisma enums
   - Prevents data corruption, enables proper indexing
   - Type-safe in TypeScript

3. **Location Required for PUBLISHED Listings**
   - Draft: location optional
   - Published: `province`, `district`, `ward`, `address_full` required
   - `geo_lat`, `geo_lng`: optional but recommended

4. **Deposit Rules by Lease Group**
   - SHORT_TERM: `booking_hold_deposit` optional (depends on business rule)
   - MID_TERM: `deposit_amount` required
   - LONG_TERM: `deposit_amount` required

5. **Metadata Always Structured**
   - Never empty `{}`
   - Always: `{ version: 1, property_type: "...", lease_group: "..." }`
   - Type-specific details validated by backend

6. **Legal Documents Required by Type**
   - HOTEL: `hotel_business_license` required
   - LAND_PLOT: `land_use_certificate` required
   - Others: optional but validated if provided

7. **Check Constraints for Data Integrity**
   - `base_price > 0`
   - `area_sqm > 0`
   - `max_occupancy >= 1` (SHORT_TERM)
   - `min_rent_duration >= 1`
   - `checkin_time < checkout_time` (same-day bookings)

8. **Comprehensive Indexing**
   - All filter/sort fields indexed
   - GIN index on both `amenities` and `metadata`
   - Composite indexes for common query patterns

---

## 1. CORE COLUMNS (Direct Database Columns)

### A. Existing Columns (Keep)
```typescript
// Identity & Classification
id: string (uuid)
org_id: string (uuid)
space_node_id: string (uuid)
code: string
name: string
description: string
status: enum (ACTIVE, INACTIVE, MAINTENANCE)

// Property Type (Already exists)
property_category: enum (21 types)
rental_duration_type: enum (SHORT_TERM, MEDIUM_TERM, LONG_TERM)

// Basic Physical Info (Already exists)
area_sqm: Decimal(10,2)
bedrooms: Int
bathrooms: Int
floor_number: Int

// Booking Settings (Already exists)
instant_booking: Boolean
advance_booking_days: Int
cancellation_policy: String

// System
created_at: DateTime
updated_at: DateTime
```

### B. NEW Core Columns to Add

#### 🏠 Location (Critical for Search/Filter)
```sql
-- Full address components
address_full          TEXT
province              VARCHAR(100)
district              VARCHAR(100)
ward                  VARCHAR(100)
geo_lat               DECIMAL(10, 8)  -- -90 to 90
geo_lng               DECIMAL(11, 8)  -- -180 to 180
```

#### 💰 Pricing & Contract (Critical for Filter/Sort/Report)
```sql
-- Base pricing
base_price            DECIMAL(15, 2) CHECK (base_price > 0)
price_unit            VARCHAR(20)     -- ENUM: HOUR, NIGHT, MONTH
currency              VARCHAR(3) DEFAULT 'VND'

-- Contract terms
min_rent_duration     INT CHECK (min_rent_duration >= 1)
deposit_amount        DECIMAL(15, 2)  -- Required for MID/LONG
booking_hold_deposit  DECIMAL(15, 2)  -- Optional for SHORT

-- Additional fees (common filters)
service_fee           DECIMAL(15, 2)
building_mgmt_fee     DECIMAL(15, 2)
```

**Prisma Enums:**
```prisma
enum PriceUnit {
  HOUR
  NIGHT
  MONTH
}
```

#### 🏗️ Physical Details (Common Filters)
```sql
-- Extended physical info
floors                INT             -- số tầng (for houses)
apartment_floor       INT             -- căn ở tầng số (for apartments)
direction             VARCHAR(20)     -- ENUM: EAST, WEST, SOUTH, NORTH, etc.
balcony               BOOLEAN
frontage_m            DECIMAL(8, 2) CHECK (frontage_m > 0)
parking_slots         INT CHECK (parking_slots >= 0)
```

**Prisma Enums:**
```prisma
enum Direction {
  EAST
  WEST
  SOUTH
  NORTH
  NORTHEAST
  NORTHWEST
  SOUTHEAST
  SOUTHWEST
}
```

#### 🛋️ Furnishing & Amenities (Filter)
```sql
furnishing_level      VARCHAR(20)     -- ENUM: FULL, PARTIAL, NONE
amenities             JSONB           -- Array of amenity codes (GIN indexed)
```

**Prisma Enums:**
```prisma
enum FurnishingLevel {
  FULL
  PARTIAL
  NONE
}
```

#### 📅 Short-term Booking Essentials (Critical for SHORT_TERM)
```sql
checkin_time          TIME            -- HH:mm
checkout_time         TIME            -- HH:mm (CHECK: checkout_time > checkin_time for same-day)
max_occupancy         INT CHECK (max_occupancy >= 1)
```

#### 💡 Utilities Billing (Important for MID/LONG)
```sql
electricity_billing   VARCHAR(30)     -- ENUM: METER_PRIVATE, SHARED, OWNER_RATE, STATE_RATE
water_billing         VARCHAR(30)     -- ENUM: METER_PRIVATE, SHARED, OWNER_RATE, STATE_RATE
```

**Prisma Enums:**
```prisma
enum UtilityBilling {
  METER_PRIVATE
  SHARED
  OWNER_RATE
  STATE_RATE
}
```

---

## 2. STRUCTURED METADATA (JSONB Column)

### Schema Structure
```typescript
interface PropertyMetadata {
  version: number;                    // Schema version (start with 1) - REQUIRED
  property_type: PropertyTypeEnum;    // For validation - REQUIRED
  lease_group: 'SHORT' | 'MID' | 'LONG'; // REQUIRED
  
  // Type-specific details
  details: ShortTermDetails | MidTermDetails | LongTermDetails;
  
  // Legal documents (URLs to uploaded files)
  legal_documents?: {
    hotel_business_license?: string;      // REQUIRED for HOTEL
    short_stay_license?: string;
    warehouse_license?: string;
    industrial_license?: string;
    land_use_certificate?: string;        // REQUIRED for LAND_PLOT
    commercial_license?: string;
  };
  
  // Custom fields for future extension
  custom_fields?: Record<string, any>;
}

// Default metadata structure (never empty {})
const DEFAULT_METADATA = {
  version: 1,
  property_type: null,  // Set based on property_category
  lease_group: null,    // Set based on rental_duration_type
  details: {}
};
```

### A. SHORT_TERM Details Schema
```typescript
interface ShortTermDetails {
  // Pricing extras
  extra_guest_fee?: number;           // VND per person
  weekend_surcharge?: number;         // VND
  cleaning_fee?: number;              // VND
  
  // Cancellation (moved from core to metadata)
  cancellation_policy?: 'FLEXIBLE' | 'MODERATE' | 'STRICT';  // ENUM
  cancellation_fee_percent?: number;  // 0-100
  
  // House rules
  allow_pets?: boolean;
  allow_smoking?: boolean;
  quiet_hours?: string;               // "22:00-06:00"
  house_rules_text?: string;
  
  // Service-based (HOTEL, SERVICED_APT)
  housekeeping_frequency?: 'DAILY' | 'WEEKLY' | 'ON_REQUEST';
  laundry_service?: boolean;
  premium_services?: string[];        // ['BREAKFAST', 'SPA', 'POOL']
  
  // Co-living specific (COLIVING_SHORT)
  dorm_beds?: number;
  shared_areas?: string[];            // ['SHARED_KITCHEN', 'WORKSPACE']
  gender_policy?: 'MALE' | 'FEMALE' | 'MIXED';
  membership_fee?: number;
  community_events?: string;
  
  // Villa/Luxury
  private_pool?: boolean;
  bbq_area?: boolean;
  garden_area_m2?: number;
  
  // Building amenities (for apartments/hotels)
  building_amenities?: string[];      // ['GYM', 'POOL', 'SECURITY_24_7']
}

// Prisma Enums
enum CancellationPolicy {
  FLEXIBLE
  MODERATE
  STRICT
}

enum HousekeepingFrequency {
  DAILY
  WEEKLY
  ON_REQUEST
}

enum GenderPolicy {
  MALE
  FEMALE
  MIXED
}
```

### B. MID_TERM Details Schema
```typescript
interface MidTermDetails {
  // Utilities & Fees
  internet_fee?: number;              // VND/month
  parking_fee_motorbike?: number;     // VND/month
  parking_fee_car?: number;           // VND/month
  
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
  business_purpose?: string;          // SHOP, RESTAURANT, OFFICE
  foot_traffic_per_day?: number;
  allowed_goods?: string;             // for TEMP_WAREHOUSE
  
  // Warehouse specific
  warehouse_area_m2?: number;
  ceiling_height_m?: number;
  truck_access?: boolean;
}
```

### C. LONG_TERM Details Schema
```typescript
interface LongTermDetails {
  // Contract terms
  yearly_increase_percent?: number;   // 0-100
  
  // Utilities & Fees
  internet_fee?: number;
  parking_fee_car?: number;
  environment_fee?: number;           // for FACTORY
  tax_estimate_per_year?: number;     // for SHOPHOUSE
  
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
  
  // Land (LAND_PLOT)
  land_use_certificate?: string;      // URL to file
  
  // Villa/Luxury
  private_pool?: boolean;
  bbq_area?: boolean;
  
  // Building amenities
  building_amenities?: string[];
}
```

---

## 3. PROPERTY TYPE → REQUIRED FIELDS MAPPING

### SHORT_TERM Group
```typescript
const SHORT_TERM_REQUIRED_CORE = [
  'base_price', 'price_unit', 'min_rent_duration',
  'checkin_time', 'checkout_time', 'max_occupancy'
  // booking_hold_deposit: optional (business rule dependent)
];

// Location required when status = PUBLISHED
const PUBLISHED_REQUIRED_LOCATION = [
  'province', 'district', 'ward', 'address_full'
  // geo_lat, geo_lng: recommended but optional
];

const SHORT_TERM_TYPES = {
  HOMESTAY: {
    core: [...SHORT_TERM_REQUIRED_CORE, 'bedrooms', 'bathrooms', 'furnishing_level'],
    metadata: {
      required: [],
      optional: ['allow_pets', 'quiet_hours', 'cancellation_policy']
    }
  },
  MOTEL: {
    core: [...SHORT_TERM_REQUIRED_CORE, 'bedrooms', 'bathrooms', 'furnishing_level'],
    metadata: {
      required: [],
      optional: ['allow_pets', 'parking_slots']
    }
  },
  HOTEL: {
    core: [...SHORT_TERM_REQUIRED_CORE, 'bedrooms', 'bathrooms', 'furnishing_level'],
    metadata: {
      required: ['hotel_business_license'],  // Legal doc required
      optional: ['housekeeping_frequency', 'premium_services', 'cancellation_policy']
    }
  },
  SERVICED_APT_SHORT: {
    core: [...SHORT_TERM_REQUIRED_CORE, 'bedrooms', 'bathrooms', 'apartment_floor', 'furnishing_level'],
    metadata: {
      required: [],
      optional: ['housekeeping_frequency', 'laundry_service', 'building_amenities']
    }
  },
  VILLA: {
    core: [...SHORT_TERM_REQUIRED_CORE, 'bedrooms', 'bathrooms', 'floors', 'furnishing_level'],
    metadata: {
      required: [],
      optional: ['private_pool', 'bbq_area', 'garden_area_m2']
    }
  },
  AIRBNB_ROOM: {
    core: [...SHORT_TERM_REQUIRED_CORE, 'bedrooms', 'bathrooms', 'furnishing_level'],
    metadata: {
      required: [],
      optional: ['house_rules_text', 'cancellation_policy']
    }
  },
  COLIVING_SHORT: {
    core: [...SHORT_TERM_REQUIRED_CORE, 'max_occupancy', 'furnishing_level'],
    metadata: {
      required: ['dorm_beds', 'shared_areas'],
      optional: ['gender_policy', 'membership_fee', 'community_events']
    }
  }
};
```

### MID_TERM Group
```typescript
const MID_TERM_REQUIRED_CORE = [
  'base_price', 'price_unit', 'min_rent_duration',
  'deposit_amount',  // REQUIRED for MID_TERM
  'electricity_billing', 'water_billing',
  'furnishing_level'
];

const MID_TERM_TYPES = {
  PRIVATE_HOUSE: {
    core: [...MID_TERM_REQUIRED_CORE, 'bedrooms', 'bathrooms', 'floors'],
    metadata: {
      required: [],
      optional: ['garden_area_m2', 'parking_slots', 'allow_pets']
    }
  },
  RENT_ROOM: {
    core: [...MID_TERM_REQUIRED_CORE, 'bedrooms', 'bathrooms'],
    metadata: {
      required: [],
      optional: ['allow_guests_overnight', 'house_rules_text']
    }
  },
  APARTMENT: {
    core: [...MID_TERM_REQUIRED_CORE, 'bedrooms', 'bathrooms', 'apartment_floor', 'direction'],
    metadata: {
      required: [],
      optional: ['building_amenities', 'building_mgmt_fee', 'balcony']
    }
  },
  SERVICED_APT_MID: {
    core: [...MID_TERM_REQUIRED_CORE, 'bedrooms', 'bathrooms', 'apartment_floor'],
    metadata: {
      required: [],
      optional: ['housekeeping_frequency', 'building_amenities']
    }
  },
  WHOLE_HOUSE: {
    core: [...MID_TERM_REQUIRED_CORE, 'bedrooms', 'bathrooms', 'floors'],
    metadata: {
      required: [],
      optional: ['garden_area_m2', 'parking_slots']
    }
  },
  SMALL_SHOP: {
    core: [...MID_TERM_REQUIRED_CORE, 'frontage_m'],
    metadata: {
      required: [],
      optional: ['business_purpose', 'foot_traffic_per_day']
    }
  },
  TEMP_WAREHOUSE: {
    core: [...MID_TERM_REQUIRED_CORE, 'area_sqm'],
    metadata: {
      required: ['allowed_goods'],
      optional: ['warehouse_area_m2', 'ceiling_height_m', 'truck_access']
    }
  }
};
```

### LONG_TERM Group
```typescript
const LONG_TERM_REQUIRED_CORE = [
  'base_price', 'price_unit', 'min_rent_duration',
  'deposit_amount',  // REQUIRED for LONG_TERM
  'electricity_billing', 'water_billing',
  'furnishing_level'
];

const LONG_TERM_TYPES = {
  OFFICE: {
    core: [...LONG_TERM_REQUIRED_CORE, 'area_sqm', 'floors'],
    metadata: {
      required: ['business_purpose', 'allow_business_registration'],
      optional: ['operating_hours', 'fire_safety_compliance']
    }
  },
  LAND_PLOT: {
    core: [...LONG_TERM_REQUIRED_CORE, 'area_sqm', 'frontage_m'],
    metadata: {
      required: ['land_use_certificate'],  // Legal doc required
      optional: []
    }
  },
  FACTORY: {
    core: [...LONG_TERM_REQUIRED_CORE, 'area_sqm'],
    metadata: {
      required: ['power_capacity_kw', 'three_phase_power', 'fire_safety_compliance'],
      optional: ['warehouse_area_m2', 'ceiling_height_m', 'truck_access', 'environment_fee']
    }
  },
  COMMERCIAL_SPACE: {
    core: [...LONG_TERM_REQUIRED_CORE, 'area_sqm', 'frontage_m'],
    metadata: {
      required: ['business_purpose'],
      optional: ['foot_traffic_per_day', 'operating_hours', 'fire_safety_compliance']
    }
  },
  LUXURY_APARTMENT: {
    core: [...LONG_TERM_REQUIRED_CORE, 'bedrooms', 'bathrooms', 'apartment_floor', 'direction'],
    metadata: {
      required: [],
      optional: ['building_amenities', 'building_mgmt_fee', 'balcony']
    }
  },
  VILLA_LONG: {
    core: [...LONG_TERM_REQUIRED_CORE, 'bedrooms', 'bathrooms', 'floors'],
    metadata: {
      required: [],
      optional: ['private_pool', 'bbq_area', 'garden_area_m2']
    }
  },
  SHOPHOUSE: {
    core: [...LONG_TERM_REQUIRED_CORE, 'bedrooms', 'bathrooms', 'floors', 'frontage_m'],
    metadata: {
      required: ['business_purpose', 'allow_business_registration'],
      optional: ['tax_estimate_per_year']
    }
  }
};
```

---

## 4. MIGRATION STRATEGY

### Phase 1: Add Core Columns (Safe & Backward Compatible)
```sql
-- All columns nullable for backward compatibility
-- Location fields
ALTER TABLE rentable_items ADD COLUMN address_full TEXT;
ALTER TABLE rentable_items ADD COLUMN province VARCHAR(100);
ALTER TABLE rentable_items ADD COLUMN district VARCHAR(100);
ALTER TABLE rentable_items ADD COLUMN ward VARCHAR(100);
ALTER TABLE rentable_items ADD COLUMN geo_lat DECIMAL(10, 8);
ALTER TABLE rentable_items ADD COLUMN geo_lng DECIMAL(11, 8);

-- Pricing & Contract
ALTER TABLE rentable_items ADD COLUMN base_price DECIMAL(15, 2) CHECK (base_price IS NULL OR base_price > 0);
ALTER TABLE rentable_items ADD COLUMN price_unit VARCHAR(20);  -- Will be ENUM in Prisma
ALTER TABLE rentable_items ADD COLUMN currency VARCHAR(3) DEFAULT 'VND';
ALTER TABLE rentable_items ADD COLUMN min_rent_duration INT CHECK (min_rent_duration IS NULL OR min_rent_duration >= 1);
ALTER TABLE rentable_items ADD COLUMN deposit_amount DECIMAL(15, 2);
ALTER TABLE rentable_items ADD COLUMN booking_hold_deposit DECIMAL(15, 2);
ALTER TABLE rentable_items ADD COLUMN service_fee DECIMAL(15, 2);
ALTER TABLE rentable_items ADD COLUMN building_mgmt_fee DECIMAL(15, 2);

-- Physical Details
ALTER TABLE rentable_items ADD COLUMN floors INT;
ALTER TABLE rentable_items ADD COLUMN apartment_floor INT;
ALTER TABLE rentable_items ADD COLUMN direction VARCHAR(20);  -- Will be ENUM in Prisma
ALTER TABLE rentable_items ADD COLUMN balcony BOOLEAN;
ALTER TABLE rentable_items ADD COLUMN frontage_m DECIMAL(8, 2) CHECK (frontage_m IS NULL OR frontage_m > 0);
ALTER TABLE rentable_items ADD COLUMN parking_slots INT CHECK (parking_slots IS NULL OR parking_slots >= 0);

-- Furnishing & Amenities
ALTER TABLE rentable_items ADD COLUMN furnishing_level VARCHAR(20);  -- Will be ENUM in Prisma

-- Short-term Booking
ALTER TABLE rentable_items ADD COLUMN checkin_time TIME;
ALTER TABLE rentable_items ADD COLUMN checkout_time TIME;
ALTER TABLE rentable_items ADD COLUMN max_occupancy INT CHECK (max_occupancy IS NULL OR max_occupancy >= 1);

-- Utilities Billing
ALTER TABLE rentable_items ADD COLUMN electricity_billing VARCHAR(30);  -- Will be ENUM in Prisma
ALTER TABLE rentable_items ADD COLUMN water_billing VARCHAR(30);  -- Will be ENUM in Prisma

-- Metadata column (JSONB for PostgreSQL)
ALTER TABLE rentable_items ADD COLUMN metadata JSONB DEFAULT '{"version": 1}'::jsonb;

-- Create comprehensive indexes
CREATE INDEX idx_rentable_items_province ON rentable_items(province);
CREATE INDEX idx_rentable_items_district ON rentable_items(district);
CREATE INDEX idx_rentable_items_ward ON rentable_items(ward);
CREATE INDEX idx_rentable_items_geo ON rentable_items(geo_lat, geo_lng);

CREATE INDEX idx_rentable_items_base_price ON rentable_items(base_price);
CREATE INDEX idx_rentable_items_price_unit ON rentable_items(price_unit);

CREATE INDEX idx_rentable_items_bedrooms ON rentable_items(bedrooms);
CREATE INDEX idx_rentable_items_bathrooms ON rentable_items(bathrooms);
CREATE INDEX idx_rentable_items_area ON rentable_items(area_sqm);
CREATE INDEX idx_rentable_items_furnishing ON rentable_items(furnishing_level);

-- CRITICAL: Indexes for Discover/Search filters
CREATE INDEX idx_rentable_items_property_category ON rentable_items(property_category);
CREATE INDEX idx_rentable_items_rental_duration ON rentable_items(rental_duration_type);

-- Composite index for common query patterns
CREATE INDEX idx_rentable_items_search ON rentable_items(property_category, rental_duration_type, status);
CREATE INDEX idx_rentable_items_location_search ON rentable_items(province, district, property_category);

-- GIN indexes for JSONB columns
CREATE INDEX idx_rentable_items_amenities ON rentable_items USING GIN (amenities);
CREATE INDEX idx_rentable_items_metadata ON rentable_items USING GIN (metadata);

-- Add check constraint for same-day bookings
ALTER TABLE rentable_items ADD CONSTRAINT chk_checkin_checkout 
  CHECK (checkin_time IS NULL OR checkout_time IS NULL OR checkout_time > checkin_time);
```

### Phase 2: Update Existing Data with Proper Defaults
```sql
-- Set default values for existing records
UPDATE rentable_items 
SET 
  currency = 'VND',
  price_unit = 'MONTH',
  furnishing_level = 'PARTIAL',
  metadata = jsonb_build_object(
    'version', 1,
    'property_type', property_category,
    'lease_group', 
      CASE 
        WHEN rental_duration_type = 'SHORT_TERM' THEN 'SHORT'
        WHEN rental_duration_type = 'MEDIUM_TERM' THEN 'MID'
        WHEN rental_duration_type = 'LONG_TERM' THEN 'LONG'
        ELSE 'MID'
      END,
    'details', '{}'::jsonb
  )
WHERE metadata IS NULL OR metadata = '{}'::jsonb;

-- Ensure amenities is array if null
UPDATE rentable_items 
SET amenities = '[]'::jsonb
WHERE amenities IS NULL;
```

---

## 5. VALIDATION RULES

### A. Core Field Validation (Backend DTO)
```typescript
// Base validation for all property types
class CreateRentableItemBaseDto {
  // Identity
  @IsEnum(PropertyCategory)
  property_category: PropertyCategory;
  
  @IsEnum(RentalDurationType)
  rental_duration_type: RentalDurationType;
  
  // Location (required when publishing)
  @IsOptional()
  @IsString()
  address_full?: string;
  
  @IsOptional()
  @IsString()
  province?: string;
  
  @IsOptional()
  @IsString()
  district?: string;
  
  @IsOptional()
  @IsString()
  ward?: string;
  
  // Pricing
  @IsNumber()
  @Min(0.01)
  base_price: number;
  
  @IsEnum(PriceUnit)
  price_unit: PriceUnit;
  
  @IsInt()
  @Min(1)
  min_rent_duration: number;
  
  // Physical
  @IsNumber()
  @Min(0.01)
  area_sqm: number;
  
  @IsEnum(FurnishingLevel)
  furnishing_level: FurnishingLevel;
  
  // Metadata
  @ValidateNested()
  @Type(() => PropertyMetadataDto)
  metadata: PropertyMetadataDto;
}

// Example for SHORT_TERM specific
class CreateShortTermPropertyDto extends CreateRentableItemBaseDto {
  @IsEnum(['HOUR', 'NIGHT'])
  price_unit: 'HOUR' | 'NIGHT';
  
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  checkin_time: string;
  
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  checkout_time: string;
  
  @IsInt()
  @Min(1)
  max_occupancy: number;
  
  @IsOptional()
  @IsNumber()
  booking_hold_deposit?: number;
  
  @ValidateNested()
  @Type(() => ShortTermMetadataDto)
  metadata: ShortTermMetadataDto;
}

// Example for MID/LONG_TERM specific
class CreateMidLongTermPropertyDto extends CreateRentableItemBaseDto {
  @IsEnum(['MONTH'])
  price_unit: 'MONTH';
  
  @IsNumber()
  @Min(0)
  deposit_amount: number;  // REQUIRED for MID/LONG
  
  @IsEnum(UtilityBilling)
  electricity_billing: UtilityBilling;
  
  @IsEnum(UtilityBilling)
  water_billing: UtilityBilling;
}
```

### B. Publish Validation (Additional Rules)
```typescript
class PublishListingValidator {
  static validate(rentableItem: RentableItem): ValidationResult {
    const errors: string[] = [];
    
    // Location required for published listings
    if (!rentableItem.province) errors.push('Province is required');
    if (!rentableItem.district) errors.push('District is required');
    if (!rentableItem.ward) errors.push('Ward is required');
    if (!rentableItem.address_full) errors.push('Full address is required');
    
    // Pricing required
    if (!rentableItem.base_price || rentableItem.base_price <= 0) {
      errors.push('Valid base price is required');
    }
    
    // Type-specific validation
    const leaseGroup = this.getLeaseGroup(rentableItem.rental_duration_type);
    
    if (leaseGroup === 'SHORT') {
      if (!rentableItem.checkin_time) errors.push('Check-in time is required');
      if (!rentableItem.checkout_time) errors.push('Check-out time is required');
      if (!rentableItem.max_occupancy) errors.push('Max occupancy is required');
    }
    
    if (leaseGroup === 'MID' || leaseGroup === 'LONG') {
      if (!rentableItem.deposit_amount) errors.push('Deposit amount is required');
      if (!rentableItem.electricity_billing) errors.push('Electricity billing method is required');
      if (!rentableItem.water_billing) errors.push('Water billing method is required');
    }
    
    // Legal documents validation
    const metadata = rentableItem.metadata as PropertyMetadata;
    if (rentableItem.property_category === 'HOTEL') {
      if (!metadata.legal_documents?.hotel_business_license) {
        errors.push('Hotel business license is required');
      }
    }
    if (rentableItem.property_category === 'LAND_PLOT') {
      if (!metadata.legal_documents?.land_use_certificate) {
        errors.push('Land use certificate is required');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

### C. Metadata Validation by Type
```typescript
class ShortTermMetadataDto {
  @IsOptional()
  @IsEnum(CancellationPolicy)
  cancellation_policy?: CancellationPolicy;
  
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cancellation_fee_percent?: number;
  
  @IsOptional()
  @IsEnum(HousekeepingFrequency)
  housekeeping_frequency?: HousekeepingFrequency;
  
  // ... other fields
}
```

---

## 6. BENEFITS OF THIS APPROACH

✅ **Query Performance**: Critical fields are indexed columns  
✅ **Flexibility**: Type-specific fields in structured metadata  
✅ **Backward Compatible**: All new columns nullable  
✅ **Scalable**: Easy to add new property types  
✅ **Type-Safe**: Metadata has versioned schema  
✅ **Maintainable**: Clear separation of concerns  

---

## 7. NEXT STEPS

1. ✅ Review & approve this design
2. Create Prisma schema update
3. Generate migration SQL
4. Create TypeScript interfaces for metadata
5. Update DTOs with validation
6. Update seed scripts
7. Update UI forms
8. Update detail components

