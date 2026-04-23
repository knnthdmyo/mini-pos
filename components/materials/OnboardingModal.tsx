"use client";

import { useState } from "react";
import MaterialForm from "@/components/materials/MaterialForm";
import { Button } from "@/components/ui/Button";
import { Toast, useToast } from "@/components/ui/Toast";

interface OnboardingModalProps {
  showOnboarding: boolean;
}

export default function OnboardingModal({
  showOnboarding,
}: OnboardingModalProps) {
  const [open, setOpen] = useState(showOnboarding);
  const [addedCount, setAddedCount] = useState(0);
  const { toast, showToast, dismiss } = useToast();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl glass-modal p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-bold text-brand-text">
          Welcome! Add your first materials
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Enter the ingredients or supplies you use to make your products. You
          can always add more later.
        </p>

        <MaterialForm
          onSuccess={() => {
            setAddedCount((c) => c + 1);
            showToast("Material added!", "success");
          }}
        />

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {addedCount} material{addedCount !== 1 ? "s" : ""} added
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={addedCount === 0}
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />
      )}
    </div>
  );
}
