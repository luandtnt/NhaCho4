import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');
  console.log('📦 This will restore data for all completed modules\n');

  // ============================================================================
  // 1. ORGANIZATIONS & USERS
  // ============================================================================
  console.log('1️⃣ Creating Organizations & Users...');

  const org1 = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Demo Landlord Org',
      status: 'ACTIVE',
    },
  });

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const landlord = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000011',
      org_id: org1.id,
      email: 'landlord@example.com',
      password_hash: passwordHash,
      role: 'Landlord',
      status: 'ACTIVE',
      name: 'Nguyễn Văn Chủ',
      phone: '+84901234567',
      id_number: '001234567890',
      scopes: [
        'listings:write',
        'assets:write',
        'agreements:write',
        'pricing_policy:*',
        'invoice:*',
        'payment:*',
        'ledger:*',
      ],
      assigned_asset_ids: [],
    },
  });

  const tenant = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000012' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000012',
      org_id: org1.id,
      email: 'tenant@example.com',
      password_hash: passwordHash,
      role: 'Tenant',
      status: 'ACTIVE',
      name: 'Trần Thị Thuê',
      phone: '+84907654321',
      id_number: '009876543210',
      emergency_contact: '+84912345678',
      scopes: ['bookings:write', 'payments:write'],
      assigned_asset_ids: [],
    },
  });

  const admin = await prisma.user.upsert({
    where: { id: '00000000-0000-0000-0000-000000000013' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000013',
      org_id: org1.id,
      email: 'admin@example.com',
      password_hash: passwordHash,
      role: 'OrgAdmin',
      status: 'ACTIVE',
      name: 'Admin User',
      phone: '+84909999999',
      scopes: ['*'],
      assigned_asset_ids: [],
    },
  });

  console.log('   ✅ Organizations created');
  console.log('   ✅ Users created:');
  console.log('      - landlord@example.com / Password123!');
  console.log('      - tenant@example.com / Password123!');
  console.log('      - admin@example.com / Password123!\n');

  // ============================================================================
  // 2. PARTIES
  // ============================================================================
  console.log('2️⃣ Creating Parties...');

  const landlordParty = await prisma.party.create({
    data: {
      id: '00000000-0000-0000-0000-000000000001',
      org_id: org1.id,
      party_type: 'LANDLORD',
      name: 'Nguyễn Văn Chủ',
      email: 'landlord@example.com',
      phone: '+84901234567',
      metadata: {
        id_number: '001234567890',
        address: '123 Đường Láng, Ba Đình, Hà Nội',
      },
    },
  });

  const tenantParty = await prisma.party.create({
    data: {
      id: '00000000-0000-0000-0000-000000000002',
      org_id: org1.id,
      party_type: 'TENANT',
      name: 'Trần Thị Thuê',
      email: 'tenant@example.com',
      phone: '+84907654321',
      metadata: {
        id_number: '009876543210',
        emergency_contact: '+84912345678',
      },
    },
  });

  console.log('   ✅ Parties created\n');

  // ============================================================================
  // 3. CONFIG BUNDLE
  // ============================================================================
  console.log('3️⃣ Creating Config Bundle...');

  const configBundle = await prisma.configBundle.create({
    data: {
      org_id: org1.id,
      bundle_id: 'cfg_2026_01_19_001',
      version: '1.0.0',
      status: 'ACTIVE',
      config: {
        asset_types: {
          apartment_building: {
            schema_ref: 'schemas/apartment_building.json',
          },
          apartment_monthly: {
            schema_ref: 'schemas/apartment.json',
          },
          coworking_hourly: {
            schema_ref: 'schemas/coworking.json',
          },
        },
        pricing: {
          policies: ['pricing/apartment_monthly.json'],
        },
        workflows: {
          agreement: 'workflows/agreement.json',
          billing: 'workflows/billing.json',
        },
      },
    },
  });

  console.log('   ✅ Config bundle created\n');

  // ============================================================================
  // 4. ASSETS & SPACE NODES
  // ============================================================================
  console.log('4️⃣ Creating Assets & Space Nodes...');

  // Asset 1: Sunrise Apartments (Mid-term)
  const asset1 = await prisma.asset.create({
    data: {
      org_id: org1.id,
      asset_type: 'apartment_monthly',
      name: 'Sunrise Apartments',
      address_json: {
        street: '123 Đường Láng',
        ward: 'Láng Thượng',
        district: 'Ba Đình',
        city: 'Hà Nội',
        country: 'Việt Nam',
      },
      status: 'ACTIVE',
      attrs: {
        year_built: 2020,
        total_units: 50,
        elevator: true,
        parking: true,
      },
    },
  });

  // Building A
  const building1 = await prisma.spaceNode.create({
    data: {
      org_id: org1.id,
      asset_id: asset1.id,
      node_type: 'building',
      name: 'Tòa A',
      path: '/toa-a',
      attrs: { floors: 10 },
    },
  });

  // Floor 1
  const floor1 = await prisma.spaceNode.create({
    data: {
      org_id: org1.id,
      asset_id: asset1.id,
      parent_id: building1.id,
      node_type: 'floor',
      name: 'Tầng 1',
      path: '/toa-a/tang-1',
      attrs: { floor_number: 1 },
    },
  });

  // Units on Floor 1
  const unit101 = await prisma.spaceNode.create({
    data: {
      org_id: org1.id,
      asset_id: asset1.id,
      parent_id: floor1.id,
      node_type: 'unit',
      name: 'Căn 101',
      path: '/toa-a/tang-1/can-101',
      attrs: {
        bedrooms: 2,
        bathrooms: 1,
        floor_area: 75,
      },
    },
  });

  const unit102 = await prisma.spaceNode.create({
    data: {
      org_id: org1.id,
      asset_id: asset1.id,
      parent_id: floor1.id,
      node_type: 'unit',
      name: 'Căn 102',
      path: '/toa-a/tang-1/can-102',
      attrs: {
        bedrooms: 3,
        bathrooms: 2,
        floor_area: 95,
      },
    },
  });

  // Floor 2
  const floor2 = await prisma.spaceNode.create({
    data: {
      org_id: org1.id,
      asset_id: asset1.id,
      parent_id: building1.id,
      node_type: 'floor',
      name: 'Tầng 2',
      path: '/toa-a/tang-2',
      attrs: { floor_number: 2 },
    },
  });

  const unit201 = await prisma.spaceNode.create({
    data: {
      org_id: org1.id,
      asset_id: asset1.id,
      parent_id: floor2.id,
      node_type: 'unit',
      name: 'Căn 201',
      path: '/toa-a/tang-2/can-201',
      attrs: {
        bedrooms: 2,
        bathrooms: 1,
        floor_area: 75,
      },
    },
  });

  console.log('   ✅ Asset 1: Sunrise Apartments created');
  console.log('   ✅ Space nodes: 1 building, 2 floors, 3 units\n');

  // ============================================================================
  // 5. PRICING POLICIES
  // ============================================================================
  console.log('5️⃣ Creating Pricing Policies...');

  const pricingPolicy1 = await prisma.pricingPolicy.create({
    data: {
      org_id: org1.id,
      name: 'Chính sách giá Chung cư Hà Nội - Trung hạn',
      description: 'Chính sách giá cho chung cư tại Hà Nội, thuê theo tháng',
      status: 'ACTIVE',
      version: 1,
      property_category: 'APARTMENT',
      rental_duration_type: 'MID_TERM',
      scope_province: 'Hà Nội',
      pricing_mode: 'FIXED',
      base_price: 12000000,
      price_unit: 'MONTH',
      min_rent_duration: 3,
      deposit_amount: 24000000,
      booking_hold_deposit: 2000000,
      service_fee: 500000,
      building_management_fee: 300000,
      electricity_billing: 'METER_PRIVATE',
      water_billing: 'METER_PRIVATE',
      pricing_details: {
        electricity_rate: 3500,
        water_rate: 15000,
      },
      created_by: landlord.id,
    },
  });

  const pricingPolicy2 = await prisma.pricingPolicy.create({
    data: {
      org_id: org1.id,
      name: 'Chính sách giá Chung cư cao cấp - Trung hạn',
      description: 'Chính sách giá cho chung cư cao cấp, thuê theo tháng',
      status: 'ACTIVE',
      version: 1,
      property_category: 'APARTMENT',
      rental_duration_type: 'MID_TERM',
      scope_province: 'Hà Nội',
      scope_district: 'Ba Đình',
      pricing_mode: 'FIXED',
      base_price: 18000000,
      price_unit: 'MONTH',
      min_rent_duration: 6,
      deposit_amount: 36000000,
      booking_hold_deposit: 3000000,
      service_fee: 800000,
      building_management_fee: 500000,
      electricity_billing: 'METER_PRIVATE',
      water_billing: 'METER_PRIVATE',
      pricing_details: {
        electricity_rate: 3500,
        water_rate: 15000,
      },
      created_by: landlord.id,
    },
  });

  console.log('   ✅ 2 Pricing policies created\n');

  // ============================================================================
  // 6. RENTABLE ITEMS
  // ============================================================================
  console.log('6️⃣ Creating Rentable Items...');

  const rentableItem1 = await prisma.rentableItem.create({
    data: {
      org_id: org1.id,
      space_node_id: unit101.id,
      code: 'UNIT-101',
      allocation_type: 'exclusive',
      status: 'ACTIVE',
      property_category: 'APARTMENT',
      rental_duration_type: 'MID_TERM',
      min_rental_days: 90,
      pricing_unit: 'PER_MONTH',
      address_full: '123 Đường Láng, Láng Thượng, Ba Đình, Hà Nội',
      province: 'Hà Nội',
      district: 'Ba Đình',
      ward: 'Láng Thượng',
      base_price: 12000000,
      price_unit: 'MONTH',
      currency: 'VND',
      min_rent_duration: 3,
      deposit_amount: 24000000,
      booking_hold_deposit: 2000000,
      service_fee: 500000,
      building_mgmt_fee: 300000,
      area_sqm: 75,
      bedrooms: 2,
      bathrooms: 1,
      apartment_floor: 1,
      direction: 'SOUTH',
      balcony: true,
      parking_slots: 1,
      furnishing_level: 'FULL',
      amenities: ['wifi', 'air_conditioner', 'washing_machine', 'refrigerator', 'tv'],
      electricity_billing: 'METER_PRIVATE',
      water_billing: 'METER_PRIVATE',
      pricing_policy_id: pricingPolicy1.id,
      pricing_policy_version: 1,
      metadata: {
        version: 1,
        electricity_rate: 3500,
        water_rate: 15000,
      },
      attrs: {
        furnished: 'full',
        parking_included: true,
      },
    },
  });

  const rentableItem2 = await prisma.rentableItem.create({
    data: {
      org_id: org1.id,
      space_node_id: unit102.id,
      code: 'UNIT-102',
      allocation_type: 'exclusive',
      status: 'ACTIVE',
      property_category: 'APARTMENT',
      rental_duration_type: 'MID_TERM',
      min_rental_days: 180,
      pricing_unit: 'PER_MONTH',
      address_full: '123 Đường Láng, Láng Thượng, Ba Đình, Hà Nội',
      province: 'Hà Nội',
      district: 'Ba Đình',
      ward: 'Láng Thượng',
      base_price: 18000000,
      price_unit: 'MONTH',
      currency: 'VND',
      min_rent_duration: 6,
      deposit_amount: 36000000,
      booking_hold_deposit: 3000000,
      service_fee: 800000,
      building_mgmt_fee: 500000,
      area_sqm: 95,
      bedrooms: 3,
      bathrooms: 2,
      apartment_floor: 1,
      direction: 'EAST',
      balcony: true,
      parking_slots: 2,
      furnishing_level: 'FULL',
      amenities: ['wifi', 'air_conditioner', 'washing_machine', 'refrigerator', 'tv', 'microwave'],
      electricity_billing: 'METER_PRIVATE',
      water_billing: 'METER_PRIVATE',
      pricing_policy_id: pricingPolicy2.id,
      pricing_policy_version: 1,
      metadata: {
        version: 1,
        electricity_rate: 3500,
        water_rate: 15000,
      },
      attrs: {
        furnished: 'full',
        parking_included: true,
      },
    },
  });

  const rentableItem3 = await prisma.rentableItem.create({
    data: {
      org_id: org1.id,
      space_node_id: unit201.id,
      code: 'UNIT-201',
      allocation_type: 'exclusive',
      status: 'ACTIVE',
      property_category: 'APARTMENT',
      rental_duration_type: 'MID_TERM',
      min_rental_days: 90,
      pricing_unit: 'PER_MONTH',
      address_full: '123 Đường Láng, Láng Thượng, Ba Đình, Hà Nội',
      province: 'Hà Nội',
      district: 'Ba Đình',
      ward: 'Láng Thượng',
      base_price: 13000000,
      price_unit: 'MONTH',
      currency: 'VND',
      min_rent_duration: 3,
      deposit_amount: 26000000,
      booking_hold_deposit: 2000000,
      service_fee: 500000,
      building_mgmt_fee: 300000,
      area_sqm: 75,
      bedrooms: 2,
      bathrooms: 1,
      apartment_floor: 2,
      direction: 'SOUTH',
      balcony: true,
      parking_slots: 1,
      furnishing_level: 'PARTIAL',
      amenities: ['wifi', 'air_conditioner', 'washing_machine'],
      electricity_billing: 'METER_PRIVATE',
      water_billing: 'METER_PRIVATE',
      pricing_policy_id: pricingPolicy1.id,
      pricing_policy_version: 1,
      metadata: {
        version: 1,
        electricity_rate: 3500,
        water_rate: 15000,
      },
      attrs: {
        furnished: 'partial',
        parking_included: true,
      },
    },
  });

  console.log('   ✅ 3 Rentable items created\n');

  // ============================================================================
  // 7. LISTINGS
  // ============================================================================
  console.log('7️⃣ Creating Listings...');

  const listing1 = await prisma.listing.create({
    data: {
      org_id: org1.id,
      title: 'Căn hộ 2PN full nội thất tại Ba Đình - Sunrise Apartments',
      description: 'Căn hộ 2 phòng ngủ, 1 phòng tắm, diện tích 75m². Full nội thất cao cấp, view đẹp hướng Nam. Gần trường học, bệnh viện, siêu thị.',
      media: [
        {
          url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
          type: 'image',
          caption: 'Phòng khách',
        },
        {
          url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
          type: 'image',
          caption: 'Phòng ngủ',
        },
      ],
      tags: ['apartment', 'monthly', 'furnished', 'ba-dinh', 'hanoi'],
      pricing_display: {
        from_amount: 12000000,
        currency: 'VND',
        unit: 'tháng',
      },
      status: 'PUBLISHED',
      is_featured: true,
      view_count: 125,
      rentable_items: {
        create: [
          {
            rentable_item_id: rentableItem1.id,
          },
        ],
      },
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      org_id: org1.id,
      title: 'Căn hộ 3PN cao cấp tại Ba Đình - Sunrise Apartments',
      description: 'Căn hộ 3 phòng ngủ, 2 phòng tắm, diện tích 95m². Full nội thất cao cấp, 2 chỗ đậu xe. Phù hợp gia đình.',
      media: [
        {
          url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
          type: 'image',
          caption: 'Phòng khách',
        },
      ],
      tags: ['apartment', 'monthly', 'furnished', 'ba-dinh', 'hanoi', '3-bedroom'],
      pricing_display: {
        from_amount: 18000000,
        currency: 'VND',
        unit: 'tháng',
      },
      status: 'PUBLISHED',
      is_featured: false,
      view_count: 87,
      rentable_items: {
        create: [
          {
            rentable_item_id: rentableItem2.id,
          },
        ],
      },
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      org_id: org1.id,
      title: 'Căn hộ 2PN tầng 2 tại Ba Đình - Giá tốt',
      description: 'Căn hộ 2 phòng ngủ tầng 2, diện tích 75m². Nội thất cơ bản, giá thuê hợp lý.',
      media: [],
      tags: ['apartment', 'monthly', 'ba-dinh', 'hanoi'],
      pricing_display: {
        from_amount: 13000000,
        currency: 'VND',
        unit: 'tháng',
      },
      status: 'PUBLISHED',
      is_featured: false,
      view_count: 45,
      rentable_items: {
        create: [
          {
            rentable_item_id: rentableItem3.id,
          },
        ],
      },
    },
  });

  console.log('   ✅ 3 Listings created\n');

  // ============================================================================
  // 8. AGREEMENTS
  // ============================================================================
  console.log('8️⃣ Creating Agreements...');

  // Agreement 1: ACTIVE agreement for Unit 101
  const agreement1 = await prisma.agreement.create({
    data: {
      org_id: org1.id,
      landlord_party_id: landlordParty.id,
      tenant_party_id: tenantParty.id,
      rentable_item_id: rentableItem1.id,
      contract_code: 'AG-202601-00001',
      contract_title: 'HĐ thuê căn 2PN Sunrise Apartments - Căn 101',
      state: 'ACTIVE',
      agreement_type: 'lease',
      tenant_id_number: '009876543210',
      start_at: new Date('2026-01-01'),
      end_at: new Date('2026-12-31'),
      billing_day: 1,
      payment_due_days: 5,
      base_price: 12000000,
      deposit_amount: 24000000,
      service_fee: 500000,
      building_mgmt_fee: 300000,
      parking_fee_motorbike: 100000,
      parking_fee_car: 0,
      internet_fee: 200000,
      electricity_billing: 'METER_PRIVATE',
      electricity_rate: 3500,
      water_billing: 'METER_PRIVATE',
      water_rate: 15000,
      payment_cycle: 'MONTHLY',
      house_rules: 'Không nuôi thú cưng. Không hút thuốc trong nhà. Giữ gìn vệ sinh chung.',
      termination_clause: 'Phạt 1 tháng tiền thuê nếu chấm dứt trước hạn.',
      violation_penalty: 5000000,
      allow_pets: false,
      allow_smoking: false,
      allow_guests: true,
      handover_date: new Date('2026-01-01'),
      handover_condition: 'Căn hộ trong tình trạng tốt, đầy đủ nội thất',
      furniture_list: [
        'Giường ngủ 2 cái',
        'Tủ quần áo 2 cái',
        'Bàn ăn + 4 ghế',
        'Sofa',
        'Tủ lạnh',
        'Máy giặt',
        'Điều hòa 2 cái',
        'TV 43 inch',
      ],
      initial_electricity: 1250,
      initial_water: 85,
      activated_at: new Date('2026-01-01'),
      snapshot_terms: {
        house_rules: 'Không nuôi thú cưng. Không hút thuốc trong nhà.',
        termination_clause: 'Phạt 1 tháng tiền thuê nếu chấm dứt trước hạn.',
      },
      snapshot_pricing: {
        base_price: 12000000,
        service_fee: 500000,
        building_mgmt_fee: 300000,
        parking_fee_motorbike: 100000,
        internet_fee: 200000,
      },
    },
  });

  // Agreement 2: DRAFT agreement for Unit 102
  const agreement2 = await prisma.agreement.create({
    data: {
      org_id: org1.id,
      landlord_party_id: landlordParty.id,
      tenant_party_id: tenantParty.id,
      rentable_item_id: rentableItem2.id,
      contract_code: 'AG-202601-00002',
      contract_title: 'HĐ thuê căn 3PN Sunrise Apartments - Căn 102',
      state: 'DRAFT',
      agreement_type: 'lease',
      start_at: new Date('2026-02-01'),
      end_at: new Date('2027-01-31'),
      billing_day: 1,
      payment_due_days: 5,
      base_price: 18000000,
      deposit_amount: 36000000,
      service_fee: 800000,
      building_mgmt_fee: 500000,
      parking_fee_motorbike: 0,
      parking_fee_car: 300000,
      internet_fee: 200000,
      electricity_billing: 'METER_PRIVATE',
      electricity_rate: 3500,
      water_billing: 'METER_PRIVATE',
      water_rate: 15000,
      payment_cycle: 'MONTHLY',
      allow_pets: false,
      allow_smoking: false,
      allow_guests: true,
    },
  });

  console.log('   ✅ 2 Agreements created (1 ACTIVE, 1 DRAFT)\n');

  // ============================================================================
  // 9. BOOKINGS
  // ============================================================================
  console.log('9️⃣ Creating Bookings...');

  // Booking 1: CONFIRMED booking
  const booking1 = await prisma.booking.create({
    data: {
      org_id: org1.id,
      rentable_item_id: rentableItem3.id,
      tenant_party_id: tenantParty.id,
      start_at: new Date('2026-02-01'),
      end_at: new Date('2026-05-01'),
      quantity: 1,
      status: 'CONFIRMED',
      is_walk_in: false,
      metadata: {
        notes: 'Khách hàng yêu cầu dọn dẹp trước khi nhận nhà',
      },
    },
  });

  // Create price snapshot for booking1
  await prisma.bookingPriceSnapshot.create({
    data: {
      booking_id: booking1.id,
      pricing_policy_id: pricingPolicy1.id,
      pricing_policy_version: 1,
      base_price: 13000000,
      price_unit: 'MONTH',
      calculation_breakdown: {
        base_price: 13000000,
        months: 3,
        subtotal: 39000000,
        service_fee: 500000,
        building_mgmt_fee: 300000,
        total: 39800000,
      },
      subtotal: 39000000,
      total_fees: 800000,
      grand_total: 39800000,
      booking_hold_deposit: 2000000,
      deposit_amount: 26000000,
      payable_now: 28000000,
      calculated_by: 'system',
    },
  });

  // Booking 2: CHECKED_IN walk-in booking
  const booking2 = await prisma.booking.create({
    data: {
      org_id: org1.id,
      rentable_item_id: rentableItem1.id,
      tenant_party_id: tenantParty.id,
      start_at: new Date('2026-01-19T10:00:00Z'),
      end_at: new Date('2026-01-19T18:00:00Z'),
      quantity: 1,
      status: 'CHECKED_IN',
      is_walk_in: true,
      actual_start_at: new Date('2026-01-19T10:15:00Z'),
      estimated_duration_hours: 8,
      walk_in_notes: 'Khách walk-in, thanh toán tiền mặt',
      metadata: {
        payment_method: 'cash',
      },
    },
  });

  // Booking 3: COMPLETED booking
  const booking3 = await prisma.booking.create({
    data: {
      org_id: org1.id,
      rentable_item_id: rentableItem1.id,
      tenant_party_id: tenantParty.id,
      start_at: new Date('2026-01-15T09:00:00Z'),
      end_at: new Date('2026-01-15T17:00:00Z'),
      quantity: 1,
      status: 'COMPLETED',
      is_walk_in: true,
      actual_start_at: new Date('2026-01-15T09:10:00Z'),
      actual_end_at: new Date('2026-01-15T16:50:00Z'),
      estimated_duration_hours: 8,
      walk_in_notes: 'Đã hoàn thành và thanh toán',
      metadata: {
        payment_method: 'bank_transfer',
        payment_status: 'paid',
      },
    },
  });

  console.log('   ✅ 3 Bookings created (1 CONFIRMED, 1 CHECKED_IN, 1 COMPLETED)\n');

  // ============================================================================
  // 10. INVOICES
  // ============================================================================
  console.log('🔟 Creating Invoices...');

  // Invoice 1: ISSUED invoice for January 2026
  const invoice1 = await prisma.invoice.create({
    data: {
      org_id: org1.id,
      agreement_id: agreement1.id,
      tenant_party_id: tenantParty.id,
      rentable_item_id: rentableItem1.id,
      invoice_code: 'INV-202601-00001',
      period_start: new Date('2026-01-01'),
      period_end: new Date('2026-01-31'),
      issued_at: new Date('2026-01-01'),
      due_at: new Date('2026-01-06'),
      currency: 'VND',
      subtotal_amount: 13100000n,
      tax_enabled: true,
      tax_rate: 10,
      tax_amount: 1310000n,
      total_amount: 14410000n,
      balance_due: 14410000n,
      state: 'ISSUED',
      status: 'ISSUED',
      notes: 'Hóa đơn tháng 1/2026 - Căn 101',
    },
  });

  // Create line items for invoice1
  await prisma.invoiceLineItem.createMany({
    data: [
      {
        invoice_id: invoice1.id,
        type: 'RENT',
        description: 'Tiền thuê căn hộ tháng 01/2026',
        qty: 1,
        unit_price: 12000000n,
        amount: 12000000n,
        metadata: {},
      },
      {
        invoice_id: invoice1.id,
        type: 'SERVICE_FEE',
        description: 'Phí dịch vụ',
        qty: 1,
        unit_price: 500000n,
        amount: 500000n,
        metadata: {},
      },
      {
        invoice_id: invoice1.id,
        type: 'MGMT_FEE',
        description: 'Phí quản lý tòa nhà',
        qty: 1,
        unit_price: 300000n,
        amount: 300000n,
        metadata: {},
      },
      {
        invoice_id: invoice1.id,
        type: 'PARKING',
        description: 'Phí gửi xe máy',
        qty: 1,
        unit_price: 100000n,
        amount: 100000n,
        metadata: {},
      },
      {
        invoice_id: invoice1.id,
        type: 'INTERNET',
        description: 'Phí internet',
        qty: 1,
        unit_price: 200000n,
        amount: 200000n,
        metadata: {},
      },
    ],
  });

  // Invoice 2: PAID invoice for December 2025
  const invoice2 = await prisma.invoice.create({
    data: {
      org_id: org1.id,
      agreement_id: agreement1.id,
      tenant_party_id: tenantParty.id,
      rentable_item_id: rentableItem1.id,
      invoice_code: 'INV-202512-00015',
      period_start: new Date('2025-12-01'),
      period_end: new Date('2025-12-31'),
      issued_at: new Date('2025-12-01'),
      due_at: new Date('2025-12-06'),
      currency: 'VND',
      subtotal_amount: 13100000n,
      tax_enabled: false,
      tax_rate: 0,
      tax_amount: 0n,
      total_amount: 13100000n,
      balance_due: 0n,
      state: 'PAID',
      status: 'PAID',
      notes: 'Hóa đơn tháng 12/2025 - Đã thanh toán',
    },
  });

  await prisma.invoiceLineItem.createMany({
    data: [
      {
        invoice_id: invoice2.id,
        type: 'RENT',
        description: 'Tiền thuê căn hộ tháng 12/2025',
        qty: 1,
        unit_price: 12000000n,
        amount: 12000000n,
        metadata: {},
      },
      {
        invoice_id: invoice2.id,
        type: 'SERVICE_FEE',
        description: 'Phí dịch vụ',
        qty: 1,
        unit_price: 500000n,
        amount: 500000n,
        metadata: {},
      },
      {
        invoice_id: invoice2.id,
        type: 'MGMT_FEE',
        description: 'Phí quản lý',
        qty: 1,
        unit_price: 300000n,
        amount: 300000n,
        metadata: {},
      },
      {
        invoice_id: invoice2.id,
        type: 'PARKING',
        description: 'Phí gửi xe',
        qty: 1,
        unit_price: 100000n,
        amount: 100000n,
        metadata: {},
      },
      {
        invoice_id: invoice2.id,
        type: 'INTERNET',
        description: 'Phí internet',
        qty: 1,
        unit_price: 200000n,
        amount: 200000n,
        metadata: {},
      },
    ],
  });

  // Invoice 3: DRAFT invoice
  const invoice3 = await prisma.invoice.create({
    data: {
      org_id: org1.id,
      agreement_id: agreement1.id,
      tenant_party_id: tenantParty.id,
      rentable_item_id: rentableItem1.id,
      invoice_code: 'INV-202602-00001',
      period_start: new Date('2026-02-01'),
      period_end: new Date('2026-02-28'),
      currency: 'VND',
      subtotal_amount: 13100000n,
      tax_enabled: false,
      tax_rate: 0,
      tax_amount: 0n,
      total_amount: 13100000n,
      balance_due: 13100000n,
      state: 'DRAFT',
      status: 'ISSUED',
      notes: 'Hóa đơn tháng 2/2026 - Đang soạn thảo',
    },
  });

  await prisma.invoiceLineItem.createMany({
    data: [
      {
        invoice_id: invoice3.id,
        type: 'RENT',
        description: 'Tiền thuê căn hộ tháng 02/2026',
        qty: 1,
        unit_price: 12000000n,
        amount: 12000000n,
        metadata: {},
      },
      {
        invoice_id: invoice3.id,
        type: 'SERVICE_FEE',
        description: 'Phí dịch vụ',
        qty: 1,
        unit_price: 500000n,
        amount: 500000n,
        metadata: {},
      },
      {
        invoice_id: invoice3.id,
        type: 'MGMT_FEE',
        description: 'Phí quản lý',
        qty: 1,
        unit_price: 300000n,
        amount: 300000n,
        metadata: {},
      },
      {
        invoice_id: invoice3.id,
        type: 'PARKING',
        description: 'Phí gửi xe',
        qty: 1,
        unit_price: 100000n,
        amount: 100000n,
        metadata: {},
      },
      {
        invoice_id: invoice3.id,
        type: 'INTERNET',
        description: 'Phí internet',
        qty: 1,
        unit_price: 200000n,
        amount: 200000n,
        metadata: {},
      },
    ],
  });

  console.log('   ✅ 3 Invoices created (1 ISSUED, 1 PAID, 1 DRAFT)\n');

  // ============================================================================
  // 11. PAYMENTS
  // ============================================================================
  console.log('1️⃣1️⃣ Creating Payments...');

  const payment1 = await prisma.payment.create({
    data: {
      org_id: org1.id,
      invoice_id: invoice2.id,
      provider: 'manual',
      amount: 13100000n,
      currency: 'VND',
      status: 'SUCCEEDED',
      idempotency_key: 'pay_202512_00015_001',
      raw_json: {
        payment_method: 'bank_transfer',
        paid_at: '2025-12-05T10:30:00Z',
        note: 'Chuyển khoản qua Vietcombank',
      },
    },
  });

  console.log('   ✅ 1 Payment created\n');

  // ============================================================================
  // 12. NOTIFICATIONS
  // ============================================================================
  console.log('1️⃣2️⃣ Creating Notifications...');

  await prisma.notification.createMany({
    data: [
      {
        org_id: org1.id,
        user_id: tenant.id,
        type: 'IN_APP',
        title: 'Chào mừng đến với URP',
        message: 'Tài khoản của bạn đã được tạo thành công',
        status: 'READ',
        metadata: {},
      },
      {
        org_id: org1.id,
        user_id: tenant.id,
        type: 'EMAIL',
        title: 'Hóa đơn mới đã sẵn sàng',
        message: 'Bạn có hóa đơn mới cần thanh toán cho tháng 01/2026',
        status: 'UNREAD',
        metadata: {
          invoice_id: invoice1.id,
          invoice_code: 'INV-202601-00001',
        },
      },
      {
        org_id: org1.id,
        user_id: landlord.id,
        type: 'IN_APP',
        title: 'Hợp đồng mới đã được kích hoạt',
        message: 'Hợp đồng AG-202601-00001 đã được kích hoạt thành công',
        status: 'READ',
        metadata: {
          agreement_id: agreement1.id,
          contract_code: 'AG-202601-00001',
        },
      },
      {
        org_id: org1.id,
        user_id: landlord.id,
        type: 'IN_APP',
        title: 'Booking mới',
        message: 'Bạn có booking mới cho căn 201',
        status: 'UNREAD',
        metadata: {
          booking_id: booking1.id,
        },
      },
    ],
  });

  console.log('   ✅ 4 Notifications created\n');

  // ============================================================================
  // 13. LEADS
  // ============================================================================
  console.log('1️⃣3️⃣ Creating Leads...');

  await prisma.lead.createMany({
    data: [
      {
        org_id: org1.id,
        listing_id: listing1.id,
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        phone: '+84912345678',
        message: 'Tôi muốn xem căn hộ này vào cuối tuần',
        status: 'NEW',
        metadata: {},
      },
      {
        org_id: org1.id,
        listing_id: listing2.id,
        name: 'Trần Thị B',
        email: 'tranthib@example.com',
        phone: '+84987654321',
        message: 'Căn này còn trống không? Tôi muốn thuê từ tháng 3',
        status: 'CONTACTED',
        metadata: {
          contacted_at: '2026-01-18T14:30:00Z',
        },
      },
    ],
  });

  console.log('   ✅ 2 Leads created\n');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📊 SUMMARY:');
  console.log('   ✅ 1 Organization');
  console.log('   ✅ 3 Users (landlord, tenant, admin)');
  console.log('   ✅ 2 Parties (landlord, tenant)');
  console.log('   ✅ 1 Config Bundle');
  console.log('   ✅ 1 Asset (Sunrise Apartments)');
  console.log('   ✅ 6 Space Nodes (1 building, 2 floors, 3 units)');
  console.log('   ✅ 2 Pricing Policies');
  console.log('   ✅ 3 Rentable Items');
  console.log('   ✅ 3 Listings (all PUBLISHED)');
  console.log('   ✅ 2 Agreements (1 ACTIVE, 1 DRAFT)');
  console.log('   ✅ 3 Bookings (1 CONFIRMED, 1 CHECKED_IN, 1 COMPLETED)');
  console.log('   ✅ 3 Invoices (1 ISSUED, 1 PAID, 1 DRAFT)');
  console.log('   ✅ 1 Payment');
  console.log('   ✅ 4 Notifications');
  console.log('   ✅ 2 Leads\n');

  console.log('🔑 LOGIN CREDENTIALS:');
  console.log('   Landlord: landlord@example.com / Password123!');
  console.log('   Tenant:   tenant@example.com / Password123!');
  console.log('   Admin:    admin@example.com / Password123!\n');

  console.log('🌐 NEXT STEPS:');
  console.log('   1. Start backend: cd apps/backend && pnpm start:dev');
  console.log('   2. Start frontend: cd apps/frontend && pnpm dev');
  console.log('   3. Login and verify all modules are working');
  console.log('   4. Check:');
  console.log('      - Listings page');
  console.log('      - Bookings page');
  console.log('      - Agreements page');
  console.log('      - Invoices page');
  console.log('      - Pricing policies page\n');

  console.log('═══════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });