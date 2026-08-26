import { useRef } from "react";

interface ImageUploaderProps {
  onSelect: (file: File) => void;
  onTakePhoto: () => void;
  disabled?: boolean;
}

export function ImageUploader({
  onSelect,
  onTakePhoto,
  disabled,
}: ImageUploaderProps) {
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleFile = (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = "";
    if (file) onSelect(file);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.currentTarget)}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={onTakePhoto}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 active:scale-[0.98] disabled:opacity-50"
      >
        <span aria-hidden>📷</span> Take Photo
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => uploadRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-lg font-semibold text-neutral-800 shadow-sm transition hover:border-violet-300 hover:text-violet-700 active:scale-[0.98] disabled:opacity-50"
      >
        <span aria-hidden>🖼️</span> Upload Image
      </button>
    </div>
  );
}
