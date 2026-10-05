import { Prisma } from '@prisma/client';
import { planStockDeduction, StockLine } from './product-config.js';

interface OrderedItem {
  productId: string;
  color?: string | null;
  quantity: number;
  variants?: Array<{ color?: string | null; quantity: number }> | null;
}

/**
 * Deducts internal stock for a newly created order. Runs inside the order transaction so the
 * order and its stock movement are saved together. The product row is locked while its stock is
 * recalculated, so two orders confirmed at the same time cannot overwrite each other's deduction.
 */
export async function deductStockForOrder(tx: Prisma.TransactionClient, items: OrderedItem[]) {
  const linesByProduct = new Map<string, StockLine[]>();
  for (const item of items) {
    const lines: StockLine[] =
      item.variants && item.variants.length > 0
        ? item.variants.map((v) => ({ color: v.color || item.color, quantity: v.quantity }))
        : [{ color: item.color, quantity: item.quantity }];
    linesByProduct.set(item.productId, [...(linesByProduct.get(item.productId) || []), ...lines]);
  }

  for (const [productId, lines] of linesByProduct) {
    await tx.$queryRaw`SELECT "id" FROM "products" WHERE "id" = ${productId} FOR UPDATE`;
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { stockCount: true, stockDeduction: true },
    });
    if (!product) continue;

    const plan = planStockDeduction(product, lines);
    await tx.product.update({
      where: { id: productId },
      data: {
        stockCount: plan.stockCount,
        ...(plan.stockDeduction ? { stockDeduction: plan.stockDeduction as unknown as Prisma.InputJsonValue } : {}),
      },
    });
  }
}
