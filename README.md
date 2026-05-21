# Secure Wallet & Transaction API

A secure backend wallet system built with NestJS, MySQL, TypeORM, and JWT authentication.  
This project implements a transactional wallet system with strict concurrency control, idempotency, and security best practices aligned with OWASP API standards.

---

# 🚀 Tech Stack

- NestJS
- TypeORM
- MySQL
- JWT Authentication
- Class Validator / Class Transformer
- bcrypt
- Docker (optional)
- Swagger (optional)
- Throttler (Rate limiting)

---

# 📦 Features

## Authentication
- User registration
- Login with JWT authentication
- Password hashing using bcrypt
- Role-based access control (user/admin)

## Wallet System
- One wallet per user
- Secure balance tracking
- Prevents negative balance

## Transactions
- Credit / Debit support
- Idempotency protection
- Race-condition safe transactions
- Atomic DB operations

---

# 🧱 Project Structure
📘 Mandatory System Design Explanation
======================================

1\. Race Condition Prevention
-----------------------------

Race conditions are prevented using **database-level row locking and transactional integrity**.

### Implementation Strategy:

-   Each wallet update is wrapped inside a **TypeORM QueryRunner transaction**
-   The wallet row is locked using:

```
lock: { mode: 'pessimistic_write' }
```

### How it works:

-   When a transaction starts, the wallet row is locked at the database level
-   Any concurrent request attempting to access the same wallet must wait
-   This ensures that only one transaction can modify the wallet balance at a time

### Result:

✔ No double debit\
✔ No balance overwrite\
✔ No concurrent write corruption

* * * * *

2\. Idempotency Strategy
------------------------

Idempotency is enforced using a unique `idempotencyKey` per transaction request.

### Implementation:

-   Each transaction includes:

```
idempotencyKey: string
```

-   Database constraint:

```
@Index({ unique: true })@Column()idempotencyKey: string;
```

### Flow:

1.  System checks if transaction with `idempotencyKey` exists
2.  If found → return existing transaction immediately
3.  If not found → process transaction normally
4.  Save transaction with unique key

### Result:

✔ Prevents duplicate debits/credits\
✔ Safe retries after network failure\
✔ Ensures exactly-once processing

* * * * *

3\. Locking Strategy Choice
---------------------------

We use **pessimistic row-level locking**.

### Why this was chosen:

-   Wallet balance is a shared mutable resource
-   Concurrent updates must be serialized
-   Database-level locking is more reliable than application-level locks

### Alternatives considered:

-   Optimistic locking ❌ (risk of retry storms under high contention)
-   Redis locking ❌ (extra infrastructure complexity for this scope)

### Final decision:

✔ Pessimistic locking ensures correctness over performance\
✔ Best suited for financial systems

* * * * *

4\. Injection Prevention
------------------------

Injection attacks are prevented using multiple layers:

### Measures:

-   TypeORM parameterized queries (no raw SQL)
-   Class-validator DTO validation
-   Whitelisted validation pipe:

```
whitelist: true,forbidNonWhitelisted: true
```

### Result:

✔ No SQL injection\
✔ No mass assignment\
✔ No malformed payload execution

* * * * *

5\. Production Changes
----------------------

If moved to production, the following improvements would be required:

### Infrastructure:

-   Use Redis for distributed rate limiting
-   Add message queue (Kafka/RabbitMQ) for transaction processing
-   Deploy with horizontal scaling (multiple instances)

### Database:

-   Enable read replicas
-   Add partitioning for transaction table
-   Add indexing for `walletId` and `idempotencyKey`

### Observability:

-   Add centralized logging (ELK stack)
-   Add monitoring (Prometheus/Grafana)
-   Add tracing (OpenTelemetry)

* * * * *

6\. Scaling Strategy
--------------------

To scale the system:

### Horizontal scaling:

-   Stateless NestJS services behind load balancer
-   Multiple API instances

### Database scaling:

-   Read replicas for wallet reads
-   Write master for transactions
-   Partition transactions by date or walletId

### Caching:

-   Redis cache for wallet balance (eventually consistent)

### Async processing:

-   Move transaction processing to queue workers

* * * * *

7\. Handling 1M Transactions Per Day
------------------------------------

To handle high throughput:

### Approach:

-   Queue-based processing (Kafka/RabbitMQ)
-   Batch writes for transactions
-   Redis caching for wallet reads
-   Database indexing on:
    -   walletId
    -   idempotencyKey
    -   createdAt

### Optimization:

-   Avoid real-time balance recalculation
-   Use denormalized balance field
-   Periodic reconciliation job

* * * * *

8\. OWASP API Top 10 Protection (BOLA + Others)
-----------------------------------------------

### 8.1 BOLA (Broken Object Level Authorization)

Prevented by:

-   Always querying wallet using authenticated user:

```
where: { userId: req.user.id }
```

✔ Users cannot access other users' wallets

* * * * *

### 8.2 Injection Protection

-   Parameterized queries via TypeORM
-   DTO validation

* * * * *

### 8.3 Mass Assignment

-   DTOs explicitly define allowed fields
-   No direct entity binding from request body

* * * * *

### 8.4 Rate Limiting

-   ThrottlerModule applied to:
    -   auth routes
    -   transaction routes

* * * * *

### 8.5 Authentication Security

-   JWT-based authentication
-   Token expiry enforced (15--30 mins)
-   Password hashing using bcrypt

* * * * *

### 8.6 Sensitive Data Protection

-   Passwords never returned in responses
-   Error messages are sanitized in production mode

* * * * *

🧠 Summary
==========

This system is designed with:

-   Strong consistency for financial transactions
-   Safe concurrency control
-   Strict idempotency guarantees
-   OWASP-aligned security principles
-   Scalable architecture foundations


# 👨‍💻 Author
Miracle Chukwuebuka Anyiam <br>
Senior Software Engineer | QA Automation Engineer <br>
📞 +2348146713301 <br>
🌎 https://www.linkedin.com/in/chukwuebuka-miracle-anyiam-879a2b177