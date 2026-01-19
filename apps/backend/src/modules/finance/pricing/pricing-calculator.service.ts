import { Injectable } from '@nestjs/common';
import { RentableItem } from '@prisma/client';

export interface PriceBreakdown {
  base_price?: number;
  cleaning_fee?: number;
  service_fee?: number;
  total_price: number;
  nights?: number;
  monthly_price?: number;
  total_months?: number;
  deposit_amount?: number;
  first_payment?: number;
  base_monthly_price?: number;
  total_years?: number;
  yearly_prices?: number[];
  breakdown: {
    per_night_avg?: number;
    discount_applied?: number;
    annual_increase_percent?: number;
  };
}

export interface CalculateShortTermParams {
  rentableItem: RentableItem;
  pricingPolicy: any;
  startDate: Date;
  endDate: Date;
  guests?: number;
}

export interface CalculateMediumTermParams {
  rentableItem: RentableItem;
  pricingPolicy: any;
  startDate: Date;
  months: number;
}

export interface CalculateLongTermParams {
  rentableItem: RentableItem;
  pricingPolicy: any;
  startDate: Date;
  years: number;
}

@Injectable()
export class PricingCalculatorService {
  
  // Calculate price for short-term rentals (per night)
  calculateShortTermPrice(params: CalculateShortTermParams): PriceBreakdown {
    const nights = this.calculateNights(params.startDate, params.endDate);
    let totalPrice = 0;
    
    const policyConfig = (params.pricingPolicy.config as any)?.config || {};
    const baseAmount = policyConfig.base_amount || 0;
    
    // Calculate each night with weekday/seasonal adjustments
    for (let i = 0; i < nights; i++) {
      const currentDate = this.addDays(params.startDate, i);
      let nightPrice = baseAmount;
      
      // Weekday adjustment
      const dayOfWeek = currentDate.getDay();
      if (policyConfig.weekday_rates && policyConfig.weekday_rates[dayOfWeek]) {
        nightPrice = policyConfig.weekday_rates[dayOfWeek];
      }
      
      // Seasonal adjustment
      const seasonalRate = this.findSeasonalRate(currentDate, policyConfig);
      if (seasonalRate) {
        nightPrice *= seasonalRate.rate_multiplier;
      }
      
      totalPrice += nightPrice;
    }
    
    // Duration discount
    const discount = this.calculateDurationDiscount(nights, policyConfig);
    totalPrice *= (1 - discount / 100);
    
    // Fees
    const fees = policyConfig.fees || {};
    const cleaningFee = fees.cleaning_fee || 0;
    const serviceFeePercent = fees.service_fee_percent || 0;
    const serviceFee = totalPrice * serviceFeePercent / 100;
    
    return {
      base_price: totalPrice,
      cleaning_fee: cleaningFee,
      service_fee: serviceFee,
      total_price: totalPrice + cleaningFee + serviceFee,
      nights,
      breakdown: {
        per_night_avg: totalPrice / nights,
        discount_applied: discount
      }
    };
  }
  
  // Calculate price for medium-term rentals (per month)
  calculateMediumTermPrice(params: CalculateMediumTermParams): PriceBreakdown {
    const policyConfig = (params.pricingPolicy.config as any)?.config || {};
    const monthlyPrice = policyConfig.base_amount || 0;
    let totalPrice = monthlyPrice * params.months;
    
    // Duration discount
    const discount = this.calculateDurationDiscount(params.months * 30, policyConfig);
    totalPrice *= (1 - discount / 100);
    
    // Deposit
    const fees = policyConfig.fees || {};
    const depositMonths = fees.deposit_months || 1;
    const depositAmount = monthlyPrice * depositMonths;
    
    return {
      monthly_price: monthlyPrice,
      total_months: params.months,
      total_price: totalPrice,
      deposit_amount: depositAmount,
      first_payment: totalPrice + depositAmount,
      breakdown: {
        discount_applied: discount
      }
    };
  }
  
  // Calculate price for long-term rentals (per year with escalation)
  calculateLongTermPrice(params: CalculateLongTermParams): PriceBreakdown {
    const policyConfig = (params.pricingPolicy.config as any)?.config || {};
    const baseMonthlyPrice = policyConfig.base_amount || 0;
    const annualIncrease = policyConfig.annual_increase_percent || 0;
    
    const yearlyPrices: number[] = [];
    for (let year = 0; year < params.years; year++) {
      const yearPrice = baseMonthlyPrice * Math.pow(1 + annualIncrease / 100, year) * 12;
      yearlyPrices.push(yearPrice);
    }
    
    const totalPrice = yearlyPrices.reduce((sum, price) => sum + price, 0);
    const fees = policyConfig.fees || {};
    const depositMonths = fees.deposit_months || 3;
    const depositAmount = baseMonthlyPrice * depositMonths;
    
    return {
      base_monthly_price: baseMonthlyPrice,
      total_years: params.years,
      yearly_prices: yearlyPrices,
      total_price: totalPrice,
      deposit_amount: depositAmount,
      breakdown: {
        annual_increase_percent: annualIncrease
      }
    };
  }

  // Helper: Calculate nights between two dates
  private calculateNights(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Helper: Add days to a date
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Helper: Find seasonal rate for a date
  private findSeasonalRate(date: Date, policyConfig: any): any {
    if (!policyConfig.seasonal_rates || !Array.isArray(policyConfig.seasonal_rates)) {
      return null;
    }

    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    for (const season of policyConfig.seasonal_rates) {
      if (this.isDateInSeason(month, day, season)) {
        return season;
      }
    }

    return null;
  }

  // Helper: Check if date is in season
  private isDateInSeason(month: number, day: number, season: any): boolean {
    const startMonth = season.start_month;
    const startDay = season.start_day;
    const endMonth = season.end_month;
    const endDay = season.end_day;

    if (startMonth === endMonth) {
      return month === startMonth && day >= startDay && day <= endDay;
    }

    if (startMonth < endMonth) {
      if (month > startMonth && month < endMonth) return true;
      if (month === startMonth && day >= startDay) return true;
      if (month === endMonth && day <= endDay) return true;
    } else {
      // Season crosses year boundary
      if (month > startMonth || month < endMonth) return true;
      if (month === startMonth && day >= startDay) return true;
      if (month === endMonth && day <= endDay) return true;
    }

    return false;
  }

  // Helper: Calculate duration discount
  private calculateDurationDiscount(days: number, policyConfig: any): number {
    if (!policyConfig.duration_discounts || !Array.isArray(policyConfig.duration_discounts)) {
      return 0;
    }

    // Find the highest applicable discount
    let maxDiscount = 0;
    for (const discount of policyConfig.duration_discounts) {
      if (days >= discount.min_days && discount.discount_percent > maxDiscount) {
        maxDiscount = discount.discount_percent;
      }
    }

    return maxDiscount;
  }
}
