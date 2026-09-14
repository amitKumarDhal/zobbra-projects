# ZOBBRA Quote Flow Audit (V1)

## Overview
This document outlines the simplified quoting experience for ZOBBRA. To reduce friction, the process of submitting a quote request has been reduced to exactly 5 inputs for both guests and authenticated customers.

---

## 1. Guest Flow (Unauthenticated)

**Endpoint:** `POST /api/v1/inquiries`

**UI Inputs:**
1. **Name:** String (Customer Name)
2. **Phone:** String (Contact Number)
3. **Product:** UUID (Must be a real, active ZOBBRA product)
4. **Quantity:** Number (Must be > 0)
5. **Reference Files:** Array of Media Uploads (Cloudinary URLs)

**Backend Behavior:**
- Receives payload.
- Validates that `Name`, `Phone`, `Product ID`, and valid `Quantity` are present.
- Maps uploaded `referenceFiles` into the `artworkUrl` string as a comma-separated list.
- Creates an **Inquiry** record (Status: `NEW`).
- Source is explicitly recorded as `WEBSITE`.

---

## 2. Customer Flow (Authenticated)

**Endpoint:** `POST /api/v1/quotes`

**UI Inputs:**
1. **Name:** String (Prefilled from session, editable)
2. **Phone:** String (Prefilled from session, editable)
3. **Product:** UUID (Must be a real, active ZOBBRA product)
4. **Quantity:** Number (Must be > 0)
5. **Reference Files:** Array of Media Uploads (Cloudinary URLs)

**Backend Behavior:**
- Receives payload.
- Validates the required parameters and looks up the real product in the catalog.
- If the target product is not found, the server rejects the request (400 Bad Request). **No fake products are ever created.**
- Maps uploaded `referenceFiles` into the `Quote.notes` field, prefixing with `Reference Files: [urls]`.
- Creates a **DRAFT Quote**.
- Stores the newly created Quote with Quote Items defaulting to the target product's base configurations.

---

## 3. Admin Workflow

**Admin handling remains unaffected.**

- **Inquiries:** Admins view incoming Guest Inquiries in the Inquiries dashboard. They can process them, attach notes, assign sales reps, and eventually convert the inquiry into a Quote.
- **Quotes:** The newly created Customer DRAFT Quotes arrive in the Admin Quotes dashboard. Admins can view the requested Product, Quantity, and the Reference Files (saved in notes). They can edit the Quote to attach pricing, exact printing methods, positions, sizes, and final costs, and then update the status to `SENT`.
- **Order Conversion:** Once the customer approves a `SENT` quote, the Admin can safely convert it to a formal Order.

---

## 4. Security & Cleanup
- **Cloudinary:** Both flows use the `uploadToCloudinary` front-end signature system. Secrets are safely maintained on the backend, and the signed tokens are utilized efficiently.
- **Fallbacks Removed:** The legacy `polo-200gsm` automatic fallback product logic has been eliminated. The legacy hardcoded success fallback codes like `ZQB-QT-2026-1028` and `INQ-2026-0001` have been eradicated.
- **Data Integrity:** No backend schema migrations were necessary. Data was cleanly mapped into the existing structures (`artworkUrl` and `notes`), preserving all previously generated quotes and orders safely.
