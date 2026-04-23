"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

interface ImageUploadProps {
  userId: string;
  currentUrl: string | null;
  onUpload: (url: string | null) => void;
  onError?: (message: string) => void;
}

export default function ImageUpload({
  userId,
  currentUrl,
  onUpload,
  onError,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.("Only JPEG, PNG, and WebP images are allowed.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      onError?.("Image must be 2 MB or smaller.");
      return;
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const filePath = `${userId}/banner.${ext}`;

      // Delete existing files in the user's folder to prevent orphans
      const { data: existing } = await supabase.storage
        .from("store-banners")
        .list(userId);

      if (existing && existing.length > 0) {
        const toRemove = existing.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from("store-banners").remove(toRemove);
      }

      const { error: uploadError } = await supabase.storage
        .from("store-banners")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        onError?.("Upload failed. You can still save without a banner.");
        setPreview(currentUrl);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("store-banners").getPublicUrl(filePath);

      // Append cache-bust to ensure fresh image
      onUpload(publicUrl + "?t=" + Date.now());
    } catch {
      onError?.("Upload failed. You can still save without a banner.");
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview(null);
    onUpload(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Store Banner (optional)
      </label>

      {preview && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Banner preview"
            className="h-32 w-full rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
            aria-label="Remove banner"
          >
            ✕
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        disabled={uploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
      />

      {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
    </div>
  );
}
