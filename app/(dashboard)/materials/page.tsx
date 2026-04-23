import { getMaterials } from "@/lib/actions/materials";
import MaterialsTable from "@/components/materials/MaterialsTable";

export default async function MaterialsPage() {
  const materials = await getMaterials();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6">
      <MaterialsTable materials={materials} />
    </div>
  );
}
