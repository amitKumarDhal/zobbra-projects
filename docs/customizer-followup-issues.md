# Customizer follow-up issues (deliberately NOT part of the UI redesign)

Found during the customizer audit and redesign. None of these were changed. Each needs its own decision.

## Security / authorization
1. **`POST /quotes` trusts a body `customerId` for CUSTOMER role.** `createQuote` only falls back to `req.user.id` when
   `customerId` is absent, so an authenticated customer can create a quote against another user's id.
   Fix: for role CUSTOMER always use `req.user.id` and ignore the body value.
2. **`GET /media/guest-signature` is unauthenticated and unrated.** Anyone can mint signed Cloudinary uploads into
   `zobbra/designs`. Consider rate limiting, and constraining size/format in the signature params.
3. **`createQuote` product lookup is fuzzy** (`name contains`) and does not filter `isActive`, unlike `pricing-preview`.
   A customer can quote an inactive or unintended product.

## Pricing
4. **Guests never get a server price.** `/quotes/pricing-preview` is behind `authenticateJWT`, so guests always get a
   401 and the page silently shows a client-side estimate.
5. **The client fallback formula differs from the server engine** (`bulkPricing` tiers, no print-position surcharge,
   18% default GST vs. product `gstRate`). Guest and logged-in totals can disagree for the same input.
   Fix options: make preview public (read-only, rate limited) so there is one formula.
6. **Quick quantity tiers (50/100/250/500) are hardcoded** and ignore the product's `bulkPricing`; `handleQuantityChange`
   clamps to 1, not to the MOQ (the input only carries a `min` attribute).

## Customizer behavior
7. **Choosing a body color overwrites the color of every row in the variant matrix**, destroying per-color rows a
   customer entered. Body color and variant colors should be decoupled (or the user warned).
8. **`switchSide` has no re-entrancy guard.** A second Front/Back click while `loadFromJSON` is still running serializes a
   partially loaded canvas into the wrong side. Add `if (isSwitchingSideRef.current) return`.
9. **Fabric init effect never disposes the canvas** (cleanup closes over stale `canvas` state, always `null`).
10. **Only the last uploaded image's URL is stored as `artworkUrl`.** Earlier logos exist only in `canvasStateJson`.
11. **Export previews are design-only transparent PNGs** although the schema comment says "garment + design".
    Compositing the garment needs a CORS-safe approach for the inline SVG mockups. (Unchanged in this phase.)
12. **`canvasStateJson` has no server-side size cap** and `express.json()` uses the 100 KB default, so a design with very
    many objects can still hit a 413.
13. **A hand-built minimal i-text JSON throws inside `loadFromJSON`** (`Cannot read properties of undefined (reading '0')`).
    Real drafts produced by the serializer restore fine; only relevant if drafts are ever generated elsewhere.

## Catalog / data
14. **No hoodie mockup.** Hoodies now use the product image (or a "preview unavailable" card) instead of a polo drawing.
    A real hoodie silhouette needs design assets.
15. **Staging seed drift:** `seed_staging.ts` uses slug `promotional-cotton-cap` and has no mug or backpack products, but
    the E2E specs use `classic-promotional-cotton-cap`, `classic-corporate-ceramic-mug`, `executive-corporate-laptop-backpack`.
16. **The catalog's first product is now the mug**, so any test that assumes "first CUSTOMIZE = T-shirt" is fragile.

## Test environment
17. **`customizer_cloudinary_upload.cy.ts` used a hand-built 1x1 PNG that Cloudinary rejected ("Invalid image file")** from
    the browser. It now uploads the real `public/brand/zobbra-logo-white.png`.
18. **Running `next build` while `next dev` is running corrupts `.next`** (customize page returns 500). Stop the dev server first.
