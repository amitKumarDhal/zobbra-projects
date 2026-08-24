# 🔍 ZOBBRA B2B SaaS — Sales Conversation & WhatsApp MVP Audit

**Date**: 2026-08-08  
**Auditor**: Senior Full-Stack Engineer + Product Engineer + QA Engineer  
**Scope**: Comprehensive inspection of existing Quote, Customer, and User models, phone number fields, status state machines, and activity timeline plan.

---

## 1. Audit Findings Matrix

| Audit Area | Findings in Workspace | Plan & Recommendation |
|---|---|---|
| **1. Customer Phone Storage** | `User.phone` (String?) in `prisma/schema.prisma`. | **REUSE `User.phone`**. Normalize to standard format (`+919876543210` or `919876543210`) for WhatsApp `https://wa.me/` links. |
| **2. WhatsApp Specific Field** | No `whatsappNumber` field exists. | **No separate column required**. `User.phone` contains the customer's phone number and serves as the WhatsApp contact. |
| **3. Quote ↔ Customer Relationship** | `Quote.customerId ➔ User.id` and `Quote.companyId ➔ Company.id`. | Maintained verbatim. `getQuoteById` includes `customer` and `company` relations. |
| **4. Admin / Sales Roles** | `Role.ADMIN` and `Role.SALES` in `prisma/schema.prisma`. | Authorize both `ADMIN` and `SALES` roles to execute sales conversation actions (notes, WhatsApp clicks, quote edits, status updates). |
| **5. Quote Status State Machine** | `DRAFT` ➔ `SENT` ➔ `APPROVED` / `REJECTED` ➔ `EXPIRED`. | Retained. Transitioning to `SENT`, `APPROVED`, or `REJECTED` logs a `STATUS_CHANGE` or `QUOTE_SENT` activity. |
| **6. Quote Detail Page** | Basic list view on `/dashboard/quotes`. Detail route `/dashboard/quotes/[id]` requires implementation. | Create `/dashboard/quotes/[id]` containing customer profile, product specs, action bar, activity timeline, and sales note input. |
| **7. Quote Activity / Timeline** | No activity timeline model currently exists. | Add `QuoteActivity` model & `QuoteActivityType` enum to Prisma schema. |

---

## 2. Phone Number Normalization Logic

```typescript
export function normalizePhoneForWhatsApp(phone: string | null | undefined): string {
  if (!phone) return '919876543210'; // Fallback default Indian test contact
  // Strip spaces, dashes, parentheses, plus signs
  let cleaned = phone.replace(/[^\d]/g, '');
  // If 10-digit Indian number without country code, prefix 91
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  // If 11-digit starting with 0 (e.g. 09876543210), replace leading 0 with 91
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = `91${cleaned.substring(1)}`;
  }
  return cleaned;
}
```

---

## 3. WhatsApp Message Templates Strategy

For MVP, pure WhatsApp click-to-chat links (`https://wa.me/<normalizedPhone>?text=<encodedText>`) are generated server-side.

| Template Key | Purpose | Message Structure |
|---|---|---|
| **`NEW_QUOTE`** | First contact after quote submission | *"Hi {name}, Thank you for contacting Zobra. We received quote request #{number} for {product} ({qty} units)..."* |
| **`QUOTE_READY`** | Inform customer quotation is ready | *"Hi {name}, Your quotation #{number} is ready. Total: ₹{total}... "* |
| **`FOLLOW_UP`** | Sales follow-up | *"Hi {name}, Just following up regarding quotation #{number}... "* |
| **`APPROVED_QUOTE`** | Confirmation upon quote approval | *"Hi {name}, Thank you for approving quotation #{number}! Your order is now being processed... "* |

---

## 4. Prisma Schema Additions Plan

```prisma
enum QuoteActivityType {
  NOTE
  WHATSAPP
  STATUS_CHANGE
  PRICE_UPDATE
  QUOTE_SENT
  CUSTOMER_APPROVED
  CUSTOMER_REJECTED
}

model QuoteActivity {
  id        String            @id @default(uuid())
  quoteId   String
  quote     Quote             @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  userId    String?
  user      User?             @relation(fields: [userId], references: [id], onDelete: SetNull)
  type      QuoteActivityType @default(NOTE)
  message   String
  createdAt DateTime          @default(now())

  @@map("quote_activities")
}
```
