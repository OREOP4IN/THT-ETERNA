# StockFlow — Minimal Inventory & Invoicing Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748.svg)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Testing-Vitest%20%2B%20Supertest-yellow.svg)](https://vitest.dev/)

**StockFlow** is a robust, production-grade inventory and invoicing web application built for small distribution businesses. It addresses the real-world operational challenge of **inventory overselling** by combining atomic database transactions, strict stock guardrails, immutable financial snapshotting, and minor-unit monetary precision.

---

## Quickstart & Setup

### Prerequisites

- **Node.js** v20.0.0 or higher
- **npm** v9.0.0 or higher

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/OREOP4IN/THT-ETERNA.git
cd THT-ETERNA
npm install
```

### 2. Environment Configuration

Create the centralized `.env` file at the repository root following `.env.example`

```bash
cp .env.example .env
```

### 3. Initialize & Seed Database

Run the Prisma database migration and seed script to provision tables and realistic demo fixtures:

```bash
npm run db:migrate
npm run db:seed
```

### 4. Start Development Servers

```bash
npm run dev
```

- **Frontend Web App       :** [http://localhost:5173](http://localhost:5173)
- **Backend REST API       :** [http://localhost:5000](http://localhost:5000)
- **Interactive API Docs   :** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## Demo Credentials

A pre-configured demo account is automatically provisioned during seeding:

| Field               | Value                                                  |
| ------------------- | ------------------------------------------------------ |
| **Email**           | `demo@stockflow.dev`                                   |
| **Password**        | `Password123!`                                         |
| **Workspace Scope** | 5 pre-loaded catalog products + sample stock movements |

_The Login page features a **"1-Click Fill Demo Account"** button for instant reviewer access._

---

## Automated Testing Suite

All 5 mandatory test requirements (Section 5, Rule N4) plus edge cases and business invariant tests run with a single command:

```bash
npm test
```

### Test Suite Coverage (`server/tests/core.test.ts`):

- `✓ Mandatory Test (a):` Login with incorrect password returns 401 with opaque error message.
- `✓ Mandatory Test (b):` Unauthenticated request to protected route returns 401.
- `✓ Mandatory Test (c):` Invoicing quantity exceeding available `quantityOnHand` returns 422 stock error.
- `✓ Mandatory Test (d):` Issuing an invoice (`DRAFT -> ISSUED`) decrements product stock atomically.
- `✓ Mandatory Test (e):` Cancelling an issued invoice (`ISSUED -> CANCELLED`) restores stock atomically.
- `✓ Invariant Test (f):` Updating a product catalog price does **not** alter historical invoice line snapshots (Rule V4).
- `✓ Invariant Test (g):` Deleting a product referenced in an existing invoice is blocked with HTTP 409 Conflict (Rule I4).
- `✓ Invariant Test (h):` Illegal status transitions (e.g. paying draft, editing issued invoice, paying cancelled invoice) are rejected with HTTP 422 (Rule V8, V9).

---

## Technology Choices & Architectural Rationale

1. **TypeScript Strict Mode Monorepo:**
   - Full end-to-end type safety between client and server eliminates contract drift. Strict mode (`strict: true`, `noImplicitAny: true`) for high code hygiene.
2. **Express.js Layered Modular Architecture:**
   - Clear separation of concerns: `Routes` → `Controllers` → `Services` → `Prisma Data Access`. Isolates business and financial rules inside pure service classes.
3. **SQLite via Prisma ORM:**
   - Zero external dependencies (no Docker or external database instance needed for review). Switchable to PostgreSQL in production simply by altering `DATABASE_URL` and provider in `schema.prisma`.
4. **Integer Minor Units for Financial Math for Zero Floating-Point Glitches:**
   - Currency amounts (`unitPrice`, `lineTotal`, `subtotal`, `taxAmount`, `total`) are calculated and stored as whole integer cents. Floating-point conversions occur strictly at the presentation layer via formatters.
5. **Atomic `$transaction` State Machine with Inventory Ledger:**
   - Stock deduction on invoice issuance and stock restoration on cancellation are wrapped in Prisma interactive transactions, logging an append-only `StockMovement` audit ledger.
6. **Immutable Historical Snapshotting (Rule V4):**
   - Product names and unit prices are snapshotted onto `InvoiceItem` at invoice creation time. Subsequent product edits never alter issued invoices.
7. **Zod Runtime Request Validation:**
   - Enforces type coercion, password policies, email normalization, and date constraints (`dueDate >= issueDate`) at the network boundary.
8. **Single Source of Truth for Configuration:**
   - Tax rate is configured via `DEFAULT_TAX_PERCENT` in root `.env` and exposed dynamically via `/api/health`, preventing frontend/backend tax drift.
9.  **Tailwind CSS + Responsive Design + Print/PDF Styling:**
    - Clean, responsive UI with interactive modals, debounced search (300ms), stock level indicators, and `@media print` stylesheets for one-click invoice PDF generation.

---

## Trade-offs & Known Limitations

1. **Stateless JWT Tokens in `localStorage`:**
   - _Trade-off:_ Tokens are stored in browser `localStorage` for clean SPA client integration.
   - _Limitation:_ While protected against CSRF, tokens in `localStorage` are theoretically accessible to XSS. In a high-security banking environment, `httpOnly` secure cookies with server-side CSRF tokens and refresh token rotation would be preferred.
2. **Stateless Logout Endpoint:**
   - _Trade-off:_ Logout clears the token on the client.
   - _Limitation:_ Without a Redis token denylist or database session table, a previously issued token remains valid until its 7-day expiration if intercepted.

---

## What I Would Do With One More Week

1. **Deploy:**
   - Deploy the web-app to a Cloud Platform for easier access and also for a chance for learning & implementation
2. **CSV / Excel Bulk Import & Export:**
   - Add bulk product catalog import and export for rapid warehouse inventory onboarding.
3. **WCAG Compliance:**
   - Optimize the web-app to be compliant to WCAG 2.2 AA to comply to industry standards

---

## AI Usage Statement

- **Tooling Used:** Antigravity CLI & Deepseek V4 Pro via Openrouter.
- **Workflows & Collaboration:**
  - Antigravity CLI was used as an interactive pair programmer for rapid boilerplate scaffolding, exploratory test fixture drafting, and documentation synthesis.
  - Deepseek V4 Pro was used as a QC representative for evaluating the source code and identifying possible vulnerabilities within the boundary of this task's scope.
  - Core financial mathematics, atomic state machine transactions, referential integrity guards, user isolation boundaries, and validation schemas were directed, reviewed line-by-line, and verified through automated tests and manual browser walkthroughs.

---

## Time Spent

- **Total Estimated Time:** ~9 hours
  - **Understanding the Task & Initialization:** ~1 hour
  - **Scaffolding the Project:** ~1 hour
  - **Accomplishing MVPs & Testing:** ~5 hours
  - **Documentation, Minor Tweaks, & Finalization:** ~2 hours

---

## Available Repository Scripts

| Command             | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| `npm run dev`       | Start backend (port 5000) and frontend (port 5173) concurrently      |
| `npm test`          | Execute full Vitest + Supertest integration test suite               |
| `npm run build`     | Build full monorepo (server TypeScript compile + client Vite bundle) |
| `npm run db:seed`   | Seed database with demo user and sample products                     |
| `npm run db:migrate`| Run Prisma database migrations                                       |
| `npm run db:studio` | Open interactive Prisma Studio database viewer                       |

---

_StockFlow — Developed for THT-ETERNA Evaluation._
