import { getProductsWithCostingStatus } from "@/lib/actions/costing";
import { getMaterials } from "@/lib/actions/materials";
import CostingPageClient from "./CostingPageClient";

export default async function CostingPage() {
  const [products, materials] = await Promise.all([
    getProductsWithCostingStatus(),
    getMaterials(),
  ]);

  return (
    <div className="h-[calc(100dvh-4rem)] overflow-y-auto bg-gray-50 p-4 pb-20">
      <div className="mx-auto max-w-3xl">
        <CostingPageClient products={products} materials={materials} />
      </div>
    </div>
  );
}
