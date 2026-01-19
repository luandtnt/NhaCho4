/**
 * Property Validator Service
 * Validates rentable items based on property type and lease group
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { PropertyMetadata } from '../interfaces/property-metadata.interface';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

@Injectable()
export class PropertyValidatorService {
  /**
   * Validate for publishing (stricter rules)
   */
  validateForPublish(rentableItem: any): ValidationResult {
    const errors: string[] = [];

    // Location required for published listings
    if (!rentableItem.province) errors.push('Province is required for publishing');
    if (!rentableItem.district) errors.push('District is required for publishing');
    if (!rentableItem.ward) errors.push('Ward is required for publishing');
    if (!rentableItem.address_full) errors.push('Full address is required for publishing');

    // Pricing required
    if (!rentableItem.base_price || rentableItem.base_price <= 0) {
      errors.push('Valid base price is required');
    }

    if (!rentableItem.price_unit) {
      errors.push('Price unit is required');
    }

    // Type-specific validation
    const leaseGroup = this.getLeaseGroup(rentableItem.rental_duration_type);

    if (leaseGroup === 'SHORT') {
      this.validateShortTermForPublish(rentableItem, errors);
    } else if (leaseGroup === 'MID' || leaseGroup === 'LONG') {
      this.validateMidLongTermForPublish(rentableItem, errors);
    }

    // Legal documents validation
    this.validateLegalDocuments(rentableItem, errors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateShortTermForPublish(item: any, errors: string[]): void {
    if (!item.checkin_time) errors.push('Check-in time is required for short-term rentals');
    if (!item.checkout_time) errors.push('Check-out time is required for short-term rentals');
    if (!item.max_occupancy || item.max_occupancy < 1) {
      errors.push('Max occupancy must be at least 1');
    }

    // Validate time format
    if (item.checkin_time && item.checkout_time) {
      const checkin = this.parseTime(item.checkin_time);
      const checkout = this.parseTime(item.checkout_time);
      
      if (checkin && checkout && checkout <= checkin) {
        errors.push('Check-out time must be after check-in time');
      }
    }
  }

  private validateMidLongTermForPublish(item: any, errors: string[]): void {
    if (!item.deposit_amount || item.deposit_amount < 0) {
      errors.push('Deposit amount is required for mid/long-term rentals');
    }

    if (!item.electricity_billing) {
      errors.push('Electricity billing method is required');
    }

    if (!item.water_billing) {
      errors.push('Water billing method is required');
    }
  }

  private validateLegalDocuments(item: any, errors: string[]): void {
    const metadata = item.metadata as PropertyMetadata;
    
    if (!metadata) return;

    // HOTEL requires business license
    if (item.property_category === 'HOTEL') {
      if (!metadata.legal_documents?.hotel_business_license) {
        errors.push('Hotel business license is required for HOTEL properties');
      }
    }

    // LAND_PLOT requires land use certificate
    if (item.property_category === 'LAND_PLOT') {
      if (!metadata.legal_documents?.land_use_certificate) {
        errors.push('Land use certificate is required for LAND_PLOT properties');
      }
    }

    // FACTORY should have industrial license
    if (item.property_category === 'FACTORY') {
      if (metadata.details && !(metadata.details as any).fire_safety_compliance) {
        errors.push('Fire safety compliance is required for FACTORY properties');
      }
    }
  }

  /**
   * Validate metadata structure
   */
  validateMetadata(metadata: any): ValidationResult {
    const errors: string[] = [];

    if (!metadata) {
      errors.push('Metadata is required');
      return { valid: false, errors };
    }

    if (metadata.version !== 1) {
      errors.push('Metadata version must be 1');
    }

    if (!metadata.property_type) {
      errors.push('Metadata must include property_type');
    }

    if (!metadata.lease_group || !['SHORT', 'MID', 'LONG'].includes(metadata.lease_group)) {
      errors.push('Metadata must include valid lease_group (SHORT, MID, or LONG)');
    }

    if (!metadata.details || typeof metadata.details !== 'object') {
      errors.push('Metadata must include details object');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get lease group from rental duration type
   */
  private getLeaseGroup(rentalDurationType: string): 'SHORT' | 'MID' | 'LONG' {
    if (rentalDurationType === 'SHORT_TERM') return 'SHORT';
    if (rentalDurationType === 'MEDIUM_TERM') return 'MID';
    if (rentalDurationType === 'LONG_TERM') return 'LONG';
    return 'MID'; // default
  }

  /**
   * Parse time string to minutes
   */
  private parseTime(timeStr: string): number | null {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    
    return hours * 60 + minutes;
  }

  /**
   * Validate required fields by property type
   */
  validateRequiredFieldsByType(propertyCategory: string, data: any): ValidationResult {
    const errors: string[] = [];

    // Residential types need bedrooms/bathrooms
    const residentialTypes = [
      'HOMESTAY', 'GUESTHOUSE', 'HOTEL', 'SERVICED_APARTMENT_SHORT',
      'VILLA_RESORT', 'AIRBNB_ROOM', 'PRIVATE_HOUSE', 'ROOM_RENTAL',
      'APARTMENT', 'SERVICED_APARTMENT_MEDIUM', 'WHOLE_HOUSE',
      'LUXURY_APARTMENT', 'VILLA_LONG', 'SHOPHOUSE'
    ];

    if (residentialTypes.includes(propertyCategory)) {
      if (data.bedrooms === undefined || data.bedrooms === null) {
        errors.push(`Bedrooms is required for ${propertyCategory}`);
      }
      if (data.bathrooms === undefined || data.bathrooms === null) {
        errors.push(`Bathrooms is required for ${propertyCategory}`);
      }
    }

    // Commercial types need frontage
    const commercialTypes = ['RETAIL_SPACE_SMALL', 'COMMERCIAL_SPACE', 'SHOPHOUSE', 'LAND_PLOT'];
    if (commercialTypes.includes(propertyCategory)) {
      if (!data.frontage_m) {
        errors.push(`Frontage is required for ${propertyCategory}`);
      }
    }

    // Office/Factory need specific fields
    if (propertyCategory === 'OFFICE') {
      const metadata = data.metadata as PropertyMetadata;
      if (!metadata?.details || !(metadata.details as any).business_purpose) {
        errors.push('Business purpose is required for OFFICE');
      }
    }

    if (propertyCategory === 'FACTORY') {
      const metadata = data.metadata as PropertyMetadata;
      const details = metadata?.details as any;
      if (!details?.power_capacity_kw) {
        errors.push('Power capacity is required for FACTORY');
      }
      if (details?.three_phase_power === undefined) {
        errors.push('Three phase power specification is required for FACTORY');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
