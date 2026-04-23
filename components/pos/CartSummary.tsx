"use client";

interface CartLine {
  productId: string;
  variantId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface CartSummaryProps {
  lines: CartLine[];
  onSetQuantity: (
    productId: string,
    quantity: number,
    variantId?: string | null,
  ) => void;
  onRemove: (productId: string, variantId?: string | null) => void;
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
      <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-brand-border/50 text-sm text-brand-muted">
        Tap a product to add it
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass overflow-hidden shadow-sm">
      <ul className="divide-y divide-brand-border/30">
        {lines.map((line) => {
          const key = line.variantId
            ? `${line.productId}::${line.variantId}`
            : line.productId;
          return (
            <li
              key={key}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="font-medium text-brand-text">{line.name}</p>
                <p className="text-sm text-brand-muted">
                  ₱{line.unitPrice.toFixed(2)} × {line.quantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-brand-text">
                  ₱{(line.unitPrice * line.quantity).toFixed(2)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (line.quantity <= 1)
                        onRemove(line.productId, line.variantId);
                      else
                        onSetQuantity(
                          line.productId,
                          line.quantity - 1,
                          line.variantId,
                        );
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-border/50 text-brand-muted hover:border-brand-primary/40 hover:text-brand-text active:bg-brand-primary/10 transition-colors text-base leading-none"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm font-medium tabular-nums text-brand-text">
                    {line.quantity}
                  </span>
                  <button
                    onClick={() =>
                      onSetQuantity(
                        line.productId,
                        line.quantity + 1,
                        line.variantId,
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-border/50 text-brand-muted hover:border-brand-primary/40 hover:text-brand-text active:bg-brand-primary/10 transition-colors text-base leading-none"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemove(line.productId, line.variantId)}
                    className="ml-1 text-brand-muted/50 hover:text-red-500 transition-colors text-lg leading-none"
                    aria-label={`Remove ${line.name}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between border-t border-brand-border/30 bg-brand-surface/40 px-4 py-3">
        <span className="text-lg font-bold text-brand-text">
          Total: ₱{total.toFixed(2)}
        </span>
        <button
          onClick={onClear}
          className="text-sm text-brand-muted hover:text-red-500 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
