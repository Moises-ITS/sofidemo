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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.currentTarget)}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={onTakePhoto}
        className="btn btn--primary btn--glow"
      >
        <span aria-hidden>📷</span> SoFi It
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => uploadRef.current?.click()}
        className="btn btn--ghost"
      >
        <span aria-hidden>🖼️</span> Upload Image
      </button>
    </div>
  );
}
