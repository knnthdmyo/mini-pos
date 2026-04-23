import { getProducts } from "@/lib/actions/products";
import ProductsTable from "@/components/products/ProductsTable";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-6">
      <ProductsTable products={products} />
    </div>
  );
}
