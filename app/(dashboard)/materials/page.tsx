import { getMaterials } from "@/lib/actions/materials";
import MaterialsTable from "@/components/materials/MaterialsTable";

export default async function MaterialsPage() {
  const materials = await getMaterials();

  return (
    <div className="h-[calc(100dvh-8rem)] overflow-y-auto bg-brand-bg p-4 pb-20">
      <div className="mx-auto max-w-3xl">
        <MaterialsTable materials={materials} />
      </div>
    </div>
  );
}
