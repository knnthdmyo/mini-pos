"use client";

import { useState } from "react";
import { adjustStock } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/Button";

interface StockAdjustFormProps {
  ingredientId: string;
}

export function StockAdjustForm({ ingredientId }: StockAdjustFormProps) {
  const [delta, setDelta] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numDelta = parseFloat(delta);
    if (isNaN(numDelta) || numDelta === 0) {
      setFeedback({ type: "error", message: "Enter a non-zero amount." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await adjustStock(ingredientId, numDelta, notes.trim() || undefined);
      setDelta("");
      setNotes("");
      setFeedback({ type: "success", message: "Stock adjusted." });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Adjust qty (+ or −)</label>
        <input
          type="number"
          step="0.01"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          placeholder="e.g. -5 or +20"
          className="w-28 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
        <label className="text-xs text-gray-500">Note (optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reason…"
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-400 focus:outline-none"
        />
      </div>
      <Button type="submit" variant="secondary" size="sm" disabled={saving}>
        {saving ? "…" : "Adjust"}
      </Button>
      {feedback && (
        <p
          className={[
            "w-full text-xs",
            feedback.type === "success" ? "text-green-600" : "text-red-600",
          ].join(" ")}
        >
          {feedback.message}
        </p>
      )}
    </form>
  );
}
