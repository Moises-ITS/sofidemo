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
      <div className="screen">
        <input
          ref={fallbackInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => handleFallbackFile(e.currentTarget)}
        />
        <div className="center-state">
          <div className="center-state__badge center-state__badge--warn">📷</div>
          <div>
            <div className="capture-heading__title" style={{ fontSize: 20 }}>
              Camera unavailable
            </div>
            <p className="muted small" style={{ marginTop: 8, maxWidth: 260 }}>
              {errorMessage}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => fallbackInputRef.current?.click()}
        >
          Use device camera
        </button>
        <button type="button" className="btn btn--ghost" onClick={handleClose}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button
          type="button"
          className="icon-btn"
          aria-label="Close camera"
          onClick={handleClose}
        >
          ✕
        </button>
        <div className="topbar-title" style={{ textAlign: "center" }}>
          SoFi It
        </div>
        <span style={{ width: 34 }} aria-hidden />
      </div>

      <div className="capture-heading">
        <div className="kicker">Point it at a want</div>
      </div>

      <div className="viewfinder">
        <video
          ref={videoRef}
          className="viewfinder__video"
          autoPlay
          playsInline
          muted
        />

        <span className="viewfinder__corner viewfinder__corner--tl" />
        <span className="viewfinder__corner viewfinder__corner--tr" />
        <span className="viewfinder__corner viewfinder__corner--bl" />
        <span className="viewfinder__corner viewfinder__corner--br" />

        {status === "starting" && (
          <div className="camera-status">
            <div className="spinner" />
            <span className="muted small">Waiting for camera access…</span>
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label="Take photo"
        className="shutter"
        onClick={handleShutter}
        disabled={status !== "ready"}
      >
        <span className="shutter__dot" />
      </button>
    </div>
  );
}
