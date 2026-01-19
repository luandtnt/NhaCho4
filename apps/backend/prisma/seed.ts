import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create organizations
  const org1 = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Demo Landlord Org',
      status: 'ACTIVE',
    },
  });

  const org2 = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Demo Tenant Org',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Organizations created');

  // Create users
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
      org_id: org1.id, // Changed to org1 to match party
      email: 'tenant@example.com',
      password_hash: passwordHash,
      role: 'Tenant',
      status: 'ACTIVE',
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
      scopes: ['*'],
      assigned_asset_ids: [],
    },
  });

  console.log('✅ Users created');
  console.log('   - landlord@example.com / Password123!');
  console.log('   - tenant@example.com / Password123!');
  console.log('   - admin@example.com / Password123!');

  // Create sample parties
  const landlordParty = await prisma.party.create({
    data: {
      id: '00000000-0000-0000-0000-000000000001',
      org_id: org1.id,
      party_type: 'LANDLORD',
      name: 'Landlord Party',
      email: 'landlord@example.com',
      phone: '+84901234567',
      metadata: {},
    },
  });

  const tenantParty = await prisma.party.create({
    data: {
      id: '00000000-0000-0000-0000-000000000002',
      org_id: org1.id,
      party_type: 'TENANT',
      name: 'Tenant Party',
      email: 'tenant@example.com',
      phone: '+84907654321',
      metadata: {},
    },
  });

  console.log('✅ Parties created');

  // Create sample config bundle
  const configBundle = await prisma.configBundle.create({
    data: {
      org_id: org1.id,
      bundle_id: 'cfg_2026_01_04_001',
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

  console.log('✅ Config bundle created');

  // Create sample asset
  const asset = await prisma.asset.create({
    data: {
      org_id: org1.id,
      asset_type: 'apartment_monthly',
      name: 'Sunrise Apartments',
      address_json: {
        street: '123 Main St',
        city: 'Hanoi',
        district: 'Ba Dinh',
        country: 'Vietnam',
      },
      status: 'ACTIVE',
      attrs: {
        year_built: 2020,
        total_units: 50,
      },
    },
  });

  console.log('✅ Sample asset created');

  // Create space nodes
  const building = await prisma.spaceNode.create({
    data: {
      org_id: org1.id,
      asset_id: asset.id,
      node_type: 'building',
      name: 'Building A',
      path: '/building-a',
      attrs: {},
    },
  });

  const floor = await prisma.spaceNode.create({
    data: {
      org_id: org1.id,
      asset_id: asset.id,
      parent_id: building.id,
      node_type: 'floor',
      name: 'Floor 1',
      path: '/building-a/floor-1',
      attrs: {},
    },
  });

  const unit = await prisma.spaceNode.create({
    data: {
      org_id: org1.id,
      asset_id: asset.id,
      parent_id: floor.id,
      node_type: 'unit',
      name: 'Unit 101',
      path: '/building-a/floor-1/unit-101',
      attrs: {
        bedrooms: 2,
        bathrooms: 1,
        floor_area: 75,
      },
    },
  });

  console.log('✅ Space nodes created');

  // Create rentable item
  const rentableItem = await prisma.rentableItem.create({
    data: {
      org_id: org1.id,
      space_node_id: unit.id,
      code: 'UNIT-101',
      allocation_type: 'exclusive',
      status: 'ACTIVE',
      attrs: {
        furnished: 'full',
        parking_included: true,
      },
    },
  });

  console.log('✅ Rentable item created');

  // Create listing
  const listing = await prisma.listing.create({
    data: {
      org_id: org1.id,
      title: '2BR Apartment in Ba Dinh - Fully Furnished',
      description: 'Beautiful 2-bedroom apartment with modern amenities',
      media: [
        {
          url: 'https://example.com/image1.jpg',
          type: 'image',
        },
      ],
      tags: ['apartment', 'monthly', 'furnished'],
      pricing_display: {
        from_amount: 12000000,
        currency: 'VND',
        unit: 'month',
      },
      status: 'PUBLISHED',
      rentable_items: {
        create: [
          {
            rentable_item_id: rentableItem.id,
          },
        ],
      },
    },
  });

  console.log('✅ Listing created');

  // Create sample notifications for tenant
  await prisma.notification.create({
    data: {
      org_id: org1.id,
      user_id: tenant.id,
      type: 'IN_APP',
      title: 'Welcome to URP',
      message: 'Your account has been created successfully',
      status: 'UNREAD',
      metadata: {},
    },
  });

  await prisma.notification.create({
    data: {
      org_id: org1.id,
      user_id: tenant.id,
      type: 'EMAIL',
      title: 'New Invoice Available',
      message: 'You have a new invoice ready for payment',
      status: 'UNREAD',
      metadata: {},
    },
  });

  console.log('✅ Sample notifications created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
