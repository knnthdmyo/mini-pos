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

  return (
    <div
      role="alert"
      className={[
        "fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-medium shadow-lg backdrop-blur-md",
        type === "error" ? "bg-red-600/90 text-white" : "bg-green-600/90 text-white",
      ].join(" ")}
    >
      {message}
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
