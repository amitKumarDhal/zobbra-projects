# ZOBBRA Cloudinary Integration

## 1. Architecture
ZOBBRA now uses Cloudinary as its primary production media storage service. 
To ensure maximum security, the frontend uploads images directly to Cloudinary using a **Signed Upload Flow**. 

1. The frontend asks the ZOBBRA backend for a signature (`GET /api/v1/media/signature`).
2. The backend generates a secure signature using the private `CLOUDINARY_API_SECRET` and the `zobbra` folder prefix.
3. The browser uploads the file directly to Cloudinary (bypassing the ZOBBRA server entirely for large file payloads).
4. Cloudinary returns the `secure_url`.
5. The frontend saves this URL as a string reference into our database via standard ZOBBRA APIs (e.g. `Product.images`).

## 2. Environment Variables
Cloudinary relies on the following environment variables.

**Backend (`server/.env` or root `.env`)**:
- `CLOUDINARY_CLOUD_NAME=e3sasmyr`
- `CLOUDINARY_API_KEY=985661943518836`
- `CLOUDINARY_API_SECRET=[SECRET]` 

> **Important**: The API Secret must NEVER be prefixed with `NEXT_PUBLIC_` or exposed in frontend Next.js code. 

## 3. Signed Upload Flow
Implemented via `apps/web/src/lib/upload.ts`.
This utility:
1. Calls `/api/v1/media/signature` (authenticated).
2. Assembles `FormData` containing `api_key`, `timestamp`, `signature`, `folder`, and the file.
3. POSTs to `https://api.cloudinary.com/v1_1/e3sasmyr/auto/upload`.

## 4. Authentication/Authorization
The signature and delete routes are strictly protected:
- `requireAuth` / `authenticateJWT`: Verifies active login.
- `authorizeRoles('ADMIN', 'SALES')`: Ensures only internal team members can upload or delete official application assets, preventing arbitrary public uploads.

## 5. Upload Endpoints
- **GET `/api/v1/media/signature`**: Returns `{ signature, timestamp, apiKey, cloudName, folder }`.
- **DELETE `/api/v1/media`**: Expects `{ url }` in body. Extracts the `public_id` and deletes the asset from Cloudinary.

## 6. Database Storage
We reuse existing `String` or `String[]` fields in Prisma (e.g., `images` in `Product`). There are no Prisma schema migrations required. We simply store the Cloudinary `secure_url` directly.

## 7. Image Delivery
Cloudinary CDN delivers the images via standard `secure_url` HTTPS paths. Because we save the URL, the Next.js `<img>` and `next/image` components simply point to the external URL.

## 8. Delete/Replacement Behavior
When an Admin removes an image (e.g., from a Product), the frontend calls `DELETE /api/v1/media` passing the old URL. The backend gracefully extracts the `public_id` and permanently deletes the asset from Cloudinary. This ensures our cloud storage doesn't accrue orphaned media files.

## 9. File Validation
- Frontend: `apps/web/src/app/dashboard/products/page.tsx` checks for size (max 5MB) and type (PNG, JPG, WEBP).
- Cloudinary: Rejects invalid mime types and excessively large files based on the account limits.

## 10. Railway Configuration
You must configure the Railway backend environment (`zobra-server` service) with the 3 variables:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**DO NOT** add the API Secret to the Railway frontend service.

## 11. Local Development Setup
Place the 3 variables in your local `.env`. Ensure `.env` is ignored by `.gitignore` (which it is).

## 12. Security Rules
- `CLOUDINARY_API_SECRET` must only live in server-side memory.
- No `NEXT_PUBLIC_CLOUDINARY_API_SECRET` variable can exist.
- Upload endpoints must restrict access via JWT role checks (`ADMIN`, `SALES`).
- The ZOBBRA root Cloudinary account remains undisturbed. Our specific uploads go into the `zobbra/` folder prefix.

## 13. Troubleshooting
- **CORS Error on Upload**: Check if the Cloudinary Cloud Name is correct.
- **Unauthorized Upload (Signature mismatch)**: Ensure `CLOUDINARY_API_SECRET` on the backend matches the account for `CLOUDINARY_API_KEY`.
- **Delete Fails**: Ensure the Cloudinary URL hasn't been transformed in a way that breaks our `public_id` parsing logic.

## 14. Future Migration Considerations
If you add more models requiring files (e.g., invoice PDFs, quote attachments), you can reuse the exact same `uploadToCloudinary` function from the frontend and store the resulting URL in a `String` column in Prisma. For non-image files, Cloudinary will treat them as `raw` or `auto` resources, which is fully supported by our setup.
