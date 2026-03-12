'use client'
import { useEffect, useRef, useState } from 'react'
import KatexRender from '../KatexRender'
import * as math from 'mathjs'

export default function IntersectionView({ data }) {
    const containerRef = useRef(null)
    const [loaded, setLoaded] = useState(false)
    const { f1, f2, roots = [] } = data || {}

    function clean(e) {
        return (e || '').replace(/\^(\d+)/g, '^($1)').replace(/(\d)(x)/g, '$1*$2')
    }

    function evalAt(expr, x) {
        try { const r = math.evaluate(clean(expr), { x }); return isFinite(r) ? r : null }
        catch { return null }
    }

    const sortedRoots = [...roots]
        .map(r => typeof r === 'object' ? r.re ?? r : r)
        .filter(r => isFinite(r))

    useEffect(() => {
        if (!containerRef.current || !f1 || !f2) return
        let cancelled = false

        async function render() {
            const Plotly = (await import('plotly.js-dist-min')).default
            if (cancelled) return

            const xValues = Array.from({ length: 500 }, (_, i) => -8 + i * 16 / 499)

            const traces = [
                {
                    x: xValues, y: xValues.map(x => evalAt(f1, x)),
                    mode: 'lines', name: `f(x) = ${f1}`,
                    line: { color: '#f0c040', width: 2.5 }, connectgaps: false,
                },
                {
                    x: xValues, y: xValues.map(x => evalAt(f2, x)),
                    mode: 'lines', name: `g(x) = ${f2}`,
                    line: { color: '#34d399', width: 2.5 }, connectgaps: false,
                },
            ]

            // Intersection points
            if (sortedRoots.length > 0) {
                traces.push({
                    x: sortedRoots,
                    y: sortedRoots.map(x => evalAt(f1, x)),
                    mode: 'markers', name: 'Intersections',
                    marker: { color: '#f87171', size: 10, symbol: 'circle', line: { color: '#fff', width: 1.5 } },
                })
            }

            const axis = { gridcolor: 'rgba(30,45,74,0.8)', tickfont: { color: '#94a3b8', family: 'JetBrains Mono', size: 10 }, zerolinecolor: 'rgba(212,168,67,0.3)', zerolinewidth: 1.5 }
            await Plotly.react(containerRef.current, traces, {
                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                margin: { t: 10, r: 15, b: 40, l: 45 },
                xaxis: { ...axis, range: [-8, 8] }, yaxis: axis,
                legend: { font: { color: '#e2e8f0', size: 11 }, bgcolor: 'rgba(10,14,26,0.8)', bordercolor: 'rgba(212,168,67,0.3)', borderwidth: 1 },
                hovermode: 'x unified', hoverlabel: { bgcolor: '#141c30', bordercolor: '#d4a843', font: { color: '#e2e8f0', family: 'JetBrains Mono' } },
            }, { displaylogo: false, responsive: true, modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'] })

            if (!cancelled) setLoaded(true)
        }
        render()
        return () => { cancelled = true }
    }, [f1, f2, roots])

    return (
        <div className="flex flex-col h-full gap-3">
            <div className="flex-shrink-0 grid grid-cols-2 gap-2">
                <div className="bg-noir-800 border border-gold-500/30 rounded-xl px-4 py-3">
                    <p className="text-xs  mb-1">f(x)</p>
                    <KatexRender latex={`f(x) = ${f1}`} className="text-gold-400 text-sm" />
                </div>
                <div className="bg-noir-800 border border-emerald-500/30 rounded-xl px-4 py-3">
                    <p className="text-xs  mb-1">g(x)</p>
                    <KatexRender latex={`g(x) = ${f2}`} className="text-emerald-400 text-sm" />
                </div>
            </div>

            <div className="flex-1 min-h-0 relative">
                {!loaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex gap-1">{[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
                    </div>
                )}
                <div ref={containerRef} className="w-full h-full" />
            </div>

            {/* Intersection points */}
            <div className="flex-shrink-0 space-y-1">
                {sortedRoots.length > 0 ? (
                    <>
                        <p className="text-xs uppercase tracking-widest">Points d'intersection</p>
                        {sortedRoots.map((r, i) => {
                            const y = evalAt(f1, r)
                            return (
                                <div key={i} className="flex items-center gap-3 bg-noir-800 border border-rose-500/30 rounded-lg px-3 py-2">
                                    <div className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                                    <KatexRender latex={`x = ${Math.round(r * 10000) / 10000}`} className="text-gold-400 text-sm" />
                                    {y !== null && (
                                        <>
                                            <span className="">→</span>
                                            <KatexRender latex={`\\left(${Math.round(r * 1000) / 1000},\\ ${Math.round(y * 1000) / 1000}\\right)`} className="text-sm" />
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </>
                ) : (
                    <p className="text-xs px-1">Aucune intersection trouvée sur ℝ.</p>
                )}
            </div>
        </div>
    )
}