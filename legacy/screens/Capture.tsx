import { useEffect, useRef, useState } from "react";
import { PRODUCT, formatMoney } from "../data";
import { CoffeeMakerArt } from "../components/CoffeeMakerArt";

const RECOGNITION_DELAY_MS = 2600;

/** "live" = real camera feed; "fallback" = permission denied / no camera. */
type CameraState = "starting" | "live" | "fallback";

interface CaptureProps {
  onClose: () => void;
  onStartVault: () => void;
}

export function Capture({ onClose, onStartVault }: CaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<CameraState>("starting");
  const [recognized, setRecognized] = useState(false);

  // Open the device camera (asks the browser for permission). No frames leave
  // the page — the feed is only rendered; recognition below stays simulated.
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera API unavailable");
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCamera("live");
      } catch {
        if (!cancelled) setCamera("fallback");
      }
    };

    void start();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Fake agentic recognition: fires after a beat once the viewfinder is up,
  // whether that's the real feed or the demo fallback.
  useEffect(() => {
    if (camera === "starting") return;
    const timer = window.setTimeout(
      () => setRecognized(true),
      RECOGNITION_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [camera]);

  return (
    <div className="screen capture-screen">
      <div className="topbar">
        <button className="icon-btn" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        <div className="topbar-title" style={{ textAlign: "center" }}>
          SoFi It
        </div>
        <button className="icon-btn" aria-label="Flash">
          ⚡
        </button>
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
          style={{ display: camera === "live" ? "block" : "none" }}
        />

        <span className="viewfinder__corner viewfinder__corner--tl" />
        <span className="viewfinder__corner viewfinder__corner--tr" />
        <span className="viewfinder__corner viewfinder__corner--bl" />
        <span className="viewfinder__corner viewfinder__corner--br" />

        {camera === "starting" && (
          <div className="camera-status">
            <div className="spinner" />
            <span className="muted small">Waiting for camera access…</span>
          </div>
        )}

        {camera === "fallback" && (
          <div className="camera-status">
            <CoffeeMakerArt />
            <span className="pill pill--muted">
              Camera unavailable · demo mode
            </span>
          </div>
        )}

        {camera !== "starting" && !recognized && <div className="scan-line" />}

        {recognized && (
          <div className="product-chip">
            <div className="vault-icon" style={{ width: 34, height: 34 }}>
              🔍
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {PRODUCT.name}
              </div>
              <div className="muted small">
                Best price{" "}
                <span className="tone-cyan" style={{ fontWeight: 700 }}>
                  {formatMoney(PRODUCT.bestPrice)}
                </span>{" "}
                · {formatMoney(PRODUCT.inStorePrice)} in store
              </div>
            </div>
          </div>
        )}
      </div>

      {recognized ? (
        <button className="btn btn--primary" onClick={onStartVault}>
          Start a Vault
        </button>
      ) : (
        <button className="btn btn--ghost" disabled>
          {camera === "starting" ? "Opening camera…" : "Scanning…"}
        </button>
      )}
    </div>
  );
}
