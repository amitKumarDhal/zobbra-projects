# Zobra REST API Specification (v1)

Base URL: `http://localhost:5000/api/v1`

---

## Auth Endpoints (`/auth`)

### `POST /auth/register`
Creates a new B2B customer account and company profile.

### `POST /auth/login`
Authenticates user and returns JWT Bearer token + role (`ADMIN`, `SALES`, `PRODUCTION`, `CUSTOMER`).

### `GET /auth/me`
Fetches active user profile and company info. (Header: `Authorization: Bearer <token>`)

---

## Products Endpoints (`/products`)

### `GET /products`
List all products with category filters, bulk pricing matrices & variants.

### `GET /products/:slug`
Fetch single product detail by slug with tiered bulk prices.

### `POST /products` (Admin/Sales)
Create new merchandise product.

---

## Quotes Endpoints (`/quotes`)

### `GET /quotes`
List quotes (Filtered by status / role scope).

### `POST /quotes`
Create new quotation request with items, bulk rates & auto GST calculation.

### `PUT /quotes/:id/status`
Update status to `APPROVED`, `REJECTED`, or `SENT`.

### `GET /quotes/:id/pdf`
Streams downloadable PDF quotation document.

### `POST /quotes/:id/email`
Dispatches PDF quotation via Resend email API.

---

## Orders & Production Endpoints (`/orders` & `/production`)

### `POST /orders/convert`
Converts approved Quote → Order and creates initial Production Job + Tax Invoice.

### `GET /production/kanban` (Admin/Production/Sales)
Fetch Kanban board jobs categorized by stage (`PENDING`, `PRINTING`, `QUALITY_CHECK`, `PACKING`, `READY_TO_DISPATCH`).

### `PUT /production/:id/stage`
Transition job stage along Kanban pipeline.

---

## Dispatch Endpoints (`/dispatch`)

### `POST /dispatch`
Create courier shipment & assign tracking number (BlueDart, Delhivery, DTDC).

### `GET /dispatch/track/:shipmentNumber`
Public shipment tracking info.
