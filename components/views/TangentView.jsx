'use client'
import { useEffect, useRef, useState } from 'react'
import KatexRender from '../KatexRender'
import * as math from 'mathjs'

const TANGENT_COLORS = ['#38bdf8', '#a78bfa', '#fb923c', '#34d399']

export default function TangentView({ data }) {
    const containerRef = useRef(null)
    const [loaded, setLoaded] = useState(false)
    const { expr, tangents = [] } = data || {}

    useEffect(() => {
        if (!containerRef.current || !expr) return
        let cancelled = false

        async function render() {
            const Plotly = (await import('plotly.js-dist-min')).default
            if (cancelled) return

            function evalAt(e, x) {
                try {
                    const r = math.evaluate(e.replace(/\^(\d+)/g, '^($1)').replace(/(\d)(x)/g, '$1*$2'), { x })
                    return isFinite(r) ? r : null
                } catch { return null }
            }

            const xValues = Array.from({ length: 500 }, (_, i) => -8 + i * 16 / 499)

            const traces = [{
                x: xValues, y: xValues.map(x => evalAt(expr, x)),
                mode: 'lines', name: 'f(x)',
                line: { color: '#f0c040', width: 2.5 }, connectgaps: false,
            }]

            // Tangent lines
            tangents.forEach((t, i) => {
                const color = TANGENT_COLORS[i % TANGENT_COLORS.length]
                traces.push({
                    x: xValues,
                    y: xValues.map(x => t.slope * x + t.intercept),
                    mode: 'lines',
                    name: `Tangente x=${t.x}`,
                    line: { color, width: 1.5, dash: 'dash' },
                })
                // Tangency point
                traces.push({
                    x: [t.x], y: [t.fx],
                    mode: 'markers', name: '',
                    showlegend: false,
                    marker: { color, size: 10, symbol: 'circle', line: { color: '#fff', width: 2 } },
                })
            })

            const axis = { gridcolor: 'rgba(30,45,74,0.8)', tickfont: { color: '#94a3b8', family: 'JetBrains Mono', size: 10 }, zerolinecolor: 'rgba(212,168,67,0.3)', zerolinewidth: 1.5 }
            await Plotly.react(containerRef.current, traces, {
                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                margin: { t: 10, r: 15, b: 40, l: 45 },
                xaxis: { ...axis, range: [-8, 8] }, yaxis: axis,
                legend: { font: { color: '#e2e8f0', size: 11 }, bgcolor: 'rgba(10,14,26,0.8)', bordercolor: 'rgba(212,168,67,0.3)', borderwidth: 1 },
                hoverlabel: { bgcolor: '#141c30', bordercolor: '#d4a843', font: { color: '#e2e8f0', family: 'JetBrains Mono' } },
            }, { displaylogo: false, responsive: true, modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'] })

            if (!cancelled) setLoaded(true)
        }
        render()
        return () => { cancelled = true }
    }, [expr, tangents])

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
                {tangents.length > 0 ? tangents.map((t, i) => {
                    const color = TANGENT_COLORS[i % TANGENT_COLORS.length]
                    return (
                        <div key={i} className="flex items-center gap-3 bg-noir-800 border border-noir-600 rounded-lg px-3 py-2">
                            <div className="w-3 h-0.5 flex-shrink-0" style={{ backgroundColor: color, borderTop: `2px dashed ${color}` }} />
                            <KatexRender latex={`x_0 = ${t.x}`} className=" text-xs" />
                            <span className="">→</span>
                            <KatexRender latex={t.tangentLatex} className="text-sm" style={{ color }} />
                            <span className="ml-auto text-xs font-mono">pente={t.slope}</span>
                        </div>
                    )
                }) : (
                    <p className="text-xs ">Aucun point remarquable trouvé.</p>
                )}
            </div>
        </div>
    )
}