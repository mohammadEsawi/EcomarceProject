import React from "react";

export function Spinner({ size = "md", className = "" }) {
  const sz = { sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-10 w-10 border-[3px]" }[size];
  return (
    <div className={`${sz} rounded-full border-gray-200 border-t-gray-900 animate-spin ${className}`} />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );
}
