import { useEffect, useRef, useState } from "react";

type CameraStatus = "starting" | "ready" | "error";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

function cameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Camera access was denied. Allow camera permission, or use your device camera instead.";
    }
    if (error.name === "NotFoundError") {
      return "No camera was found on this device.";
    }
  }
  return "We couldn't open the camera on this device.";
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<CameraStatus>("starting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMessage(
          "This browser can't open the camera directly. Use your device camera instead.",
        );
        setStatus("error");
        return;
      }
      // Prefer the rear camera; fall back to any camera (laptops, webcams).
      const acquire = () =>
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: "environment" }, audio: false })
          .catch(() =>
            navigator.mediaDevices.getUserMedia({ video: true, audio: false }),
          );

      try {
        let stream: MediaStream;
        try {
          stream = await acquire();
        } catch (firstError: unknown) {
          // Transient failures happen when another acquisition is still being
          // released (e.g. remounts); permission denials shouldn't be retried.
          if (
            firstError instanceof DOMException &&
            firstError.name === "NotAllowedError"
          ) {
            throw firstError;
          }
          await new Promise((resolve) => setTimeout(resolve, 400));
          stream = await acquire();
        }
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("ready");
      } catch (error: unknown) {
        if (!cancelled) {
          setErrorMessage(cameraErrorMessage(error));
          setStatus("error");
        }
      }
    };

    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const handleShutter = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopStream();
        onCapture(new File([blob], "photo.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  const handleFallbackFile = (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = "";
    if (file) {
      stopStream();
      onCapture(file);
    }
  };

  if (status === "error") {
    return (
      <div className="animate-fade-up flex flex-col items-center gap-6 text-center">
        <input
          ref={fallbackInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFallbackFile(e.currentTarget)}
        />
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-3xl">
          📷
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Camera unavailable</h2>
          <p className="mx-auto mt-2 max-w-xs text-neutral-500">{errorMessage}</p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={() => fallbackInputRef.current?.click()}
            className="rounded-2xl bg-violet-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 active:scale-[0.98]"
          >
            Use device camera
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-2xl border border-neutral-200 bg-white px-6 py-3.5 font-semibold text-neutral-700 transition hover:border-neutral-300 active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up flex flex-col items-center gap-6">
      <div className="relative w-full overflow-hidden rounded-3xl bg-neutral-900 shadow-xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-[3/4] w-full object-cover"
        />
        {status === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white" />
            <p className="text-sm font-medium">Opening camera…</p>
          </div>
        )}
        <button
          type="button"
          aria-label="Close camera"
          onClick={handleClose}
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
        >
          ✕
        </button>
        {/* Framing guides */}
        <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-white/25" />
      </div>

      <button
        type="button"
        aria-label="Take photo"
        onClick={handleShutter}
        disabled={status !== "ready"}
        className="flex h-18 w-18 items-center justify-center rounded-full border-4 border-neutral-300 bg-white shadow-lg transition active:scale-95 disabled:opacity-40"
      >
        <span className="h-13 w-13 rounded-full bg-violet-600 transition hover:bg-violet-500" />
      </button>
    </div>
  );
}
