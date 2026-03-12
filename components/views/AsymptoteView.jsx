'use client'
import { useEffect, useRef, useState } from 'react'
import KatexRender from '../KatexRender'
import * as math from 'mathjs'

export default function AsymptoteView({ data }) {
    const containerRef = useRef(null)
    const [loaded, setLoaded] = useState(false)
    const { expr, asymptotes, limits, results = [] } = data || {}

    useEffect(() => {
        if (!containerRef.current || !expr) return
        let cancelled = false

        async function render() {
            const Plotly = (await import('plotly.js-dist-min')).default
            if (cancelled) return

            function evalAt(x) {
                try {
                    const r = math.evaluate(expr.replace(/\^(\d+)/g, '^($1)').replace(/(\d)(x)/g, '$1*$2'), { x })
                    return isFinite(r) ? r : null
                } catch { return null }
            }

            // Split x range around vertical asymptotes to avoid connecting branches
            const vas = asymptotes?.vertical || []
            const xChunks = []
            const bounds = [-8, ...vas.flatMap(v => [v - 0.01, v + 0.01]), 8]
            for (let i = 0; i < bounds.length - 1; i += 2) {
                const x0 = bounds[i], x1 = bounds[i + 1]
                const pts = Array.from({ length: 200 }, (_, j) => x0 + j * (x1 - x0) / 199)
                xChunks.push(pts)
            }

            const traces = xChunks.map((xs, i) => ({
                x: xs, y: xs.map(evalAt),
                mode: 'lines', name: i === 0 ? 'f(x)' : '',
                showlegend: i === 0,
                line: { color: '#f0c040', width: 2.5 },
                connectgaps: false,
            }))

            // Vertical asymptote lines
            vas.forEach(v => {
                traces.push({
                    x: [v, v], y: [-50, 50],
                    mode: 'lines', name: `x = ${v}`,
                    line: { color: '#f87171', width: 1.5, dash: 'dash' },
                })
            })

                // Horizontal asymptote lines
                ; (asymptotes?.horizontal || []).forEach(a => {
                    traces.push({
                        x: [-8, 8], y: [a.y, a.y],
                        mode: 'lines', name: `y = ${a.y}`,
                        line: { color: '#38bdf8', width: 1.5, dash: 'dot' },
                    })
                })

            const axis = {
                gridcolor: 'rgba(30,45,74,0.8)',
                tickfont: { color: '#94a3b8', family: 'JetBrains Mono', size: 10 },
                zerolinecolor: 'rgba(212,168,67,0.3)', zerolinewidth: 1.5,
            }

            await Plotly.react(containerRef.current, traces, {
                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                margin: { t: 10, r: 15, b: 40, l: 45 },
                xaxis: { ...axis, range: [-8, 8] },
                yaxis: { ...axis, range: [-10, 10] },
                legend: { font: { color: '#e2e8f0', size: 11 }, bgcolor: 'rgba(10,14,26,0.8)', bordercolor: 'rgba(212,168,67,0.3)', borderwidth: 1 },
                hovermode: 'x unified',
                hoverlabel: { bgcolor: '#141c30', bordercolor: '#d4a843', font: { color: '#e2e8f0', family: 'JetBrains Mono' } },
            }, { displaylogo: false, responsive: true, modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'] })

            if (!cancelled) setLoaded(true)
        }
        render()
        return () => { cancelled = true }
    }, [expr])

    return (
        <div className="flex flex-col h-full gap-3">
            <div className="flex-1 min-h-0 relative">
                {!loaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex gap-1">{[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
                    </div>
                )}
                <div ref={containerRef} className="w-full h-full" />
            </div>

            <div className="flex-shrink-0 space-y-1">
                <div className="flex gap-4 text-xs mb-2">
                    <span className="flex items-center gap-2"><span className="w-4 h-0.5 bg-red-400 inline-block" style={{ borderTop: '2px dashed #f87171' }} />Asymptote verticale</span>
                    <span className="flex items-center gap-2"><span className="w-4 h-0.5 bg-sky-400 inline-block" style={{ borderTop: '2px dotted #38bdf8' }} />Asymptote horizontale</span>
                </div>
                {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 bg-noir-800 border border-noir-600 rounded-lg px-3 py-2">
                        <KatexRender latex={r.latex} className="text-gold-400 text-sm" />
                        <span className="text-xs ml-auto">{r.description}</span>
                    </div>
                ))}
                {results.length === 0 && <p className="text-xs ">Aucune asymptote détectée.</p>}
            </div>
        </div>
    )
}