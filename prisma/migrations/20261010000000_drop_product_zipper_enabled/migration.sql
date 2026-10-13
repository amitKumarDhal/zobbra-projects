-- Zipper option removed: no current product (t-shirts, caps) offers one.
ALTER TABLE "products" DROP COLUMN IF EXISTS "zipperEnabled";
