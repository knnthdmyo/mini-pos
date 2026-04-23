"use client";

interface Product {
  id: string;
  variantId?: string | null;
  name: string;
  price: number;
  servingsLeft: number | null;
}

interface ProductGridProps {
  products: Product[];
  onAdd: (product: Product) => void;
}

export function ProductGrid({ products, onAdd }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 mb-5">
      {products.map((product) => {
        const key = product.variantId
          ? `${product.id}::${product.variantId}`
          : product.id;
        return (
          <button
            key={key}
            onClick={() => onAdd(product)}
            className="flex min-h-[80px] flex-col items-center justify-center rounded-2xl glass p-4 text-center shadow-sm transition-all active:scale-95 active:border-brand-primary/60 active:bg-brand-primary/10 hover:border-brand-primary/40 hover:shadow"
          >
            <span className="text-base font-semibold text-brand-text leading-tight">
              {product.name}
            </span>
            <span className="mt-1 text-sm font-semibold text-brand-text/70">
              ₱{product.price.toFixed(2)}
            </span>
            {product.servingsLeft !== null && (
              <span
                className={[
                  "mt-1 text-xs font-medium",
                  product.servingsLeft === 0
                    ? "text-red-500"
                    : product.servingsLeft <= 5
                      ? "text-amber-500"
                      : "text-brand-muted",
                ].join(" ")}
              >
                {product.servingsLeft === 0
                  ? "Out of stock"
                  : `${product.servingsLeft} left`}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
