# Step 3: DTOs & Validation - Complete

**Date:** 2026-01-16  
**Status:** ✅ Complete

## Overview

Created comprehensive DTO classes and validation service for enhanced property schema with type-specific validation rules.

## What Was Created

### 1. Enhanced DTOs (`create-rentable-item-enhanced.dto.ts`)

#### Base DTO
- `CreateRentableItemBaseDto`: Common fields for all property types
  - Property classification (property_category, rental_duration_type)
  - Location fields (address, province, district, ward, geo coordinates)
  - Pricing fields (base_price, price_unit, currency, min_rent_duration)
  - Physical fields (area_sqm, furnishing_level, amenities)
  - Metadata (structured with versioning)

#### Type-Specific DTOs
- `CreateShortTermPropertyDto`: For SHORT_TERM rentals
  - Price unit: HOUR or NIGHT only
  - Booking fields: checkin_time, checkout_time, max_occupancy
  - Optional: booking_hold_deposit
  - Validates time format (HH:mm)

- `CreateMidTermPropertyDto`: For MEDIUM_TERM rentals
  - Price unit: MONTH only
  - Required: deposit_amount, electricity_billing, water_billing
  - Physical: bedrooms, bathrooms, floors, apartment_floor, direction, balcony
  - Commercial: frontage_m, parking_slots

- `CreateLongTermPropertyDto`: For LONG_TERM rentals
  - Price unit: MONTH only
  - Required: deposit_amount, electricity_billing, water_billing
  - Physical: all residential/commercial fields
  - Additional: building_mgmt_fee

### 2. Validation Service (`property-validator.service.ts`)

#### Key Methods

**`validateForPublish(rentableItem)`**
- Validates all required fields for publishing
- Location: province, district, ward, address_full required
- Pricing: base_price > 0, price_unit required
- Type-specific: SHORT_TERM needs booking fields, MID/LONG need deposits
- Legal documents: HOTEL needs license, LAND_PLOT needs certificate
- Returns: `{ valid: boolean, errors: string[] }`

**`validateShortTermForPublish(item, errors)`**
- Validates checkin_time, checkout_time, max_occupancy
- Ensures checkout_time > checkin_time
- Max occupancy >= 1

**`validateMidLongTermForPublish(item, errors)`**
- Validates deposit_amount >= 0
- Validates electricity_billing and water_billing required

**`validateLegalDocuments(item, errors)`**
- HOTEL: requires hotel_business_license
- LAND_PLOT: requires land_use_certificate
- FACTORY: requires fire_safety_compliance

**`validateMetadata(metadata)`**
- Ensures version = 1
- Ensures property_type present
- Ensures lease_group in [SHORT, MID, LONG]
- Ensures details object exists

**`validateRequiredFieldsByType(propertyCategory, data)`**
- Residential types: requires bedrooms, bathrooms
- Commercial types: requires frontage_m
- OFFICE: requires business_purpose in metadata
- FACTORY: requires power_capacity_kw, three_phase_power

## Validation Rules Summary

### All Properties
- ✅ base_price > 0
- ✅ area_sqm > 0
- ✅ min_rent_duration >= 1
- ✅ furnishing_level in [FULL, PARTIAL, NONE]
- ✅ metadata with version, property_type, lease_group

### SHORT_TERM Properties
- ✅ price_unit in [HOUR, NIGHT]
- ✅ checkin_time in HH:mm format
- ✅ checkout_time in HH:mm format
- ✅ checkout_time > checkin_time
- ✅ max_occupancy >= 1
- ⭕ booking_hold_deposit (optional)

### MID_TERM Properties
- ✅ price_unit = MONTH
- ✅ deposit_amount >= 0 (required)
- ✅ electricity_billing required
- ✅ water_billing required

### LONG_TERM Properties
- ✅ price_unit = MONTH
- ✅ deposit_amount >= 0 (required)
- ✅ electricity_billing required
- ✅ water_billing required

### Property Type Specific

**Residential (HOMESTAY, APARTMENT, VILLA, etc.)**
- ✅ bedrooms required
- ✅ bathrooms required

**Commercial (RETAIL, COMMERCIAL_SPACE, SHOPHOUSE)**
- ✅ frontage_m required

**Office**
- ✅ business_purpose in metadata required

**Factory**
- ✅ power_capacity_kw in metadata required
- ✅ three_phase_power in metadata required
- ✅ fire_safety_compliance required

**Hotel**
- ✅ hotel_business_license in metadata required

**Land Plot**
- ✅ land_use_certificate in metadata required

## Usage Examples

### Creating a Short-Term Property
```typescript
const dto: CreateShortTermPropertyDto = {
  space_node_id: 'uuid',
  code: 'ROOM-101',
  property_category: 'HOMESTAY',
  rental_duration_type: 'SHORT_TERM',
  
  // Location
  address_full: '123 Street, City',
  province: 'TP. Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Nghé',
  
  // Pricing
  base_price: 500000,
  price_unit: 'NIGHT',
  min_rent_duration: 1,
  
  // Physical
  area_sqm: 25,
  bedrooms: 1,
  bathrooms: 1,
  furnishing_level: 'FULL',
  amenities: ['WIFI', 'AC'],
  
  // Booking
  checkin_time: '14:00',
  checkout_time: '12:00',
  max_occupancy: 2,
  
  // Metadata
  metadata: {
    version: 1,
    property_type: 'HOMESTAY',
    lease_group: 'SHORT',
    details: {
      cancellation_policy: 'MODERATE',
      allow_pets: false,
    }
  }
};
```

### Validating for Publish
```typescript
const validator = new PropertyValidatorService();
const result = validator.validateForPublish(rentableItem);

if (!result.valid) {
  throw new BadRequestException({
    message: 'Validation failed',
    errors: result.errors,
  });
}
```

## Integration Points

### Controller Layer
- Use appropriate DTO class based on rental_duration_type
- Apply `@UsePipes(ValidationPipe)` for automatic validation
- Call `validateForPublish()` before publishing listings

### Service Layer
- Call `validateMetadata()` when creating/updating items
- Call `validateRequiredFieldsByType()` for type-specific validation
- Store validation errors in response

### Frontend
- Use same validation rules in forms
- Show field-specific error messages
- Disable publish button until validation passes

## Benefits

✅ **Type Safety**: TypeScript DTOs with decorators  
✅ **Automatic Validation**: class-validator integration  
✅ **Type-Specific Rules**: Different validation per property type  
✅ **Clear Error Messages**: Detailed validation errors  
✅ **Publish Gate**: Strict validation before publishing  
✅ **Metadata Validation**: Structured metadata with versioning  
✅ **Legal Compliance**: Required documents per type  

## Next Steps

- ✅ Step 1: Schema & Migration (Complete)
- ✅ Step 2: Seed Script (Complete)
- ✅ Step 3: DTOs & Validation (Complete)
- ⏭️ Step 4: Update UI Forms (Next)
- ⏭️ Step 5: Update Detail Components (Next)

