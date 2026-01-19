import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const landlordUser = await prisma.user.findFirst({
    where: { email: 'landlord@example.com' },
  });

  if (!landlordUser) {
    throw new Error('Landlord user not found');
  }

  const orgId = landlordUser.org_id;
  const categories = await prisma.propertyCategory.findMany();
  const amenities = await prisma.amenity.findMany();

  console.log(`Found ${categories.length} property categories`);

  const propertyStructures = [
    // SHORT_TERM
    { code: 'HOMESTAY', assetName: 'Homestay Đà Lạt View', address: '123 Trần Phú, Đà Lạt', structure: [
      { name: 'Tầng 1', units: ['Phòng Garden 1', 'Phòng Garden 2'] },
      { name: 'Tầng 2', units: ['Phòng City 1', 'Phòng City 2', 'Phòng City 3'] },
      { name: 'Tầng 3', units: ['Phòng Mountain 1', 'Phòng Mountain 2', 'Phòng Mountain 3', 'Phòng Mountain 4', 'Phòng Mountain 5'] },
    ], priceRange: [300000, 800000], area: [20, 35] },
    
    { code: 'GUESTHOUSE', assetName: 'Nhà Nghỉ Sài Gòn', address: '45 Bùi Viện, Q1, TP.HCM', structure: [
      { name: 'Tầng 2', units: ['Phòng 201', 'Phòng 202', 'Phòng 203', 'Phòng 204', 'Phòng 205'] },
      { name: 'Tầng 3', units: ['Phòng 301', 'Phòng 302', 'Phòng 303', 'Phòng 304', 'Phòng 305'] },
    ], priceRange: [200000, 500000], area: [15, 25] },
    
    { code: 'HOTEL', assetName: 'Khách Sạn Mường Thanh', address: '60 Nguyễn Huệ, Q1, TP.HCM', structure: [
      { name: 'Tầng 5 - Standard', units: ['Phòng 501', 'Phòng 502', 'Phòng 503'] },
      { name: 'Tầng 10 - Deluxe', units: ['Phòng 1001', 'Phòng 1002', 'Phòng 1003'] },
      { name: 'Tầng 15 - Suite', units: ['Suite 1501', 'Suite 1502', 'Suite 1503', 'Suite 1504'] },
    ], priceRange: [800000, 3000000], area: [25, 60] },
    
    { code: 'SERVICED_APARTMENT_SHORT', assetName: 'Căn Hộ DV Ngắn Hạn Vinhomes', address: '208 Nguyễn Hữu Cảnh, Bình Thạnh', structure: [
      { name: 'Tầng 12', units: ['Căn 1201', 'Căn 1202', 'Căn 1203', 'Căn 1204', 'Căn 1205'] },
      { name: 'Tầng 15', units: ['Căn 1501', 'Căn 1502', 'Căn 1503', 'Căn 1504', 'Căn 1505'] },
    ], priceRange: [1500000, 3500000], area: [45, 75] },
    
    { code: 'VILLA_RESORT', assetName: 'Villa Nghỉ Dưỡng Phú Quốc', address: 'Bãi Trường, Phú Quốc', structure: [
      { name: 'Khu A - Biển', units: ['Villa A1', 'Villa A2', 'Villa A3', 'Villa A4', 'Villa A5'] },
      { name: 'Khu B - Vườn', units: ['Villa B1', 'Villa B2', 'Villa B3', 'Villa B4', 'Villa B5'] },
    ], priceRange: [5000000, 15000000], area: [150, 300] },
    
    { code: 'AIRBNB_ROOM', assetName: 'Phòng Airbnb Quận 2', address: '28 Mai Chí Thọ, Q2, TP.HCM', structure: [
      { name: 'Tầng 8', units: ['Phòng 801', 'Phòng 802', 'Phòng 803', 'Phòng 804', 'Phòng 805'] },
      { name: 'Tầng 10', units: ['Phòng 1001', 'Phòng 1002', 'Phòng 1003', 'Phòng 1004', 'Phòng 1005'] },
    ], priceRange: [400000, 900000], area: [18, 30] },
    
    { code: 'COLIVING_SHORT', assetName: 'Co-living Ngắn Hạn Thủ Đức', address: 'Kha Vạn Cân, Thủ Đức', structure: [
      { name: 'Tầng 3', units: ['Phòng 301', 'Phòng 302', 'Phòng 303', 'Phòng 304', 'Phòng 305'] },
      { name: 'Tầng 4', units: ['Phòng 401', 'Phòng 402', 'Phòng 403', 'Phòng 404', 'Phòng 405'] },
    ], priceRange: [350000, 700000], area: [15, 25] },

    // MEDIUM_TERM
    { code: 'PRIVATE_HOUSE', assetName: 'Khu Nhà Phố Thảo Điền', address: 'Xuân Thủy, Thảo Điền, Q2', structure: [
      { name: 'Dãy A', units: ['Nhà A1', 'Nhà A2', 'Nhà A3', 'Nhà A4', 'Nhà A5'] },
      { name: 'Dãy B', units: ['Nhà B1', 'Nhà B2', 'Nhà B3', 'Nhà B4', 'Nhà B5'] },
    ], priceRange: [25000000, 45000000], area: [120, 200] },
    
    { code: 'ROOM_RENTAL', assetName: 'Dãy Trọ Sinh Viên Thủ Đức', address: 'Kha Vạn Cân, Thủ Đức', structure: [
      { name: 'Dãy A', units: ['Phòng A1', 'Phòng A2', 'Phòng A3', 'Phòng A4'] },
      { name: 'Dãy B', units: ['Phòng B1', 'Phòng B2', 'Phòng B3'] },
      { name: 'Dãy C', units: ['Phòng C1', 'Phòng C2', 'Phòng C3'] },
    ], priceRange: [1500000, 3500000], area: [15, 25] },
    
    { code: 'APARTMENT', assetName: 'Chung Cư Vinhomes Central Park', address: '208 Nguyễn Hữu Cảnh, Bình Thạnh', structure: [
      { name: 'Tòa Landmark 1', children: [
        { name: 'Tầng 15', units: ['Căn 1501', 'Căn 1502'] },
        { name: 'Tầng 16', units: ['Căn 1601', 'Căn 1602'] },
        { name: 'Tầng 17', units: ['Căn 1701', 'Căn 1702'] },
        { name: 'Tầng 18', units: ['Căn 1801', 'Căn 1802'] },
        { name: 'Tầng 19', units: ['Căn 1901', 'Căn 1902'] },
      ]},
    ], priceRange: [8000000, 15000000], area: [65, 95] },
    
    { code: 'SERVICED_APARTMENT_MEDIUM', assetName: 'Căn Hộ DV Trung Hạn Masteri', address: '159 Xa Lộ Hà Nội, Q2', structure: [
      { name: 'Tầng 10', units: ['Căn 1001', 'Căn 1002', 'Căn 1003', 'Căn 1004', 'Căn 1005'] },
      { name: 'Tầng 12', units: ['Căn 1201', 'Căn 1202', 'Căn 1203', 'Căn 1204', 'Căn 1205'] },
    ], priceRange: [10000000, 20000000], area: [50, 80] },
    
    { code: 'WHOLE_HOUSE', assetName: 'Nhà Nguyên Căn Quận 7', address: 'Nguyễn Lương Bằng, Phú Mỹ Hưng, Q7', structure: [
      { name: 'Khu A', units: ['Nhà A1', 'Nhà A2', 'Nhà A3', 'Nhà A4', 'Nhà A5'] },
      { name: 'Khu B', units: ['Nhà B1', 'Nhà B2', 'Nhà B3', 'Nhà B4', 'Nhà B5'] },
    ], priceRange: [20000000, 40000000], area: [100, 180] },
    
    { code: 'RETAIL_SPACE_SMALL', assetName: 'Mặt Bằng Nhỏ Vincom', address: '72 Lê Thánh Tôn, Q1', structure: [
      { name: 'Tầng Trệt', units: ['MB-G01', 'MB-G02', 'MB-G03', 'MB-G04', 'MB-G05'] },
      { name: 'Tầng 1', units: ['MB-101', 'MB-102', 'MB-103', 'MB-104', 'MB-105'] },
    ], priceRange: [15000000, 35000000], area: [30, 80] },
    
    { code: 'WAREHOUSE_TEMP', assetName: 'Kho Tạm Bình Tân', address: 'Đường số 8, Bình Tân', structure: [
      { name: 'Khu A', units: ['Kho A1', 'Kho A2', 'Kho A3', 'Kho A4', 'Kho A5'] },
      { name: 'Khu B', units: ['Kho B1', 'Kho B2', 'Kho B3', 'Kho B4', 'Kho B5'] },
    ], priceRange: [10000000, 25000000], area: [100, 300] },

    // LONG_TERM
    { code: 'OFFICE', assetName: 'Tòa Văn Phòng Bitexco', address: '2 Hải Triều, Q1', structure: [
      { name: 'Tầng 8', units: ['VP 801', 'VP 802', 'VP 803'] },
      { name: 'Tầng 12', units: ['VP 1201', 'VP 1202', 'VP 1203'] },
      { name: 'Tầng 20', units: ['VP 2001', 'VP 2002', 'VP 2003', 'VP 2004'] },
    ], priceRange: [15000000, 50000000], area: [50, 200] },
    
    { code: 'LAND', assetName: 'Đất Nền Nhà Bè', address: 'Huỳnh Tấn Phát, Nhà Bè', structure: [
      { name: 'Khu A - Mặt Tiền', units: ['Lô A1', 'Lô A2', 'Lô A3'] },
      { name: 'Khu B - Hẻm Xe Hơi', units: ['Lô B1', 'Lô B2', 'Lô B3'] },
      { name: 'Khu C - Trong Hẻm', units: ['Lô C1', 'Lô C2', 'Lô C3', 'Lô C4'] },
    ], priceRange: [15000000, 40000000], area: [80, 200] },
    
    { code: 'WAREHOUSE', assetName: 'Nhà Xưởng Bình Dương', address: 'DT743, Thuận An, Bình Dương', structure: [
      { name: 'Khu Sản Xuất A', units: ['Xưởng A1', 'Xưởng A2', 'Xưởng A3'] },
      { name: 'Khu Sản Xuất B', units: ['Xưởng B1', 'Xưởng B2', 'Xưởng B3'] },
      { name: 'Khu Lắp Ráp C', units: ['Xưởng C1', 'Xưởng C2', 'Xưởng C3', 'Xưởng C4'] },
    ], priceRange: [30000000, 100000000], area: [300, 1500] },
    
    { code: 'COMMERCIAL_SPACE', assetName: 'Mặt Bằng Thương Mại Vincom', address: '72 Lê Thánh Tôn, Q1', structure: [
      { name: 'Tầng Trệt', units: ['MB-G01', 'MB-G02', 'MB-G03'] },
      { name: 'Tầng 1', units: ['MB-101', 'MB-102', 'MB-103'] },
      { name: 'Tầng 2', units: ['MB-201', 'MB-202', 'MB-203', 'MB-204'] },
    ], priceRange: [30000000, 80000000], area: [40, 150] },
    
    { code: 'LUXURY_APARTMENT', assetName: 'Chung Cư Cao Cấp Landmark 81', address: '720A Điện Biên Phủ, Bình Thạnh', structure: [
      { name: 'Tầng 50', units: ['Căn 5001', 'Căn 5002', 'Căn 5003', 'Căn 5004', 'Căn 5005'] },
      { name: 'Tầng 60', units: ['Căn 6001', 'Căn 6002', 'Căn 6003', 'Căn 6004', 'Căn 6005'] },
    ], priceRange: [40000000, 100000000], area: [100, 200] },
    
    { code: 'VILLA', assetName: 'Biệt Thự Riviera Cove', address: 'Nguyễn Văn Tưởng, Q2', structure: [
      { name: 'Khu A - Ven Sông', units: ['Villa A1', 'Villa A2', 'Villa A3', 'Villa A4', 'Villa A5'] },
      { name: 'Khu B - Vườn Xanh', units: ['Villa B1', 'Villa B2', 'Villa B3', 'Villa B4', 'Villa B5'] },
    ], priceRange: [80000000, 150000000], area: [300, 500] },
    
    { code: 'SHOPHOUSE', assetName: 'Nhà Phố Kinh Doanh Vạn Phúc', address: 'Vạn Phúc, Thủ Đức', structure: [
      { name: 'Dãy A - Mặt Tiền', units: ['SH-A01', 'SH-A02', 'SH-A03'] },
      { name: 'Dãy B - Mặt Tiền Phụ', units: ['SH-B01', 'SH-B02', 'SH-B03'] },
      { name: 'Dãy C - Trong Khu', units: ['SH-C01', 'SH-C02', 'SH-C03', 'SH-C04'] },
    ], priceRange: [35000000, 90000000], area: [100, 250] },
  ];

  let totalCreated = 0;

  for (const structure of propertyStructures) {
    const category = categories.find(c => c.code === structure.code);
    if (!category) {
      console.log(`Category not found: ${structure.code}`);
      continue;
    }

    console.log(`\n=== Creating ${category.name_vi} ===`);

    const asset = await prisma.asset.create({
      data: {
        org_id: orgId,
        asset_type: 'PROPERTY',
        name: structure.assetName,
        address_json: { full_address: structure.address },
        status: 'ACTIVE',
      },
    });

    console.log(`Created asset: ${asset.name}`);

    const categoryAmenities = amenities.filter(a => a.category).slice(0, 5);

    for (const section of structure.structure) {
      const parentNode = await prisma.spaceNode.create({
        data: {
          org_id: orgId,
          name: section.name,
          asset_id: asset.id,
          parent_id: null,
          node_type: 'SECTION',
          path: `/${section.name}`,
        },
      });

      console.log(`  Created section: ${section.name}`);

      if ('units' in section && section.units) {
        for (const unitName of section.units) {
          const unitNode = await prisma.spaceNode.create({
            data: {
              org_id: orgId,
              name: unitName,
              asset_id: asset.id,
              parent_id: parentNode.id,
              node_type: 'UNIT',
              path: `${parentNode.path}/${unitName}`,
            },
          });

          const price = Math.floor(Math.random() * (structure.priceRange[1] - structure.priceRange[0]) + structure.priceRange[0]);
          const area = Math.floor(Math.random() * (structure.area[1] - structure.area[0]) + structure.area[0]);

          // Determine property-specific attributes
          const isShortTerm = category.duration_type === 'SHORT_TERM';
          const isCommercial = ['OFFICE', 'COMMERCIAL_SPACE', 'RETAIL_SPACE_SMALL'].includes(structure.code);
          const isWarehouse = ['WAREHOUSE', 'WAREHOUSE_TEMP'].includes(structure.code);
          const isLand = structure.code === 'LAND';

          const attrs: any = {
            base_price: price,
            name: unitName,
            description: `${category.name_vi} ${unitName} - Diện tích ${area}m²`,
          };

          // Add commercial-specific attributes
          if (isCommercial) {
            attrs.power_capacity = Math.floor(Math.random() * 50) + 20; // 20-70 kW
            attrs.internet_bandwidth = [100, 200, 500, 1000][Math.floor(Math.random() * 4)]; // Mbps
          }

          // Add warehouse-specific attributes
          if (isWarehouse) {
            attrs.ceiling_height = Math.floor(Math.random() * 6) + 4; // 4-10m
            attrs.floor_load_capacity = Math.floor(Math.random() * 3) + 2; // 2-5 tấn/m²
            attrs.has_crane = Math.random() > 0.5;
          }

          // Add land-specific attributes
          if (isLand) {
            attrs.frontage = Math.floor(Math.random() * 20) + 5; // 5-25m
            attrs.land_type = ['Thổ cư', 'Nông nghiệp', 'Công nghiệp'][Math.floor(Math.random() * 3)];
          }

          const rentableItem = await prisma.rentableItem.create({
            data: {
              org_id: orgId,
              code: unitName.replace(/\s+/g, '_').toUpperCase(),
              space_node_id: unitNode.id,
              property_category: category.code,
              rental_duration_type: category.duration_type,
              allocation_type: 'exclusive',
              status: 'ACTIVE',
              area_sqm: area,
              bedrooms: ['APARTMENT', 'PRIVATE_HOUSE', 'VILLA', 'LUXURY_APARTMENT'].includes(structure.code) ? Math.floor(Math.random() * 3) + 1 : null,
              bathrooms: ['APARTMENT', 'PRIVATE_HOUSE', 'VILLA', 'HOMESTAY', 'HOTEL'].includes(structure.code) ? Math.floor(Math.random() * 2) + 1 : null,
              amenities: categoryAmenities.map(a => a.code),
              instant_booking: isShortTerm ? Math.random() > 0.3 : false, // 70% short-term có instant booking
              cancellation_policy: isShortTerm ? ['FLEXIBLE', 'MODERATE', 'STRICT'][Math.floor(Math.random() * 3)] : 'MODERATE',
              min_rental_days: isShortTerm ? 1 : category.duration_type === 'MEDIUM_TERM' ? 30 : 365,
              house_rules: ['APARTMENT', 'PRIVATE_HOUSE', 'VILLA', 'HOMESTAY'].includes(structure.code) 
                ? ['Không hút thuốc', 'Không nuôi thú cưng', 'Giữ gìn vệ sinh chung']
                : [],
              attrs: attrs,
            },
          });

          await prisma.listing.create({
            data: {
              org_id: orgId,
              title: `Cho thuê ${category.name_vi} ${unitName}`,
              description: `${category.name_vi} ${unitName} tại ${structure.assetName}. Diện tích ${area}m², giá ${price.toLocaleString('vi-VN')}đ/tháng`,
              status: 'PUBLISHED',
              pricing_display: { base_price: price, currency: 'VND' },
              rentable_items: {
                create: {
                  rentable_item_id: rentableItem.id,
                },
              },
            },
          });

          totalCreated++;
          console.log(`    Created unit: ${unitName} (${totalCreated}/210)`);
        }
      } else if ('children' in section && section.children) {
        for (const child of section.children) {
          const childNode = await prisma.spaceNode.create({
            data: {
              org_id: orgId,
              name: child.name,
              asset_id: asset.id,
              parent_id: parentNode.id,
              node_type: 'FLOOR',
              path: `${parentNode.path}/${child.name}`,
            },
          });

          console.log(`    Created floor: ${child.name}`);

          for (const unitName of child.units) {
            const unitNode = await prisma.spaceNode.create({
              data: {
                org_id: orgId,
                name: unitName,
                asset_id: asset.id,
                parent_id: childNode.id,
                node_type: 'UNIT',
                path: `${childNode.path}/${unitName}`,
              },
            });

            const price = Math.floor(Math.random() * (structure.priceRange[1] - structure.priceRange[0]) + structure.priceRange[0]);
            const area = Math.floor(Math.random() * (structure.area[1] - structure.area[0]) + structure.area[0]);

            // Determine property-specific attributes
            const isShortTerm = category.duration_type === 'SHORT_TERM';
            const isCommercial = ['OFFICE', 'COMMERCIAL_SPACE', 'RETAIL_SPACE_SMALL'].includes(structure.code);
            const isWarehouse = ['WAREHOUSE', 'WAREHOUSE_TEMP'].includes(structure.code);
            const isLand = structure.code === 'LAND';

            const attrs: any = {
              base_price: price,
              name: unitName,
              description: `${category.name_vi} ${unitName} - Diện tích ${area}m²`,
            };

            // Add commercial-specific attributes
            if (isCommercial) {
              attrs.power_capacity = Math.floor(Math.random() * 50) + 20; // 20-70 kW
              attrs.internet_bandwidth = [100, 200, 500, 1000][Math.floor(Math.random() * 4)]; // Mbps
            }

            // Add warehouse-specific attributes
            if (isWarehouse) {
              attrs.ceiling_height = Math.floor(Math.random() * 6) + 4; // 4-10m
              attrs.floor_load_capacity = Math.floor(Math.random() * 3) + 2; // 2-5 tấn/m²
              attrs.has_crane = Math.random() > 0.5;
            }

            // Add land-specific attributes
            if (isLand) {
              attrs.frontage = Math.floor(Math.random() * 20) + 5; // 5-25m
              attrs.land_type = ['Thổ cư', 'Nông nghiệp', 'Công nghiệp'][Math.floor(Math.random() * 3)];
            }

            const rentableItem = await prisma.rentableItem.create({
              data: {
                org_id: orgId,
                code: unitName.replace(/\s+/g, '_').toUpperCase(),
                space_node_id: unitNode.id,
                property_category: category.code,
                rental_duration_type: category.duration_type,
                allocation_type: 'exclusive',
                status: 'ACTIVE',
                area_sqm: area,
                bedrooms: ['APARTMENT', 'PRIVATE_HOUSE', 'VILLA', 'LUXURY_APARTMENT'].includes(structure.code) ? Math.floor(Math.random() * 3) + 1 : null,
                bathrooms: ['APARTMENT', 'PRIVATE_HOUSE', 'VILLA', 'HOMESTAY', 'HOTEL'].includes(structure.code) ? Math.floor(Math.random() * 2) + 1 : null,
                amenities: categoryAmenities.map(a => a.code),
                instant_booking: isShortTerm ? Math.random() > 0.3 : false, // 70% short-term có instant booking
                cancellation_policy: isShortTerm ? ['FLEXIBLE', 'MODERATE', 'STRICT'][Math.floor(Math.random() * 3)] : 'MODERATE',
                min_rental_days: isShortTerm ? 1 : category.duration_type === 'MEDIUM_TERM' ? 30 : 365,
                house_rules: ['APARTMENT', 'PRIVATE_HOUSE', 'VILLA', 'HOMESTAY'].includes(structure.code) 
                  ? ['Không hút thuốc', 'Không nuôi thú cưng', 'Giữ gìn vệ sinh chung']
                  : [],
                attrs: attrs,
              },
            });

            await prisma.listing.create({
              data: {
                org_id: orgId,
                title: `Cho thuê ${category.name_vi} ${unitName}`,
                description: `${category.name_vi} ${unitName} tại ${structure.assetName}. Diện tích ${area}m², giá ${price.toLocaleString('vi-VN')}đ/tháng`,
                status: 'PUBLISHED',
                pricing_display: { base_price: price, currency: 'VND' },
                rentable_items: {
                  create: {
                    rentable_item_id: rentableItem.id,
                  },
                },
              },
            });

            totalCreated++;
            console.log(`      Created unit: ${unitName} (${totalCreated}/210)`);
          }
        }
      }
    }
  }

  console.log(`\n✅ Successfully created ${totalCreated} rentable items across 21 assets`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
