# Zobra - Flutter Mobile Customer App Integration Plan

This document outlines the API endpoints, state management strategy, and Flutter architecture for building the **Zobra Customer Mobile App** (iOS & Android).

---

## 1. Mobile App Purpose & Scope

The Flutter Mobile App is tailored specifically for **Corporate Clients & Merchandise Buyers** to:
1. Browse B2B product catalog & bulk pricing tiers.
2. Submit instant quote requests with logo attachments.
3. Review & Approve/Reject received quotations with 1-click.
4. Track real-time garment printing & shipping stages (Live Timeline).
5. Download GST Tax Invoices (PDF).

---

## 2. Recommended Flutter Tech Stack

- **Framework**: Flutter 3.24+ (Dart)
- **State Management**: `flutter_bloc` or `riverpod`
- **HTTP Client**: `dio` (with Interceptors for JWT token handling)
- **Local Storage**: `flutter_secure_storage` (for JWT token)
- **PDF Viewer**: `flutter_pdfview`
- **Push Notifications**: `firebase_messaging` (for live order status updates)

---

## 3. Core API Endpoint Mapping for Flutter App

### Auth Module
- **`POST /api/v1/auth/login`**:
  - Request: `{ "email": "client@acme.com", "password": "..." }`
  - Response: `{ "token": "JWT_TOKEN_HERE", "user": { "id": "...", "name": "...", "role": "CUSTOMER" } }`
- **`POST /api/v1/auth/register`**:
  - Request: `{ "email": "...", "password": "...", "name": "...", "companyName": "...", "gstin": "..." }`

### Products & Quotes Module
- **`GET /api/v1/products`**: Fetch full catalog with bulk pricing matrix.
- **`POST /api/v1/quotes`**: Submit new quote request.
- **`GET /api/v1/quotes`**: List customer quotes.
- **`PUT /api/v1/quotes/:id/status`**: Approve/Reject quotation.
  - Body: `{ "status": "APPROVED" }`
- **`GET /api/v1/quotes/:id/pdf`**: Stream PDF quotation for download.

### Order Tracking Module
- **`GET /api/v1/orders`**: List customer orders.
- **`GET /api/v1/orders/:id`**: Order details + live production stage (`PENDING`, `PRINTING`, `QUALITY_CHECK`, `PACKING`, `DISPATCHED`).
- **`GET /api/v1/dispatch/track/:shipmentNumber`**: Tracking info & courier URL (BlueDart, Delhivery, DTDC).

---

## 4. Sample Dio API Client Snippet (Dart)

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ZobraApiClient {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: 'https://api.zobra.com/api/v1',
    connectTimeout: const Duration(seconds: 10),
  ));
  final _storage = const FlutterSecureStorage();

  ZobraApiClient() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'jwt_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
    ));
  }

  Future<List<dynamic>> fetchQuotes() async {
    final response = await _dio.get('/quotes');
    return response.data['quotes'];
  }

  Future<void> approveQuote(String quoteId) async {
    await _dio.put('/quotes/$quoteId/status', data: {'status': 'APPROVED'});
    await _dio.post('/orders/convert', data: {'quoteId': quoteId});
  }
}
```
