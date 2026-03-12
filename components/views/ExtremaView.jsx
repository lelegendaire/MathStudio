'use client'
import { useEffect, useRef, useState } from 'react'
import KatexRender from '../KatexRender'
import * as math from 'mathjs'

export default function ExtremaView({ data }) {
    const containerRef = useRef(null)
    const [loaded, setLoaded] = useState(false)
    const { expr, extrema = [] } = data || {}

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

            const xValues = Array.from({ length: 500 }, (_, i) => -8 + i * 16 / 499)

            const traces = [{
                x: xValues, y: xValues.map(evalAt),
                mode: 'lines', name: 'f(x)',
                line: { color: '#f0c040', width: 2.5 }, connectgaps: false,
            }]

            // Max points
            const maxPts = extrema.filter(e => e.type === 'maximum')
            const minPts = extrema.filter(e => e.type === 'minimum')
            const inflPts = extrema.filter(e => e.type === 'inflexion')

            if (maxPts.length) traces.push({
                x: maxPts.map(e => e.x), y: maxPts.map(e => e.fx),
                mode: 'markers+text', name: 'Maximum',
                marker: { color: '#34d399', size: 12, symbol: 'triangle-up', line: { color: '#fff', width: 1.5 } },
                text: maxPts.map(e => `(${e.x}, ${e.fx})`), textposition: 'top center',
                textfont: { color: '#34d399', size: 10, family: 'JetBrains Mono' },
            })

            if (minPts.length) traces.push({
                x: minPts.map(e => e.x), y: minPts.map(e => e.fx),
                mode: 'markers+text', name: 'Minimum',
                marker: { color: '#f87171', size: 12, symbol: 'triangle-down', line: { color: '#fff', width: 1.5 } },
                text: minPts.map(e => `(${e.x}, ${e.fx})`), textposition: 'bottom center',
                textfont: { color: '#f87171', size: 10, family: 'JetBrains Mono' },
            })

            if (inflPts.length) traces.push({
                x: inflPts.map(e => e.x), y: inflPts.map(e => e.fx),
                mode: 'markers', name: 'Inflexion',
                marker: { color: '#a78bfa', size: 10, symbol: 'diamond', line: { color: '#fff', width: 1.5 } },
            })

            const axis = { gridcolor: 'rgba(30,45,74,0.8)', tickfont: { color: '#94a3b8', family: 'JetBrains Mono', size: 10 }, zerolinecolor: 'rgba(212,168,67,0.3)', zerolinewidth: 1.5 }
            await Plotly.react(containerRef.current, traces, {
                paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                margin: { t: 10, r: 15, b: 40, l: 45 },
                xaxis: { ...axis, range: [-8, 8] }, yaxis: axis,
                legend: { font: { color: '#e2e8f0', size: 11 }, bgcolor: 'rgba(10,14,26,0.8)', bordercolor: 'rgba(212,168,67,0.3)', borderwidth: 1 },
                hovermode: 'closest',
                hoverlabel: { bgcolor: '#141c30', bordercolor: '#d4a843', font: { color: '#e2e8f0', family: 'JetBrains Mono' } },
            }, { displaylogo: false, responsive: true, modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'] })

            if (!cancelled) setLoaded(true)
        }
        render()
        return () => { cancelled = true }
    }, [expr])

    const TYPE_STYLE = {
        maximum: { color: 'text-emerald-400', border: 'border-emerald-500/30', icon: '▲' },
        minimum: { color: 'text-rose-400', border: 'border-rose-500/30', icon: '▼' },
        inflexion: { color: 'text-violet-400', border: 'border-violet-500/30', icon: '◆' },
        inconnu: { color: 'text-slate-400', border: 'border-noir-500', icon: '●' },
    }

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
                {extrema.length > 0 ? extrema.map((e, i) => {
                    const s = TYPE_STYLE[e.type] || TYPE_STYLE.inconnu
                    return (
                        <div key={i} className={`flex items-center gap-3 bg-noir-800 border ${s.border} rounded-lg px-3 py-2`}>
                            <span className={`text-sm ${s.color}`}>{s.icon}</span>
                            <span className={`text-xs font-mono ${s.color} capitalize`}>{e.type}</span>
                            <KatexRender latex={`x = ${e.x}`} className=" text-sm" />
                            <span className="">→</span>
                            <KatexRender latex={`f(${e.x}) = ${e.fx}`} className="text-sm" />
                            {e.d2 !== null && <span className="ml-auto text-xs  font-mono">f''={e.d2}</span>}
                        </div>
                    )
                }) : (
                    <p className="text-xs ">Aucun extremum trouvé (f' sans racine réelle).</p>
                )}
            </div>
        </div>
    )
}