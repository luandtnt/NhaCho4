import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get landlord organization
  const landlordUser = await prisma.user.findFirst({
    where: { email: 'landlord@example.com' },
  });

  if (!landlordUser) {
    throw new Error('Landlord user not found');
  }

  const orgId = landlordUser.org_id;

  // Get all property categories
  const categories = await prisma.propertyCategory.findMany({
    orderBy: { display_order: 'asc' },
  });

  console.log(`Found ${categories.length} property categories`);

  // Get amenities for assignment
  const amenities = await prisma.amenity.findMany();

  // Define property structures for each category
  const propertyStructures = [
    {
      category: 'Chung cư',
      assetName: 'Chung cư Vinhomes Central Park',
      assetAddress: '208 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM',
      structure: [
        { name: 'Tòa Landmark 1', children: [
          { name: 'Tầng 15', units: ['Căn 1501', 'Căn 1502'] },
          { name: 'Tầng 16', units: ['Căn 1601', 'Căn 1602'] },
          { name: 'Tầng 17', units: ['Căn 1701', 'Căn 1702'] },
          { name: 'Tầng 18', units: ['Căn 1801', 'Căn 1802'] },
          { name: 'Tầng 19', units: ['Căn 1901', 'Căn 1902'] },
        ]},
      ],
      priceRange: [8000000, 15000000],
      area: [65, 95],
    },
    {
      category: 'Nhà riêng',
      assetName: 'Khu Nhà Phố Thảo Điền',
      assetAddress: 'Đường Xuân Thủy, Thảo Điền, Quận 2, TP.HCM',
      structure: [
        { name: 'Dãy A', units: ['Nhà A1', 'Nhà A2', 'Nhà A3', 'Nhà A4', 'Nhà A5'] },
        { name: 'Dãy B', units: ['Nhà B1', 'Nhà B2', 'Nhà B3', 'Nhà B4', 'Nhà B5'] },
      ],
      priceRange: [25000000, 45000000],
      area: [120, 200],
    },
    {
      category: 'Biệt thự',
      assetName: 'Khu Biệt Thự Riviera Cove',
      assetAddress: 'Đường Nguyễn Văn Tưởng, Quận 2, TP.HCM',
      structure: [
        { name: 'Khu A - Ven Sông', units: ['Villa A1', 'Villa A2', 'Villa A3', 'Villa A4', 'Villa A5'] },
        { name: 'Khu B - Vườn Xanh', units: ['Villa B1', 'Villa B2', 'Villa B3', 'Villa B4', 'Villa B5'] },
      ],
      priceRange: [80000000, 150000000],
      area: [300, 500],
    },
    {
      category: 'Homestay',
      assetName: 'Homestay Đà Lạt View',
      assetAddress: '123 Đường Trần Phú, Phường 4, Đà Lạt, Lâm Đồng',
      structure: [
        { name: 'Tầng 1', units: ['Phòng Garden View 1', 'Phòng Garden View 2'] },
        { name: 'Tầng 2', units: ['Phòng City View 1', 'Phòng City View 2', 'Phòng City View 3'] },
        { name: 'Tầng 3', units: ['Phòng Mountain View 1', 'Phòng Mountain View 2', 'Phòng Mountain View 3'] },
      ],
      priceRange: [300000, 800000],
      area: [20, 35],
    },
    {
      category: 'Khách sạn',
      assetName: 'Khách Sạn Mường Thanh Luxury',
      assetAddress: '60 Nguyễn Huệ, Quận 1, TP.HCM',
      structure: [
        { name: 'Tầng 5 - Standard', units: ['Phòng 501', 'Phòng 502', 'Phòng 503'] },
        { name: 'Tầng 10 - Deluxe', units: ['Phòng 1001', 'Phòng 1002', 'Phòng 1003'] },
        { name: 'Tầng 15 - Suite', units: ['Suite 1501', 'Suite 1502', 'Suite 1503', 'Suite 1504'] },
      ],
      priceRange: [800000, 3000000],
      area: [25, 60],
    },
    {
      category: 'Văn phòng',
      assetName: 'Tòa Nhà Văn Phòng Bitexco',
      assetAddress: '2 Hải Triều, Quận 1, TP.HCM',
      structure: [
        { name: 'Tầng 8', units: ['VP 801', 'VP 802', 'VP 803'] },
        { name: 'Tầng 12', units: ['VP 1201', 'VP 1202', 'VP 1203'] },
        { name: 'Tầng 20', units: ['VP 2001', 'VP 2002', 'VP 2003', 'VP 2004'] },
      ],
      priceRange: [15000000, 50000000],
      area: [50, 200],
    },
    {
      category: 'Mặt bằng kinh doanh',
      assetName: 'Trung Tâm Thương Mại Vincom',
      assetAddress: '72 Lê Thánh Tôn, Quận 1, TP.HCM',
      structure: [
        { name: 'Tầng Trệt', units: ['MB-G01', 'MB-G02', 'MB-G03'] },
        { name: 'Tầng 1', units: ['MB-101', 'MB-102', 'MB-103'] },
        { name: 'Tầng 2', units: ['MB-201', 'MB-202', 'MB-203', 'MB-204'] },
      ],
      priceRange: [30000000, 80000000],
      area: [40, 150],
    },
    {
      category: 'Cửa hàng',
      assetName: 'Khu Shophouse Phú Mỹ Hưng',
      assetAddress: 'Nguyễn Lương Bằng, Phú Mỹ Hưng, Quận 7, TP.HCM',
      structure: [
        { name: 'Dãy 1', units: ['Shop 1-01', 'Shop 1-02', 'Shop 1-03', 'Shop 1-04', 'Shop 1-05'] },
        { name: 'Dãy 2', units: ['Shop 2-01', 'Shop 2-02', 'Shop 2-03', 'Shop 2-04', 'Shop 2-05'] },
      ],
      priceRange: [20000000, 60000000],
      area: [30, 100],
    },
    {
      category: 'Nhà hàng',
      assetName: 'Khu Ẩm Thực Bùi Viện',
      assetAddress: 'Đường Bùi Viện, Quận 1, TP.HCM',
      structure: [
        { name: 'Khu A', units: ['Nhà hàng A1', 'Nhà hàng A2', 'Nhà hàng A3'] },
        { name: 'Khu B', units: ['Nhà hàng B1', 'Nhà hàng B2', 'Nhà hàng B3', 'Nhà hàng B4'] },
        { name: 'Khu C - Rooftop', units: ['Rooftop C1', 'Rooftop C2', 'Rooftop C3'] },
      ],
      priceRange: [40000000, 100000000],
      area: [80, 250],
    },
    {
      category: 'Kho xưởng',
      assetName: 'Khu Công Nghiệp Tân Bình',
      assetAddress: 'Đường số 8, KCN Tân Bình, TP.HCM',
      structure: [
        { name: 'Khu A - Kho Nhỏ', units: ['Kho A1', 'Kho A2', 'Kho A3'] },
        { name: 'Khu B - Kho Trung', units: ['Kho B1', 'Kho B2', 'Kho B3'] },
        { name: 'Khu C - Kho Lớn', units: ['Kho C1', 'Kho C2', 'Kho C3', 'Kho C4'] },
      ],
      priceRange: [25000000, 80000000],
      area: [200, 1000],
    },
    {
      category: 'Nhà xưởng',
      assetName: 'Khu Xưởng Sản Xuất Bình Dương',
      assetAddress: 'Đường DT743, Thuận An, Bình Dương',
      structure: [
        { name: 'Khu Sản Xuất A', units: ['Xưởng A1', 'Xưởng A2', 'Xưởng A3'] },
        { name: 'Khu Sản Xuất B', units: ['Xưởng B1', 'Xưởng B2', 'Xưởng B3'] },
        { name: 'Khu Lắp Ráp C', units: ['Xưởng C1', 'Xưởng C2', 'Xưởng C3', 'Xưởng C4'] },
      ],
      priceRange: [30000000, 100000000],
      area: [300, 1500],
    },
    {
      category: 'Đất nông nghiệp',
      assetName: 'Khu Đất Nông Nghiệp Long An',
      assetAddress: 'Xã Tân Trụ, Huyện Tân Trụ, Long An',
      structure: [
        { name: 'Khu A - Đất Trồng Lúa', units: ['Lô A1', 'Lô A2', 'Lô A3'] },
        { name: 'Khu B - Đất Vườn', units: ['Lô B1', 'Lô B2', 'Lô B3'] },
        { name: 'Khu C - Đất Ao', units: ['Lô C1', 'Lô C2', 'Lô C3', 'Lô C4'] },
      ],
      priceRange: [5000000, 15000000],
      area: [1000, 5000],
    },
    {
      category: 'Đất thổ cư',
      assetName: 'Khu Đất Thổ Cư Nhà Bè',
      assetAddress: 'Đường Huỳnh Tấn Phát, Nhà Bè, TP.HCM',
      structure: [
        { name: 'Khu A - Mặt Tiền', units: ['Lô A1', 'Lô A2', 'Lô A3'] },
        { name: 'Khu B - Hẻm Xe Hơi', units: ['Lô B1', 'Lô B2', 'Lô B3'] },
        { name: 'Khu C - Trong Hẻm', units: ['Lô C1', 'Lô C2', 'Lô C3', 'Lô C4'] },
      ],
      priceRange: [15000000, 40000000],
      area: [80, 200],
    },
    {
      category: 'Đất công nghiệp',
      assetName: 'Khu Công Nghiệp Long Hậu',
      assetAddress: 'KCN Long Hậu, Long An',
      structure: [
        { name: 'Khu A - Công Nghiệp Nhẹ', units: ['Lô A1', 'Lô A2', 'Lô A3'] },
        { name: 'Khu B - Công Nghiệp Nặng', units: ['Lô B1', 'Lô B2', 'Lô B3'] },
        { name: 'Khu C - Logistics', units: ['Lô C1', 'Lô C2', 'Lô C3', 'Lô C4'] },
      ],
      priceRange: [20000000, 60000000],
      area: [500, 3000],
    },
    {
      category: 'Studio',
      assetName: 'Tòa Studio The Sun Avenue',
      assetAddress: '28 Mai Chí Thọ, Quận 2, TP.HCM',
      structure: [
        { name: 'Tầng 10', units: ['Studio 1001', 'Studio 1002', 'Studio 1003'] },
        { name: 'Tầng 15', units: ['Studio 1501', 'Studio 1502', 'Studio 1503'] },
        { name: 'Tầng 20', units: ['Studio 2001', 'Studio 2002', 'Studio 2003', 'Studio 2004'] },
      ],
      priceRange: [5000000, 9000000],
      area: [25, 40],
    },
    {
      category: 'Penthouse',
      assetName: 'Tòa Penthouse Masteri Thảo Điền',
      assetAddress: '159 Xa Lộ Hà Nội, Quận 2, TP.HCM',
      structure: [
        { name: 'Tầng 30 - Sky Villa', units: ['PH-3001', 'PH-3002'] },
        { name: 'Tầng 35 - Premium', units: ['PH-3501', 'PH-3502', 'PH-3503'] },
        { name: 'Tầng 40 - Luxury', units: ['PH-4001', 'PH-4002', 'PH-4003', 'PH-4004', 'PH-4005'] },
      ],
      priceRange: [50000000, 120000000],
      area: [150, 300],
    },
    {
      category: 'Officetel',
      assetName: 'Tòa Officetel Millennium',
      assetAddress: '132 Bến Vân Đồn, Quận 4, TP.HCM',
      structure: [
        { name: 'Tầng 8', units: ['OT-801', 'OT-802', 'OT-803'] },
        { name: 'Tầng 12', units: ['OT-1201', 'OT-1202', 'OT-1203'] },
        { name: 'Tầng 18', units: ['OT-1801', 'OT-1802', 'OT-1803', 'OT-1804'] },
      ],
      priceRange: [6000000, 12000000],
      area: [30, 50],
    },
    {
      category: 'Condotel',
      assetName: 'Condotel Nha Trang Pearl',
      assetAddress: 'Trần Phú, Nha Trang, Khánh Hòa',
      structure: [
        { name: 'Tầng 15 - Sea View', units: ['CDT-1501', 'CDT-1502', 'CDT-1503'] },
        { name: 'Tầng 20 - Premium', units: ['CDT-2001', 'CDT-2002', 'CDT-2003'] },
        { name: 'Tầng 25 - Luxury', units: ['CDT-2501', 'CDT-2502', 'CDT-2503', 'CDT-2504'] },
      ],
      priceRange: [1500000, 4000000],
      area: [35, 65],
    },
    {
      category: 'Shophouse',
      assetName: 'Khu Shophouse Vạn Phúc City',
      assetAddress: 'Vạn Phúc, Thủ Đức, TP.HCM',
      structure: [
        { name: 'Dãy A - Mặt Tiền Chính', units: ['SH-A01', 'SH-A02', 'SH-A03'] },
        { name: 'Dãy B - Mặt Tiền Phụ', units: ['SH-B01', 'SH-B02', 'SH-B03'] },
        { name: 'Dãy C - Trong Khu', units: ['SH-C01', 'SH-C02', 'SH-C03', 'SH-C04'] },
      ],
      priceRange: [35000000, 90000000],
      area: [100, 250],
    },
    {
      category: 'Nhà trọ',
      assetName: 'Dãy Trọ Sinh Viên Thủ Đức',
      assetAddress: 'Đường Kha Vạn Cân, Thủ Đức, TP.HCM',
      structure: [
        { name: 'Dãy A', units: ['Phòng A1', 'Phòng A2', 'Phòng A3', 'Phòng A4'] },
        { name: 'Dãy B', units: ['Phòng B1', 'Phòng B2', 'Phòng B3'] },
        { name: 'Dãy C', units: ['Phòng C1', 'Phòng C2', 'Phòng C3'] },
      ],
      priceRange: [1500000, 3500000],
      area: [15, 25],
    },
    {
      category: 'Ký túc xá',
      assetName: 'Ký Túc Xá Đại Học Quốc Gia',
      assetAddress: 'Đường Tạ Quang Bửu, Thủ Đức, TP.HCM',
      structure: [
        { name: 'Khu A - Nam', units: ['Phòng A101', 'Phòng A102', 'Phòng A103'] },
        { name: 'Khu B - Nữ', units: ['Phòng B101', 'Phòng B102', 'Phòng B103'] },
        { name: 'Khu C - Gia Đình', units: ['Phòng C101', 'Phòng C102', 'Phòng C103', 'Phòng C104'] },
      ],
      priceRange: [1000000, 2500000],
      area: [12, 20],
    },
  ];

  let totalCreated = 0;

  for (const structure of propertyStructures) {
    const category = categories.find(c => c.name_vi === structure.category);
    if (!category) {
      console.log(`Category not found: ${structure.category}`);
      continue;
    }

    console.log(`\n=== Creating ${structure.category} ===`);

    // Create Asset
    const asset = await prisma.asset.create({
      data: {
        org_id: orgId,
        asset_type: 'PROPERTY',
        name: structure.assetName,
        address_json: { full_address: structure.assetAddress },
        status: 'ACTIVE',
      },
    });

    console.log(`Created asset: ${asset.name}`);

    // Get suitable amenities for this category
    const categoryAmenities = amenities.filter(a => {
      if (!a.category) return false;
      if (structure.category.includes('Chung cư') || structure.category.includes('Studio') || structure.category.includes('Officetel')) {
        return ['BASIC', 'COMFORT', 'SAFETY'].includes(a.category);
      }
      if (structure.category.includes('Văn phòng') || structure.category.includes('Mặt bằng')) {
        return ['BUSINESS', 'TECHNOLOGY'].includes(a.category);
      }
      if (structure.category.includes('Kho') || structure.category.includes('Xưởng')) {
        return ['BUSINESS', 'SAFETY'].includes(a.category);
      }
      if (structure.category.includes('Đất')) {
        return ['OUTDOOR'].includes(a.category);
      }
      return true;
    }).slice(0, 5);

    // Create space structure
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

      // Create units or child nodes
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

          // Create rentable item for this unit
          const price = Math.floor(Math.random() * (structure.priceRange[1] - structure.priceRange[0]) + structure.priceRange[0]);
          const area = Math.floor(Math.random() * (structure.area[1] - structure.area[0]) + structure.area[0]);

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
              bedrooms: ['Chung cư', 'Nhà riêng', 'Biệt thự', 'Penthouse'].includes(structure.category) ? Math.floor(Math.random() * 3) + 1 : null,
              bathrooms: ['Chung cư', 'Nhà riêng', 'Biệt thự', 'Homestay', 'Khách sạn'].includes(structure.category) ? Math.floor(Math.random() * 2) + 1 : null,
              floor_number: structure.category.includes('Tầng') ? Math.floor(Math.random() * 20) + 1 : null,
              amenities: categoryAmenities.map(a => a.code),
              attrs: {
                base_price: price,
                name: unitName,
                description: `${structure.category} ${unitName} - Diện tích ${area}m²`,
              },
            },
          });

          // Create listing for this rentable item
          await prisma.listing.create({
            data: {
              org_id: orgId,
              title: `Cho thuê ${structure.category} ${unitName}`,
              description: `${structure.category} ${unitName} tại ${structure.assetName}. Diện tích ${area}m², giá ${price.toLocaleString('vi-VN')}đ/tháng`,
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
                bedrooms: ['Chung cư', 'Nhà riêng', 'Biệt thự', 'Penthouse'].includes(structure.category) ? Math.floor(Math.random() * 3) + 1 : null,
                bathrooms: ['Chung cư', 'Nhà riêng', 'Biệt thự', 'Homestay', 'Khách sạn'].includes(structure.category) ? Math.floor(Math.random() * 2) + 1 : null,
                floor_number: structure.category.includes('Tầng') ? Math.floor(Math.random() * 20) + 1 : null,
                amenities: categoryAmenities.map(a => a.code),
                attrs: {
                  base_price: price,
                  name: unitName,
                  description: `${structure.category} ${unitName} - Diện tích ${area}m²`,
                },
              },
            });

            await prisma.listing.create({
              data: {
                org_id: orgId,
                title: `Cho thuê ${structure.category} ${unitName}`,
                description: `${structure.category} ${unitName} tại ${structure.assetName}. Diện tích ${area}m², giá ${price.toLocaleString('vi-VN')}đ/tháng`,
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
