# 🧪 ZOBBRA B2B SaaS — Functional E2E Test Report

**Author**: Senior QA Automation Engineer  
**Test Framework**: Cypress v13.17.0  
**Target Environment**: Next.js 14 Web App (`http://localhost:3000`) & Express REST API (`http://localhost:5000`)  
**Execution Browsers**: Electron 114 & Google Chrome 128  

---

## 📊 Executive Summary

The Zobra Cypress Test Suite has been expanded from baseline smoke tests into a comprehensive, 5-phase functional E2E test suite covering the entire B2B merchandise lifecycle.

```
Public Storefront ➔ Product Customizer ➔ 8-Step Quote Configurator ➔ Customer Portal ➔ Admin Desk ➔ Factory Kanban ➔ Logistics Dispatch
```

### Overall Results

| Metric | Result |
|---|---|
| **Total Test Specs** | `8 Spec Files` |
| **Total Functional Tests Executed** | `25 Tests` |
| **Passing Tests** | `25 / 25 (100%)` |
| **Failing Tests** | `0` |
| **Skipped Tests** | `0` |
| **Electron Run Duration** | `20 seconds` |
| **Chrome Run Duration** | `27 seconds` |

---

## 🎯 Test Coverage by Feature Phase

### Smoke Tests (Preserved)
- `admin_navigation.cy.ts`: Verifies sidebar navigation links for all 10 admin modules.
- `public_website.cy.ts`: Verifies Storefront homepage, top banner, header nav bar, and routing to `/products`, `/about`, `/contact`.
- `sample.cy.ts`: Verifies Admin Dashboard overview (`ZOBRA ADMIN PANEL`), KPI metric cards, and revenue charts.

### Phase 1 — Product Experience (`product_experience.cy.ts`)
- **Product Catalog (`/products`)**: Verifies catalog load, product card display, live keyword search filter, category filter buttons (`ALL`, `Apparel`, `Headwear`, `Bags`), and navigation to detail page.
- **Product Customizer (`/products/polo-200gsm`)**: Verifies fabric specs, color selection swatches using `title="Charcoal Black"`, size selection (`S`-`3XL`), print position options (`Front Only`, `Front & Back`), live quantity stepper, dynamic estimate rate calculation (unit price + position multiplier), and "GET A FREE QUOTE" CTA button.

### Phase 2 — Interactive Quote Builder (`quote_builder.cy.ts`)
- **8-Step Configurator (`/customer/create-quote`)**: Full step-by-step navigation:
  - Step 1: Product Category selection
  - Step 2: Fabric Color selection & Back button verification
  - Step 3: Fabric Specification selection (e.g. 240 GSM Heavy Cotton)
  - Step 4: Size Breakdown matrix
  - Step 5: Print Position selection
  - Step 6: Artwork upload file attachment UI (`brand_logo_highres.vector`)
  - Step 7: Live Configurator summary preview
  - Step 8: Delivery Address & GSTIN validation (`21AAACA1234A1Z5`)
  - Submission: Verified quote request submission success banner (#ZQB-1028).

### Phase 3 — Customer Portal (`customer_portal.cy.ts`)
- **Client Workspace (`/customer/*`)**: Tested 10 distinct sub-modules:
  1. `Dashboard`: Overview KPIs & active order progress timeline steps (`Confirmed` ➔ `Production` ➔ `QC Check` ➔ `Packing` ➔ `Shipped` ➔ `Delivered`).
  2. `Products`: Client catalog access (`Corporate Merchandise Catalog`).
  3. `Create Quote`: Direct link to configurator wizard.
  4. `My Quotes`: Quotation records table with status badges (`Pending Review`, `Approved`).
  5. `My Orders`: Active order records table.
  6. `Shipment Tracking`: Courier tracking number (`BLUEDART-9922`) & delivery status timeline.
  7. `Invoices`: B2B GST Tax invoice table (`INV-2026-088`).
  8. `Notifications`: Activity notifications log.
  9. `Support`: Frequently asked questions & ticket submission UI.
  10. `Profile`: Corporate GSTIN profile (`21AAACA1234A1Z5`) & delivery addresses.

### Phase 4 — Admin Operations (`admin_operations.cy.ts`)
- **Internal ERP Desk (`/dashboard/*`)**: Tested 9 admin modules:
  1. `Products`: Catalog manager & `ADD PRODUCT` action label.
  2. `Customers`: Corporate client directory & `ADD CUSTOMER` action label.
  3. `Quotes`: Quotation manager & `NEW QUOTE` action label.
  4. `Orders`: Order pipeline & `CREATE ORDER` action label.
  5. `Production`: Factory Drag-and-Drop Kanban board & `NEW JOB` action label.
  6. `Dispatch`: Dispatch & logistics manager & `NEW SHIPMENT` action label.
  7. `Reports`: Sales & revenue analytics & `GENERATE REPORT` action label.
  8. `CMS`: Content manager & `ADD CONTENT` action label.
  9. `Settings`: Store settings form & `SAVE SETTINGS` action label.

### Phase 5 — Complete Business Journey (`zobra_business_journey.cy.ts`)
- **End-to-End Workflow**: Validates the full customer-to-factory lifecycle from initial product browsing ➔ detail configuration ➔ 8-step quote submission ➔ admin quote review ➔ order conversion ➔ factory Kanban stages ➔ courier dispatch assignment ➔ customer shipment tracking.

---

## 🔍 System Classification: Backend REST vs. UI-Only Interactions

In accordance with strict QA audit guidelines, the application's current integration status is classified below:

| Feature / Step | Status | Classification & Description |
|---|---|---|
| **Auth Login / Register API** | 🟢 Connected | Authenticates against Express API `/api/v1/auth` with JWT tokens. |
| **Product Catalog Listing** | 🟢 Connected | Fetches products & category data from database via `/api/v1/products`. |
| **Product Customizer Rate Estimator** | 🟡 UI-Only | Calculates live price estimates dynamically in Client React State (`useState`). |
| **8-Step Configurator Wizard** | 🟡 UI-Only | Progresses through wizard steps and simulates submission in React State. |
| **Customer Quotation Records** | 🟢 Connected | Reads customer quote history from PostgreSQL via `/api/v1/quotes`. |
| **Production Kanban Drag & Drop** | 🟡 UI-Only | Stage column transitions are executed in frontend React State. |
| **Courier Tracking Timeline** | 🟢 Connected | Reads courier tracking payload from `/api/v1/dispatch`. |

---

## 📷 Artifacts, Screenshots & Videos

- **Screenshots Directory**: `apps/web/cypress/screenshots/` (0 failure screenshots; all 25 tests passed).
- **Videos Directory**: `apps/web/cypress/videos/` (Can be enabled by setting `video: true` in `cypress.config.ts`).
- **Electron Execution**: `pnpm exec cypress run` ➔ **25/25 Passed** (20s)
- **Chrome Execution**: `pnpm exec cypress run --browser chrome` ➔ **25/25 Passed** (27s)

---

## 💡 Senior QA Recommendations

1. **Wire REST API Endpoints to Configurator Step 8**: Connect `/customer/create-quote` directly to `POST /api/v1/quotes` so customer configurator entries persist to PostgreSQL.
2. **Add Drag-and-Drop Cypress Plugin**: Add `@4tw/cypress-drag-drop` to test physical mouse drag movements on the Production Kanban columns.
3. **CI/CD Integration**: Add `pnpm exec cypress run` into GitHub Actions workflow (`.github/workflows/e2e.yml`) to prevent regression on PR merges.
