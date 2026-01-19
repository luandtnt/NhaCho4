import { Test, TestingModule } from '@nestjs/testing';
import { PricingCalculatorService } from './pricing-calculator.service';

describe('PricingCalculatorService', () => {
  let service: PricingCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricingCalculatorService],
    }).compile();

    service = module.get<PricingCalculatorService>(PricingCalculatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateShortTermPrice', () => {
    it('should calculate basic short-term price', () => {
      const rentableItem: any = {
        id: 'test-id',
        rental_duration_type: 'SHORT_TERM',
      };

      const pricingPolicy: any = {
        config: {
          config: {
            base_amount: 1000000,
            fees: {
              cleaning_fee: 200000,
              service_fee_percent: 5,
            },
          },
        },
      };

      const startDate = new Date('2026-01-20');
      const endDate = new Date('2026-01-25');

      const result = service.calculateShortTermPrice({
        rentableItem,
        pricingPolicy,
        startDate,
        endDate,
      });

      expect(result.nights).toBe(5);
      expect(result.base_price).toBe(5000000); // 5 nights * 1M
      expect(result.cleaning_fee).toBe(200000);
      expect(result.service_fee).toBe(250000); // 5% of 5M
      expect(result.total_price).toBe(5450000);
    });

    it('should apply weekday rates', () => {
      const rentableItem: any = {
        id: 'test-id',
        rental_duration_type: 'SHORT_TERM',
      };

      const pricingPolicy: any = {
        config: {
          config: {
            base_amount: 1000000,
            weekday_rates: {
              0: 1500000, // Sunday
              6: 1500000, // Saturday
            },
            fees: {},
          },
        },
      };

      // Jan 25, 2026 is Sunday, Jan 24 is Saturday
      const startDate = new Date('2026-01-24');
      const endDate = new Date('2026-01-26');

      const result = service.calculateShortTermPrice({
        rentableItem,
        pricingPolicy,
        startDate,
        endDate,
      });

      expect(result.nights).toBe(2);
      // Should be 1.5M (Sat) + 1.5M (Sun) = 3M
      expect(result.base_price).toBe(3000000);
    });

    it('should apply duration discount', () => {
      const rentableItem: any = {
        id: 'test-id',
        rental_duration_type: 'SHORT_TERM',
      };

      const pricingPolicy: any = {
        config: {
          config: {
            base_amount: 1000000,
            duration_discounts: [
              { min_days: 7, discount_percent: 10 },
              { min_days: 30, discount_percent: 20 },
            ],
            fees: {},
          },
        },
      };

      const startDate = new Date('2026-01-20');
      const endDate = new Date('2026-01-27'); // 7 nights

      const result = service.calculateShortTermPrice({
        rentableItem,
        pricingPolicy,
        startDate,
        endDate,
      });

      expect(result.nights).toBe(7);
      expect(result.breakdown.discount_applied).toBe(10);
      // 7M * 0.9 = 6.3M
      expect(result.base_price).toBe(6300000);
    });

    it('should apply seasonal rates', () => {
      const rentableItem: any = {
        id: 'test-id',
        rental_duration_type: 'SHORT_TERM',
      };

      const pricingPolicy: any = {
        config: {
          config: {
            base_amount: 1000000,
            seasonal_rates: [
              {
                name: 'Tết',
                start_month: 1,
                start_day: 20,
                end_month: 2,
                end_day: 5,
                rate_multiplier: 1.5,
              },
            ],
            fees: {},
          },
        },
      };

      const startDate = new Date('2026-01-20');
      const endDate = new Date('2026-01-25');

      const result = service.calculateShortTermPrice({
        rentableItem,
        pricingPolicy,
        startDate,
        endDate,
      });

      expect(result.nights).toBe(5);
      // 5 nights * 1M * 1.5 = 7.5M
      expect(result.base_price).toBe(7500000);
    });
  });

  describe('calculateMediumTermPrice', () => {
    it('should calculate basic medium-term price', () => {
      const rentableItem: any = {
        id: 'test-id',
        rental_duration_type: 'MEDIUM_TERM',
      };

      const pricingPolicy: any = {
        config: {
          config: {
            base_amount: 10000000,
            fees: {
              deposit_months: 2,
            },
          },
        },
      };

      const startDate = new Date('2026-02-01');
      const months = 3;

      const result = service.calculateMediumTermPrice({
        rentableItem,
        pricingPolicy,
        startDate,
        months,
      });

      expect(result.total_months).toBe(3);
      expect(result.monthly_price).toBe(10000000);
      expect(result.total_price).toBe(30000000); // 3 months * 10M
      expect(result.deposit_amount).toBe(20000000); // 2 months deposit
      expect(result.first_payment).toBe(50000000); // 30M + 20M
    });

    it('should apply duration discount for medium-term', () => {
      const rentableItem: any = {
        id: 'test-id',
        rental_duration_type: 'MEDIUM_TERM',
      };

      const pricingPolicy: any = {
        config: {
          config: {
            base_amount: 10000000,
            duration_discounts: [
              { min_days: 90, discount_percent: 10 }, // 3 months
            ],
            fees: {
              deposit_months: 1,
            },
          },
        },
      };

      const startDate = new Date('2026-02-01');
      const months = 3;

      const result = service.calculateMediumTermPrice({
        rentableItem,
        pricingPolicy,
        startDate,
        months,
      });

      expect(result.breakdown.discount_applied).toBe(10);
      // 30M * 0.9 = 27M
      expect(result.total_price).toBe(27000000);
    });
  });

  describe('calculateLongTermPrice', () => {
    it('should calculate basic long-term price', () => {
      const rentableItem: any = {
        id: 'test-id',
        rental_duration_type: 'LONG_TERM',
      };

      const pricingPolicy: any = {
        config: {
          config: {
            base_amount: 10000000,
            annual_increase_percent: 0,
            fees: {
              deposit_months: 3,
            },
          },
        },
      };

      const startDate = new Date('2026-03-01');
      const years = 2;

      const result = service.calculateLongTermPrice({
        rentableItem,
        pricingPolicy,
        startDate,
        years,
      });

      expect(result.total_years).toBe(2);
      expect(result.base_monthly_price).toBe(10000000);
      expect(result.yearly_prices).toBeDefined();
      expect(result.yearly_prices).toHaveLength(2);
      expect(result.yearly_prices![0]).toBe(120000000); // 10M * 12
      expect(result.yearly_prices![1]).toBe(120000000); // No increase
      expect(result.total_price).toBe(240000000);
      expect(result.deposit_amount).toBe(30000000); // 3 months
    });

    it('should apply annual increase', () => {
      const rentableItem: any = {
        id: 'test-id',
        rental_duration_type: 'LONG_TERM',
      };

      const pricingPolicy: any = {
        config: {
          config: {
            base_amount: 10000000,
            annual_increase_percent: 5,
            fees: {
              deposit_months: 3,
            },
          },
        },
      };

      const startDate = new Date('2026-03-01');
      const years = 3;

      const result = service.calculateLongTermPrice({
        rentableItem,
        pricingPolicy,
        startDate,
        years,
      });

      expect(result.total_years).toBe(3);
      expect(result.breakdown.annual_increase_percent).toBe(5);
      expect(result.yearly_prices).toBeDefined();
      expect(result.yearly_prices).toHaveLength(3);
      
      // Year 1: 10M * 12 = 120M
      expect(result.yearly_prices![0]).toBe(120000000);
      
      // Year 2: 10M * 1.05 * 12 = 126M
      expect(result.yearly_prices![1]).toBe(126000000);
      
      // Year 3: 10M * 1.05^2 * 12 = 132.3M
      expect(result.yearly_prices![2]).toBeCloseTo(132300000, -3);
    });
  });

  describe('edge cases', () => {
    it('should handle single night booking', () => {
      const rentableItem: any = {
        id: 'test-id',
        rental_duration_type: 'SHORT_TERM',
      };

      const pricingPolicy: any = {
        config: {
          config: {
            base_amount: 1000000,
            fees: {},
          },
        },
      };

      const startDate = new Date('2026-01-20');
      const endDate = new Date('2026-01-21');

      const result = service.calculateShortTermPrice({
        rentableItem,
        pricingPolicy,
        startDate,
        endDate,
      });

      expect(result.nights).toBe(1);
      expect(result.base_price).toBe(1000000);
    });

    it('should handle zero fees', () => {
      const rentableItem: any = {
        id: 'test-id',
        rental_duration_type: 'SHORT_TERM',
      };

      const pricingPolicy: any = {
        config: {
          config: {
            base_amount: 1000000,
            fees: {},
          },
        },
      };

      const startDate = new Date('2026-01-20');
      const endDate = new Date('2026-01-25');

      const result = service.calculateShortTermPrice({
        rentableItem,
        pricingPolicy,
        startDate,
        endDate,
      });

      expect(result.cleaning_fee).toBe(0);
      expect(result.service_fee).toBe(0);
      expect(result.total_price).toBe(result.base_price);
    });

    it('should handle missing seasonal rates', () => {
      const rentableItem: any = {
        id: 'test-id',
        rental_duration_type: 'SHORT_TERM',
      };

      const pricingPolicy: any = {
        config: {
          config: {
            base_amount: 1000000,
            fees: {},
          },
        },
      };

      const startDate = new Date('2026-01-20');
      const endDate = new Date('2026-01-25');

      const result = service.calculateShortTermPrice({
        rentableItem,
        pricingPolicy,
        startDate,
        endDate,
      });

      expect(result.base_price).toBe(5000000);
    });
  });
});
