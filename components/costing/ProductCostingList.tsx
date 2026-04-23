"use client";

interface Variant {
  id: string;
  name: string;
  price: number;
  hasCosting: boolean;
  costPerItem: number | null;
  srp: number | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  hasCosting: boolean;
  costPerItem: number | null;
  srp: number | null;
  variants: Variant[];
}

interface ProductCostingListProps {
  products: Product[];
  selectedProductId: string | null;
  onSelect: (productId: string) => void;
}

export default function ProductCostingList({
  products,
  selectedProductId,
  onSelect,
}: ProductCostingListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">Products</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {products.map((p) => {
          const hasVariants = p.variants.length > 0;
          const costedVariants = p.variants.filter((v) => v.hasCosting).length;

          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={[
                "rounded-xl border p-3 text-left transition-colors",
                selectedProductId === p.id
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
              ].join(" ")}
            >
              <p className="text-sm font-medium text-gray-900">{p.name}</p>
              <p className="text-xs text-gray-500">₱{p.price.toFixed(2)}</p>
              {hasVariants ? (
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-xs text-gray-400">
                    {p.variants.length} variant{p.variants.length > 1 ? "s" : ""}
                  </span>
                  <span
                    className={[
                      "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                      costedVariants === p.variants.length
                        ? "bg-green-100 text-green-700"
                        : costedVariants > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-500",
                    ].join(" ")}
                  >
                    {costedVariants}/{p.variants.length}
                  </span>
                </div>
              ) : (
                <span
                  className={[
                    "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                    p.hasCosting
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700",
                  ].join(" ")}
                >
                  {p.hasCosting ? "✓ Costed" : "⚠ No Costing"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
