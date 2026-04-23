"use client";

import { useEffect, useRef } from "react";

interface ToastProps {
  message: string;
  type?: "error" | "success";
  onDismiss: () => void;
}

export function Toast({ message, type = "error", onDismiss }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  const styles =
    type === "error"
      ? "border-red-500/30 bg-red-500/20 text-red-800"
      : "border-green-500/30 bg-green-500/20 text-green-800";

  const icon = type === "error" ? "✕" : "✓";

  return (
    <div
      role="alert"
      className={[
        "fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-2xl border px-5 py-3 text-sm font-medium shadow-xl backdrop-blur-2xl",
        styles,
      ].join(" ")}
    >
      <span className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        {message}
      </span>
    </div>
  );
}

// Hook for managing toast state
import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "error" | "success" = "error") => {
      setToast({ message, type });
    },
    [],
  );

  const dismiss = useCallback(() => setToast(null), []);

  return { toast, showToast, dismiss };
}
