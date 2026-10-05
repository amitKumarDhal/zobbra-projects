import { ProductForm } from '@/components/dashboard/ProductForm';

export default function EditProductPage({ params }: { params: { id: string } }) {
  return <ProductForm productId={params.id} />;
}
