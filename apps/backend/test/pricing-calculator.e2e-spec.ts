import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/platform/prisma/prisma.service';

describe('PricingCalculator (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let orgId: string;
  let rentableItemId: string;
  let pricingPolicyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Create test organization
    const org = await prisma.organization.create({
      data: {
        name: 'Test Org for Pricing',
        status: 'ACTIVE',
      },
    });
    orgId = org.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        org_id: orgId,
        email: 'pricing-test@example.com',
        password_hash: 'hashed',
        role: 'Landlord',
        status: 'ACTIVE',
      },
    });

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'pricing-test@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.access_token;

    // Create test asset
    const asset = await prisma.asset.create({
      data: {
        org_id: orgId,
        name: 'Test Asset',
        asset_type: 'BUILDING',
        status: 'ACTIVE',
      },
    });

    // Create test space node
    const spaceNode = await prisma.spaceNode.create({
      data: {
        org_id: orgId,
        asset_id: asset.id,
        name: 'Test Space',
        node_type: 'ROOM',
        path: '/test',
      },
    });

    // Create test rentable item
    const rentableItem = await prisma.rentableItem.create({
      data: {
        org_id: orgId,
        space_node_id: spaceNode.id,
        code: 'TEST-PRICING-001',
        allocation_type: 'exclusive',
        property_category: 'HOMESTAY',
        rental_duration_type: 'SHORT_TERM',
        status: 'ACTIVE',
      },
    });
    rentableItemId = rentableItem.id;

    // Create test pricing policy
    const pricingPolicy = await prisma.configBundle.create({
      data: {
        org_id: orgId,
        bundle_id: `pricing_test_${Date.now()}`,
        version: '1.0',
        status: 'ACTIVE',
        config: {
          type: 'pricing_policy',
          name: 'Test Pricing Policy',
          policy_type: 'daily_rent',
          config: {
            base_amount: 1000000,
            currency: 'VND',
            unit: 'night',
            fees: {
              cleaning_fee: 200000,
              service_fee_percent: 5,
            },
          },
        },
      },
    });
    pricingPolicyId = pricingPolicy.id;
  }

  async function cleanupTestData() {
    if (orgId) {
      await prisma.rentableItem.deleteMany({ where: { org_id: orgId } });
      await prisma.spaceNode.deleteMany({ where: { org_id: orgId } });
      await prisma.asset.deleteMany({ where: { org_id: orgId } });
      await prisma.configBundle.deleteMany({ where: { org_id: orgId } });
      await prisma.user.deleteMany({ where: { org_id: orgId } });
      await prisma.organization.delete({ where: { id: orgId } });
    }
  }

  describe('/api/v1/pricing/calculate (POST)', () => {
    it('should calculate short-term price', () => {
      return request(app.getHttpServer())
        .post('/api/v1/pricing/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rentable_item_id: rentableItemId,
          pricing_policy_id: pricingPolicyId,
          start_date: '2026-01-20',
          end_date: '2026-01-25',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.calculation).toBeDefined();
          expect(res.body.calculation.nights).toBe(5);
          expect(res.body.calculation.base_price).toBe(5000000);
          expect(res.body.calculation.cleaning_fee).toBe(200000);
          expect(res.body.calculation.total_price).toBeGreaterThan(5000000);
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/pricing/calculate')
        .send({
          rentable_item_id: rentableItemId,
          pricing_policy_id: pricingPolicyId,
          start_date: '2026-01-20',
          end_date: '2026-01-25',
        })
        .expect(401);
    });

    it('should return error for invalid rentable item', () => {
      return request(app.getHttpServer())
        .post('/api/v1/pricing/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rentable_item_id: 'invalid-id',
          pricing_policy_id: pricingPolicyId,
          start_date: '2026-01-20',
          end_date: '2026-01-25',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.error_code).toBe('NOT_FOUND');
        });
    });

    it('should return error for missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/pricing/calculate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rentable_item_id: rentableItemId,
          pricing_policy_id: pricingPolicyId,
          // Missing dates
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.error_code).toBe('VALIDATION_ERROR');
        });
    });
  });
});
