// Default company logo: circular emblem with a down arrow over waves,
// approximating the F.G.E. Ltd. mark in the reference figures.
// Swapped for project.logoDataUrl when the user uploads an image.

interface Props {
  cx: number
  cy: number
  r: number
  label: string
  logoDataUrl?: string
}

export function Logo({ cx, cy, r, label, logoDataUrl }: Props) {
  return (
    <g>
      {logoDataUrl ? (
        <image
          href={logoDataUrl}
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <g>
          <circle cx={cx} cy={cy} r={r} fill="black" />
          <circle cx={cx} cy={cy} r={r - 3} fill="white" />
          {/* down arrow */}
          <path
            d={`M ${cx - r * 0.16} ${cy - r * 0.75}
                h ${r * 0.32}
                v ${r * 0.55}
                h ${r * 0.28}
                l ${-r * 0.44} ${r * 0.5}
                l ${-r * 0.44} ${-r * 0.5}
                h ${r * 0.28} z`}
            fill="black"
          />
          {/* waves */}
          {[0.42, 0.6].map((f, i) => (
            <path
              key={i}
              d={`M ${cx - r * 0.7} ${cy + r * f}
                  q ${r * 0.18} ${-r * 0.14} ${r * 0.35} 0
                  q ${r * 0.18} ${r * 0.14} ${r * 0.35} 0
                  q ${r * 0.18} ${-r * 0.14} ${r * 0.35} 0
                  q ${r * 0.18} ${r * 0.14} ${r * 0.35} 0`}
              fill="none"
              stroke="black"
              strokeWidth={1.6}
            />
          ))}
        </g>
      )}
      <text x={cx} y={cy + r + 11} textAnchor="middle" fontSize={9} fontFamily="Arial, Helvetica, sans-serif">
        {label}
      </text>
    </g>
  )
}
