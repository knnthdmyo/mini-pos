import { getProducts } from "@/lib/actions/products";
import { getMaterials } from "@/lib/actions/materials";
import { getProductsWithCostingStatus } from "@/lib/actions/costing";
import ManageClient from "./ManageClient";

export default async function ManagePage() {
  const [products, materials, costingProducts] = await Promise.all([
    getProducts(),
    getMaterials(),
    getProductsWithCostingStatus(),
  ]);

  return (
    <ManageClient
      products={products}
      materials={materials}
      costingProducts={costingProducts}
    />
  );
}
