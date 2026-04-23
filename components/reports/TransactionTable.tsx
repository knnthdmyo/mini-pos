"use client";

import { useState } from "react";
import type { TransactionRow } from "@/lib/actions/reports";

interface Props {
  transactions: TransactionRow[];
}

function formatPHP(value: number) {
  return `₱${value.toFixed(2)}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TransactionTable({ transactions }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (transactions.length === 0) {
    return (
      <p className="rounded-xl bg-white border border-gray-100 px-4 py-6 text-center text-sm text-gray-400">
        No transactions in this period.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-700">Transactions</h2>
      </div>

      <ul className="divide-y divide-gray-50">
        {transactions.map((tx) => {
          const isOpen = expandedIds.has(tx.id);
          return (
            <li key={tx.id}>
              {/* Summary row */}
              <button
                onClick={() => toggle(tx.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                {/* Chevron */}
                <span
                  className={[
                    "flex-shrink-0 text-gray-400 transition-transform",
                    isOpen ? "rotate-90" : "",
                  ].join(" ")}
                >
                  ›
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      {tx.order_number}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(tx.completed_at)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-gray-500">
                      {tx.items
                        .map((i) =>
                          i.variant_name
                            ? `${i.product_name} (${i.variant_name})`
                            : i.product_name,
                        )
                        .join(", ")}
                    </span>
                    <span className="flex-shrink-0 text-sm font-semibold text-gray-900">
                      {formatPHP(tx.total_price)}
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded item breakdown */}
              {isOpen && (
                <div className="border-t border-gray-50 bg-gray-50/60 px-4 pb-3 pt-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-400">
                        <th className="pb-1 text-left font-medium">Item</th>
                        <th className="pb-1 text-right font-medium">Qty</th>
                        <th className="pb-1 text-right font-medium">Price</th>
                        <th className="pb-1 text-right font-medium">Sub</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tx.items.map((item, i) => (
                        <tr key={i} className="text-gray-700">
                          <td className="py-1">
                            {item.variant_name
                              ? `${item.product_name} (${item.variant_name})`
                              : item.product_name}
                          </td>
                          <td className="py-1 text-right">{item.quantity}</td>
                          <td className="py-1 text-right">
                            {formatPHP(item.unit_price)}
                          </td>
                          <td className="py-1 text-right">
                            {formatPHP(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-2 space-y-0.5 border-t border-gray-200 pt-2 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span className="font-semibold text-gray-800">
                        {formatPHP(tx.total_price)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Received</span>
                      <span>{formatPHP(tx.amount_received)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Change</span>
                      <span>
                        {formatPHP(tx.change_amount)}
                        {tx.change_given ? "" : " (not given)"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
