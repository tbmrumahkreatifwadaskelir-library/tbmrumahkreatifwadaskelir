"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Camera, RotateCcw, Check, X } from "lucide-react";

interface CameraModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageDataUrl: string) => void;
}

export function CameraModal({ isOpen, onOpenChange, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setCapturedImage(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror the image (selfie mode)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden bg-white rounded-[20px] border-0 shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-3">
          <h2 className="text-[18px] font-extrabold text-[#0F172A]">
            Ambil Foto Profil
          </h2>
          <p className="text-[#64748b] text-[13px] font-medium mt-1">
            Posisikan wajah Anda di tengah frame
          </p>
        </div>

        {/* Camera View */}
        <div className="px-6 pb-4">
          <div className="relative w-full aspect-[4/3] bg-[#0F172A] rounded-2xl overflow-hidden">
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-white/80 text-[14px] font-medium">{error}</p>
              </div>
            ) : capturedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={capturedImage}
                alt="Foto yang diambil"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
                {/* Circular overlay guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 rounded-full border-[3px] border-white/40 border-dashed" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 flex items-center justify-center gap-4">
          {error ? (
            <button
              onClick={handleClose}
              className="px-6 py-3 border border-slate-200 text-[#334155] rounded-xl font-bold text-[14px] hover:bg-slate-50 transition-colors"
            >
              Tutup
            </button>
          ) : capturedImage ? (
            <>
              <button
                onClick={handleRetake}
                className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-[#334155] rounded-xl font-bold text-[14px] hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Ulangi
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-6 py-3 bg-[#99BD4A] hover:bg-[#87A840] text-white rounded-xl font-bold text-[14px] transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                Gunakan Foto
              </button>
            </>
          ) : (
            <button
              onClick={handleCapture}
              className="flex items-center gap-2 px-8 py-3 bg-[#99BD4A] hover:bg-[#87A840] text-white rounded-xl font-bold text-[14px] transition-colors shadow-sm"
            >
              <Camera className="w-5 h-5" />
              Ambil Foto
            </button>
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
