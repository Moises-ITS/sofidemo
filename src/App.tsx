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
    <div className="stage">
      <div className="phone">
        <header className="app-header">
          <button
            type="button"
            className="brand"
            onClick={() => setPage("home")}
          >
            <span className="topbar-kicker">SoFi</span>
            <span className="topbar-title">SoFi It</span>
          </button>

          <nav className="tab-group">
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
        </header>

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
      </div>
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
      className={`tab-btn ${active ? "tab-btn--active" : ""}`}
    >
      {label}
      {badge !== undefined && <span className="tab-btn__badge">{badge}</span>}
    </button>
  );
}
