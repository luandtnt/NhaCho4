import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ============================================================================
// PROPERTY TYPE DEFINITIONS - 21 loại hình BĐS
// ============================================================================

interface PropertyType {
  code: string;
  name: string;
  category: string;
  durationType: 'SHORT_TERM' | 'MID_TERM' | 'LONG_TERM';
  priceRange: { min: number; max: number };
  priceUnit: 'HOUR' | 'NIGHT' | 'MONTH';
  minRentalDays: number;
  provinces: string[];
}

const PROPERTY_TYPES: PropertyType[] = [
  // SHORT_TERM (7 loại)
  { code: 'HOTEL', name: 'Khách sạn', category: 'HOTEL', durationType: 'SHORT_TERM', priceRange: { min: 500000, max: 3000000 }, priceUnit: 'NIGHT', minRentalDays: 1, provinces: ['Hà Nội', 'TP.HCM', 'Đà Nẵng'] },
  { code: 'HOMESTAY', name: 'Homestay', category: 'HOMESTAY', durationType: 'SHORT_TERM', priceRange: { min: 300000, max: 1500000 }, priceUnit: 'NIGHT', minRentalDays: 1, provinces: ['Hà Nội', 'Đà Lạt', 'Sapa'] },
  { code: 'VACATION_VILLA', name: 'Villa nghỉ dưỡng', category: 'VILLA', durationType: 'SHORT_TERM', priceRange: { min: 2000000, max: 10000000 }, priceUnit: 'NIGHT', minRentalDays: 2, provinces: ['Vũng Tàu', 'Phú Quốc', 'Nha Trang'] },
  { code: 'SERVICED_APARTMENT_SHORT', name: 'Căn hộ dịch vụ ngắn hạn', category: 'APARTMENT', durationType: 'SHORT_TERM', priceRange: { min: 800000, max: 3000000 }, priceUnit: 'NIGHT', minRentalDays: 1, provinces: ['Hà Nội', 'TP.HCM', 'Đà Nẵng'] },
  { code: 'MOTEL', name: 'Nhà nghỉ', category: 'MOTEL', durationType: 'SHORT_TERM', priceRange: { min: 200000, max: 800000 }, priceUnit: 'NIGHT', minRentalDays: 1, provinces: ['Hà Nội', 'TP.HCM', 'Hải Phòng'] },
  { code: 'RESORT', name: 'Resort', category: 'RESORT', durationType: 'SHORT_TERM', priceRange: { min: 3000000, max: 15000000 }, priceUnit: 'NIGHT', minRentalDays: 2, provinces: ['Phú Quốc', 'Nha Trang', 'Đà Nẵng'] },
  { code: 'COWORKING_HOURLY', name: 'Coworking theo giờ', category: 'COWORKING', durationType: 'SHORT_TERM', priceRange: { min: 50000, max: 200000 }, priceUnit: 'HOUR', minRentalDays: 1, provinces: ['Hà Nội', 'TP.HCM'] },
  
  // MID_TERM (7 loại)
  { code: 'APARTMENT', name: 'Chung cư', category: 'APARTMENT', durationType: 'MID_TERM', priceRange: { min: 5000000, max: 30000000 }, priceUnit: 'MONTH', minRentalDays: 90, provinces: ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng'] },
  { code: 'ROOM', name: 'Phòng trọ', category: 'ROOM', durationType: 'MID_TERM', priceRange: { min: 1500000, max: 5000000 }, priceUnit: 'MONTH', minRentalDays: 30, provinces: ['Hà Nội', 'TP.HCM', 'Đà Nẵng'] },
  { code: 'HOUSE', name: 'Nhà riêng', category: 'HOUSE', durationType: 'MID_TERM', priceRange: { min: 8000000, max: 40000000 }, priceUnit: 'MONTH', minRentalDays: 90, provinces: ['Hà Nội', 'TP.HCM', 'Hải Phòng'] },
  { code: 'SERVICED_APARTMENT_MID', name: 'Căn hộ dịch vụ trung hạn', category: 'APARTMENT', durationType: 'MID_TERM', priceRange: { min: 10000000, max: 50000000 }, priceUnit: 'MONTH', minRentalDays: 90, provinces: ['Hà Nội', 'TP.HCM'] },
  { code: 'STUDIO', name: 'Studio', category: 'STUDIO', durationType: 'MID_TERM', priceRange: { min: 4000000, max: 15000000 }, priceUnit: 'MONTH', minRentalDays: 90, provinces: ['Hà Nội', 'TP.HCM', 'Đà Nẵng'] },
  { code: 'PENTHOUSE', name: 'Penthouse', category: 'PENTHOUSE', durationType: 'MID_TERM', priceRange: { min: 30000000, max: 100000000 }, priceUnit: 'MONTH', minRentalDays: 180, provinces: ['Hà Nội', 'TP.HCM'] },
  { code: 'WHOLE_HOUSE', name: 'Nhà nguyên căn', category: 'HOUSE', durationType: 'MID_TERM', priceRange: { min: 10000000, max: 50000000 }, priceUnit: 'MONTH', minRentalDays: 90, provinces: ['Hà Nội', 'TP.HCM', 'Đà Nẵng'] },
  
  // LONG_TERM (7 loại)
  { code: 'OFFICE', name: 'Văn phòng', category: 'OFFICE', durationType: 'LONG_TERM', priceRange: { min: 15000000, max: 100000000 }, priceUnit: 'MONTH', minRentalDays: 365, provinces: ['Hà Nội', 'TP.HCM', 'Đà Nẵng'] },
  { code: 'RETAIL_SPACE', name: 'Mặt bằng kinh doanh', category: 'RETAIL', durationType: 'LONG_TERM', priceRange: { min: 20000000, max: 150000000 }, priceUnit: 'MONTH', minRentalDays: 365, provinces: ['Hà Nội', 'TP.HCM', 'Hải Phòng'] },
  { code: 'WAREHOUSE', name: 'Nhà xưởng', category: 'WAREHOUSE', durationType: 'LONG_TERM', priceRange: { min: 30000000, max: 200000000 }, priceUnit: 'MONTH', minRentalDays: 365, provinces: ['Bắc Ninh', 'Bình Dương', 'Đồng Nai'] },
  { code: 'LAND', name: 'Đất nền', category: 'LAND', durationType: 'LONG_TERM', priceRange: { min: 10000000, max: 100000000 }, priceUnit: 'MONTH', minRentalDays: 365, provinces: ['Hà Nội', 'TP.HCM', 'Đà Nẵng'] },
  { code: 'VILLA', name: 'Biệt thự', category: 'VILLA', durationType: 'LONG_TERM', priceRange: { min: 40000000, max: 200000000 }, priceUnit: 'MONTH', minRentalDays: 365, provinces: ['Hà Nội', 'TP.HCM'] },
  { code: 'SHOPHOUSE', name: 'Shophouse', category: 'SHOPHOUSE', durationType: 'LONG_TERM', priceRange: { min: 25000000, max: 150000000 }, priceUnit: 'MONTH', minRentalDays: 365, provinces: ['Hà Nội', 'TP.HCM', 'Đà Nẵng'] },
  { code: 'COMMERCIAL_BUILDING', name: 'Tòa nhà thương mại', category: 'COMMERCIAL', durationType: 'LONG_TERM', priceRange: { min: 100000000, max: 500000000 }, priceUnit: 'MONTH', minRentalDays: 365, provinces: ['Hà Nội', 'TP.HCM'] },
];

// Helper function to generate random price
function randomPrice(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Districts by province
const DISTRICTS: Record<string, string[]> = {
  'Hà Nội': ['Ba Đình', 'Hoàn Kiếm', 'Đống Đa', 'Hai Bà Trưng', 'Cầu Giấy', 'Thanh Xuân', 'Hoàng Mai', 'Long Biên'],
  'TP.HCM': ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 7', 'Bình Thạnh', 'Phú Nhuận'],
  'Đà Nẵng': ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu'],
  'Hải Phòng': ['Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Hải An', 'Kiến An'],
  'Đà Lạt': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4'],
  'Sapa': ['Sa Pa', 'Sa Pả', 'Ô Quý Hồ'],
  'Vũng Tàu': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4'],
  'Phú Quốc': ['Dương Đông', 'An Thới', 'Cửa Cạn'],
  'Nha Trang': ['Vĩnh Hải', 'Vĩnh Hòa', 'Vĩnh Phước', 'Lộc Thọ'],
  'Bắc Ninh': ['Thành phố Bắc Ninh', 'Từ Sơn', 'Thuận Thành'],
  'Bình Dương': ['Thủ Dầu Một', 'Dĩ An', 'Thuận An', 'Bến Cát'],
  'Đồng Nai': ['Biên Hòa', 'Long Khánh', 'Nhơn Trạch'],
};

async function main() {
  console.log('🌱 Starting MASSIVE database seeding...');
  console.log('📦 Creating 21 property types x 10 items = 210 rentable items');
  console.log('📦 Plus agreements, bookings, invoices, and more...\n');

  // ============================================================================
  // 1. ORGANIZATIONS & USERS
  // ============================================================================
  console.log('1️⃣ Creating Organizations & Users...');

  const org1 = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'URP Property Management',
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
      scopes: ['*'],
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
      scopes: ['bookings:write', 'payments:write'],
      assigned_asset_ids: [],
    },
  });

  // Create 4 more landlords
  const landlords = [landlord];
  for (let i = 1; i <= 4; i++) {
    const ll = await prisma.user.create({
      data: {
        org_id: org1.id,
        email: `landlord${i}@example.com`,
        password_hash: passwordHash,
        role: 'Landlord',
        status: 'ACTIVE',
        name: `Chủ Nhà ${i}`,
        phone: `+8490123456${i}`,
        id_number: `00123456789${i}`,
        scopes: ['*'],
        assigned_asset_ids: [],
      },
    });
    landlords.push(ll);
  }

  // Create 9 more tenants
  const tenants = [tenant];
  for (let i = 1; i <= 9; i++) {
    const tn = await prisma.user.create({
      data: {
        org_id: org1.id,
        email: `tenant${i}@example.com`,
        password_hash: passwordHash,
        role: 'Tenant',
        status: 'ACTIVE',
        name: `Người Thuê ${i}`,
        phone: `+8490765432${i}`,
        id_number: `00987654321${i}`,
        scopes: ['bookings:write', 'payments:write'],
        assigned_asset_ids: [],
      },
    });
    tenants.push(tn);
  }

  console.log('   ✅ Organization created');
  console.log(`   ✅ ${landlords.length} Landlords created`);
  console.log(`   ✅ ${tenants.length} Tenants created\n`);

  // ============================================================================
  // 2. PARTIES
  // ============================================================================
  console.log('2️⃣ Creating Parties...');

  // Create landlord parties
  const landlordParties = [];
  for (let i = 0; i < landlords.length; i++) {
    const ll = landlords[i];
    const party = await prisma.party.create({
      data: {
        org_id: org1.id,
        party_type: 'LANDLORD',
        name: ll.name || 'Landlord',
        email: ll.email,
        phone: ll.phone || '+84901234567',
        metadata: { id_number: ll.id_number || '001234567890', user_id: ll.id },
      },
    });
    landlordParties.push(party);
  }

  // Create tenant parties
  const tenantParties = [];
  for (let i = 0; i < tenants.length; i++) {
    const tn = tenants[i];
    const party = await prisma.party.create({
      data: {
        org_id: org1.id,
        party_type: 'TENANT',
        name: tn.name || 'Tenant',
        email: tn.email,
        phone: tn.phone || '+84907654321',
        metadata: { id_number: tn.id_number || '009876543210', user_id: tn.id },
      },
    });
    tenantParties.push(party);
  }

  console.log(`   ✅ ${landlordParties.length} Landlord parties created`);
  console.log(`   ✅ ${tenantParties.length} Tenant parties created\n`);

  // ============================================================================
  // 3. CONFIG BUNDLE
  // ============================================================================
  console.log('3️⃣ Creating Config Bundle...');

  await prisma.configBundle.create({
    data: {
      org_id: org1.id,
      bundle_id: 'cfg_2026_01_19_massive',
      version: '1.0.0',
      status: 'ACTIVE',
      config: { asset_types: {}, pricing: {}, workflows: {} },
    },
  });

  console.log('   ✅ Config bundle created\n');

  // ============================================================================
  // 4. CREATE PRICING POLICIES (21 policies - 1 per property type)
  // ============================================================================
  console.log('4️⃣ Creating 21 Pricing Policies...');

  const pricingPolicies: any[] = [];
  
  for (const propType of PROPERTY_TYPES) {
    const basePrice = randomPrice(propType.priceRange.min, propType.priceRange.max);
    const deposit = propType.durationType === 'SHORT_TERM' ? basePrice : basePrice * 2;
    
    const policy = await prisma.pricingPolicy.create({
      data: {
        org_id: org1.id,
        name: `Chính sách giá ${propType.name}`,
        description: `Chính sách giá cho ${propType.name} - ${propType.durationType}`,
        status: 'ACTIVE',
        version: 1,
        property_category: propType.category,
        rental_duration_type: propType.durationType,
        pricing_mode: 'FIXED',
        base_price: basePrice,
        price_unit: propType.priceUnit,
        min_rent_duration: propType.durationType === 'SHORT_TERM' ? 1 : propType.durationType === 'MID_TERM' ? 3 : 12,
        deposit_amount: deposit,
        booking_hold_deposit: Math.floor(basePrice * 0.1),
        service_fee: propType.durationType === 'LONG_TERM' ? Math.floor(basePrice * 0.05) : Math.floor(basePrice * 0.03),
        building_management_fee: propType.category.includes('APARTMENT') ? 300000 : null,
        electricity_billing: 'METER_PRIVATE',
        water_billing: 'METER_PRIVATE',
        pricing_details: { electricity_rate: 3500, water_rate: 15000 },
        created_by: landlord.id,
      },
    });
    
    pricingPolicies.push({ ...policy, propType });
  }

  console.log(`   ✅ ${pricingPolicies.length} Pricing policies created\n`);

  // ============================================================================
  // 5. CREATE ASSETS, SPACE NODES & RENTABLE ITEMS (210 items)
  // ============================================================================
  console.log('5️⃣ Creating Assets, Space Nodes & Rentable Items...');
  console.log('   This will take a while (210 items)...\n');

  const rentableItems: any[] = [];
  const listings: any[] = [];
  let itemCounter = 0;

  for (let policyIndex = 0; policyIndex < pricingPolicies.length; policyIndex++) {
    const { propType } = pricingPolicies[policyIndex];
    const policy = pricingPolicies[policyIndex];
    
    console.log(`   📦 Creating 10 items for ${propType.name}...`);
    
    for (let i = 0; i < 10; i++) {
      itemCounter++;
      
      // Assign to landlord (round-robin)
      const landlordIndex = (itemCounter - 1) % landlords.length;
      const currentLandlord = landlords[landlordIndex];
      const currentLandlordParty = landlordParties[landlordIndex];
      
      const province = randomItem(propType.provinces);
      const district = randomItem(DISTRICTS[province] || ['Quận 1']);
      const ward = `Phường ${Math.floor(Math.random() * 10) + 1}`;
      const streetNum = Math.floor(Math.random() * 500) + 1;
      const address = `${streetNum} Đường ${['Láng', 'Giải Phóng', 'Nguyễn Trãi', 'Lê Duẩn', 'Trần Hưng Đạo'][i % 5]}`;
      
      // Create Asset
      const asset = await prisma.asset.create({
        data: {
          org_id: org1.id,
          asset_type: propType.code.toLowerCase(),
          name: `${propType.name} ${province} ${itemCounter}`,
          address_json: { street: address, ward, district, city: province, country: 'Việt Nam' },
          status: 'ACTIVE',
          attrs: { year_built: 2015 + (i % 8), total_units: 1, owner: currentLandlord.name },
        },
      });

      // Create Space Node
      const spaceNode = await prisma.spaceNode.create({
        data: {
          org_id: org1.id,
          asset_id: asset.id,
          node_type: 'unit',
          name: `${propType.code}-${itemCounter}`,
          path: `/${propType.code.toLowerCase()}-${itemCounter}`,
          attrs: { bedrooms: [1, 2, 3, 4][i % 4], bathrooms: [1, 2][i % 2], floor_area: 30 + (i * 10) },
        },
      });

      // Create Rentable Item
      const basePrice = randomPrice(propType.priceRange.min, propType.priceRange.max);
      const rentableItem = await prisma.rentableItem.create({
        data: {
          org_id: org1.id,
          space_node_id: spaceNode.id,
          code: `${propType.code}-${String(itemCounter).padStart(3, '0')}`,
          allocation_type: 'exclusive',
          status: 'ACTIVE',
          property_category: propType.category,
          rental_duration_type: propType.durationType,
          min_rental_days: propType.minRentalDays,
          pricing_unit: `PER_${propType.priceUnit}`,
          address_full: `${address}, ${ward}, ${district}, ${province}`,
          province,
          district,
          ward,
          base_price: basePrice,
          price_unit: propType.priceUnit,
          currency: 'VND',
          min_rent_duration: propType.durationType === 'SHORT_TERM' ? 1 : propType.durationType === 'MID_TERM' ? 3 : 12,
          deposit_amount: propType.durationType === 'SHORT_TERM' ? basePrice : basePrice * 2,
          booking_hold_deposit: Math.floor(basePrice * 0.1),
          service_fee: Math.floor(basePrice * 0.03),
          building_mgmt_fee: propType.category.includes('APARTMENT') ? 300000 : null,
          area_sqm: 30 + (i * 10),
          bedrooms: [1, 2, 3, 4][i % 4],
          bathrooms: [1, 2][i % 2],
          apartment_floor: i + 1,
          direction: ['EAST', 'WEST', 'SOUTH', 'NORTH'][i % 4] as any,
          balcony: i % 2 === 0,
          parking_slots: i % 3,
          furnishing_level: ['FULL', 'PARTIAL', 'NONE'][i % 3] as any,
          amenities: ['wifi', 'air_conditioner', 'washing_machine'],
          electricity_billing: 'METER_PRIVATE',
          water_billing: 'METER_PRIVATE',
          pricing_policy_id: policy.id,
          pricing_policy_version: 1,
          metadata: { version: 1, electricity_rate: 3500, water_rate: 15000 },
          attrs: {},
        },
      });

      rentableItems.push({ ...rentableItem, propType, landlordParty: currentLandlordParty });

      // Create Listing
      const listing = await prisma.listing.create({
        data: {
          org_id: org1.id,
          title: `${propType.name} ${[1, 2, 3, 4][i % 4]}PN tại ${district}, ${province}`,
          description: `${propType.name} đẹp, tiện nghi đầy đủ tại ${district}, ${province}. Diện tích ${30 + (i * 10)}m².`,
          media: [],
          tags: [propType.code.toLowerCase(), province.toLowerCase(), district.toLowerCase()],
          pricing_display: { from_amount: basePrice, currency: 'VND', unit: propType.priceUnit.toLowerCase() },
          status: 'PUBLISHED',
          is_featured: i === 0,
          view_count: Math.floor(Math.random() * 200),
          rentable_items: { create: [{ rentable_item_id: rentableItem.id }] },
        },
      });

      listings.push(listing);
    }
  }

  console.log(`   ✅ ${rentableItems.length} Rentable items created`);
  console.log(`   ✅ ${listings.length} Listings created\n`);

  // ============================================================================
  // 6. CREATE AGREEMENTS (~50 agreements)
  // ============================================================================
  console.log('6️⃣ Creating Agreements...');

  const agreements: any[] = [];
  const agreementStates = ['ACTIVE', 'DRAFT', 'EXPIRED', 'TERMINATED'];
  
  // Create agreements for MID_TERM and LONG_TERM properties
  const eligibleItems = rentableItems.filter(item => 
    item.propType.durationType === 'MID_TERM' || item.propType.durationType === 'LONG_TERM'
  );

  for (let i = 0; i < Math.min(50, eligibleItems.length); i++) {
    const item = eligibleItems[i];
    const state = agreementStates[i % agreementStates.length];
    
    // Assign to tenant (round-robin)
    const tenantIndex = i % tenantParties.length;
    const currentTenantParty = tenantParties[tenantIndex];
    
    const startDate = new Date(2025, 0 + (i % 12), 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (item.propType.durationType === 'MID_TERM' ? 6 : 12));

    const agreement = await prisma.agreement.create({
      data: {
        org_id: org1.id,
        landlord_party_id: item.landlordParty.id,
        tenant_party_id: currentTenantParty.id,
        rentable_item_id: item.id,
        contract_code: `AG-2026${String(i + 1).padStart(5, '0')}`,
        contract_title: `HĐ thuê ${item.propType.name} - ${item.code}`,
        state,
        agreement_type: 'lease',
        tenant_id_number: currentTenantParty.metadata.id_number || '009876543210',
        start_at: startDate,
        end_at: endDate,
        billing_day: 1,
        payment_due_days: 5,
        base_price: item.base_price,
        deposit_amount: item.deposit_amount,
        service_fee: item.service_fee || 0,
        building_mgmt_fee: item.building_mgmt_fee || 0,
        parking_fee_motorbike: 100000,
        internet_fee: 200000,
        electricity_billing: 'METER_PRIVATE',
        electricity_rate: 3500,
        water_billing: 'METER_PRIVATE',
        water_rate: 15000,
        payment_cycle: 'MONTHLY',
        allow_pets: false,
        allow_smoking: false,
        allow_guests: true,
        activated_at: state === 'ACTIVE' ? startDate : null,
      },
    });

    agreements.push({ ...agreement, tenantParty: currentTenantParty });
  }

  console.log(`   ✅ ${agreements.length} Agreements created\n`);

  // ============================================================================
  // 7. CREATE BOOKINGS (~100 bookings)
  // ============================================================================
  console.log('7️⃣ Creating Bookings...');

  const bookings: any[] = [];
  const bookingStatuses = ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED', 'CANCELLED'];
  
  // Create bookings for SHORT_TERM properties
  const shortTermItems = rentableItems.filter(item => item.propType.durationType === 'SHORT_TERM');

  for (let i = 0; i < Math.min(100, shortTermItems.length * 5); i++) {
    const item = shortTermItems[i % shortTermItems.length];
    const status = bookingStatuses[i % bookingStatuses.length];
    
    // Assign to tenant (round-robin)
    const tenantIndex = i % tenantParties.length;
    const currentTenantParty = tenantParties[tenantIndex];
    
    const startDate = new Date(2026, 0, 1 + (i % 30));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (item.propType.priceUnit === 'HOUR' ? 1 : [1, 2, 3][i % 3]));

    const booking = await prisma.booking.create({
      data: {
        org_id: org1.id,
        rentable_item_id: item.id,
        tenant_party_id: currentTenantParty.id,
        start_at: startDate,
        end_at: endDate,
        quantity: 1,
        status,
        is_walk_in: i % 5 === 0,
        actual_start_at: status !== 'CONFIRMED' ? startDate : null,
        actual_end_at: status === 'COMPLETED' ? endDate : null,
        metadata: { tenant_email: currentTenantParty.email },
      },
    });

    bookings.push(booking);
  }

  console.log(`   ✅ ${bookings.length} Bookings created\n`);

  // ============================================================================
  // 8. CREATE INVOICES (~150 invoices)
  // ============================================================================
  console.log('8️⃣ Creating Invoices...');

  const invoices: any[] = [];
  const invoiceStates = ['ISSUED', 'PAID', 'DRAFT', 'OVERDUE'];
  
  // Create invoices for active agreements
  const activeAgreements = agreements.filter(a => a.state === 'ACTIVE');

  for (let i = 0; i < activeAgreements.length; i++) {
    const agreement = activeAgreements[i];
    
    // Create 3 invoices per agreement (past, current, future)
    for (let month = 0; month < 3; month++) {
      const state = month === 0 ? 'PAID' : month === 1 ? 'ISSUED' : 'DRAFT';
      const periodStart = new Date(2026, month, 1);
      const periodEnd = new Date(2026, month + 1, 0);
      const issuedAt = month < 2 ? periodStart : null;
      const dueAt = issuedAt ? new Date(issuedAt.getTime() + 5 * 24 * 60 * 60 * 1000) : null;

      const subtotal = Number(agreement.base_price) + Number(agreement.service_fee || 0) + 
                      Number(agreement.building_mgmt_fee || 0) + Number(agreement.parking_fee_motorbike || 0) + 
                      Number(agreement.internet_fee || 0);
      
      const invoice = await prisma.invoice.create({
        data: {
          org_id: org1.id,
          agreement_id: agreement.id,
          tenant_party_id: agreement.tenantParty.id,
          rentable_item_id: agreement.rentable_item_id,
          invoice_code: `INV-2026${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(5, '0')}`,
          period_start: periodStart,
          period_end: periodEnd,
          issued_at: issuedAt,
          due_at: dueAt,
          currency: 'VND',
          subtotal_amount: BigInt(subtotal),
          tax_enabled: false,
          tax_rate: 0,
          tax_amount: 0n,
          total_amount: BigInt(subtotal),
          balance_due: state === 'PAID' ? 0n : BigInt(subtotal),
          state,
          status: state,
          notes: `Hóa đơn tháng ${month + 1}/2026`,
        },
      });

      // Create line items
      await prisma.invoiceLineItem.createMany({
        data: [
          {
            invoice_id: invoice.id,
            type: 'RENT',
            description: 'Tiền thuê',
            qty: 1,
            unit_price: BigInt(agreement.base_price),
            amount: BigInt(agreement.base_price),
            metadata: {},
          },
          {
            invoice_id: invoice.id,
            type: 'SERVICE_FEE',
            description: 'Phí dịch vụ',
            qty: 1,
            unit_price: BigInt(agreement.service_fee || 0),
            amount: BigInt(agreement.service_fee || 0),
            metadata: {},
          },
          {
            invoice_id: invoice.id,
            type: 'MGMT_FEE',
            description: 'Phí quản lý',
            qty: 1,
            unit_price: BigInt(agreement.building_mgmt_fee || 0),
            amount: BigInt(agreement.building_mgmt_fee || 0),
            metadata: {},
          },
        ],
      });

      invoices.push(invoice);
    }
  }

  console.log(`   ✅ ${invoices.length} Invoices created\n`);

  // ============================================================================
  // 9. CREATE PAYMENTS
  // ============================================================================
  console.log('9️⃣ Creating Payments...');

  const paidInvoices = invoices.filter(inv => inv.state === 'PAID');
  
  for (const invoice of paidInvoices) {
    await prisma.payment.create({
      data: {
        org_id: org1.id,
        invoice_id: invoice.id,
        provider: 'manual',
        amount: invoice.total_amount,
        currency: 'VND',
        status: 'SUCCEEDED',
        idempotency_key: `pay_${invoice.invoice_code}`,
        raw_json: { payment_method: 'bank_transfer' },
      },
    });
  }

  console.log(`   ✅ ${paidInvoices.length} Payments created\n`);

  // ============================================================================
  // 10. CREATE NOTIFICATIONS & LEADS
  // ============================================================================
  console.log('🔟 Creating Notifications & Leads...');

  await prisma.notification.createMany({
    data: [
      {
        org_id: org1.id,
        user_id: tenants[0].id,
        type: 'IN_APP',
        title: 'Chào mừng đến với URP',
        message: 'Tài khoản của bạn đã được tạo thành công',
        status: 'READ',
        metadata: {},
      },
      {
        org_id: org1.id,
        user_id: landlords[0].id,
        type: 'IN_APP',
        title: 'Hệ thống đã sẵn sàng',
        message: `Bạn có ${Math.floor(210 / landlords.length)} bất động sản đang hoạt động`,
        status: 'UNREAD',
        metadata: {},
      },
    ],
  });

  await prisma.lead.createMany({
    data: [
      {
        org_id: org1.id,
        listing_id: listings[0].id,
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@example.com',
        phone: '+84912345678',
        message: 'Tôi muốn xem bất động sản này',
        status: 'NEW',
        metadata: {},
      },
      {
        org_id: org1.id,
        listing_id: listings[1].id,
        name: 'Trần Thị B',
        email: 'tranthib@example.com',
        phone: '+84987654321',
        message: 'Còn trống không?',
        status: 'CONTACTED',
        metadata: {},
      },
    ],
  });

  console.log('   ✅ Notifications & Leads created\n');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 MASSIVE DATABASE SEEDING COMPLETED!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📊 SUMMARY:');
  console.log(`   ✅ 21 Property Types`);
  console.log(`   ✅ 21 Pricing Policies`);
  console.log(`   ✅ ${rentableItems.length} Rentable Items (21 types x 10 items)`);
  console.log(`   ✅ ${listings.length} Listings (all PUBLISHED)`);
  console.log(`   ✅ ${agreements.length} Agreements (ACTIVE, DRAFT, EXPIRED, TERMINATED)`);
  console.log(`   ✅ ${bookings.length} Bookings (various statuses)`);
  console.log(`   ✅ ${invoices.length} Invoices (ISSUED, PAID, DRAFT, OVERDUE)`);
  console.log(`   ✅ ${paidInvoices.length} Payments`);
  console.log(`   ✅ 2 Notifications`);
  console.log(`   ✅ 2 Leads\n`);

  console.log('🔑 LOGIN CREDENTIALS:');
  console.log('   Landlords:');
  for (let i = 0; i < landlords.length; i++) {
    console.log(`     ${landlords[i].email} / Password123!`);
  }
  console.log('   Tenants:');
  for (let i = 0; i < Math.min(5, tenants.length); i++) {
    console.log(`     ${tenants[i].email} / Password123!`);
  }
  console.log(`     ... and ${tenants.length - 5} more tenants\n`);

  console.log('🌐 NEXT STEPS:');
  console.log('   1. Start backend: cd apps/backend && pnpm start:dev');
  console.log('   2. Start frontend: cd apps/frontend && pnpm dev');
  console.log('   3. Login and explore 210 properties across 21 types!\n');

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
