"use client";

import { Button } from "@/components/ui/Button";

interface PlaceOrderButtonProps {
  isEmpty: boolean;
  loading: boolean;
  onPlace: () => void;
  onCancel: () => void;
}

export function PlaceOrderButton({
  isEmpty,
  loading,
  onPlace,
  onCancel,
}: PlaceOrderButtonProps) {
  return (
    <div className="flex gap-3">
      <Button
        variant="secondary"
        size="lg"
        onClick={onCancel}
        disabled={isEmpty || loading}
        className="flex-1"
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        size="lg"
        onClick={onPlace}
        disabled={isEmpty || loading}
        className="flex-[2]"
      >
        {loading ? "Placing…" : "Place Order"}
      </Button>
    </div>
  );
}
