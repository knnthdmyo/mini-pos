"use client";

interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface CartSummaryProps {
  lines: CartLine[];
  onSetQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
}

export function CartSummary({
  lines,
  onSetQuantity,
  onRemove,
  onClear,
}: CartSummaryProps) {
  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  if (lines.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white text-sm text-gray-400">
        Tap a product to add it
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <ul className="divide-y divide-gray-100">
        {lines.map((line) => (
          <li
            key={line.productId}
            className="flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="font-medium text-gray-900">{line.name}</p>
              <p className="text-sm text-gray-500">
                ₱{line.unitPrice.toFixed(2)} × {line.quantity}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                ₱{(line.unitPrice * line.quantity).toFixed(2)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (line.quantity <= 1) onRemove(line.productId);
                    else onSetQuantity(line.productId, line.quantity - 1);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900 active:bg-gray-100 transition-colors text-base leading-none"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-5 text-center text-sm font-medium tabular-nums">
                  {line.quantity}
                </span>
                <button
                  onClick={() =>
                    onSetQuantity(line.productId, line.quantity + 1)
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900 active:bg-gray-100 transition-colors text-base leading-none"
                  aria-label="Increase quantity"
                >
                  +
                </button>
                <button
                  onClick={() => onRemove(line.productId)}
                  className="ml-1 text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                  aria-label={`Remove ${line.name}`}
                >
                  ×
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3">
        <span className="text-lg font-bold text-gray-900">
          Total: ₱{total.toFixed(2)}
        </span>
        <button
          onClick={onClear}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
