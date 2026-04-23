"use client";

import { useState } from "react";
import type { Transaction } from "@/lib/actions/reports";

interface TransactionTableProps {
  transactions: Transaction[];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPHP(value: number | null | undefined) {
  if (value == null) return "—";
  return `₱${Number(value).toFixed(2)}`;
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400 py-4">
        No transactions for this period.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">Order</th>
            <th className="px-3 py-2 text-right">Items</th>
            <th className="px-3 py-2 text-right">Total</th>
            <th className="px-3 py-2 text-right">Received</th>
            <th className="px-3 py-2 text-right">Change</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isExpanded = expandedId === tx.id;
            const totalItems = tx.order_items.reduce(
              (sum, item) => sum + item.quantity,
              0,
            );
            const firstItem =
              tx.order_items[0]?.products?.name ?? "—";
            const label =
              tx.order_items.length > 1
                ? `${firstItem} +${tx.order_items.length - 1}`
                : firstItem;

            return (
              <tr key={tx.id} className="group">
                <td colSpan={6} className="p-0">
                  {/* Summary row */}
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : tx.id)
                    }
                    className="flex w-full items-center border-b border-gray-50 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex-1 grid grid-cols-6 gap-0 items-center">
                      <span className="text-gray-500 text-xs">
                        {formatTime(tx.completed_at)}
                      </span>
                      <span className="text-gray-800 font-medium truncate">
                        {label}
                      </span>
                      <span className="text-gray-600 text-right">
                        {totalItems}
                      </span>
                      <span className="text-gray-900 font-semibold text-right">
                        {formatPHP(tx.total_price)}
                      </span>
                      <span className="text-gray-600 text-right">
                        {formatPHP(tx.amount_received)}
                      </span>
                      <span className="text-gray-600 text-right">
                        {formatPHP(tx.change_amount)}
                      </span>
                    </span>
                    <svg
                      className={[
                        "ml-2 h-4 w-4 shrink-0 text-gray-400 transition-transform",
                        isExpanded ? "rotate-180" : "",
                      ].join(" ")}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400 uppercase tracking-wide">
                            <th className="pb-1 text-left font-medium">
                              Product
                            </th>
                            <th className="pb-1 text-right font-medium">
                              Qty
                            </th>
                            <th className="pb-1 text-right font-medium">
                              Price
                            </th>
                            <th className="pb-1 text-right font-medium">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {tx.order_items.map((item) => (
                            <tr
                              key={item.product_id}
                              className="text-gray-700"
                            >
                              <td className="py-0.5">
                                {item.products?.name}
                              </td>
                              <td className="py-0.5 text-right">
                                {item.quantity}
                              </td>
                              <td className="py-0.5 text-right">
                                {formatPHP(item.unit_price)}
                              </td>
                              <td className="py-0.5 text-right font-medium">
                                {formatPHP(
                                  item.unit_price * item.quantity,
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
