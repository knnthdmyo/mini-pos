import { getProductsWithCostingStatus } from "@/lib/actions/costing";
import { getMaterials } from "@/lib/actions/materials";
import CostingPageClient from "./CostingPageClient";

export default async function CostingPage() {
  const [products, materials] = await Promise.all([
    getProductsWithCostingStatus(),
    getMaterials(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-6">
      <CostingPageClient products={products} materials={materials} />
    </div>
  );
}
