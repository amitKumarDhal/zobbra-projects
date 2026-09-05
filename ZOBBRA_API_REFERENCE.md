# ZOBBRA API Reference

> **SOURCE OF TRUTH:** The current source code, Prisma schema, deployment configuration, and live environment configuration override this document. This document reflects the state as of the time of writing.

## Overview
The ZOBBRA API is a RESTful service.
Base URL: `https://zobra-server-production.up.railway.app/api/v1`

## API Endpoints

### Auth
- `POST /auth/register` (Public) - Register a new user
- `POST /auth/login` (Public) - Login
- `POST /auth/forgot-password` (Public) - Forgot password
- `POST /auth/change-password` (Auth required) - Change password
- `GET /auth/me` (Auth required) - Get current user

### Products
- `GET /products` (Public) - List products
- `GET /products/categories` (Public) - List categories
- `GET /products/:slug` (Public) - Get product details
- `POST /products` (ADMIN/SALES) - Create product
- `PUT /products/:id` (ADMIN/SALES) - Update product
- `POST /products/:id/duplicate` (ADMIN/SALES) - Duplicate product
- `DELETE /products/:id` (ADMIN/SALES) - Delete product

### Quotes
- `GET /quotes` (Auth required) - List quotes
- `POST /quotes/calculate` (ADMIN/SALES) - Calculate pricing
- `GET /quotes/:id` (Auth required) - Get quote details
- `POST /quotes` (Auth required) - Create quote
- `PUT /quotes/:id` (ADMIN/SALES) - Edit quote
- `PUT /quotes/:id/status` (Auth required) - Update status
- `GET /quotes/:id/pdf` (Auth required) - Download quote PDF
- `POST /quotes/:id/email` (Auth required) - Email quote
- `POST /quotes/:id/whatsapp` (ADMIN/SALES) - Send WhatsApp link

### Orders
- `GET /orders` (Auth required) - List orders
- `GET /orders/:id` (Auth required) - Get order details
- `POST /orders/from-quote/:quoteId` (Auth required) - Convert quote to order
- `PUT /orders/:id/status` (ADMIN/SALES/PRODUCTION) - Update order status

### Invoices
- `GET /invoices` (Auth required) - List invoices
- `GET /invoices/:id` (Auth required) - Get invoice details
- `GET /invoices/:id/pdf` (Auth required) - Download invoice PDF

### Production
- `GET /production/kanban` (ADMIN/PRODUCTION/SALES) - List jobs
- `PUT /production/:id/stage` (ADMIN/PRODUCTION) - Update stage

### Dispatch
- `GET /dispatch` (ADMIN/SALES/PRODUCTION) - List dispatches
- `POST /dispatch` (ADMIN/PRODUCTION) - Create dispatch
- `GET /dispatch/track/:shipmentNumber` (Public) - Track shipment

### Inquiries
- `GET /inquiries` (ADMIN/SALES) - List inquiries
- `POST /inquiries` (Public) - Create inquiry
- `POST /inquiries/:id/convert-to-quote` (ADMIN/SALES) - Convert inquiry to quote

### Payments
- `POST /payments/create-order` (Auth required) - Create Razorpay order
- `POST /payments/verify` (Auth required) - Verify payment
- `POST /payments/webhook` (Public) - Webhook
- `GET /payments` (ADMIN/SALES) - List payments
- `POST /payments/record` (ADMIN/SALES) - Record manual payment

> **SOURCE OF TRUTH:** The current source code, Prisma schema, deployment configuration, and live environment configuration override this document. This document reflects the state as of the time of writing.
