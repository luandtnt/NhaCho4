import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Config Engine (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let landlordToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Login as admin
    const adminRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Password123!',
      });
    adminToken = adminRes.body.access_token;

    // Login as landlord
    const landlordRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'landlord@example.com',
        password: 'Password123!',
      });
    landlordToken = landlordRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/configs/bundles (POST)', () => {
    it('should create config bundle as admin', () => {
      return request(app.getHttpServer())
        .post('/api/v1/configs/bundles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bundle_id: 'test_bundle_001',
          version: '1.0.0',
          status: 'DRAFT',
          config: {
            asset_types: {
              test_type: {
                schema_ref: 'schemas/test.json',
              },
            },
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.bundle_id).toBe('test_bundle_001');
        });
    });

    it('should fail to create as landlord (forbidden)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/configs/bundles')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          bundle_id: 'test_bundle_002',
          version: '1.0.0',
          config: {},
        })
        .expect(403);
    });
  });

  describe('/api/v1/configs/bundles (GET)', () => {
    it('should list config bundles', () => {
      return request(app.getHttpServer())
        .get('/api/v1/configs/bundles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/v1/configs/bundles/:id/activate (POST)', () => {
    let bundleId: string;

    beforeAll(async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/configs/bundles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bundle_id: 'test_bundle_activate',
          version: '1.0.0',
          config: {},
        });
      bundleId = createRes.body.id;
    });

    it('should activate config bundle', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/configs/bundles/${bundleId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('ACTIVE');
        });
    });
  });
});
