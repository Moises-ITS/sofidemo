import { useEffect, useRef, useState } from "react";
import type {
  LibraryItem,
  ProductIdentification,
  ProductSearchResult,
} from "../types";
import { analyzeImage, searchProduct } from "../lib/api";
import { compressForUpload, createThumbnail } from "../lib/image";
import { createLibraryItemId } from "../lib/library";
import { findDemoFallback } from "../data/demoFallbacks";
import { ImageUploader } from "../components/ImageUploader";
import { CameraCapture } from "../components/CameraCapture";
import { AnalysisLoading, type LoadingStage } from "../components/AnalysisLoading";
import { ProductResult } from "../components/ProductResult";

type Phase = "idle" | "camera" | "preview" | "loading" | "result" | "error";

interface AnalysisState {
  identification: ProductIdentification;
  candidates: ProductSearchResult[];
  usedFallback: boolean;
}

interface HomeProps {
  onAddToLibrary: (item: LibraryItem) => void;
}

const IDENTIFY_STAGE_DELAY_MS = 1500;

export function Home({ onAddToLibrary }: HomeProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stage, setStage] = useState<LoadingStage>("analyzing");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stageTimerRef = useRef(0);

  useEffect(() => () => window.clearTimeout(stageTimerRef.current), []);

  const reset = () => {
    window.clearTimeout(stageTimerRef.current);
    setPhase("idle");
    setPhotoUrl(null);
    setThumbUrl(null);
    setAnalysis(null);
    setErrorMessage(null);
  };

  const handleSelect = async (file: File) => {
    try {
      const [upload, thumb] = await Promise.all([
        compressForUpload(file),
        createThumbnail(file),
      ]);
      setPhotoUrl(upload);
      setThumbUrl(thumb);
      setAnalysis(null);
      setErrorMessage(null);
      setPhase("preview");
    } catch {
      setErrorMessage("We couldn't read that image. Try a different photo.");
      setPhase("error");
    }
  };

  const handleAnalyze = async (imageDataUrl: string) => {
    setPhase("loading");
    setStage("analyzing");
    stageTimerRef.current = window.setTimeout(
      () => setStage("identifying"),
      IDENTIFY_STAGE_DELAY_MS,
    );

    let identification: ProductIdentification;
    try {
      identification = await analyzeImage(imageDataUrl);
    } catch {
      window.clearTimeout(stageTimerRef.current);
      setErrorMessage(
        "We couldn't identify that item. Try a clearer, closer photo.",
      );
      setPhase("error");
      return;
    }

    window.clearTimeout(stageTimerRef.current);
    setStage("searching");

    let candidates: ProductSearchResult[] = [];
    let usedFallback = false;
    try {
      candidates = await searchProduct(identification.searchQuery);
    } catch {
      candidates = [];
    }

    if (candidates.length === 0) {
      const fallback = findDemoFallback(identification);
      if (fallback) {
        candidates = [fallback];
        usedFallback = true;
      }
    }

    if (candidates.length === 0) {
      setErrorMessage(
        `We identified "${identification.productName}" but couldn't find a current price. Please try again.`,
      );
      setPhase("error");
      return;
    }

    setAnalysis({ identification, candidates, usedFallback });
    setPhase("result");
  };

  const handleConfirm = (selected: ProductSearchResult) => {
    if (!analysis) return;
    const { identification } = analysis;
    const item: LibraryItem = {
      id: createLibraryItemId(),
      name: identification.brand &&
        !identification.productName
          .toLowerCase()
          .includes(identification.brand.toLowerCase())
        ? `${identification.brand} ${identification.productName}`
        : identification.productName,
      brand: identification.brand ?? undefined,
      model: identification.model ?? undefined,
      price: selected.price,
      quantity: 1,
      image: selected.imageUrl ?? thumbUrl ?? "",
      retailer: selected.retailer,
      addedAt: new Date().toISOString(),
    };
    onAddToLibrary(item);
    reset();
  };

  if (phase === "camera") {
    return (
      <CameraCapture
        onCapture={(file) => void handleSelect(file)}
        onClose={reset}
      />
    );
  }

  if (phase === "preview" && photoUrl) {
    return (
      <div className="screen">
        <div className="capture-heading">
          <div className="kicker">Ready to scan</div>
        </div>
        <div className="viewfinder">
          <img className="viewfinder__photo" src={photoUrl} alt="Selected item" />
          <span className="viewfinder__corner viewfinder__corner--tl" />
          <span className="viewfinder__corner viewfinder__corner--tr" />
          <span className="viewfinder__corner viewfinder__corner--bl" />
          <span className="viewfinder__corner viewfinder__corner--br" />
        </div>
        <button
          type="button"
          className="btn btn--primary btn--glow"
          onClick={() => void handleAnalyze(photoUrl)}
        >
          <span aria-hidden>🔍</span> Identify It
        </button>
        <button type="button" className="btn btn--ghost" onClick={reset}>
          Change Photo
        </button>
      </div>
    );
  }

  if (phase === "loading" && photoUrl) {
    return <AnalysisLoading stage={stage} imageUrl={photoUrl} />;
  }

  if (phase === "result" && analysis && photoUrl) {
    return (
      <ProductResult
        identification={analysis.identification}
        candidates={analysis.candidates}
        photoUrl={photoUrl}
        usedFallback={analysis.usedFallback}
        onConfirm={handleConfirm}
        onRetry={reset}
      />
    );
  }

  if (phase === "error") {
    return (
      <div className="screen">
        <div className="center-state">
          <div className="center-state__badge center-state__badge--warn">🤔</div>
          <div>
            <div className="capture-heading__title" style={{ fontSize: 20 }}>
              Hmm, that didn&apos;t work
            </div>
            <p className="muted small" style={{ marginTop: 8, maxWidth: 260 }}>
              {errorMessage ?? "Something went wrong. Please try again."}
            </p>
          </div>
        </div>
        <button type="button" className="btn btn--primary" onClick={reset}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="center-state">
        <div className="center-state__badge">📷</div>
        <div className="capture-heading">
          <div className="kicker">Point it at a want</div>
          <div className="capture-heading__title">What is it worth?</div>
          <p className="muted small" style={{ maxWidth: 260, margin: "0 auto" }}>
            Take a photo of an item and we&apos;ll identify it and find its
            current price.
          </p>
        </div>
      </div>
      <ImageUploader
        onSelect={(file) => void handleSelect(file)}
        onTakePhoto={() => setPhase("camera")}
      />
    </div>
  );
}
