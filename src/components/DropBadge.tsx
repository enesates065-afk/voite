// Reusable drop badge for product cards
export function DropBadge({ dropNumber, seriesSlug }: { dropNumber: number; seriesSlug?: string }) {
  return (
    <div className="absolute top-0 right-0 z-20 overflow-hidden pointer-events-none">
      {/* Clipped corner badge */}
      <div
        className="relative"
        style={{
          width: 72,
          height: 72,
          clipPath: "polygon(100% 0, 100% 100%, 0 0)",
          background: "white",
        }}
      >
        {/* Diagonal text */}
        <div
          className="absolute inset-0 flex items-start justify-end pr-2 pt-1.5"
          style={{ transform: "rotate(0deg)" }}
        >
          <div
            style={{
              transform: "rotate(45deg) translateX(6px) translateY(-12px)",
              transformOrigin: "center center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 7,
                fontWeight: 900,
                letterSpacing: "0.3em",
                color: "#000",
                lineHeight: 1,
                textTransform: "uppercase",
                fontFamily: "inherit",
              }}
            >
              DROP
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: "#000",
                lineHeight: 1,
                fontFamily: "var(--font-heading, inherit)",
                letterSpacing: "0.05em",
              }}
            >
              {String(dropNumber).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stylized "DROP 01" text label for use in headers/cards
export function DropLabel({ dropNumber, seriesName }: { dropNumber: number; seriesName?: string }) {
  return (
    <div className="flex items-center gap-2">
      {seriesName && (
        <>
          <span className="text-[9px] uppercase tracking-[0.4em] text-white/30 font-light">
            {seriesName}
          </span>
          <span className="text-white/15 text-xs">—</span>
        </>
      )}
      <div className="flex items-baseline gap-1">
        <span
          className="text-[10px] uppercase font-black tracking-[0.3em] text-white/80"
          style={{ fontVariant: "all-small-caps" }}
        >
          Drop
        </span>
        <span
          className="font-mono font-black text-white"
          style={{ fontSize: 13, letterSpacing: "0.05em" }}
        >
          {String(dropNumber).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
