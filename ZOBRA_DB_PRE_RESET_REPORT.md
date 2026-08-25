# ZOBBRA Database Pre-Cleanup Audit Report

**Date & Time:** August 25, 2026, 12:30 PM IST  
**Environment:** Local Development (PostgreSQL on `localhost:5432/zobra_db`)  
**Database Backup:** `C:\Zobra\backups\zobra-before-manual-flow-test-20260825-1228.sql` (Size: 331,874 bytes — Verified)

---

## 1. Active Database Confirmation

- **Database Engine:** PostgreSQL 18
- **Host / Port:** `localhost:5432`
- **Database Name:** `zobra_db`
- **Schema:** `public`
- **Remote / Production Check:** Confirmed purely **LOCAL**. No remote, shared, Railway, or Hostinger databases are connected.

---

## 2. Pre-Cleanup Data Counts

| Table Name | Entity Description | Current Record Count | Cleanup Action | Rationale |
| :--- | :--- | :---: | :--- | :--- |
| `users` | User Accounts | **48** | **Partial Clean** (Remove 41 demo/e2e customers; preserve 7 system accounts) | Preserve Admin (`admin@zobra.test`, `admin@zobra.com`), Sales (`sales@zobra.com`), Production (`production@zobra.com`), and default seed users |
| `companies` | Corporate Profiles | **39** | **Partial Clean** (Remove demo test companies; preserve default seed companies) | Preserve Acme Corp and base seeded companies |
| `categories` | Product Categories | **5** | **PRESERVE ALL** | Core Catalog: T-Shirts, Hoodies, Caps, Bags, Drinkware |
| `products` | Product Catalog | **13** | **PRESERVE ALL** | Core catalog products required for quotation & orders |
| `product_variants` | Product Colors & Sizes | **7** | **PRESERVE ALL** | Catalog variants |
| `bulk_pricings` | Quantity Tier Pricing | **26** | **PRESERVE ALL** | Pricing rules needed for dynamic quote rate calculation |
| `inquiries` | Inquiries / B2B Leads | **34** | **REMOVE ALL** | Demo & test inquiries from Cypress/manual testing |
| `inquiry_activities`| Inquiry Logs & Notes | **73** | **REMOVE ALL** | Transactional history linked to inquiries |
| `quotes` | Quotation Records | **214** | **REMOVE ALL** | Demo & automated test quotations |
| `quote_items` | Quote Line Items | **200** | **REMOVE ALL** | Cascade-deleted with quotes |
| `quote_activities` | Quote Timeline Events | **374** | **REMOVE ALL** | Cascade-deleted with quotes |
| `orders` | Confirmed B2B Orders | **66** | **REMOVE ALL** | Demo & automated test orders |
| `order_items` | Order Line Items | **62** | **REMOVE ALL** | Cascade-deleted with orders |
| `payments` | Recorded & UPI Payments | **29** | **REMOVE ALL** | Demo payment transactions |
| `invoices` | Generated Invoices | **63** | **REMOVE ALL** | Transactional invoices linked to demo orders |
| `production_jobs` | Manufacturing Jobs | **63** | **REMOVE ALL** | Transactional production states |
| `dispatches` | Shipping & Tracking | **0** | **Clean** (0 present) | Transactional shipping data |
| `tasks` | Follow-up & Sales Tasks | **10** | **REMOVE ALL** | Demo tasks linked to test quotes/inquiries |
| `coupons` | Discount Coupons | **1** | **PRESERVE ALL** | Marketing data (`WELCOME10`) |
| `coupon_usages` | Coupon Tracking | **0** | **Clean** (0 present) | Usage tracking |
| `testimonials` | CMS Testimonials | **6** | **PRESERVE ALL** | Marketing content |
| `cms_contents` | CMS Blogs & Content | **5** | **PRESERVE ALL** | Marketing content |
| `system_settings` | Platform Configuration | **27** | **PRESERVE ALL** | Core configuration & branding settings |
| `system_activities` | Audit Logs | **43** | **Clean/Preserve** | System audit logs |

---

## 3. Preservation vs. Removal Plan

### Data to Preserve:
1. **System & Staff Accounts:**
   - `admin@zobra.test` (Admin)
   - `admin@zobra.com` (Admin - Rajesh Sharma)
   - `admin@zobbra.com` (Admin)
   - `sales@zobra.com` (Sales Lead - Priya Das)
   - `production@zobra.com` (Print Manager - Amitav Mohanty)
   - `customer@zobra.test` (Customer - Rahul Sharma)
   - `client@acme.com` (Customer - Rahul Mishra)
2. **Product Catalog & Pricing:**
   - All 5 Categories (`t-shirts`, `hoodies`, `caps`, `bags`, `drinkware`)
   - All Core Products, Variants, and Bulk Pricing Tiers
3. **Marketing & Settings:**
   - Active Coupons, System Settings, Testimonials, CMS Content

### Data to Safely Remove (Transactional Data in Safe Order):
1. `Payment` records
2. `Dispatch` records
3. `ProductionJob` records
4. `Invoice` records
5. `OrderItem` records
6. `Order` records
7. `QuoteActivity` records
8. `QuoteItem` records
9. `Task` records (or unlink foreign keys)
10. `Quote` records
11. `InquiryActivity` records
12. `Inquiry` records
13. Temporary test/e2e `User` accounts (`e2e-customer-*`, `guest-*`, `test-user-*`) and test `Company` records
