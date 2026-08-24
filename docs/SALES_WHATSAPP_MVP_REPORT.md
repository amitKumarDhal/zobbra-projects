# 💬 ZOBBRA B2B SaaS — Sales Conversation & WhatsApp MVP Technical Report

**Author**: Senior Full-Stack Engineer + Product Engineer + QA Engineer  
**Scope**: Implementation of Lightweight Sales Conversation Workflow, WhatsApp Click-to-Chat Link Generation, Quote Specification Editing with Authoritative Server Repricing, Activity Timeline Log, Jest/Vitest Backend Tests, and Cypress E2E Automation.

---

## 📊 Executive Summary

The Sales Conversation & WhatsApp MVP feature has been successfully deployed to the ZOBBRA B2B SaaS platform.

```
Customer Quote Submission ➔ Admin Reviews in Quote Detail Desk ➔ Click "WhatsApp Customer" ➔ Instant WhatsApp Click-to-Chat ➔ Discuss Requirements ➔ Edit Quote Specs (Server Recalculates Price) ➔ Send Quote ➔ Customer Approves ➔ Convert to Order
```

### Key Milestones Achieved

- 🟢 **Phone Normalization Engine**: Built `normalizePhoneForWhatsApp` handling Indian numbers (`+91`, `0`, spaces, dashes) to output standard format (`919876543210`).
- 🟢 **WhatsApp Click-to-Chat Integration**: Built `POST /api/v1/quotes/:id/whatsapp` returning pre-filled `https://wa.me/` URLs for 5 professional templates (`NEW_QUOTE`, `QUOTE_UPDATED`, `QUOTE_READY`, `FOLLOW_UP`, `APPROVED_QUOTE`).
- 🟢 **Activity Timeline Logging (`QuoteActivity`)**: Added `QuoteActivity` Prisma model tracking chronological event types (`NOTE`, `WHATSAPP`, `STATUS_CHANGE`, `PRICE_UPDATE`, `QUOTE_SENT`, `CUSTOMER_APPROVED`, `CUSTOMER_REJECTED`).
- 🟢 **Quote Specification Editing & Server Repricing**: Admin/Sales can edit quantity, color, size, and printType via `PUT /api/v1/quotes/:id`. The server recalculates base price, volume discounts, position addons (+₹40 front/back), and 5% GST.
- 🟢 **Admin Quote Detail Desk**: Created `/dashboard/quotes/[id]` featuring Customer Info profile, line item specifications, action bar, sales timeline, and internal note form.
- 🟢 **Customer Ownership & Security**: Customer role queries automatically strip internal staff notes (`NOTE`) and WhatsApp click logs (`WHATSAPP`).
- 🟢 **Backend Integration Tests**: Created `server/tests/whatsapp.test.ts` — **23/23 Total Backend Tests Passed**.
- 🟢 **Cypress E2E Automation**: Created `apps/web/cypress/e2e/sales_whatsapp.cy.ts` — **28/28 Total Cypress Tests Passed 100% in Electron & Chrome**.

---

## 🏗️ API Endpoints Summary

| Method | Endpoint | Access Control | Behavior & Classification |
|---|---|---|---|
| `GET` | `/api/v1/quotes/:id` | `Bearer <JWT>` | **REAL BACKEND**: Returns quote details, customer/company, items, and activities. Sanitizes internal notes for CUSTOMER role. |
| `PUT` | `/api/v1/quotes/:id` | `ADMIN`, `SALES` | **REAL BACKEND**: Updates quote specifications (quantity, printType, color, size). Server recalculates subtotal, GST, and total. Logs `PRICE_UPDATE` activity. |
| `POST` | `/api/v1/quotes/:id/activity` | `ADMIN`, `SALES` | **REAL BACKEND**: Adds an internal sales note (`NOTE`) to the quote timeline. |
| `POST` | `/api/v1/quotes/:id/whatsapp` | `ADMIN`, `SALES` | **EXTERNAL LINK + REAL BACKEND**: Generates normalized `https://wa.me/` URL and logs `WHATSAPP` activity (`"WhatsApp conversation initiated from Zobra"`). |
| `POST` | `/api/v1/orders/from-quote/:quoteId` | `Bearer <JWT>` | **REAL BACKEND**: Converts approved quote into an order record using an atomic Prisma transaction. |

---

## 📲 WhatsApp Click-to-Chat Link Specification

- **Base URL Format**: `https://wa.me/<normalizedPhone>?text=<encodedMessage>`
- **Sample Message Output (`NEW_QUOTE`)**:
  ```text
  Hi Rahul Mishra,

  This is Zobra Sales from Zobra.

  We received your merchandise quotation request:
  • Quote: #ZQB-QT-2026-1003
  • Product: Customized Polo T-Shirt (200 GSM Cotton)
  • Quantity: 100 units

  I'd like to discuss the requirements and finalize the quotation with you.

  Regards,
  ZOBBRA Team
  ```

---

## 🧪 Automated Test Execution Matrix

| Test Suite | Test Runner | Total Specs / Tests | Passed | Result |
|---|---|---|---|---|
| **Backend API & Unit Tests** | Jest / Supertest | 4 Suites / 23 Tests | 23 / 23 | 🟢 **100% PASSED** |
| **Cypress E2E (Electron)** | Cypress v13 | 11 Spec Files / 28 Tests | 28 / 28 | 🟢 **100% PASSED** |
| **Cypress E2E (Chrome)** | Cypress v13 | 11 Spec Files / 28 Tests | 28 / 28 | 🟢 **100% PASSED** |
| **Monorepo Build** | Turbo / Next.js | 4 Packages / 32 Routes | 4 / 4 | 🟢 **100% PASSED** |

---

## ⚠️ Known Limitations & Future Architecture

1. **Current MVP Scope**: Uses WhatsApp Click-to-Chat links (`https://wa.me/`). Does NOT require Meta Business Manager, WABA, Cloud API access tokens, or webhooks.
2. **Activity Recording**: Records `"WhatsApp conversation initiated from Zobra"` upon button click. Does NOT claim or fake customer responses.
3. **Future Cloud API Roadmap**:
   ```
   Zobra Backend ➔ WhatsApp Cloud API ➔ Customer Device ➔ Customer Reply ➔ Webhook ➔ Zobra CRM
   ```
