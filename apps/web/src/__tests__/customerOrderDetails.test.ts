import { describe, expect, it } from 'vitest';
import { getOrderPaidAmount, getOrderSpecs, CustomerOrderDetail } from '../components/orders/CustomerOrderDetails';

const order = (patch: Partial<CustomerOrderDetail>): CustomerOrderDetail => ({
  id: 'o1',
  orderNumber: 'ZQB-ORD-2026-5001',
  status: 'PENDING',
  paymentStatus: 'PENDING',
  subtotal: 5980,
  gstTotal: 299,
  totalAmount: 6279,
  createdAt: '2026-10-01T00:00:00.000Z',
  ...patch,
});

describe('order paid / due amounts', () => {
  it('nothing paid when there are no successful payments', () => {
    expect(getOrderPaidAmount(order({}))).toBe(0);
    expect(getOrderPaidAmount(order({ payments: [{ id: 'p', amount: 1000, status: 'FAILED', createdAt: '' }] }))).toBe(0);
  });

  it('sums only successful payments', () => {
    const o = order({
      paymentStatus: 'PARTIAL',
      payments: [
        { id: 'a', amount: 2000, status: 'SUCCESS', createdAt: '' },
        { id: 'b', amount: 1000, status: 'SUCCESS', createdAt: '' },
        { id: 'c', amount: 500, status: 'PENDING', createdAt: '' },
      ],
    });
    expect(getOrderPaidAmount(o)).toBe(3000);
  });

  it('an order marked PAID is fully paid even without payment records', () => {
    expect(getOrderPaidAmount(order({ paymentStatus: 'PAID' }))).toBe(6279);
  });
});

describe('customer-visible order specifications', () => {
  it('returns readable specs and leaves out raw customizer JSON and the artwork URL', () => {
    const o = order({
      items: [
        {
          id: 'i1',
          printType: 'Front Only',
          color: 'Navy Blue',
          size: 'S',
          quantity: 20,
          unitPrice: 299,
          totalPrice: 5980,
          customizationDetails:
            'Print: Custom Online Design - Front Only | Artwork: https://res.cloudinary.com/x/a.png | Delivery Address: Plot 4, Bhubaneswar | Customization: {"selectedColor":"Navy Blue"} | Notes: Custom Online Design',
        },
      ],
    });
    expect(getOrderSpecs(o)).toEqual([
      { label: 'Print', value: 'Custom Online Design - Front Only' },
      { label: 'Delivery Address', value: 'Plot 4, Bhubaneswar' },
      { label: 'Notes', value: 'Custom Online Design' },
    ]);
  });

  it('is empty when the order carries no notes', () => {
    expect(getOrderSpecs(order({ items: [] }))).toEqual([]);
    expect(getOrderSpecs(order({}))).toEqual([]);
  });
});
