"use client";

import { useState } from "react";
import ProductsTable from "@/components/products/ProductsTable";
import MaterialsTable from "@/components/materials/MaterialsTable";
import CostingPageClient from "@/app/(dashboard)/costing/CostingPageClient";

type Section = "products" | "materials" | "costing";

interface Variant {
  id: string;
  name: string;
  price: number;
  hasCosting: boolean;
  costPerItem: number | null;
  srp: number | null;
}

interface CostingProduct {
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

interface Product {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

interface ManageClientProps {
  products: Product[];
  materials: Material[];
  costingProducts: CostingProduct[];
}

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: "products", label: "Products", icon: "📦" },
  { key: "materials", label: "Materials", icon: "🧱" },
  { key: "costing", label: "Costing", icon: "💰" },
];

export default function ManageClient({
  products,
  materials,
  costingProducts,
}: ManageClientProps) {
  const [active, setActive] = useState<Section>("products");

  const sidebarCards = (
    <div className="flex flex-col gap-2">
      {SECTIONS.map((s) => (
        <button
          key={s.key}
          onClick={() => setActive(s.key)}
          className={[
            "rounded-2xl border p-4 text-left transition-all",
            active === s.key
              ? "border-brand-primary/60 bg-brand-primary/10 shadow-sm"
              : "border-brand-border bg-brand-surface/60 hover:border-brand-border hover:shadow-sm",
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{s.icon}</span>
            <div>
              <p className="text-sm font-semibold text-brand-text">{s.label}</p>
              <p className="text-xs text-gray-500">
                {s.key === "products" && `${products.length} product${products.length !== 1 ? "s" : ""}`}
                {s.key === "materials" && `${materials.length} material${materials.length !== 1 ? "s" : ""}`}
                {s.key === "costing" && `${costingProducts.filter((p) => p.hasCosting).length}/${costingProducts.length} costed`}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  const content = (
    <>
      {active === "products" && <ProductsTable products={products} />}
      {active === "materials" && <MaterialsTable materials={materials} />}
      {active === "costing" && (
        <CostingPageClient products={costingProducts} materials={materials} />
      )}
    </>
  );

  return (
    <>
      {/* ── Mobile: tab layout ── */}
      <div className="flex h-[calc(100dvh-8rem)] flex-col md:hidden">
        {/* Tab bar */}
        <div className="flex shrink-0 border-b border-brand-border/30 glass-heavy">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={[
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-semibold transition-colors",
                active === s.key
                  ? "border-b-2 border-brand-primary text-brand-primary"
                  : "text-gray-500",
              ].join(" ")}
            >
              <span className="text-base leading-none">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto bg-brand-bg p-4 pb-20">
          {content}
        </div>
      </div>

      {/* ── Desktop: two-column layout ── */}
      <div className="hidden md:flex h-[calc(100dvh-8rem)] divide-x divide-gray-200 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-64 shrink-0 overflow-y-auto bg-brand-bg p-4">
          <h2 className="mb-4 text-lg font-bold text-brand-text">Inventory</h2>
          {sidebarCards}
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto bg-brand-bg p-6 pb-20">
          <div className="mx-auto max-w-3xl">
            {content}
          </div>
        </div>
      </div>
    </>
  );
}
