import { useEffect, useRef, useState } from "react";
import { ESPRESSO_PRODUCT, formatMoney, productFromApi } from "../data";
import type { Product } from "../types";
import { CoffeeMakerArt } from "../components/CoffeeMakerArt";

const FALLBACK_RECOGNITION_MS = 2600;
const API_TIMEOUT_MS = 25_000;
const MAX_FRAME_PX = 1024;
const JPEG_QUALITY = 0.82;

/** "live" = real camera feed; "fallback" = permission denied / no camera. */
type CameraState = "starting" | "live" | "fallback";
type ScanState = "idle" | "scanning" | "done";

interface CaptureProps {
  onClose: () => void;
  onStartVault: (product: Product) => void;
}

export function Capture({ onClose, onStartVault }: CaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<CameraState>("starting");
  const [scan, setScan] = useState<ScanState>("idle");
  const [product, setProduct] = useState<Product | null>(null);
  // Frozen frame shown while the agent identifies the photo — makes it clear
  // a single photo was captured, not a live feed.
  const [snapshot, setSnapshot] = useState<string | null>(null);

  // Open the device camera (asks the browser for permission).
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

  // No camera to snap from — recognition stays simulated on this path.
  useEffect(() => {
    if (camera !== "fallback") return;
    const timer = window.setTimeout(() => {
      setProduct(ESPRESSO_PRODUCT);
      setScan("done");
    }, FALLBACK_RECOGNITION_MS);
    return () => window.clearTimeout(timer);
  }, [camera]);

  // The fallback path "scans" for the duration of its timer.
  const scanning =
    scan === "scanning" || (camera === "fallback" && !product);

  // Grab a downscaled JPEG frame and send it to the recognition API.
  // Any failure (offline, no key, timeout) falls back to the demo product.
  const snap = async () => {
    const video = videoRef.current;
    if (!video || scan === "scanning") return;
    setScan("scanning");
    try {
      const w = video.videoWidth || 1;
      const h = video.videoHeight || 1;
      const scale = Math.min(1, MAX_FRAME_PX / Math.max(w, h));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      setSnapshot(dataUrl);
      const image = dataUrl.split(",")[1];

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      const res = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, media_type: "image/jpeg" }),
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      if (!res.ok) throw new Error(`recognition failed (${res.status})`);
      setProduct(productFromApi(await res.json()));
    } catch (err) {
      // Fall back to the canned demo product so the pitch flow never breaks.
      console.error("[recognize]", err);
      setProduct(ESPRESSO_PRODUCT);
    }
    setScan("done");
  };

  const retake = () => {
    setProduct(null);
    setSnapshot(null);
    setScan("idle");
  };

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
          style={{ display: camera === "live" && !snapshot ? "block" : "none" }}
        />

        {snapshot && (
          <img
            src={snapshot}
            className="viewfinder__video"
            alt="Captured photo"
          />
        )}

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

        {scanning && <div className="scan-line" />}

        {product && (
          <div className="product-chip">
            <div className="vault-icon" style={{ width: 34, height: 34 }}>
              {product.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {product.name}
              </div>
              <div className="muted small">
                Best price{" "}
                <span className="tone-cyan" style={{ fontWeight: 700 }}>
                  {formatMoney(product.bestPrice)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {product ? (
        <>
          <button
            className="btn btn--primary"
            onClick={() => onStartVault(product)}
          >
            Start a Vault
          </button>
          {camera === "live" && (
            <button className="link-btn" onClick={retake}>
              Retake
            </button>
          )}
        </>
      ) : camera === "live" && scan === "idle" ? (
        <button className="btn btn--primary" onClick={() => void snap()}>
          ◉ Snap it
        </button>
      ) : (
        <button className="btn btn--ghost" disabled>
          {camera === "starting"
            ? "Opening camera…"
            : scan === "scanning"
              ? "Identifying…"
              : "Scanning…"}
        </button>
      )}
    </div>
  );
}
