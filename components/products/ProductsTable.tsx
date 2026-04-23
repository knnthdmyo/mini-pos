"use client";

import { useState } from "react";
import { deleteProduct, toggleProductActive } from "@/lib/actions/products";
import ProductForm from "@/components/products/ProductForm";
import VariantManager from "@/components/products/VariantManager";
import { Button } from "@/components/ui/Button";
import { Toast, useToast } from "@/components/ui/Toast";

interface Product {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

interface ProductsTableProps {
  products: Product[];
}

export default function ProductsTable({ products }: ProductsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast, showToast, dismiss } = useToast();

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const result = await deleteProduct(id);
      if (!result.deleted && result.error) {
        showToast(result.error, "error");
      } else {
        showToast("Product deleted", "success");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      await toggleProductActive(id, !currentActive);
      showToast(currentActive ? "Product deactivated" : "Product activated", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to toggle", "error");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-text">Products</h1>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancel" : "Add Product"}
        </Button>
      </div>

      {showAdd && (
        <div className="mb-6 rounded-2xl glass p-4 shadow-sm">
          <ProductForm
            onSuccess={() => {
              setShowAdd(false);
              showToast("Product added!", "success");
            }}
          />
        </div>
      )}

      {products.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          No products yet. Add your first product above.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl glass shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-border/30 bg-brand-surface/40">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 font-medium text-gray-700">Price</th>
                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className={!p.is_active ? "opacity-50" : ""}>
                  {editingId === p.id ? (
                    <td colSpan={4} className="px-4 py-3">
                      <ProductForm
                        initialData={p}
                        onSuccess={() => {
                          setEditingId(null);
                          showToast("Product updated!", "success");
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
                      <td className="px-4 py-3 font-medium text-brand-text">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">₱{Number(p.price).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(p.id, p.is_active)}
                          className={[
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            p.is_active
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                          ].join(" ")}
                        >
                          {p.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="flex gap-2 px-4 py-3">
                        <button
                          onClick={() => setEditingId(p.id)}
                          className="text-sm font-medium text-brand-primary hover:text-brand-primary/80"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setVariantProduct(p)}
                          className="text-sm font-medium text-purple-600 hover:text-purple-800"
                        >
                          Variants
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
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

      {variantProduct && (
        <VariantManager
          productId={variantProduct.id}
          productName={variantProduct.name}
          onClose={() => setVariantProduct(null)}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />
      )}
    </div>
  );
}
