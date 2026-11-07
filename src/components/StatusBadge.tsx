import React from "react";
import { InvoiceStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: InvoiceStatus | string;
  size?: "sm" | "md" | "lg";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3 py-1.5 text-sm font-bold",
  };

  switch (status) {
    case "LUNAS":
      return (
        <span
          className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses[size]}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
          Lunas
        </span>
      );
    case "TERKIRIM":
      return (
        <span
          className={`inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses[size]}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
          Terkirim
        </span>
      );
    case "JATUH_TEMPO":
      return (
        <span
          className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses[size]}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
          Jatuh Tempo
        </span>
      );
    case "BATAL":
      return (
        <span
          className={`inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses[size]}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
          Dibatalkan
        </span>
      );
    case "DRAFT":
    default:
      return (
        <span
          className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses[size]}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          Draft
        </span>
      );
  }
}
