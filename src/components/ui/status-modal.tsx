"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import Link from "next/link";
import { ReactNode } from "react";
import { AlertCircle, Check, X } from "lucide-react";

interface StatusModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  status: "success" | "failed" | "reject";
  title: ReactNode;
  description: ReactNode;
  actionLabel: string;
  cancelLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  children?: ReactNode;
  isLoading?: boolean;
}

export function StatusModal({
  isOpen,
  onOpenChange,
  status,
  title,
  description,
  actionLabel,
  cancelLabel = "Batal",
  actionHref,
  onAction,
  children,
  isLoading,
}: StatusModalProps) {
  if (status === "reject") {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-8 overflow-hidden bg-white rounded-2xl border-none shadow-2xl flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C83030] rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle size={24} className="text-[#C83030] fill-white" />
            </div>
            <h3 className="text-[22px] font-bold text-slate-900 leading-tight">
              {title}
            </h3>
          </div>

          <div className="text-slate-600 text-[15px] leading-relaxed">
            {description}
          </div>

          {children && (
            <div className="w-full">
              {children}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="px-6 py-2.5 text-slate-700 font-bold text-sm hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                if (onAction) onAction();
                else onOpenChange(false);
              }}
              disabled={isLoading}
              className="px-6 py-2.5 bg-[#99BD4A] hover:bg-[#88ab3d] text-white rounded-lg font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? "Memproses..." : actionLabel}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isSuccess = status === "success";

  const borderColor = isSuccess ? "border-[#D5E4A6]" : "border-red-300";
  const bgCircleColor = isSuccess ? "bg-[#F4F7F4]" : "bg-red-50";
  const innerCircleColor = isSuccess ? "bg-[#99BD4A]" : "bg-red-500";
  const buttonColor = isSuccess
    ? "bg-[#99BD4A] hover:bg-[#87A840]"
    : "bg-red-500 hover:bg-red-600";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={`sm:max-w-[450px] p-8 overflow-hidden bg-white rounded-[24px] border-0 border-b-[12px] ${borderColor} shadow-2xl flex flex-col items-center text-center`}
      >
        <div
          className={`w-24 h-24 ${bgCircleColor} rounded-full flex items-center justify-center mb-4 mt-2`}
        >
          <div
            className={`w-14 h-14 ${innerCircleColor} rounded-full flex items-center justify-center shadow-md`}
          >
            {isSuccess ? (
              <Check size={28} className="text-white" strokeWidth={3} />
            ) : (
              <X size={28} className="text-white" strokeWidth={3} />
            )}
          </div>
        </div>

        <h3 className="text-[22px] font-extrabold text-[#0F172A] mb-3 leading-tight">
          {title}
        </h3>

        <div className="text-[#6B7280] text-[15px] leading-relaxed mb-8 px-2">
          {description}
        </div>

        {actionHref ? (
          <Link
            href={actionHref}
            onClick={(e) => {
              if (isLoading) e.preventDefault();
              else if (onAction) onAction();
              else onOpenChange(false);
            }}
            className={`w-full py-4 ${buttonColor} text-white rounded-xl font-bold text-[16px] transition-colors shadow-sm flex items-center justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? "Memproses..." : actionLabel}
          </Link>
        ) : (
          <button
            disabled={isLoading}
            onClick={() => {
              if (onAction) onAction();
              else onOpenChange(false);
            }}
            className={`w-full py-4 ${buttonColor} text-white rounded-xl font-bold text-[16px] transition-colors shadow-sm flex items-center justify-center disabled:opacity-50`}
          >
            {isLoading ? "Memproses..." : actionLabel}
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
