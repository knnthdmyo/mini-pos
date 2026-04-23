"use client";

import { useState, useEffect } from "react";
import ProductCostingList from "@/components/costing/ProductCostingList";
import CostingBuilder from "@/components/costing/CostingBuilder";
import { getCosting } from "@/lib/actions/costing";
import Link from "next/link";

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

interface Material {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  stock_qty: number;
  created_at: string;
}

interface CostingData {
  id: string;
  overheadCost: number;
  laborCost: number;
  otherCost: number;
  yieldQuantity: number;
  profitMargin: number;
  srp: number;
  srpOverride: boolean;
  updatedAt: string;
  materialRows: {
    id: string;
    ingredientId: string | null;
    materialName: string;
    unit: string;
    costPerUnit: number;
    quantityUsed: number;
    rowTotal: number;
  }[];
}

interface CostingPageClientProps {
  products: Product[];
  materials: Material[];
}

export default function CostingPageClient({
  products,
  materials,
}: CostingPageClientProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [costingData, setCostingData] = useState<CostingData | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const hasVariants = (selectedProduct?.variants.length ?? 0) > 0;

  const costedCount = products.filter((p) => p.hasCosting).length;
  const uncostedCount = products.length - costedCount;

  // Load costing when product or variant changes
  useEffect(() => {
    if (!selectedProductId) {
      setCostingData(null);
      return;
    }

    // If product has variants but none selected, don't load
    if (hasVariants && !selectedVariantId) {
      setCostingData(null);
      return;
    }

    setLoading(true);
    getCosting(selectedProductId, selectedVariantId)
      .then((data) => {
        setCostingData(
          data
            ? {
                id: data.id,
                overheadCost: data.overheadCost,
                laborCost: data.laborCost,
                otherCost: data.otherCost,
                yieldQuantity: data.yieldQuantity,
                profitMargin: data.profitMargin,
                srp: data.srp,
                srpOverride: data.srpOverride,
                updatedAt: data.updatedAt,
                materialRows: data.materialRows,
              }
            : null,
        );
      })
      .finally(() => setLoading(false));
  }, [selectedProductId, selectedVariantId, hasVariants]);

  // Reset variant when product changes
  useEffect(() => {
    setSelectedVariantId(null);
  }, [selectedProductId]);

  // Determine label for the costing builder
  const costingLabel = selectedProduct
    ? hasVariants && selectedVariantId
      ? `${selectedProduct.name} — ${selectedProduct.variants.find((v) => v.id === selectedVariantId)?.name}`
      : selectedProduct.name
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Costing</h1>
        <Link
          href="/materials"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Manage Materials →
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          <p className="text-xs text-gray-500">Total Products</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{costedCount}</p>
          <p className="text-xs text-green-600">With Costing</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{uncostedCount}</p>
          <p className="text-xs text-amber-600">No Costing</p>
        </div>
      </div>

      {/* Product selector */}
      <ProductCostingList
        products={products}
        selectedProductId={selectedProductId}
        onSelect={setSelectedProductId}
      />

      {/* Variant selector */}
      {selectedProduct && hasVariants && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Select Variant</h3>
          <div className="flex flex-wrap gap-2">
            {selectedProduct.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariantId(v.id)}
                className={[
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  selectedVariantId === v.id
                    ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
                ].join(" ")}
              >
                <span>{v.name}</span>
                <span className="ml-1 text-xs text-gray-400">₱{v.price.toFixed(2)}</span>
                {v.hasCosting && (
                  <span className="ml-1 text-xs text-green-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Costing builder */}
      {selectedProduct && !loading && (!hasVariants || selectedVariantId) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <CostingBuilder
            key={`${selectedProductId}-${selectedVariantId}`}
            productId={selectedProduct.id}
            productName={costingLabel}
            materials={materials}
            initialData={costingData}
            variantId={selectedVariantId}
          />
        </div>
      )}

      {selectedProduct && hasVariants && !selectedVariantId && (
        <div className="py-8 text-center text-sm text-gray-400">
          Select a variant above to view or create its costing
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-sm text-gray-400">
          Loading costing data...
        </div>
      )}

      {!selectedProductId && (
        <div className="py-8 text-center text-sm text-gray-400">
          Select a product above to view or create its costing
        </div>
      )}
    </div>
  );
}
