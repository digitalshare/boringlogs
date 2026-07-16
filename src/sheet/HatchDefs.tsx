// SVG <pattern> definitions for the graphic soil column.
// Referenced by id from domain/uscs.ts.

export function HatchDefs() {
  return (
    <defs>
      {/* Diagonal hatch — silts (ML/MH) and fill */}
      <pattern id="hatch-diag" width={6} height={6} patternUnits="userSpaceOnUse">
        <rect width={6} height={6} fill="white" />
        <path d="M -1 5 L 5 -1 M 1 7 L 7 1" stroke="black" strokeWidth={0.7} />
      </pattern>

      {/* Dense cross-diagonal — clays (CL/CH) */}
      <pattern id="hatch-diag-dense" width={5} height={5} patternUnits="userSpaceOnUse">
        <rect width={5} height={5} fill="white" />
        <path d="M -1 4 L 4 -1 M 0 6 L 6 0 M -1 1 L 1 -1" stroke="black" strokeWidth={0.6} />
      </pattern>

      {/* Fine stipple — well/poorly graded sands (SW, SP, SW-SM) */}
      <pattern id="hatch-stipple-fine" width={8} height={8} patternUnits="userSpaceOnUse">
        <rect width={8} height={8} fill="white" />
        <circle cx={2} cy={2} r={0.5} fill="black" />
        <circle cx={6} cy={5} r={0.5} fill="black" />
        <circle cx={4} cy={7} r={0.4} fill="black" />
      </pattern>

      {/* Dense stipple — silty/clayey sands (SM, SC) */}
      <pattern id="hatch-stipple-dense" width={7} height={7} patternUnits="userSpaceOnUse">
        <rect width={7} height={7} fill="white" />
        <circle cx={1.5} cy={1.5} r={0.55} fill="black" />
        <circle cx={5} cy={3} r={0.55} fill="black" />
        <circle cx={3} cy={5.5} r={0.55} fill="black" />
        <circle cx={6.2} cy={6.4} r={0.45} fill="black" />
      </pattern>

      {/* Gravel — dots plus small angular shapes (GW, GP, GM, GC) */}
      <pattern id="hatch-gravel" width={12} height={12} patternUnits="userSpaceOnUse">
        <rect width={12} height={12} fill="white" />
        <circle cx={3} cy={3} r={1.1} fill="none" stroke="black" strokeWidth={0.6} />
        <path d="M 8 7 l 2.4 1 l -1 1.8 l -1.8 -0.8 z" fill="none" stroke="black" strokeWidth={0.6} />
        <circle cx={9.5} cy={2.5} r={0.5} fill="black" />
        <circle cx={4.5} cy={9.5} r={0.5} fill="black" />
      </pattern>

      {/* Weathered / bedded rock — broken horizontal lines (WH) */}
      <pattern id="hatch-rock" width={12} height={6} patternUnits="userSpaceOnUse">
        <rect width={12} height={6} fill="white" />
        <path d="M 0 1.5 H 8 M 10 1.5 H 12 M 0 4.5 H 3 M 5 4.5 H 12" stroke="black" strokeWidth={0.7} />
      </pattern>

      {/* Pavement / surface cap — solid dark diagonal wedge */}
      <pattern id="hatch-cap" width={4} height={4} patternUnits="userSpaceOnUse">
        <rect width={4} height={4} fill="white" />
        <path d="M -1 3 L 3 -1 M 0 5 L 5 0 M 2 6 L 6 2" stroke="black" strokeWidth={1.4} />
      </pattern>
    </defs>
  )
}
