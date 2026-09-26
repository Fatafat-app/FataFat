# Ftafat Backend — Production-Level Design

**Node.js + Express Modular Monolith · Security-First · Scale-Ready**

---

## 1. Design Goals

- **Zero compromise on security** — every layer (auth, transport, data, secrets) hardened by default, not bolted on later.
- **Scalability without premature complexity** — stateless app layer, clean module boundaries, so it can go from 1 VPS to N VPS (and later, modules → microservices) without a rewrite.
- **Predictable, enforced structure** — folder structure mirrors module boundaries 1:1, so any dev (including future-you) can find/extend anything in seconds.

---

## 2. Folder Structure

```
ftafat-backend/
├── src/
│   ├── config/                    # env-driven config, no hardcoded values
│   │   ├── env.js                 # validates & exports process.env (fail-fast on missing vars)
│   │   ├── db.js                  # MongoDB connection
│   │   ├── redis.js               # Redis client
│   │   ├── socket.js              # Socket.IO init
│   │   ├── queue.js                # BullMQ queues init
│   │   └── logger.js               # Winston/Pino logger config
│   │
│   ├── modules/                   # ⭐ core business logic — one folder per domain module
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.validation.js
│   │   │   └── otp.service.js
│   │   ├── users/
│   │   │   ├── user.routes.js
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.model.js
│   │   │   └── user.validation.js
│   │   ├── restaurants/
│   │   │   ├── restaurant.routes.js
│   │   │   ├── restaurant.controller.js
│   │   │   ├── restaurant.service.js
│   │   │   ├── restaurant.model.js
│   │   │   └── restaurant.validation.js
│   │   ├── menu/
│   │   │   ├── menu.routes.js
│   │   │   ├── menuCategory.model.js
│   │   │   ├── menuItem.model.js
│   │   │   ├── menu.controller.js
│   │   │   └── menu.service.js
│   │   ├── search/
│   │   │   ├── search.routes.js
│   │   │   └── search.service.js       # geo + text search logic
│   │   ├── cart/
│   │   │   ├── cart.routes.js
│   │   │   ├── cart.controller.js
│   │   │   ├── cart.service.js
│   │   │   └── cart.model.js
│   │   ├── orders/
│   │   │   ├── order.routes.js
│   │   │   ├── order.controller.js
│   │   │   ├── order.service.js
│   │   │   ├── order.model.js
│   │   │   ├── order.stateMachine.js   # enforces valid status transitions
│   │   │   └── order.validation.js
│   │   ├── payments/
│   │   │   ├── payment.routes.js
│   │   │   ├── payment.controller.js
│   │   │   ├── payment.service.js
│   │   │   ├── payment.model.js
│   │   │   ├── webhook.controller.js   # gateway webhook — source of truth
│   │   │   └── webhook.verify.js       # signature verification
│   │   ├── coupons/
│   │   ├── reviews/
│   │   ├── delivery/                   # ready for future delivery-partner module
│   │   ├── notifications/
│   │   │   ├── notification.service.js
│   │   │   └── fcm.client.js
│   │   ├── analytics/
│   │   ├── admin/
│   │   └── support/
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js          # JWT verify
│   │   ├── rbac.middleware.js          # role-based access control
│   │   ├── validate.middleware.js      # schema validation (zod/joi)
│   │   ├── rateLimiter.middleware.js   # Redis-backed rate limiting
│   │   ├── errorHandler.middleware.js  # centralized error handling
│   │   ├── sanitize.middleware.js      # NoSQL injection / XSS sanitization
│   │   └── requestLogger.middleware.js
│   │
│   ├── jobs/                            # BullMQ background workers
│   │   ├── notification.worker.js
│   │   ├── email.worker.js
│   │   ├── sms.worker.js
│   │   ├── payoutReconciliation.worker.js
│   │   ├── couponExpiry.worker.js
│   │   └── analytics.worker.js
│   │
│   ├── sockets/
│   │   ├── socket.gateway.js            # connection/auth handshake
│   │   ├── order.events.js
│   │   └── delivery.events.js
│   │
│   ├── integrations/                    # all 3rd-party SDK wrappers live here — nowhere else
│   │   ├── razorpay.client.js
│   │   ├── cloudinary.client.js
│   │   ├── firebase.client.js
│   │   └── maps.client.js
│   │
│   ├── common/
│   │   ├── constants/                   # roles, order statuses, error codes
│   │   ├── utils/                       # pure helper functions
│   │   ├── errors/                      # custom error classes (AppError, ValidationError...)
│   │   └── response/                    # standard API response formatter
│   │
│   ├── routes/
│   │   └── index.js                     # mounts all module routes under /api/v1
│   │
│   ├── app.js                           # express app: middleware pipeline, route mounting
│   └── server.js                        # entrypoint: http server + socket + graceful shutdown
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── scripts/                             # DB seed, migration, backup scripts
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env.example                         # every required var documented, no real secrets
├── .eslintrc / .prettierrc
└── package.json
```

**Key rule:** a module never imports another module's model directly — only its `service.js` public functions. This one rule is what makes future microservice extraction a "move a folder" job instead of a rewrite.

---

## 3. Request Flow (every API call)

```
Client
  ↓
Nginx (TLS termination, WS upgrade)
  ↓
Express app.js
  ↓
requestLogger → rateLimiter → sanitize → CORS/Helmet
  ↓
auth.middleware (JWT verify)
  ↓
rbac.middleware (role check)
  ↓
validate.middleware (schema check on body/params/query)
  ↓
Controller → Service → Model (Mongoose) → MongoDB
  ↓
Standard response formatter
  ↓
errorHandler (catches everything — never leaks stack traces in prod)
```

Every layer is a separate, testable middleware — none of this logic lives inline in route handlers.

---

## 4. Security — No Compromise Checklist

### Auth & Access
- JWT **access token** (short-lived, 15 min) + **refresh token** (httpOnly, secure cookie, rotated on use)
- Refresh token stored hashed in DB; reused/stolen refresh token auto-revokes the whole session family
- RBAC enforced per-route, never inferred client-side
- OTP: rate-limited per phone number, expires in 5 min, stored in Redis (not MongoDB) so it auto-expires

### Data & Transport
- HTTPS-only (enforced at Nginx + HSTS header)
- All input validated at the edge (`validate.middleware`) before it ever touches a service
- MongoDB query sanitization against NoSQL injection (`express-mongo-sanitize`)
- Mongoose schemas with strict typing + `select: false` on sensitive fields (password hash, tokens)
- Passwords: bcrypt, cost factor 12
- Secrets only via environment variables, validated at boot (`config/env.js` throws if anything's missing — **fail fast, not silently**)

### API Hardening
- Helmet for security headers (CSP, X-Frame-Options, no-sniff)
- CORS locked to known origins (app domains only, not `*`)
- Redis-backed rate limiting: global per-IP + tighter per-endpoint limits on `/auth`, `/otp`, `/payments`
- Idempotency keys on payment/order-creation endpoints to prevent double-submission

### Payments
- **Webhook signature verification is mandatory** — client-reported payment success is never trusted alone
- Payment state machine: `created → pending → paid/failed → refunded` — no skipping states
- All money fields stored as integers (smallest currency unit) — never floats

### Ops-Level
- Audit log on every admin/restaurant state-changing action (who, what, when, before/after)
- Centralized error handler strips stack traces & internal messages in production responses
- Dependency scanning in CI (`npm audit` / Snyk) before every deploy
- Secrets never committed — `.env` gitignored, `.env.example` documents shape only

---

## 5. Scalability Decisions (built in from day one)

| Concern | Approach |
|---|---|
| **Stateless app servers** | No in-memory session/cart state — everything in MongoDB/Redis, so any instance can serve any request |
| **Horizontal scaling** | Add VPS #2, #3... behind Nginx/load balancer; Node processes are interchangeable |
| **Socket.IO across instances** | Redis adapter (`@socket.io/redis-adapter`) so real-time events reach clients regardless of which instance they're connected to |
| **Heavy work off the request path** | Notifications, emails, SMS, payouts, analytics all go through BullMQ — API responds fast, workers process async |
| **Read-heavy endpoints** | Redis caching for restaurant listing/menu reads with short TTL + cache invalidation on write |
| **DB scaling path** | Start on VPS-hosted MongoDB → move to MongoDB Atlas / dedicated DB server as load grows, zero app-code change (connection string only) |
| **Module → microservice path** | Because modules only talk via their own service layer, any module (e.g. `payments`, `notifications`) can be lifted into its own service later behind the same API gateway contract |

---

## 6. Testing Strategy

**Framework: Jest** — chosen over Vitest for this project because the ecosystem support around Node/Express + MongoDB is more mature, the team/hiring pool already knows it, and the app is CommonJS-based with no near-term ESM migration planned. Boring, predictable tooling over marginal speed gains.

```
tests/
├── unit/           # services, utils, state machines — Jest, DB fully mocked
└── integration/    # controllers + routes — Jest + Supertest + mongodb-memory-server
```

**Tooling:**
- **Jest** — test runner, assertions, mocking, coverage
- **Supertest** — hits real Express routes (`/api/v1/orders`, etc.) and asserts responses
- **mongodb-memory-server** — spins up a real in-memory MongoDB for integration tests, so tests exercise real Mongoose/query behavior instead of mocks

**Coverage priorities (not uniform across modules):**
- **High priority, near-100% coverage:** `payments` (webhook verification, signature checks), `orders` (state-machine transitions), `auth` (JWT/refresh-token flow, RBAC)
- **Standard coverage:** remaining modules (`menu`, `cart`, `coupons`, `reviews`, etc.)

**CI enforcement:**
- Test suite runs on every push (`Lint → Tests → Build` stage in the CI/CD pipeline, Section 18 of the architecture doc)
- Coverage threshold gate on critical modules — build fails if `payments`/`orders`/`auth` coverage drops below the set threshold
- No merge to `main` with failing tests

---

## 7. What Goes Where — Quick Reference

- **New business feature?** → new/extended `modules/<name>/`
- **Cross-cutting concern (auth, logging, validation)?** → `middlewares/`
- **Talks to a 3rd-party API?** → wrapped in `integrations/`, called only from a module's `service.js`
- **Runs outside the request/response cycle?** → `jobs/`
- **Real-time event?** → `sockets/`
- **Reusable, no business logic?** → `common/utils/`

This mapping is the entire onboarding doc for a new developer — if something doesn't obviously fit one of these, it's a sign the module boundary needs rethinking before writing code.
