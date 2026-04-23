import { getProducts } from "@/lib/actions/products";
import ProductsTable from "@/components/products/ProductsTable";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="h-[calc(100dvh-4rem)] overflow-y-auto bg-gray-50 p-4 pb-20">
      <div className="mx-auto max-w-3xl">
        <ProductsTable products={products} />
      </div>
    </div>
  );
}
