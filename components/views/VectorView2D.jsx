'use client'
import { useEffect, useRef, useState } from 'react'
import KatexRender from '../KatexRender'

export default function VectorView2D({ data, explanation }) {
  const svgRef = useRef(null)
  const [size, setSize] = useState({ w: 400, h: 400 })

  const { vectors = [], operations = [] } = data || {}

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        setSize({ w: e.contentRect.width, h: e.contentRect.height })
      }
    })
    if (svgRef.current?.parentElement) obs.observe(svgRef.current.parentElement)
    return () => obs.disconnect()
  }, [])

  const { w, h } = size
  const cx = w / 2
  const cy = h / 2

  // Compute scale
  const allX = vectors.flatMap(v => [v.fromX || 0, (v.fromX || 0) + v.x])
  const allY = vectors.flatMap(v => [v.fromY || 0, (v.fromY || 0) + v.y])
  const maxVal = Math.max(5, ...allX.map(Math.abs), ...allY.map(Math.abs)) * 1.4
  const scale = Math.min(w, h) / 2 / maxVal

  const toSvg = (mathX, mathY) => ({
    x: cx + mathX * scale,
    y: cy - mathY * scale,
  })

  // Grid lines
  const gridCount = Math.ceil(maxVal) + 1
  const gridLines = []
  for (let i = -gridCount; i <= gridCount; i++) {
    gridLines.push(i)
  }

  // Arrow marker
  const arrowSize = 8

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative min-h-0">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${w} ${h}`}
          style={{ background: 'transparent' }}
        >
          <defs>
            {vectors.map((v, i) => (
              <marker
                key={`arrow-${i}`}
                id={`arrow-${i}`}
                markerWidth={arrowSize}
                markerHeight={arrowSize}
                refX={arrowSize - 1}
                refY={arrowSize / 2}
                orient="auto"
              >
                <path
                  d={`M0,0 L0,${arrowSize} L${arrowSize},${arrowSize / 2} Z`}
                  fill={v.color || '#f0c040'}
                  opacity="0.9"
                />
              </marker>
            ))}
            <marker id="axis-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 Z" fill="rgba(148,163,184,0.5)" />
            </marker>
          </defs>

          {/* Grid */}
          {gridLines.map(i => {
            const { x: gx } = toSvg(i, 0)
            const { y: gy } = toSvg(0, i)
            return (
              <g key={i}>
                <line x1={gx} y1={0} x2={gx} y2={h}
                  stroke={i === 0 ? 'rgba(212,168,67,0.35)' : 'rgba(30,45,74,0.7)'}
                  strokeWidth={i === 0 ? 1.5 : 1}
                />
                <line x1={0} y1={gy} x2={w} y2={gy}
                  stroke={i === 0 ? 'rgba(212,168,67,0.35)' : 'rgba(30,45,74,0.7)'}
                  strokeWidth={i === 0 ? 1.5 : 1}
                />
                {i !== 0 && (
                  <>
                    <text x={gx} y={cy + 14} textAnchor="middle" fontSize="9" fill="rgba(148,163,184,0.6)" fontFamily="JetBrains Mono">{i}</text>
                    <text x={cx + 5} y={gy + 3} textAnchor="start" fontSize="9" fill="rgba(148,163,184,0.6)" fontFamily="JetBrains Mono">{i}</text>
                  </>
                )}
              </g>
            )
          })}

          {/* Axis labels */}
          <text x={w - 15} y={cy + 14} fontSize="12" fill="rgba(148,163,184,0.8)" fontFamily="JetBrains Mono">x</text>
          <text x={cx + 8} y={14} fontSize="12" fill="rgba(148,163,184,0.8)" fontFamily="JetBrains Mono">y</text>

          {/* Vectors */}
          {vectors.map((v, i) => {
            const from = toSvg(v.fromX || 0, v.fromY || 0)
            const to = toSvg((v.fromX || 0) + v.x, (v.fromY || 0) + v.y)
            const midX = (from.x + to.x) / 2
            const midY = (from.y + to.y) / 2
            const color = v.color || '#f0c040'

            // Shorten line to not overlap arrowhead
            const dx = to.x - from.x, dy = to.y - from.y
            const len = Math.sqrt(dx * dx + dy * dy)
            const shortX = len > 0 ? to.x - (dx / len) * arrowSize * 0.9 : to.x
            const shortY = len > 0 ? to.y - (dy / len) * arrowSize * 0.9 : to.y

            return (
              <g key={i} className="view-transition">
                {/* Shadow */}
                <line x1={from.x} y1={from.y} x2={shortX} y2={shortY}
                  stroke={color} strokeWidth="4" opacity="0.12"
                  markerEnd={`url(#arrow-${i})`}
                />
                {/* Main line */}
                <line x1={from.x} y1={from.y} x2={shortX} y2={shortY}
                  stroke={color} strokeWidth="2.5" opacity="0.9"
                  markerEnd={`url(#arrow-${i})`}
                />
                {/* Dot at origin */}
                <circle cx={from.x} cy={from.y} r="3" fill={color} opacity="0.7" />
                {/* Label */}
                <text
                  x={midX - 10}
                  y={midY - 10}
                  fontSize="13"
                  fontFamily="JetBrains Mono"
                  fontWeight="600"
                  fill={color}
                  style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.8))' }}
                >
                  {v.label ? `⃗${v.label}` : ''}
                </text>
                {/* Coordinates */}
                <text
                  x={to.x + 8}
                  y={to.y - 6}
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  fill={color}
                  opacity="0.7"
                >
                  ({v.x}, {v.y})
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Operations results */}
      {operations?.length > 0 && (
        <div className="mt-2 space-y-1">
          {operations.map((op, i) => (
            <div key={i} className="flex items-center gap-2  border border-noir-500 rounded-lg px-3 py-2">
              <span className="text-xs  uppercase tracking-wider">{op.type?.replace('_', ' ')}</span>
              <KatexRender latex={op.latex} className="text-gold-400 text-sm" />
            </div>
          ))}
        </div>
      )}

      {explanation && (
        <p className="mt-2 text-xs  px-1">{explanation}</p>
      )}
    </div>
  )
}
