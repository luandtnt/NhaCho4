/**
 * Seed Enhanced 21 Assets with Full Property Data
 * Creates 21 assets (one per property type) with realistic hierarchical structure
 * Each asset has 10 rentable items with complete enhanced fields
 */

import { PrismaClient, PriceUnit } from '@prisma/client';
import {
  generateLocation,
  generatePricing,
  generatePhysicalDetails,
  generateAmenities,
  generateShortTermBooking,
  generateShortTermMetadata,
  generateMidTermMetadata,
  generateLongTermMetadata,
} from './helpers/property-data-generator';

const prisma = new PrismaClient();

// Property type configurations
const PROPERTY_CONFIGS = [
  // SHORT_TERM
  { code: 'HOMESTAY', duration: 'SHORT_TERM', assetName: 'Homestay Đà Lạt View', address: '123 Trần Phú, Đà Lạt', 
    priceRange: [300000, 800000], areaRange: [20, 35], bedrooms: [1, 2], bathrooms: [1, 2], priceUnit: 'NIGHT' as PriceUnit,
    structure: [
      { name: 'Tầng 1', units: ['Phòng Garden 1', 'Phòng Garden 2'] },
      { name: 'Tầng 2', units: ['Phòng City 1', 'Phòng City 2', 'Phòng City 3'] },
      { name: 'Tầng 3', units: ['Phòng Mountain 1', 'Phòng Mountain 2', 'Phòng Mountain 3', 'Phòng Mountain 4', 'Phòng Mountain 5'] },
    ]
  },
  
  { code: 'GUESTHOUSE', duration: 'SHORT_TERM', assetName: 'Nhà Nghỉ Sài Gòn', address: '45 Bùi Viện, Q1, TP.HCM',
    priceRange: [200000, 500000], areaRange: [15, 25], bedrooms: [1, 1], bathrooms: [1, 1], priceUnit: 'NIGHT' as PriceUnit,
    structure: [
      { name: 'Tầng 2', units: ['Phòng 201', 'Phòng 202', 'Phòng 203', 'Phòng 204', 'Phòng 205'] },
      { name: 'Tầng 3', units: ['Phòng 301', 'Phòng 302', 'Phòng 303', 'Phòng 304', 'Phòng 305'] },
    ]
  },
  
  { code: 'HOTEL', duration: 'SHORT_TERM', assetName: 'Khách Sạn Mường Thanh', address: '60 Nguyễn Huệ, Q1, TP.HCM',
    priceRange: [800000, 3000000], areaRange: [25, 60], bedrooms: [1, 2], bathrooms: [1, 2], priceUnit: 'NIGHT' as PriceUnit,
    structure: [
      { name: 'Tầng 5 - Standard', units: ['Phòng 501', 'Phòng 502', 'Phòng 503'] },
      { name: 'Tầng 10 - Deluxe', units: ['Phòng 1001', 'Phòng 1002', 'Phòng 1003', 'Phòng 1004'] },
      { name: 'Tầng 15 - Suite', units: ['Suite 1501', 'Suite 1502', 'Suite 1503'] },
    ]
  },
  
  { code: 'SERVICED_APARTMENT_SHORT', duration: 'SHORT_TERM', assetName: 'Căn Hộ DV Ngắn Hạn Vinhomes', address: '208 Nguyễn Hữu Cảnh, Bình Thạnh',
    priceRange: [1500000, 3500000], areaRange: [45, 75], bedrooms: [1, 3], bathrooms: [1, 2], priceUnit: 'NIGHT' as PriceUnit,
    structure: [
      { name: 'Tầng 12', units: ['Căn 1201', 'Căn 1202', 'Căn 1203', 'Căn 1204', 'Căn 1205'] },
      { name: 'Tầng 15', units: ['Căn 1501', 'Căn 1502', 'Căn 1503', 'Căn 1504', 'Căn 1505'] },
    ]
  },
  
  { code: 'VILLA_RESORT', duration: 'SHORT_TERM', assetName: 'Villa Nghỉ Dưỡng Phú Quốc', address: 'Bãi Trường, Phú Quốc',
    priceRange: [5000000, 15000000], areaRange: [150, 300], bedrooms: [3, 5], bathrooms: [2, 4], priceUnit: 'NIGHT' as PriceUnit,
    structure: [
      { name: 'Khu A - Biển', units: ['Villa A1', 'Villa A2', 'Villa A3', 'Villa A4', 'Villa A5'] },
      { name: 'Khu B - Vườn', units: ['Villa B1', 'Villa B2', 'Villa B3', 'Villa B4', 'Villa B5'] },
    ]
  },
  
  { code: 'AIRBNB_ROOM', duration: 'SHORT_TERM', assetName: 'Phòng Airbnb Quận 2', address: '28 Mai Chí Thọ, Q2, TP.HCM',
    priceRange: [400000, 900000], areaRange: [18, 30], bedrooms: [1, 1], bathrooms: [1, 1], priceUnit: 'NIGHT' as PriceUnit,
    structure: [
      { name: 'Tầng 8', units: ['Phòng 801', 'Phòng 802', 'Phòng 803', 'Phòng 804', 'Phòng 805'] },
      { name: 'Tầng 10', units: ['Phòng 1001', 'Phòng 1002', 'Phòng 1003', 'Phòng 1004', 'Phòng 1005'] },
    ]
  },
  
  { code: 'COLIVING_SHORT', duration: 'SHORT_TERM', assetName: 'Co-living Ngắn Hạn Thủ Đức', address: 'Kha Vạn Cân, Thủ Đức',
    priceRange: [350000, 700000], areaRange: [15, 25], bedrooms: [1, 1], bathrooms: [1, 1], priceUnit: 'NIGHT' as PriceUnit,
    structure: [
      { name: 'Tầng 3', units: ['Phòng 301', 'Phòng 302', 'Phòng 303', 'Phòng 304', 'Phòng 305'] },
      { name: 'Tầng 4', units: ['Phòng 401', 'Phòng 402', 'Phòng 403', 'Phòng 404', 'Phòng 405'] },
    ]
  },

  // MEDIUM_TERM
  { code: 'PRIVATE_HOUSE', duration: 'MEDIUM_TERM', assetName: 'Khu Nhà Phố Thảo Điền', address: 'Xuân Thủy, Thảo Điền, Q2',
    priceRange: [25000000, 45000000], areaRange: [120, 200], bedrooms: [3, 5], bathrooms: [2, 4], priceUnit: 'MONTH' as PriceUnit,
    structure: [
      { name: 'Dãy A', units: ['Nhà A1', 'Nhà A2', 'Nhà A3', 'Nhà A4', 'Nhà A5'] },
      { name: 'Dãy B', units: ['Nhà B1', 'Nhà B2', 'Nhà B3', 'Nhà B4', 'Nhà B5'] },
    ]
  },
  
  { code: 'ROOM_RENTAL', duration: 'MEDIUM_TERM', assetName: 'Dãy Trọ Sinh Viên Thủ Đức', address: 'Kha Vạn Cân, Thủ Đức',
    priceRange: [1500000, 3500000], areaRange: [15, 25], bedrooms: [1, 1], bathrooms: [1, 1], priceUnit: 'MONTH' as PriceUnit,
    structure: [
      { name: 'Dãy A', units: ['Phòng A1', 'Phòng A2', 'Phòng A3', 'Phòng A4', 'Phòng A5'] },
      { name: 'Dãy B', units: ['Phòng B1', 'Phòng B2', 'Phòng B3', 'Phòng B4', 'Phòng B5'] },
    ]
  },
  
  { code: 'APARTMENT', duration: 'MEDIUM_TERM', assetName: 'Chung Cư Vinhomes Central Park', address: '208 Nguyễn Hữu Cảnh, Bình Thạnh',
    priceRange: [8000000, 15000000], areaRange: [65, 95], bedrooms: [2, 3], bathrooms: [2, 2], priceUnit: 'MONTH' as PriceUnit,
    structure: [
      { name: 'Tầng 15', units: ['Căn 1501', 'Căn 1502'] },
      { name: 'Tầng 16', units: ['Căn 1601', 'Căn 1602'] },
      { name: 'Tầng 17', units: ['Căn 1701', 'Căn 1702'] },
      { name: 'Tầng 18', units: ['Căn 1801', 'Căn 1802'] },
      { name: 'Tầng 19', units: ['Căn 1901', 'Căn 1902'] },
    ]
  },
  
  { code: 'SERVICED_APARTMENT_MEDIUM', duration: 'MEDIUM_TERM', assetName: 'Căn Hộ DV Trung Hạn Masteri', address: '159 Xa Lộ Hà Nội, Q2',
    priceRange: [10000000, 20000000], areaRange: [50, 80], bedrooms: [1, 2], bathrooms: [1, 2], priceUnit: 'MONTH' as PriceUnit,
    structure: [
      { name: 'Tầng 10', units: ['Căn 1001', 'Căn 1002', 'Căn 1003', 'Căn 1004', 'Căn 1005'] },
      { name: 'Tầng 12', units: ['Căn 1201', 'Căn 1202', 'Căn 1203', 'Căn 1204', 'Căn 1205'] },
    ]
  },
  
  { code: 'WHOLE_HOUSE', duration: 'MEDIUM_TERM', assetName: 'Nhà Nguyên Căn Quận 7', address: 'Nguyễn Lương Bằng, Phú Mỹ Hưng, Q7',
    priceRange: [20000000, 40000000], areaRange: [100, 180], bedrooms: [3, 4], bathrooms: [2, 3], priceUnit: 'MONTH' as PriceUnit,
    structure: [
      { name: 'Khu A', units: ['Nhà A1', 'Nhà A2', 'Nhà A3', 'Nhà A4', 'Nhà A5'] },
      { name: 'Khu B', units: ['Nhà B1', 'Nhà B2', 'Nhà B3', 'Nhà B4', 'Nhà B5'] },
    ]
  },
  
  { code: 'RETAIL_SPACE_SMALL', duration: 'MEDIUM_TERM', assetName: 'Mặt Bằng Nhỏ Vincom', address: '72 Lê Thánh Tôn, Q1',
    priceRange: [15000000, 35000000], areaRange: [30, 80], priceUnit: 'MONTH' as PriceUnit,
    structure: [
      { name: 'Tầng Trệt', units: ['MB-G01', 'MB-G02', 'MB-G03', 'MB-G04', 'MB-G05'] },
      { name: 'Tầng 1', units: ['MB-101', 'MB-102', 'MB-103', 'MB-104', 'MB-105'] },
    ]
  },
  
  { code: 'WAREHOUSE_TEMP', duration: 'MEDIUM_TERM', assetName: 'Kho Tạm Bình Tân', address: 'Đường số 8, Bình Tân',
    priceRange: [10000000, 25000000], areaRange: [100, 300], priceUnit: 'MONTH' as PriceUnit,
    structure: [
      { name: 'Khu A', units: ['Kho A1', 'Kho A2', 'Kho A3', 'Kho A4', 'Kho A5'] },
      { name: 'Khu B', units: ['Kho B1', 'Kho B2', 'Kho B3', 'Kho B4', 'Kho B5'] },
    ]
  },

  // LONG_TERM
  { code: 'OFFICE', duration: 'LONG_TERM', assetName: 'Văn Phòng Bitexco', address: '2 Hải Triều, Q1, TP.HCM',
    priceRange: [30000000, 80000000], areaRange: [80, 200], priceUnit: 'MONTH' as PriceUnit,
    structure: [
      { name: 'Tầng 20', units: ['VP 2001', 'VP 2002', 'VP 2003', 'VP 2004'] },
      { name: 'Tầng 21', units: ['VP 2101', 'VP 2102', 'VP 2103', 'VP 2104', 'VP 2105', 'VP 2106'] },
    ]
  },
  
  { code: 'LAND_PLOT', duration: 'LONG_TERM', assetName: 'Đất Nền Nhà Bè', address: 'Đường Huỳnh Tấn Phát, Nhà Bè',
    priceRange: [50000000, 150000000], areaRange: [100, 500], priceUnit: 'MONTH' as PriceUnit,
    structure: [
      { name: 'Khu A', units: ['Lô A1', 'Lô A2', 'Lô A3', 'Lô A4', 'Lô A5'] },
      { name: 'Khu B', units: ['Lô B1', 'Lô B2', 'Lô B3', 'Lô B4', 'Lô B5'] },
    ]
  },
  
  { code: 'FACTORY', duration: 'LONG_TERM', assetName: 'Nhà Xưởng Bình Dương', address: 'KCN Việt Nam Singapore, Bình Dương',
    priceRange: [80000000, 200000000], areaRange: [500, 2000], priceUnit: 'MONTH' as PriceUnit,
    structure: [
      { name: 'Khu A', units: ['Xưởng A1', 'Xưởng A2', 'Xưởng A3', 'Xưởng A4'] },
      { name: 'Khu B', units: ['Xưởng B1', 'Xưởng B2', 'Xưởng B3', 'Xưởng B4', 'Xưởng B5', 'Xưởng B6'] },
    ]
  },
  
  { code: 'COMMERCIAL_SPACE', duration: 'LONG_TERM', assetName: 'Mặt Bằng Thương Mại Landmark 81', address: '720A Điện Biên Phủ, Bình Thạnh',
    priceRange: [100000000, 300000000], areaRange: [200, 800], priceUnit: 'MONTH' as PriceUnit,
    structure: [
      { name: 'Tầng Trệt', units: ['MB-G01', 'MB-G02', 'MB-G03', 'MB-G04', 'MB-G05'] },
      { name: 'Tầng 1', units: ['MB-101', 'MB-102', 'MB-103', 'MB-104', 'MB-105'] },
    ]
  },
  
  { code: 'LUXURY_APARTMENT', duration: 'LONG_TERM', assetName: 'Căn Hộ Cao Cấp The Marq', address: '15 Nguyễn Đình Chiểu, Q1',
    priceRange: [50000000, 120000000], areaRange: [120, 250], bedrooms: [3, 4], bathrooms: [3, 4], priceUnit: 'MONTH' as PriceUnit,
    structure: [
      { name: 'Tầng 25', units: ['Căn 2501', 'Căn 2502', 'Căn 2503', 'Căn 2504', 'Căn 2505'] },
      { name: 'Tầng 30', units: ['Căn 3001', 'Căn 3002', 'Căn 3003', 'Căn 3004', 'Căn 3005'] },
    ]
  },
  
  { code: 'VILLA_LONG', duration: 'LONG_TERM', assetName: 'Biệt Thự Thảo Điền', address: 'Đường Nguyễn Văn Hưởng, Thảo Điền, Q2',
    priceRange: [80000000, 200000000], areaRange: [300, 600], bedrooms: [4, 6], bathrooms: [4, 6], priceUnit: 'MONTH' as PriceUnit,
    structure: [
      { name: 'Khu A', units: ['Villa A1', 'Villa A2', 'Villa A3', 'Villa A4', 'Villa A5'] },
      { name: 'Khu B', units: ['Villa B1', 'Villa B2', 'Villa B3', 'Villa B4', 'Villa B5'] },
    ]
  },
  
  { code: 'SHOPHOUSE', duration: 'LONG_TERM', assetName: 'Nhà Phố Kinh Doanh Vạn Phúc', address: 'Vạn Phúc City, Thủ Đức',
    priceRange: [40000000, 100000000], areaRange: [150, 300], bedrooms: [3, 4], bathrooms: [3, 4], priceUnit: 'MONTH' as PriceUnit,
    structure: [
      { name: 'Dãy C', units: ['SH-C01', 'SH-C02', 'SH-C03', 'SH-C04'] },
      { name: 'Dãy D', units: ['SH-D01', 'SH-D02', 'SH-D03', 'SH-D04', 'SH-D05', 'SH-D06'] },
    ]
  },
];

async function main() {
  console.log('🚀 Starting enhanced property seeding...\n');

  const landlordUser = await prisma.user.findFirst({
    where: { email: 'landlord@example.com' },
  });

  if (!landlordUser) {
    throw new Error('❌ Landlord user not found');
  }

  const orgId = landlordUser.org_id;
  console.log(`✅ Found organization: ${orgId}\n`);

  let totalCreated = 0;

  for (const config of PROPERTY_CONFIGS) {
    console.log(`📦 Creating asset: ${config.assetName} (${config.code})`);

    // Create asset
    const asset = await prisma.asset.create({
      data: {
        org_id: orgId,
        name: config.assetName,
        asset_type: 'PROPERTY',
        status: 'ACTIVE',
        attrs: { address: config.address },
      },
    });

    // Create space structure
    for (const floor of config.structure) {
      const floorNode = await prisma.spaceNode.create({
        data: {
          org_id: orgId,
          asset_id: asset.id,
          node_type: 'floor',
          name: floor.name,
          path: `/${floor.name}`,
          attrs: {},
        },
      });

      // Create units (rentable items)
      for (const unitName of floor.units) {
        const unitNode = await prisma.spaceNode.create({
          data: {
            org_id: orgId,
            asset_id: asset.id,
            parent_id: floorNode.id,
            node_type: 'unit',
            name: unitName,
            path: `/${floor.name}/${unitName}`,
            attrs: {},
          },
        });

        // Generate complete property data
        const location = generateLocation(config.address);
        const pricing = generatePricing(
          config.priceRange as [number, number],
          config.priceUnit,
          config.duration === 'SHORT_TERM' ? 'SHORT' : config.duration === 'MEDIUM_TERM' ? 'MID' : 'LONG'
        );
        const physical = generatePhysicalDetails(
          config.areaRange as [number, number],
          config.bedrooms as [number, number] | undefined,
          config.bathrooms as [number, number] | undefined,
          config.code
        );
        const amenities = generateAmenities(config.code);
        
        let booking = {};
        let metadata = {};
        
        if (config.duration === 'SHORT_TERM') {
          booking = generateShortTermBooking();
          metadata = generateShortTermMetadata(config.code);
        } else if (config.duration === 'MEDIUM_TERM') {
          metadata = generateMidTermMetadata(config.code);
        } else {
          metadata = generateLongTermMetadata(config.code);
        }

        // Create rentable item with all enhanced fields
        const rentableItem = await prisma.rentableItem.create({
          data: {
            org_id: orgId,
            space_node_id: unitNode.id,
            code: unitName.replace(/\s+/g, '-').toUpperCase(),
            allocation_type: 'exclusive',
            status: 'ACTIVE',
            property_category: config.code,
            rental_duration_type: config.duration,
            
            // Location
            ...location,
            
            // Pricing
            ...pricing,
            
            // Physical
            ...physical,
            
            // Amenities
            amenities: amenities,
            
            // Booking (SHORT_TERM only)
            ...booking,
            
            // Metadata
            metadata: metadata as any,
          },
        });

        totalCreated++;
      }
    }

    console.log(`  ✅ Created ${config.structure.reduce((sum, f) => sum + f.units.length, 0)} rentable items\n`);
  }

  console.log(`\n🎉 Seeding complete! Created ${totalCreated} enhanced rentable items`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
