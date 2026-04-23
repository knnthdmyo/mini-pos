"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface PaymentModalProps {
  total: number;
  onConfirm: (amountReceived: number, changeAmount: number, changeGiven: boolean) => void;
  onCancel: () => void;
}

export function PaymentModal({ total, onConfirm, onCancel }: PaymentModalProps) {
  const [input, setInput] = useState("");
  const amount = parseFloat(input) || 0;
  const change = amount - total;
  const isValid = amount >= total && input.length > 0;

  function handleConfirm(giveNow: boolean) {
    onConfirm(amount, Math.max(change, 0), giveNow);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-xl mx-0 sm:mx-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Payment</h2>

        {/* Order total */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">Order Total</span>
          <span className="text-xl font-bold text-gray-900">₱{total.toFixed(2)}</span>
        </div>

        {/* Amount received input */}
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Amount Received
        </label>
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₱</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            placeholder="0.00"
            className="w-full rounded-xl border border-gray-300 py-3 pl-8 pr-4 text-lg font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Change display */}
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 mb-6">
          <span className="text-sm text-gray-500">Change</span>
          <span
            className={[
              "text-xl font-bold",
              change >= 0 ? "text-green-600" : "text-red-500",
            ].join(" ")}
          >
            ₱{change >= 0 ? change.toFixed(2) : "—"}
          </span>
        </div>

        {/* Validation error */}
        {input.length > 0 && !isValid && (
          <p className="text-sm text-red-500 mb-4">
            Amount received must be at least ₱{total.toFixed(2)}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {change > 0 ? (
            <>
              <Button
                variant="primary"
                size="lg"
                disabled={!isValid}
                onClick={() => handleConfirm(true)}
                className="w-full"
              >
                Give Change Now (₱{change.toFixed(2)})
              </Button>
              <Button
                variant="secondary"
                size="lg"
                disabled={!isValid}
                onClick={() => handleConfirm(false)}
                className="w-full"
              >
                Give Change Later
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="lg"
              disabled={!isValid}
              onClick={() => handleConfirm(true)}
              className="w-full"
            >
              Confirm
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
