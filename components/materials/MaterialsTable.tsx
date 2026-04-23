"use client";

import { useState } from "react";
import { deleteMaterial } from "@/lib/actions/materials";
import MaterialForm from "@/components/materials/MaterialForm";
import { Button } from "@/components/ui/Button";
import { Toast, useToast } from "@/components/ui/Toast";

interface Material {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  stock_qty: number;
  created_at: string;
}

interface MaterialsTableProps {
  materials: Material[];
}

export default function MaterialsTable({ materials }: MaterialsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    products: string[];
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast, showToast, dismiss } = useToast();

  async function handleDelete(id: string, confirm?: boolean) {
    setDeleting(true);
    try {
      const result = await deleteMaterial(id, confirm);
      if (!result.deleted && result.warning && result.affectedProducts) {
        setConfirmDelete({ id, products: result.affectedProducts });
      } else {
        setConfirmDelete(null);
        showToast("Material deleted", "success");
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-text">Materials</h1>
        <Button
          className="min-w-32"
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
          variant={showAdd ? "secondary" : "primary"}
        >
          {showAdd ? "Cancel" : "Add Material"}
        </Button>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-2xl glass p-4 shadow-sm">
          <MaterialForm
            onSuccess={() => {
              setShowAdd(false);
              showToast("Material added!", "success");
            }}
          />
        </div>
      )}

      {materials.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          No materials yet. Add your first material above.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl glass shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-border/30 bg-brand-surface/40">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 font-medium text-gray-700">Unit</th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  Cost/Unit
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">Stock</th>
                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materials.map((m) => (
                <tr key={m.id}>
                  {editingId === m.id ? (
                    <td colSpan={5} className="px-4 py-3">
                      <MaterialForm
                        initialData={m}
                        onSuccess={() => {
                          setEditingId(null);
                          showToast("Material updated!", "success");
                        }}
                      />
                      <button
                        onClick={() => setEditingId(null)}
                        className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-brand-text">
                        {m.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{m.unit}</td>
                      <td className="px-4 py-3 text-gray-600">
                        ₱{Number(m.cost_per_unit).toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {Number(m.stock_qty).toFixed(2)}
                      </td>
                      <td className="flex gap-2 px-4 py-3">
                        <button
                          onClick={() => setEditingId(m.id)}
                          className="text-sm font-medium text-brand-primary hover:text-brand-primary/80"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={deleting}
                          className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl glass-modal p-6 shadow-xl">
            <h3 className="mb-2 text-base font-bold text-brand-text">
              Delete Material?
            </h3>
            <p className="mb-3 text-sm text-gray-600">
              This material is used in the costing for:
            </p>
            <ul className="mb-4 list-inside list-disc text-sm text-gray-700">
              {confirmDelete.products.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
            <p className="mb-4 text-sm text-gray-500">
              The costing snapshot data will be preserved but the link to this
              material will be removed.
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                disabled={deleting}
                onClick={() => handleDelete(confirmDelete.id, true)}
              >
                {deleting ? "Deleting..." : "Delete Anyway"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />
      )}
    </div>
  );
}
