'use client'
import { useEffect, useRef, useState } from 'react'
import KatexRender from '../KatexRender'
import * as math from 'mathjs'

export default function DerivativeView({ data }) {
    const containerRef = useRef(null)
    const [loaded, setLoaded] = useState(false)
    const { expr, derivative } = data || {}

    function cleanForPlot(e) {
        return e.replace(/\^(\d+)/g, '^($1)').replace(/(\d)(x)/g, '$1*$2')
    }

    useEffect(() => {
        if (!containerRef.current || !expr) return
        let cancelled = false

        async function render() {
            const Plotly = (await import('plotly.js-dist-min')).default
            if (cancelled) return

            const xValues = Array.from({ length: 500 }, (_, i) => -8 + i * 16 / 499)

            function evalExpr(e, x) {
                try { const r = math.evaluate(cleanForPlot(e), { x }); return isFinite(r) ? r : null }
                catch { return null }
            }

            const traces = [
                {
                    x: xValues, y: xValues.map(x => evalExpr(expr, x)),
                    mode: 'lines', name: 'f(x)',
                    line: { color: '#f0c040', width: 2.5 }, connectgaps: false,
                },
                {
                    x: xValues, y: xValues.map(x => evalExpr(derivative, x)),
                    mode: 'lines', name: "f'(x)",
                    line: { color: '#34d399', width: 2, dash: 'dash' }, connectgaps: false,
                },
            ]

            const axis = { gridcolor: 'rgba(30,45,74,0.8)', tickfont: { color: '#94a3b8', family: 'JetBrains Mono', size: 10 }, zerolinecolor: 'rgba(212,168,67,0.3)', zerolinewidth: 1.5 }
            await Plotly.react(containerRef.current, traces, {
                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                margin: { t: 10, r: 15, b: 40, l: 45 },
                xaxis: axis, yaxis: axis,
                legend: { font: { color: '#e2e8f0', size: 11 }, bgcolor: 'rgba(10,14,26,0.8)', bordercolor: 'rgba(212,168,67,0.3)', borderwidth: 1 },
                hovermode: 'x unified', hoverlabel: { bgcolor: '#141c30', bordercolor: '#d4a843', font: { color: '#e2e8f0', family: 'JetBrains Mono' } },
            }, { displaylogo: false, responsive: true, modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'] })

            if (!cancelled) setLoaded(true)
        }
        render()
        return () => { cancelled = true }
    }, [expr, derivative])

    return (
        <div className="flex flex-col h-full gap-3">
            <div className="flex-shrink-0 grid grid-cols-2 gap-2">
                <div className="bg-noir-800 border border-noir-500 rounded-xl px-4 py-3">
                    <p className="text-xs  mb-1">f(x)</p>
                    <KatexRender latex={`f(x) = ${expr}`} className="text-gold-400 text-sm" />
                </div>
                <div className="bg-noir-800 border border-emerald-500/30 rounded-xl px-4 py-3">
                    <p className="text-xs mb-1">f'(x)</p>
                    <KatexRender latex={`f'(x) = ${derivative}`} className="text-emerald-400 text-sm" />
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
            <div className="flex-shrink-0 flex gap-4 text-xs px-1">
                <span className="flex items-center gap-2"><span className="w-4 h-0.5 bg-gold-400 inline-block" />f(x)</span>
                <span className="flex items-center gap-2"><span className="w-4 h-0.5 bg-emerald-400 inline-block" style={{ borderTop: '2px dashed #34d399' }} />f'(x)</span>
            </div>
        </div>
    )
}