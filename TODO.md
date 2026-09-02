# StockFlow — Master Task List & Implementation Roadmap

This document outlines the end-to-end implementation plan for the **StockFlow** Inventory & Invoicing application based on the requirements in `fullstack-js-take-home-test.md`.

---

## 📋 Comprehensive Implementation Checklist

### Phase 1: Project Scaffolding & Monorepo Configuration
- [ ] Initialize monorepo structure with `server/` and `client/` workspaces.
- [ ] Configure root `package.json` with scripts (`dev`, `build`, `test`, `db:migrate`, `db:seed`).
- [ ] Set up TypeScript configuration (`tsconfig.json`) for backend with strict mode enabled.
- [ ] Initialize Vite + React + TypeScript in `client/` with Tailwind CSS and Lucide icons.
- [ ] Configure `.gitignore` to protect environment files, build artifacts, SQLite database files, and dependencies.
- [ ] Create `.env.example` documenting all configuration keys (`PORT`, `DATABASE_URL`, `JWT_SECRET`, `TAX_RATE_PERCENT`, `CORS_ORIGIN`).

---

### Phase 2: Database Modeling & Data Seeding
- [ ] Configure Prisma ORM with SQLite provider.
- [ ] Implement Prisma schema models:
  - [ ] `User` (id, email, passwordHash, name, timestamps)
  - [ ] `Product` (id, userId, sku, name, description, unitPrice in cents, quantityOnHand, timestamps)
  - [ ] `Invoice` (id, userId, invoiceNumber, customerName, issueDate, dueDate, status, notes, subtotal, taxRate, taxAmount, total, timestamps)
  - [ ] `InvoiceItem` (id, invoiceId, productId, productName snapshot, unitPrice snapshot in cents, quantity, lineTotal)
  - [ ] `StockMovement` (id, productId, invoiceId, quantityChange, reason, timestamp)
- [ ] Add unique compound index on `Product(userId, sku)` and indexes on search fields.
- [ ] Generate initial Prisma migration (`prisma migrate dev`).
- [ ] Implement idempotent seed script (`server/prisma/seed.ts`):
  - [ ] Demo user: `demo@stockflow.dev` / `Password123!`
  - [ ] Minimum 5 diverse products with varied stock levels and unit prices.

---

### Phase 3: Authentication & Security Subsystem
- [ ] Password hashing utility with `bcrypt` (salt rounds = 12) or `argon2`.
- [ ] Zod validation schemas for registration and login payloads.
- [ ] Implement `POST /api/auth/register`:
  - [ ] Enforce unique email (case-insensitive)
  - [ ] Validate minimum password length (≥ 8 characters)
  - [ ] Return clean user object (excluding passwordHash)
- [ ] Implement `POST /api/auth/login`:
  - [ ] Verify credentials
  - [ ] Return JWT token with 7-day expiration
  - [ ] Obfuscate failure reasons (generic "Invalid email or password" on both missing user and bad password)
- [ ] Implement `GET /api/auth/me` to fetch current user profile.
- [ ] Implement `POST /api/auth/logout` endpoint.
- [ ] Implement `authenticate` middleware:
  - [ ] Extract Bearer token from `Authorization` header
  - [ ] Verify token signature and attach `req.user`
  - [ ] Return HTTP `401 Unauthorized` for missing, expired, or invalid tokens
- [ ] Multi-tenant isolation: Ensure all subsequent routes scope database queries with `where: { userId: req.user.id }`.

---

### Phase 4: Product Inventory Subsystem
- [ ] Implement Zod schemas for Product creation and updates:
  - [ ] `sku` required, non-empty
  - [ ] `name` required, non-empty
  - [ ] `unitPrice` integer ≥ 0 (in minor units / cents)
  - [ ] `quantityOnHand` integer ≥ 0
- [ ] Implement `POST /api/products`:
  - [ ] Validate uniqueness of SKU within user's workspace
  - [ ] Persist product and return HTTP 201
- [ ] Implement `GET /api/products`:
  - [ ] Pagination (`page`, `limit`) with defaults (page 1, limit 10)
  - [ ] Case-insensitive search filtering by `name` or `sku`
  - [ ] Return `{ data: [...], meta: { page, limit, total, totalPages } }`
- [ ] Implement `GET /api/products/:id`:
  - [ ] Return product details or 404 if not found or belongs to another user
- [ ] Implement `PUT /api/products/:id`:
  - [ ] Validate and update product fields
- [ ] Implement `DELETE /api/products/:id`:
  - [ ] **Referential Integrity Guard:** Verify if product is linked to any existing `InvoiceItem`.
  - [ ] If linked, reject deletion with HTTP `409 Conflict` ("Cannot delete product because it is referenced in an invoice").
  - [ ] If not linked, delete product and return HTTP 200/204.

---

### Phase 5: Invoicing Engine & State Machine
- [ ] Invoice number generator utility (e.g. `INV-YYYY-XXXX`).
- [ ] Money & Tax calculation service:
  - [ ] Strict integer minor units (cents) for `lineTotal = quantity * unitPrice`.
  - [ ] $\text{subtotal} = \sum \text{lineTotal}$.
  - [ ] $\text{taxAmount} = \text{Math.round}((\text{subtotal} \times \text{taxRatePercent}) / 100)$.
  - [ ] $\text{total} = \text{subtotal} + \text{taxAmount}$.
- [ ] Implement `POST /api/invoices`:
  - [ ] Validate customer name, dates, and non-empty line items array
  - [ ] Validate all referenced product IDs exist in user workspace
  - [ ] **Stock Guard:** Verify each line quantity $\le$ current product `quantityOnHand`. If exceeded, reject with HTTP 422.
  - [ ] **Snapshotting:** Copy current `product.name` and `product.unitPrice` onto `InvoiceItem`.
  - [ ] Calculate server-side totals (ignore any totals sent by client).
  - [ ] Set initial status to `DRAFT`.
- [ ] Implement `GET /api/invoices`:
  - [ ] Pagination (`page`, `limit`)
  - [ ] Filter by status (`DRAFT`, `ISSUED`, `PAID`, `CANCELLED`)
- [ ] Implement `GET /api/invoices/:id`:
  - [ ] Return complete invoice with line items and product details.
- [ ] Implement `PUT /api/invoices/:id`:
  - [ ] Reject edit with HTTP 422 if invoice status is NOT `DRAFT`.
  - [ ] Recalculate line totals and re-verify stock.
- [ ] Implement `POST /api/invoices/:id/issue`:
  - [ ] Validate invoice status is `DRAFT`.
  - [ ] **Atomic Transaction:** Inside `prisma.$transaction`:
    1. Re-verify available stock for all line items.
    2. Decrement `quantityOnHand` for each product.
    3. Record `StockMovement` entries for audit trail.
    4. Update status to `ISSUED`.
- [ ] Implement `POST /api/invoices/:id/pay`:
  - [ ] Validate status transition: allowed ONLY from `ISSUED` to `PAID`.
  - [ ] Mark status as `PAID`.
- [ ] Implement `POST /api/invoices/:id/cancel`:
  - [ ] Validate status: allowed from `DRAFT` or `ISSUED`.
  - [ ] If status was `ISSUED`:
    - **Atomic Transaction:** Restore product stock (`quantityOnHand += item.quantity`) and record `StockMovement`.
  - [ ] If status was `DRAFT`:
    - Transition directly to `CANCELLED` without stock adjustment.
  - [ ] If status is `PAID` or already `CANCELLED`, reject with HTTP 422 (terminal state).

---

### Phase 6: Automated Testing Suite
- [ ] Configure Vitest and Supertest with dedicated test database environment.
- [ ] Implement Mandatory Test Suite (`tests/core.test.ts`):
  - [ ] **Test 1:** Login with incorrect password returns 401.
  - [ ] **Test 2:** Unauthenticated request to `/api/products` and `/api/invoices` returns 401.
  - [ ] **Test 3:** Creating/issuing an invoice with quantity exceeding stock returns 422.
  - [ ] **Test 4:** Issuing an invoice decrements product stock atomically.
  - [ ] **Test 5:** Cancelling an issued invoice restores stock atomically.
- [ ] Implement Additional Edge Case Tests:
  - [ ] State transition violations (e.g. paying a DRAFT invoice, editing an ISSUED invoice).
  - [ ] Deleting a product referenced in an invoice returns 409 Conflict.
  - [ ] Product price change does not modify existing invoice snapshots.
- [ ] Verify single command test execution: `npm test` passes cleanly.

---

### Phase 7: Frontend Application (Client)
- [ ] Setup Axios client with authentication request interceptor (attaching Bearer token) and 401 response interceptor.
- [ ] Setup Auth context & state management (stored in localStorage or memory).
- [ ] Implement UI views & routing:
  - [ ] `/login` & `/register` forms with field validation and server error callouts.
  - [ ] Protected Layout with navigation bar, user indicator, and Logout action.
  - [ ] `/products` Product List:
    - Search input with debounce.
    - Responsive table with pagination controls.
    - "Add Product" & "Edit Product" modal dialogs with unit price and stock input.
    - Delete button with confirmation and error handling.
  - [ ] `/invoices` Invoice List:
    - Filter tabs by status (`All`, `DRAFT`, `ISSUED`, `PAID`, `CANCELLED`).
    - Status badges with distinct semantic colors.
  - [ ] `/invoices/new` Interactive Invoice Creator:
    - Customer details & dates.
    - Dynamic line item table with product picker, real-time available stock indicator, quantity input.
    - Live breakdown of Subtotal, Tax (11%), and Grand Total.
  - [ ] `/invoices/:id` Invoice Detail View:
    - Clean, printable invoice layout.
    - Action toolbar: `Issue Invoice`, `Mark as Paid`, `Cancel Invoice`.
- [ ] Provide clear loading skeletons, spinner feedback, and empty states.

---

### Phase 8: Documentation & Developer Experience
- [ ] Write comprehensive `README.md`:
  - [ ] Prerequisites (Node.js version).
  - [ ] Quickstart instructions (clone -> install -> seed -> run).
  - [ ] Demo login credentials.
  - [ ] Architectural decisions & tech stack rationale.
  - [ ] Trade-offs and known limitations.
  - [ ] "What I would do with one more week" section.
  - [ ] AI Usage statement detailing tools and workflows used.
  - [ ] Time spent report.
- [ ] Setup interactive API documentation with Swagger / OpenAPI (`/api/docs`).
- [ ] Verify clean, incremental git commit history across all stages.

---

## 💡 Human-Friendly Summary

### What We Are Building
We are creating **StockFlow**, a focused, professional-grade Inventory & Invoicing web application. It is designed to solve a very specific, real-world business headache: **preventing businesses from selling products they don't actually have in stock**, while keeping their billing records completely accurate and historically trustworthy.

### Core Strengths of Our Solution
1. **Bulletproof Financial Accuracy:**  
   Money is never calculated using standard JavaScript decimals (which produce floating-point glitches like `$0.10 + $0.20 = $0.30000000000000004`). All calculations are carried out in exact integer minor units (cents / Rupiah) and converted only when rendered in the UI.

2. **Strict Inventory Guards:**  
   When an invoice is issued, the application locks the database transaction, verifies that sufficient items are on shelves, and decrements stock atomically. If an issued invoice is cancelled later, the exact inventory is automatically returned to the shelf.

3. **Historical Invariant Protection:**  
   If you raise an invoice for "Leather Jacket" at $150 today, and next month you raise the product's catalog price to $200 or rename it, your historical invoice will forever state "Leather Jacket" at $150. Historical records remain 100% faithful.

4. **Zero-Setup Friction for Evaluators:**  
   By default, the application runs on SQLite with Prisma. Evaluators do not need to install Docker or configure a remote database. They can simply clone, run `npm run db:seed`, `npm run dev`, and be clicking around with pre-populated demo data in under 60 seconds.

5. **Complete Test Suite Included:**  
   All 5 mandatory automated test scenarios required by the evaluation team (unauthorized requests, wrong password, stock limits, stock deduction, and stock restoration) plus edge cases are codified with Vitest and Supertest, passing with a single `npm test` command.

---

## 🔍 Tech Stack Compliance Audit & Justification

### 1. Direct Compliance Mapping (Section 2 of Task Specification)

Every primary technology selected comes directly from the permitted options explicitly enumerated in `fullstack-js-take-home-test.md`:

| Concern | Task Specification Options | Our Selected Choice | Compliance Status |
|---|---|---|---|
| **Server Runtime** | Node.js (Required) | Node.js (v20+ LTS) | ✅ **100% Match** |
| **Backend Framework** | NestJS, Express, Fastify, Hapi, Koa, Next.js API routes | **Express.js** | ✅ **Direct Match** |
| **Frontend Framework** | React, Next.js, Vue, Nuxt, Svelte, Angular, Remix | **React (Vite)** | ✅ **Direct Match** |
| **Programming Language** | JavaScript or TypeScript (TypeScript preferred) | **TypeScript (Strict Mode)** | ✅ **Preferred Match** |
| **Database** | PostgreSQL, MySQL/MariaDB, SQLite, MongoDB ("SQLite counts") | **SQLite** | ✅ **Direct Match** |
| **ORM / Data Layer** | Prisma, TypeORM, Drizzle, Sequelize, Mongoose, Knex, raw SQL | **Prisma ORM** | ✅ **Direct Match** |
| **Styling / UI Kit** | Tailwind, MUI, Chakra, shadcn/ui, Bootstrap, plain CSS | **Tailwind CSS** | ✅ **Direct Match** |
| **Project Layout** | Monorepo or Two Folders | **Monorepo (`server/` + `client/`)** | ✅ **Direct Match** |
| **Auth Credential** | JWT or httpOnly session cookie (Section 4.1 A2) | **JWT (Bearer Token)** | ✅ **Direct Match** |
| **Password Hashing** | Bcrypt or Argon2 with salt (Section 4.1 A4) | **Bcrypt (12 rounds)** | ✅ **Direct Match** |
| **API Documentation** | Swagger/OpenAPI, Postman/Bruno, README table (Section 5 N5) | **Swagger / OpenAPI (`swagger-ui-express`)** | ✅ **Direct Match** |

---

### 2. Complementary Libraries Not Formally Enumerated in Section 2 & Technical Justifications

The task specification leaves specific sub-libraries (validation, testing framework, HTTP client, client-side cache) to developer discretion while mandating strict behavioral outcomes (e.g. "Server-side validation returning 400/422", "at minimum 5 automated tests", "loading and error states"). Below are the specific libraries chosen and why:

#### A. Zod (Runtime Schema & Request Validation)
- **Why It Was Chosen:**  
  Requirement **I3** and **A5** require strict server-side validation returning structured field-level 400/422 error responses. Zod provides declarative, type-inferred validation that bridges TypeScript compile-time types with runtime HTTP boundaries. It eliminates boilerplate validation checks and prevents malformed data from ever touching controllers or services.

#### B. Vitest & Supertest (Automated Testing Framework)
- **Why It Was Chosen:**  
  Requirement **N4** mandates at least 5 automated integration tests executable with a single command. Vitest executes TypeScript natively with ES modules without complex Babel/ts-jest transformation overhead. Paired with Supertest, it enables testing HTTP endpoints and Prisma transactions against an ephemeral SQLite test database in milliseconds.

#### C. TanStack Query / React Query & Axios (Client State & HTTP Requests)
- **Why It Was Chosen:**  
  Requirement **F6** requires smooth loading skeletons, spinners, and error alerts without leaving the user staring at blank screens. TanStack Query provides out-of-the-box declarative query states (`isLoading`, `isError`, `data`), automatic background cache revalidation, and mutation triggers for seamless UI updates upon product/invoice mutations. Axios simplifies setting up global request interceptors to automatically attach JWT Bearer tokens and handle 401 redirects.

#### D. Lucide React (Iconography)
- **Why It Was Chosen:**  
  Provides featherweight, accessible SVG icons (status badges, action buttons, search icons) that pair seamlessly with Tailwind CSS classes without introducing bulky component library overhead.

