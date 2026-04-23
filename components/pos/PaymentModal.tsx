"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface PaymentModalProps {
  total: number;
  onConfirm: (payment: {
    amountReceived: number;
    changeAmount: number;
    changeGiven: boolean;
  }) => void;
  allowPayLater?: boolean;
  onCancel: () => void;
}

export function PaymentModal({ total, onConfirm, onCancel, allowPayLater = true }: PaymentModalProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const amountReceived = parseFloat(input) || 0;
  const change = amountReceived - total;
  const isValid = amountReceived >= total && input.trim() !== "";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleGiveNow() {
    if (!isValid) return;
    onConfirm({
      amountReceived,
      changeAmount: change,
      changeGiven: true,
    });
  }

  function handleGiveLater() {
    if (!isValid) return;
    onConfirm({
      amountReceived,
      changeAmount: change,
      changeGiven: false,
    });
  }

  function handlePayLater() {
    onConfirm({
      amountReceived: 0,
      changeAmount: 0,
      changeGiven: false,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl mx-4">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Payment</h2>
        <p className="text-sm text-gray-500 mb-4">
          Order total: <span className="font-semibold text-gray-900">₱{total.toFixed(2)}</span>
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount received
        </label>
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && isValid) handleGiveNow();
          }}
          placeholder="0.00"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-lg font-semibold tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />

        {input.trim() !== "" && (
          <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Change</span>
              <span
                className={[
                  "text-lg font-bold tabular-nums",
                  change >= 0 ? "text-green-600" : "text-red-600",
                ].join(" ")}
              >
                ₱{change.toFixed(2)}
              </span>
            </div>
            {change < 0 && (
              <p className="mt-1 text-xs text-red-500">
                Amount is less than the total
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {change === 0 ? (
            <Button
              variant="primary"
              size="md"
              onClick={handleGiveNow}
              disabled={!isValid}
              className="w-full"
            >
              Exact amount — Place order
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                size="md"
                onClick={handleGiveNow}
                disabled={!isValid}
                className="w-full"
              >
                Give change now
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleGiveLater}
                disabled={!isValid}
                className="w-full"
              >
                Give change later
              </Button>
            </>
          )}
          {allowPayLater && (
            <Button
              variant="secondary"
              size="md"
              onClick={handlePayLater}
              className="w-full"
            >
              Pay later
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
