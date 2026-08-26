interface CoffeeMakerArtProps {
  size?: number;
}

/** Line-art espresso machine shown inside the capture viewfinder. */
export function CoffeeMakerArt({ size = 150 }: CoffeeMakerArtProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      stroke="#5d99c4"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Espresso machine"
      role="img"
    >
      {/* body */}
      <rect x="22" y="18" width="76" height="26" rx="6" />
      <rect x="30" y="44" width="60" height="10" rx="3" />
      {/* group head + portafilter */}
      <path d="M52 54v8h16v-8" />
      <path d="M48 62h24" />
      <path d="M60 62v7" />
      {/* cup */}
      <path d="M50 84h20v8a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8v-8Z" />
      <path d="M70 86h5a5 5 0 0 1 0 10h-5" />
      {/* drip tray / base */}
      <rect x="26" y="102" width="68" height="8" rx="4" />
      {/* dial + steam wand */}
      <circle cx="34" cy="31" r="6" />
      <path d="M92 44l8 14" />
      {/* steam */}
      <path d="M57 72c-1.5 2 1.5 3.5 0 5.5" opacity="0.7" />
      <path d="M64 72c-1.5 2 1.5 3.5 0 5.5" opacity="0.7" />
    </svg>
  );
}
