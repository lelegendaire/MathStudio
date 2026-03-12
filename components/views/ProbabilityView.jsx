'use client'
import { useEffect, useRef, useState } from 'react'
import KatexRender from '../KatexRender'

// ============================================================
// PROBABILITY TREE
// ============================================================
function TreeNode({ node, x, y, parentX, parentY, xSpacing, ySpacing, depth }) {
    if (!node) return null
    const children = node.children || []
    const n = children.length
    const childrenX = children.map((_, i) => x + xSpacing * (i - (n - 1) / 2))
    const childY = y + ySpacing

    return (
        <g>
            {/* Lines to children */}
            {children.map((child, i) => (
                <g key={child.id || i}>
                    <line
                        x1={x} y1={y + 12}
                        x2={childrenX[i]} y2={childY - 12}
                        stroke="rgba(148,163,184,0.3)" strokeWidth="1.5"
                        strokeDasharray={depth >= 1 ? 'none' : '4,3'}
                    />
                    {/* Probability label on edge */}
                    <text
                        x={(x + childrenX[i]) / 2 + 6}
                        y={(y + 12 + childY - 12) / 2}
                        textAnchor="start"
                        fontSize="10"
                        fontFamily="JetBrains Mono"
                        fill={child.color || '#94a3b8'}
                        fontWeight="600"
                    >
                        {child.probability}
                    </text>
                </g>
            ))}

            {/* Node circle */}
            {depth > 0 && (
                <g>
                    <circle cx={x} cy={y} r="18" fill="rgba(10,14,26,0.9)" stroke={node.color || '#94a3b8'} strokeWidth="1.5" />
                    <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontFamily="JetBrains Mono" fontWeight="700" fill={node.color || '#e2e8f0'}>
                        {node.label}
                    </text>
                    {node.finalProb !== undefined && (
                        <text x={x} y={y + 30} textAnchor="middle" fontSize="9" fontFamily="JetBrains Mono" fill={node.color || '#94a3b8'} opacity="0.8">
                            {node.finalProb}
                        </text>
                    )}
                </g>
            )}

            {/* Recurse */}
            {children.map((child, i) => (
                <TreeNode
                    key={child.id || i}
                    node={child}
                    x={childrenX[i]}
                    y={childY}
                    parentX={x}
                    parentY={y}
                    xSpacing={xSpacing / Math.max(n, 1.5)}
                    ySpacing={ySpacing}
                    depth={depth + 1}
                />
            ))}
        </g>
    )
}

function ProbabilityTree({ tree, results }) {
    const [svgSize, setSvgSize] = useState({ w: 500, h: 320 })
    const containerRef = useRef(null)

    useEffect(() => {
        const obs = new ResizeObserver(entries => {
            for (const e of entries) setSvgSize({ w: e.contentRect.width, h: e.contentRect.height })
        })
        if (containerRef.current) obs.observe(containerRef.current)
        return () => obs.disconnect()
    }, [])

    const { w, h } = svgSize
    const children = tree?.children || []
    const levels = getDepth(tree)

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0" ref={containerRef}>
                <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`}>
                    {/* Start dot */}
                    <circle cx={w / 2} cy={30} r="5" fill="#d4a843" />
                    <TreeNode
                        node={tree}
                        x={w / 2}
                        y={30}
                        xSpacing={w * 0.38}
                        ySpacing={h / (levels + 0.5)}
                        depth={0}
                    />
                </svg>
            </div>

            {/* Results */}
            {results?.length > 0 && (
                <div className="flex-shrink-0 mt-2 space-y-2">
                    {results.map((r, i) => (
                        <div key={i} className="flex items-center gap-3 s border border-noir-500 rounded-lg px-3 py-2">
                            <KatexRender latex={r.latex} className="text-gold-400 text-sm" />
                            {r.description && <span className="text-xs ml-auto">{r.description}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function getDepth(node) {
    if (!node?.children?.length) return 0
    return 1 + Math.max(...node.children.map(getDepth))
}

// ============================================================
// BINOMIAL LAW
// ============================================================
function BinomialLaw({ n, p, esperance, variance, ecartType, queries }) {
    const containerRef = useRef(null)
    const [loaded, setLoaded] = useState(false)

    // Compute binomial PMF
    function binomialProb(k, n, p) {
        if (k < 0 || k > n) return 0
        const logBinom = logCombinations(n, k)
        return Math.exp(logBinom + k * Math.log(p) + (n - k) * Math.log(1 - p))
    }

    function logCombinations(n, k) {
        let result = 0
        for (let i = 0; i < k; i++) {
            result += Math.log(n - i) - Math.log(i + 1)
        }
        return result
    }

    useEffect(() => {
        if (!containerRef.current) return
        let cancelled = false

        async function render() {
            const Plotly = (await import('plotly.js-dist-min')).default
            if (cancelled) return

            const kValues = Array.from({ length: n + 1 }, (_, i) => i)
            const probs = kValues.map(k => binomialProb(k, n, p))
            const mean = n * p

            const colors = kValues.map(k =>
                Math.abs(k - mean) < 0.5 ? '#f0c040' : k <= mean ? '#34d399' : '#38bdf8'
            )

            const trace = {
                x: kValues,
                y: probs,
                type: 'bar',
                marker: { color: colors, opacity: 0.85, line: { color: 'rgba(0,0,0,0.3)', width: 1 } },
                hovertemplate: 'k=%{x}<br>P(X=k)=%{y:.4f}<extra></extra>',
            }

            // Mean line
            const meanLine = {
                x: [mean, mean],
                y: [0, Math.max(...probs) * 1.1],
                mode: 'lines',
                name: `E(X) = ${esperance}`,
                line: { color: '#d4a843', width: 2, dash: 'dash' },
            }

            const layout = {
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                margin: { t: 10, r: 15, b: 45, l: 50 },
                xaxis: {
                    title: { text: 'k', font: { color: '#94a3b8' } },
                    gridcolor: 'rgba(30,45,74,0.6)',
                    tickcolor: 'rgba(148,163,184,0.4)',
                    tickfont: { color: '#94a3b8', family: 'JetBrains Mono', size: 10 },
                    zerolinecolor: 'rgba(212,168,67,0.3)',
                },
                yaxis: {
                    title: { text: 'P(X=k)', font: { color: '#94a3b8' } },
                    gridcolor: 'rgba(30,45,74,0.6)',
                    tickcolor: 'rgba(148,163,184,0.4)',
                    tickfont: { color: '#94a3b8', family: 'JetBrains Mono', size: 10 },
                    zerolinecolor: 'rgba(212,168,67,0.3)',
                },
                showlegend: true,
                legend: { font: { color: '#e2e8f0', size: 10 }, bgcolor: 'rgba(10,14,26,0.7)' },
                bargap: 0.15,
            }

            await Plotly.react(containerRef.current, [trace, meanLine], layout, {
                displaylogo: false, responsive: true,
                modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'],
            })
            if (!cancelled) setLoaded(true)
        }

        render()
        return () => { cancelled = true }
    }, [n, p])

    return (
        <div className="flex flex-col h-full">
            {/* Stats row */}
            <div className="flex-shrink-0 grid grid-cols-3 gap-2 mb-3">
                {[
                    { label: 'E(X) = np', value: esperance ?? (n * p).toFixed(2), color: 'text-gold-400' },
                    { label: 'V(X) = np(1-p)', value: variance ?? (n * p * (1 - p)).toFixed(4), color: 'text-sky-400' },
                    { label: 'σ(X)', value: ecartType ?? Math.sqrt(n * p * (1 - p)).toFixed(4), color: 'text-emerald-400' },
                ].map(s => (
                    <div key={s.label} className=" border border-noir-500 rounded-lg p-2 text-center">
                        <p className="text-xs  font-mono">{s.label}</p>
                        <p className={`font-mono font-bold text-sm mt-0.5 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0" ref={containerRef} />

            {/* Query results */}
            {queries?.length > 0 && (
                <div className="flex-shrink-0 mt-2 space-y-1">
                    {queries.map((q, i) => (
                        <div key={i} className="flex items-center gap-3  border border-noir-500 rounded-lg px-3 py-2">
                            <KatexRender latex={q.latex} className="text-gold-400 text-sm" />
                            {q.description && <span className="text-xs  ml-auto">{q.description}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================================
// MAIN EXPORT
// ============================================================
export default function ProbabilityView({ type, data, explanation }) {
    if (type === 'binomial_law') {
        return <BinomialLaw {...data} />
    }
    if (type === 'probability_tree') {
        return <ProbabilityTree tree={data?.tree} results={data?.results} />
    }
    return (
        <div className="flex items-center justify-center h-full  text-sm">
            Type de probabilité non reconnu
        </div>
    )
}
