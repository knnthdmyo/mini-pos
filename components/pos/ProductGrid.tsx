"use client";

interface Product {
  id: string;
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
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onAdd(product)}
          className="flex min-h-[80px] flex-col items-center justify-center rounded-2xl border-2 border-gray-200 bg-white p-4 text-center shadow-sm transition-all active:scale-95 active:border-indigo-400 active:bg-indigo-50 hover:border-indigo-300 hover:shadow"
        >
          <span className="text-base font-semibold text-gray-900 leading-tight">
            {product.name}
          </span>
          <span className="mt-1 text-sm font-medium text-indigo-600">
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
                    : "text-gray-400",
              ].join(" ")}
            >
              {product.servingsLeft === 0
                ? "Out of stock"
                : `${product.servingsLeft} left`}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
