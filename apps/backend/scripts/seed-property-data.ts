import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Property categories with their codes
const PROPERTY_CATEGORIES = [
  'HOMESTAY', 'GUESTHOUSE', 'HOTEL', 'SERVICED_APARTMENT_SHORT', 'VILLA_RESORT', 'AIRBNB_ROOM', 'COLIVING_SHORT',
  'PRIVATE_HOUSE', 'ROOM_RENTAL', 'APARTMENT', 'SERVICED_APARTMENT_MEDIUM', 'WHOLE_HOUSE', 'RETAIL_SPACE_SMALL', 'WAREHOUSE_TEMP',
  'OFFICE', 'LAND', 'WAREHOUSE', 'COMMERCIAL_SPACE', 'LUXURY_APARTMENT', 'VILLA', 'SHOPHOUSE'
];

// Vietnamese property names
const PROPERTY_NAMES: Record<string, string> = {
  'HOMESTAY': 'Homestay',
  'GUESTHOUSE': 'Nhà nghỉ',
  'HOTEL': 'Khách sạn',
  'SERVICED_APARTMENT_SHORT': 'Căn hộ dịch vụ ngắn hạn',
  'VILLA_RESORT': 'Villa nghỉ dưỡng',
  'AIRBNB_ROOM': 'Phòng Airbnb',
  'COLIVING_SHORT': 'Co-living',
  'PRIVATE_HOUSE': 'Nhà riêng',
  'ROOM_RENTAL': 'Phòng trọ',
  'APARTMENT': 'Căn hộ',
  'SERVICED_APARTMENT_MEDIUM': 'Căn hộ dịch vụ',
  'WHOLE_HOUSE': 'Nhà nguyên căn',
  'RETAIL_SPACE_SMALL': 'Mặt bằng kinh doanh',
  'WAREHOUSE_TEMP': 'Kho tạm',
  'OFFICE': 'Văn phòng',
  'LAND': 'Đất nền',
  'WAREHOUSE': 'Nhà xưởng',
  'COMMERCIAL_SPACE': 'Mặt bằng thương mại',
  'LUXURY_APARTMENT': 'Chung cư cao cấp',
  'VILLA': 'Biệt thự',
  'SHOPHOUSE': 'Nhà phố'
};

// Districts in Ho Chi Minh City
const DISTRICTS = [
  'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 7', 'Quận 10',
  'Bình Thạnh', 'Phú Nhuận', 'Tân Bình', 'Thủ Đức'
];

// Amenities by category
const AMENITIES_BY_TYPE: Record<string, string[]> = {
  residential: ['wifi', 'ac', 'tv', 'washing_machine', 'kitchen', 'refrigerator', 'water_heater', 'balcony'],
  commercial: ['wifi', 'ac', 'security', 'cctv', 'parking', 'elevator', 'high_speed_internet'],
  warehouse: ['security', 'cctv', 'parking', 'fire_alarm'],
};

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getAmenitiesForCategory(category: string): string[] {
  if (['OFFICE', 'WAREHOUSE', 'COMMERCIAL_SPACE', 'RETAIL_SPACE_SMALL', 'SHOPHOUSE'].includes(category)) {
    return getRandomElements(AMENITIES_BY_TYPE.commercial, getRandomInt(3, 6));
  } else if (['WAREHOUSE_TEMP'].includes(category)) {
    return getRandomElements(AMENITIES_BY_TYPE.warehouse, getRandomInt(2, 4));
  } else if (category === 'LAND') {
    return [];
  } else {
    return getRandomElements(AMENITIES_BY_TYPE.residential, getRandomInt(4, 8));
  }
}

function getPriceForCategory(category: string): number {
  const priceRanges: Record<string, [number, number]> = {
    'HOMESTAY': [200000, 500000],
    'GUESTHOUSE': [300000, 600000],
    'HOTEL': [500000, 2000000],
    'SERVICED_APARTMENT_SHORT': [800000, 2500000],
    'VILLA_RESORT': [3000000, 10000000],
    'AIRBNB_ROOM': [250000, 700000],
    'COLIVING_SHORT': [300000, 800000],
    'PRIVATE_HOUSE': [5000000, 15000000],
    'ROOM_RENTAL': [2000000, 5000000],
    'APARTMENT': [6000000, 20000000],
    'SERVICED_APARTMENT_MEDIUM': [10000000, 30000000],
    'WHOLE_HOUSE': [8000000, 25000000],
    'RETAIL_SPACE_SMALL': [10000000, 30000000],
    'WAREHOUSE_TEMP': [15000000, 40000000],
    'OFFICE': [20000000, 80000000],
    'LAND': [50000000, 200000000],
    'WAREHOUSE': [30000000, 100000000],
    'COMMERCIAL_SPACE': [50000000, 150000000],
    'LUXURY_APARTMENT': [20000000, 60000000],
    'VILLA': [30000000, 100000000],
    'SHOPHOUSE': [25000000, 80000000],
  };
  
  const [min, max] = priceRanges[category] || [5000000, 20000000];
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function main() {
  console.log('🚀 Starting property data seeding...\n');

  // Get landlord user
  const landlord = await prisma.user.findFirst({
    where: { role: 'Landlord' },
  });

  if (!landlord) {
    throw new Error('No Landlord user found. Please create a landlord user first.');
  }

  console.log(`✅ Found landlord: ${landlord.email}`);

  // Get or create asset
  let asset = await prisma.asset.findFirst({
    where: { org_id: landlord.org_id },
  });

  if (!asset) {
    asset = await prisma.asset.create({
      data: {
        org_id: landlord.org_id,
        asset_type: 'mixed_use',
        name: 'URP Property Portfolio',
        address_json: {
          street: '123 Nguyễn Huệ',
          district: 'Quận 1',
          city: 'Hồ Chí Minh',
          country: 'Vietnam',
        },
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Created asset: ${asset.name}`);
  } else {
    console.log(`✅ Using existing asset: ${asset.name}`);
  }

  // Get or create root space node
  let rootNode = await prisma.spaceNode.findFirst({
    where: {
      asset_id: asset.id,
      parent_id: null,
    },
  });

  if (!rootNode) {
    rootNode = await prisma.spaceNode.create({
      data: {
        org_id: landlord.org_id,
        asset_id: asset.id,
        node_type: 'building',
        name: 'Main Building',
        path: 'root',
        attrs: {},
      },
    });
    console.log(`✅ Created root space node`);
  } else {
    console.log(`✅ Using existing root space node`);
  }

  console.log('\n📦 Creating rentable items and listings...\n');

  let totalItems = 0;
  let totalListings = 0;

  for (const category of PROPERTY_CATEGORIES) {
    console.log(`\n🏠 Creating ${category} items...`);
    
    const categoryData = await prisma.propertyCategory.findUnique({
      where: { code: category },
    });

    if (!categoryData) {
      console.log(`⚠️  Category ${category} not found, skipping...`);
      continue;
    }

    for (let i = 1; i <= 10; i++) {
      try {
        // Create rentable item
        const itemCode = `${category}-${String(i).padStart(3, '0')}`;
        const district = getRandomElement(DISTRICTS);
        const streetNumber = getRandomInt(1, 999);
        
        const isResidential = !['OFFICE', 'WAREHOUSE', 'COMMERCIAL_SPACE', 'RETAIL_SPACE_SMALL', 'SHOPHOUSE', 'WAREHOUSE_TEMP', 'LAND'].includes(category);
        
        const rentableItem = await prisma.rentableItem.create({
          data: {
            org_id: landlord.org_id,
            space_node_id: rootNode.id,
            code: itemCode,
            allocation_type: 'exclusive',
            capacity: 1,
            property_category: category,
            rental_duration_type: categoryData.duration_type,
            min_rental_days: categoryData.typical_min_days || 1,
            pricing_unit: categoryData.typical_pricing_unit || 'PER_MONTH',
            area_sqm: category === 'LAND' ? getRandomInt(100, 1000) : getRandomInt(30, 200),
            bedrooms: isResidential ? getRandomInt(1, 4) : null,
            bathrooms: isResidential ? getRandomInt(1, 3) : null,
            floor_number: ['APARTMENT', 'OFFICE', 'LUXURY_APARTMENT'].includes(category) ? getRandomInt(1, 20) : null,
            amenities: getAmenitiesForCategory(category),
            house_rules: isResidential ? ['no_smoking', 'no_pets'] : ['business_hours_only'],
            instant_booking: Math.random() > 0.5,
            advance_booking_days: getRandomInt(1, 7),
            cancellation_policy: getRandomElement(['FLEXIBLE', 'MODERATE', 'STRICT']),
            status: 'ACTIVE',
            attrs: {},
          },
        });

        totalItems++;

        // Create listing
        const price = getPriceForCategory(category);
        const listing = await prisma.listing.create({
          data: {
            org_id: landlord.org_id,
            title: `${PROPERTY_NAMES[category]} ${streetNumber} ${district}`,
            description: `${PROPERTY_NAMES[category]} hiện đại, đầy đủ tiện nghi tại ${district}, Hồ Chí Minh. Vị trí thuận lợi, gần trung tâm, giao thông dễ dàng.`,
            status: 'PUBLISHED',
            tags: [district, PROPERTY_NAMES[category], categoryData.duration_type === 'SHORT_TERM' ? 'Ngắn hạn' : categoryData.duration_type === 'MEDIUM_TERM' ? 'Trung hạn' : 'Dài hạn'],
            media: [],
            pricing_display: {
              from_amount: price,
              currency: 'VND',
              unit: categoryData.typical_pricing_unit === 'PER_NIGHT' ? 'đêm' : 'tháng',
            },
          },
        });

        // Link listing to rentable item
        await prisma.listingRentableItem.create({
          data: {
            listing_id: listing.id,
            rentable_item_id: rentableItem.id,
          },
        });

        totalListings++;

        if (i % 5 === 0) {
          console.log(`  ✓ Created ${i}/10 items`);
        }
      } catch (error: any) {
        console.error(`  ✗ Error creating item ${i}:`, error.message);
      }
    }
  }

  console.log('\n\n✅ Seeding completed!');
  console.log(`📊 Summary:`);
  console.log(`   - Total rentable items created: ${totalItems}`);
  console.log(`   - Total listings created: ${totalListings}`);
  console.log(`   - Categories processed: ${PROPERTY_CATEGORIES.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
