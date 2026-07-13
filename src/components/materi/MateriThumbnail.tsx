// Thumbnail preview mini-spreadsheet/dokumen, konsisten dengan gaya ikon SVG
// inline yang sudah dipakai di ToolIcon.tsx (bukan gambar raster/screenshot).
const EXCEL_GREEN = "#107C41";
const WORD_BLUE = "#185ABD";

export function MateriThumbnail({ format }: { format: "xlsx" | "docx" }) {
  const color = format === "xlsx" ? EXCEL_GREEN : WORD_BLUE;

  return (
    <svg viewBox="0 0 160 116" width="100%" height="100%" role="img" aria-hidden="true">
      <rect x="0.5" y="0.5" width="159" height="115" rx="10" fill="#fff" stroke="#e5e7eb" />

      {format === "xlsx" ? (
        <>
          <rect x="10" y="10" width="140" height="16" rx="3" fill={color} />
          {Array.from({ length: 4 }).map((_, r) => (
            <g key={r}>
              {Array.from({ length: 5 }).map((_, c) => (
                <rect
                  key={c}
                  x={10 + c * 28}
                  y={30 + r * 15}
                  width={26}
                  height={13}
                  fill={(r + c) % 2 === 0 ? "#f0fdf4" : "#ffffff"}
                  stroke="#d1fae5"
                  strokeWidth={1}
                />
              ))}
            </g>
          ))}
        </>
      ) : (
        <>
          <rect x="20" y="12" width="120" height="8" rx="2" fill={color} />
          <rect x="20" y="26" width="90" height="5" rx="1.5" fill="#e5e7eb" />
          <rect x="20" y="36" width="120" height="5" rx="1.5" fill="#e5e7eb" />
          <rect x="20" y="46" width="100" height="5" rx="1.5" fill="#e5e7eb" />
          <rect x="20" y="60" width="120" height="30" rx="3" fill="#fff" stroke={color} strokeWidth={1.5} />
          <line x1="20" x2="140" y1="70" y2="70" stroke="#eef2f7" strokeWidth={1} />
          <line x1="20" x2="140" y1="80" y2="80" stroke="#eef2f7" strokeWidth={1} />
          <line x1="66" x2="66" y1="60" y2="90" stroke="#eef2f7" strokeWidth={1} />
        </>
      )}

      <rect x="98" y="94" width="52" height="18" rx="4" fill={color} />
      <text x="124" y="106.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">
        {format.toUpperCase()}
      </text>
    </svg>
  );
}
