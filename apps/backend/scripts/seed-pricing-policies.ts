/**
 * Seed Pricing Policies
 * Create sample pricing policies for all 21 property types
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Pricing Policies...\n');

  // Get first org
  const org = await prisma.organization.findFirst();
  if (!org) {
    console.error('❌ No organization found. Please create an organization first.');
    return;
  }

  console.log(`✅ Using organization: ${org.name} (${org.id})\n`);

  const policies = [
    // SHORT_TERM Policies
    {
      name: 'Homestay Standard - Hà Nội',
      description: 'Giá chuẩn cho homestay tại Hà Nội',
      property_category: 'HOMESTAY',
      rental_duration_type: 'SHORT_TERM',
      scope_province: 'Hà Nội',
      base_price: 300000,
      price_unit: 'NIGHT',
      min_rent_duration: 1,
      booking_hold_deposit: 300000,
      service_fee: 50000,
      pricing_details: {
        extra_guest_fee: 50000,
        extra_guest_threshold: 2,
        cleaning_fee: 100000,
        weekly_discount_percent: 10,
        monthly_discount_percent: 20,
        cancellation_policy: 'FLEXIBLE',
      },
    },
    {
      name: 'Khách sạn 3 sao - TP.HCM',
      description: 'Giá phòng khách sạn 3 sao tại TP.HCM',
      property_category: 'HOTEL',
      rental_duration_type: 'SHORT_TERM',
      scope_province: 'Hồ Chí Minh',
      base_price: 500000,
      price_unit: 'NIGHT',
      min_rent_duration: 1,
      booking_hold_deposit: 500000,
      service_fee: 100000,
      pricing_details: {
        extra_guest_fee: 100000,
        cleaning_fee: 150000,
        breakfast_included: true,
        cancellation_policy: 'MODERATE',
      },
    },
    {
      name: 'Villa Biển - Đà Nẵng',
      description: 'Giá villa view biển tại Đà Nẵng',
      property_category: 'VILLA',
      rental_duration_type: 'SHORT_TERM',
      scope_province: 'Đà Nẵng',
      base_price: 3000000,
      price_unit: 'NIGHT',
      min_rent_duration: 2,
      booking_hold_deposit: 5000000,
      service_fee: 500000,
      pricing_details: {
        extra_guest_fee: 200000,
        extra_guest_threshold: 6,
        cleaning_fee: 500000,
        weekly_discount_percent: 15,
        cancellation_policy: 'STRICT',
      },
    },

    // MEDIUM_TERM Policies
    {
      name: 'Căn hộ 2PN - Quận 1',
      description: 'Giá thuê căn hộ 2 phòng ngủ tại Quận 1',
      property_category: 'APARTMENT',
      rental_duration_type: 'MEDIUM_TERM',
      scope_province: 'Hồ Chí Minh',
      scope_district: 'Quận 1',
      base_price: 15000000,
      price_unit: 'MONTH',
      min_rent_duration: 3,
      deposit_amount: 30000000,
      service_fee: 1000000,
      building_management_fee: 500000,
      electricity_billing: 'METER_PRIVATE',
      water_billing: 'METER_PRIVATE',
      pricing_details: {
        internet_included: true,
        parking_fee: 500000,
      },
    },
    {
      name: 'Nhà phố 3 tầng - Hà Nội',
      description: 'Giá thuê nhà phố 3 tầng tại Hà Nội',
      property_category: 'TOWNHOUSE',
      rental_duration_type: 'MEDIUM_TERM',
      scope_province: 'Hà Nội',
      base_price: 20000000,
      price_unit: 'MONTH',
      min_rent_duration: 6,
      deposit_amount: 40000000,
      service_fee: 1500000,
      electricity_billing: 'METER_PRIVATE',
      water_billing: 'METER_PRIVATE',
      pricing_details: {
        parking_slots: 2,
        garden_maintenance_fee: 500000,
      },
    },
    {
      name: 'Phòng trọ sinh viên - Hà Nội',
      description: 'Giá phòng trọ cho sinh viên tại Hà Nội',
      property_category: 'BOARDING_ROOM',
      rental_duration_type: 'MEDIUM_TERM',
      scope_province: 'Hà Nội',
      base_price: 2500000,
      price_unit: 'MONTH',
      min_rent_duration: 3,
      deposit_amount: 2500000,
      electricity_billing: 'OWNER_RATE',
      water_billing: 'OWNER_RATE',
      pricing_details: {
        internet_included: true,
        electricity_rate_per_kwh: 3500,
        water_rate_per_m3: 20000,
      },
    },

    // LONG_TERM Policies
    {
      name: 'Văn phòng 100m² - Quận 3',
      description: 'Giá thuê văn phòng 100m² tại Quận 3',
      property_category: 'OFFICE',
      rental_duration_type: 'LONG_TERM',
      scope_province: 'Hồ Chí Minh',
      scope_district: 'Quận 3',
      base_price: 30000000,
      price_unit: 'MONTH',
      min_rent_duration: 12,
      deposit_amount: 90000000,
      service_fee: 2000000,
      building_management_fee: 1500000,
      electricity_billing: 'METER_PRIVATE',
      water_billing: 'METER_PRIVATE',
      pricing_details: {
        parking_slots: 5,
        yearly_increase_percent: 5,
      },
    },
    {
      name: 'Mặt bằng kinh doanh - Quận 1',
      description: 'Giá thuê mặt bằng kinh doanh tại Quận 1',
      property_category: 'RETAIL_SPACE',
      rental_duration_type: 'LONG_TERM',
      scope_province: 'Hồ Chí Minh',
      scope_district: 'Quận 1',
      base_price: 50000000,
      price_unit: 'MONTH',
      min_rent_duration: 24,
      deposit_amount: 150000000,
      service_fee: 3000000,
      building_management_fee: 2000000,
      electricity_billing: 'METER_PRIVATE',
      water_billing: 'METER_PRIVATE',
      pricing_details: {
        yearly_increase_percent: 7,
        signage_fee: 5000000,
      },
    },
    {
      name: 'Kho xưởng 500m² - Bình Dương',
      description: 'Giá thuê kho xưởng 500m² tại Bình Dương',
      property_category: 'WAREHOUSE',
      rental_duration_type: 'LONG_TERM',
      scope_province: 'Bình Dương',
      base_price: 25000000,
      price_unit: 'MONTH',
      min_rent_duration: 12,
      deposit_amount: 75000000,
      service_fee: 1500000,
      electricity_billing: 'METER_PRIVATE',
      water_billing: 'METER_PRIVATE',
      pricing_details: {
        loading_dock_fee: 2000000,
        security_fee: 1000000,
        yearly_increase_percent: 5,
      },
    },
    {
      name: 'Đất nông nghiệp - Long An',
      description: 'Giá thuê đất nông nghiệp tại Long An',
      property_category: 'AGRICULTURAL_LAND',
      rental_duration_type: 'LONG_TERM',
      scope_province: 'Long An',
      base_price: 5000000,
      price_unit: 'MONTH',
      min_rent_duration: 12,
      deposit_amount: 15000000,
      pricing_details: {
        water_access_fee: 500000,
        yearly_increase_percent: 3,
      },
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const policyData of policies) {
    try {
      // Check if policy already exists
      const existing = await prisma.pricingPolicy.findFirst({
        where: {
          org_id: org.id,
          name: policyData.name,
        },
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${policyData.name} (already exists)`);
        skipped++;
        continue;
      }

      // Create policy
      const policy = await prisma.pricingPolicy.create({
        data: {
          org_id: org.id,
          ...policyData,
          status: 'ACTIVE',
          version: 1,
          effective_from: new Date(),
          pricing_mode: 'FIXED',
        },
      });

      // Create version record
      await prisma.pricingPolicyVersion.create({
        data: {
          policy_id: policy.id,
          version: 1,
          policy_snapshot: policy as any,
          change_type: 'CREATED',
          change_reason: 'Initial creation',
          changed_at: new Date(),
        },
      });

      console.log(`✅ Created: ${policyData.name}`);
      created++;
    } catch (error) {
      console.error(`❌ Failed to create ${policyData.name}:`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${policies.length}`);
  console.log('\n✅ Seeding completed!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
