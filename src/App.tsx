import { useState } from "react";
import type { LibraryItem, Page } from "./types";
import {
  addLibraryItem,
  clearLibrary,
  getLibrary,
  removeLibraryItem,
  updateQuantity,
} from "./lib/library";
import { Home } from "./pages/Home";
import { Library } from "./pages/Library";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [items, setItems] = useState<LibraryItem[]>(() => getLibrary());

  const handleAdd = (item: LibraryItem) => {
    setItems((prev) => addLibraryItem(prev, item));
    setPage("library");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-neutral-200/70 bg-neutral-50/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-3">
          <button
            type="button"
            onClick={() => setPage("home")}
            className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-neutral-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-base shadow-sm">
              💎
            </span>
            Worth It
          </button>

          <nav className="flex gap-1 rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
            <TabButton
              label="Scan"
              active={page === "home"}
              onClick={() => setPage("home")}
            />
            <TabButton
              label="Library"
              active={page === "library"}
              onClick={() => setPage("library")}
              badge={items.length > 0 ? items.length : undefined}
            />
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {page === "home" ? (
          <Home onAddToLibrary={handleAdd} />
        ) : (
          <Library
            items={items}
            onQuantityChange={(id, quantity) =>
              setItems((prev) => updateQuantity(prev, id, quantity))
            }
            onRemove={(id) => setItems((prev) => removeLibraryItem(prev, id))}
            onClear={() => setItems(clearLibrary())}
            onGoHome={() => setPage("home")}
          />
        )}
      </main>
    </div>
  );
}

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

function TabButton({ label, active, onClick, badge }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-violet-600 text-white shadow-sm"
          : "text-neutral-500 hover:text-neutral-800"
      }`}
    >
      {label}
      {badge !== undefined && (
        <span
          className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
            active ? "bg-white/20 text-white" : "bg-violet-100 text-violet-700"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
