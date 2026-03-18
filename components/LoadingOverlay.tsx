"use client";

export default function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin" />
        </div>
        <p className="text-white/80 text-lg">
          {message || "Capturing page..."}
        </p>
        <p className="text-white/40 text-sm mt-2">
          This may take a few seconds
        </p>
      </div>
    </div>
  );
}
