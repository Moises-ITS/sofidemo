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

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-8">
      {phase === "idle" && (
        <div className="animate-fade-up flex flex-col items-center gap-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 text-4xl shadow-lg shadow-violet-600/30">
            💎
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900">
              What is it worth?
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-neutral-500">
              Take a photo of an item and we&apos;ll identify it and find its
              current price.
            </p>
          </div>
          <ImageUploader
            onSelect={(file) => void handleSelect(file)}
            onTakePhoto={() => setPhase("camera")}
          />
        </div>
      )}

      {phase === "camera" && (
        <CameraCapture
          onCapture={(file) => void handleSelect(file)}
          onClose={reset}
        />
      )}

      {phase === "preview" && photoUrl && (
        <div className="animate-fade-up flex flex-col items-center gap-6">
          <div className="w-full overflow-hidden rounded-3xl shadow-xl">
            <img
              src={photoUrl}
              alt="Selected item"
              className="max-h-[26rem] w-full object-cover"
            />
          </div>
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-2xl border border-neutral-200 bg-white px-4 py-4 font-semibold text-neutral-700 transition hover:border-neutral-300 active:scale-[0.98]"
            >
              Change Photo
            </button>
            <button
              type="button"
              onClick={() => void handleAnalyze(photoUrl)}
              className="flex-[1.4] rounded-2xl bg-violet-600 px-4 py-4 font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 active:scale-[0.98]"
            >
              ✨ Identify It
            </button>
          </div>
        </div>
      )}

      {phase === "loading" && photoUrl && (
        <AnalysisLoading stage={stage} imageUrl={photoUrl} />
      )}

      {phase === "result" && analysis && photoUrl && (
        <ProductResult
          identification={analysis.identification}
          candidates={analysis.candidates}
          photoUrl={photoUrl}
          usedFallback={analysis.usedFallback}
          onConfirm={handleConfirm}
          onRetry={reset}
        />
      )}

      {phase === "error" && (
        <div className="animate-fade-up flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-3xl">
            🤔
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              Hmm, that didn&apos;t work
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-neutral-500">
              {errorMessage ?? "Something went wrong. Please try again."}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-2xl bg-violet-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 active:scale-[0.98]"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
