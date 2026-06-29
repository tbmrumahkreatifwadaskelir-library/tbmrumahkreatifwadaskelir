"use client";

import { X, Maximize, Minimize, FileText } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent } from "./dialog";

interface DigitalBookViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  title: string;
  onExpand?: () => void;
}

export function DigitalBookViewer({ isOpen, onClose, fileUrl, title, onExpand }: DigitalBookViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={`p-0 bg-white border-none shadow-2xl transition-all duration-300 ${
          isFullscreen 
            ? "w-[100vw] h-[100vh] max-w-none max-h-none rounded-none m-0 top-0 left-0 translate-x-0 translate-y-0" 
            : "w-[95vw] max-w-[1000px] h-[90vh] rounded-[24px]"
        }`}
        showCloseButton={false}
      >
        <div className="flex flex-col w-full h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#f4f7f0] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#99BD4A]" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-[16px] line-clamp-1">{title}</h3>
                <p className="text-[12px] font-medium text-slate-500">Membaca Dokumen Digital</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (onExpand) {
                    onExpand();
                  } else {
                    setIsFullscreen(!isFullscreen);
                  }
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title={onExpand ? "Baca di Layar Penuh" : isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
              >
                {!onExpand && isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* PDF Viewer Content */}
          <div className="flex-1 w-full bg-slate-100/50 relative">
            <iframe
              src={`${fileUrl}#toolbar=0`}
              className="w-full h-full border-none"
              title={title}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
