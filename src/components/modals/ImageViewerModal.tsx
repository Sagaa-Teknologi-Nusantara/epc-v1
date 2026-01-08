"use client";

import { useEffect, useCallback } from "react";
import { Icons } from "@/components/ui/Icons";

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageTitle?: string;
  imageAlt?: string;
}

export function ImageViewerModal({
  isOpen,
  onClose,
  imageSrc,
  imageTitle,
  imageAlt,
}: ImageViewerModalProps) {
  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  // Download image
  const handleDownload = async () => {
    try {
      // For base64 data URLs
      if (imageSrc.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = imageSrc;
        link.download = `${imageTitle || "image"}_${
          new Date().toISOString().split("T")[0]
        }.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For regular URLs, fetch and download
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${imageTitle || "image"}_${
          new Date().toISOString().split("T")[0]
        }.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download image");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="relative max-h-[90vh] max-w-[90vw] rounded-2xl bg-white p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            {imageTitle || "Image Preview"}
          </h3>
          <div className="flex items-center gap-2">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
            >
              <Icons.Download className="h-4 w-4" />
              Download
            </button>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="overflow-auto rounded-xl bg-slate-100 p-2">
          <img
            src={imageSrc}
            alt={imageAlt || imageTitle || "Preview"}
            className="max-h-[75vh] max-w-full rounded-lg object-contain mx-auto"
          />
        </div>

        {/* Footer hint */}
        <p className="mt-3 text-center text-xs text-slate-400">
          Press{" "}
          <kbd className="rounded bg-slate-200 px-1.5 py-0.5 font-mono">
            Esc
          </kbd>{" "}
          or click outside to close
        </p>
      </div>
    </div>
  );
}
