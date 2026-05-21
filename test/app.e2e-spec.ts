import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// describe('AppController (e2e)', () => {
//   let app: INestApplication<App>;

//   beforeEach(async () => {
//     const moduleFixture: TestingModule = await Test.createTestingModule({
//       imports: [AppModule],
//     }).compile();

//     app = moduleFixture.createNestApplication();
//     await app.init();
//   });

//   it('/ (GET)', () => {
//     return request(app.getHttpServer())
//       .get('/')
//       .expect(200)
//       .expect('Hello World!');
//   });

//   afterEach(async () => {
//     await app.close();
//   });
// });


describe('AppController (e2e)', () => {
  let app: INestApplication;
  let httpServer: any;
  let token: string;

  // -------------------------------
  // 🔐 AUTH HELPER
  // -------------------------------
  const createUserAndLogin = async () => {
    await request(httpServer).post('/auth/register').send({
      email: 'test@test.com',
      password: '123456',
    });

    const res = await request(httpServer).post('/auth/login').send({
      email: 'test@test.com',
      password: '123456',
    });

    return res.body.accessToken;
  };

  // -------------------------------
  // 🚀 SETUP
  // -------------------------------
  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    httpServer = app.getHttpServer();

    token = await createUserAndLogin();
  });

  // -------------------------------
  // 🧹 CLEANUP
  // -------------------------------
  afterAll(async () => {
    await app.close();
  });

  // =========================================================
  // 🧪 1. AUTH GUARD TEST
  // =========================================================
  it('should reject unauthenticated requests', async () => {
    const res = await request(httpServer).get('/wallets');

    expect(res.status).toBe(401);
  });

  // =========================================================
  // 🧪 2. IDEMPOTENCY TEST
  // =========================================================
  it('should return same transaction for duplicate idempotency key', async () => {
    const payload = {
      amount: 50,
      type: 'credit',
      idempotencyKey: 'same-key',
    };

    const first = await request(httpServer)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    const second = await request(httpServer)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(first.body.id).toBe(second.body.id);
  });

  // =========================================================
  // 🧪 3. NEGATIVE BALANCE TEST
  // =========================================================
  it('should prevent negative balance', async () => {
    const res = await request(httpServer)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 999999,
        type: 'debit',
        idempotencyKey: 'negative-test',
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // =========================================================
  // 🧪 4. CONCURRENT DEBIT TEST
  // =========================================================
  it('should handle concurrent debit safely', async () => {
    const payload = {
      amount: 100,
      type: 'debit',
      idempotencyKey: 'concurrent-key',
    };

    const results = await Promise.all([
      request(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send(payload),

      request(httpServer)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send(payload),
    ]);

    const successResponses = results.filter(r => r.status < 400);

    expect(successResponses.length).toBeLessThanOrEqual(1);
  });
});