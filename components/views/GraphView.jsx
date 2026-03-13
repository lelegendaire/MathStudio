'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import * as math from 'mathjs'

export default function GraphView({ data, title, explanation }) {
    const containerRef = useRef(null)
    const [error, setError] = useState(null)
    const [loaded, setLoaded] = useState(false)
    const [xRange, setXRange] = useState(data?.xRange || [-8, 8])
    const [hoveredFn, setHoveredFn] = useState(null)

    const renderPlot = useCallback(async (range) => {
        if (!data?.functions?.length || !containerRef.current) return
        try {
            const Plotly = (await import('plotly.js-dist-min')).default
            const { functions = [] } = data
            const [xMin, xMax] = range
            const steps = 600
            const dx = (xMax - xMin) / steps
            const xValues = Array.from({ length: steps + 1 }, (_, i) => xMin + i * dx)

            const traces = functions.map((fn, idx) => {
                const yValues = xValues.map(x => {
                    try {
                        const result = math.evaluate(fn.expr, { x })
                        return typeof result === 'number' && isFinite(result) ? result : null
                    } catch { return null }
                })
                return {
                    x: xValues, y: yValues,
                    mode: 'lines',
                    name: fn.label || 'f(x)',
                    line: { color: fn.color || '#f0c040', width: hoveredFn === idx ? 3.5 : 2.5, shape: 'spline', smoothing: 1 },
                    connectgaps: false,
                    hovertemplate: `<b>${fn.label || 'f(x)'}</b><br>x = %{x:.3f}<br>y = %{y:.3f}<extra></extra>`,
                }
            })

            const axisStyle = {
                gridcolor: 'rgba(0,0,0,0.06)',
                linecolor: 'rgba(0,0,0,0.12)',
                tickcolor: 'rgba(0,0,0,0.2)',
                tickfont: { color: '#6b7280', family: 'JetBrains Mono', size: 10 },
                zerolinecolor: 'rgba(0,0,0,0.2)',
                zerolinewidth: 1.5,
            }

            const layout = {
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'rgba(255,255,255,0.5)',
                font: { family: 'DM Sans', color: '#374151' },
                margin: { t: 12, r: 12, b: 40, l: 44 },
                xaxis: { ...axisStyle, range, title: { text: 'x', font: { color: '#9ca3af', size: 11 } } },
                yaxis: { ...axisStyle, title: { text: 'y', font: { color: '#9ca3af', size: 11 } } },
                showlegend: false,
                hovermode: 'closest',
                hoverlabel: {
                    bgcolor: '#111827', bordercolor: 'transparent',
                    font: { color: '#f9fafb', family: 'JetBrains Mono', size: 12 },
                },
            }

            await Plotly.react(containerRef.current, traces, layout, {
                displaylogo: false, displayModeBar: false, responsive: true, scrollZoom: true,
            })
            setLoaded(true)
        } catch (err) { setError(err.message) }
    }, [data, hoveredFn])

    useEffect(() => {
        setLoaded(false)
        const r = data?.xRange || [-8, 8]
        setXRange(r)
    }, [data])

    useEffect(() => { renderPlot(xRange) }, [xRange, renderPlot])

    const zoom = (f) => {
        const mid = (xRange[0] + xRange[1]) / 2
        const h = (xRange[1] - xRange[0]) / 2 * f
        setXRange([mid - h, mid + h])
    }
    const pan = (d) => {
        const s = (xRange[1] - xRange[0]) * 0.2 * d
        setXRange([xRange[0] + s, xRange[1] + s])
    }
    const reset = () => setXRange(data?.xRange || [-8, 8])

    if (error) return (
        <div className="flex items-center justify-center h-full text-red-500 text-sm font-mono">Erreur : {error}</div>
    )

    const COLORS = ['#f0c040', '#34d399', '#38bdf8', '#f87171', '#a78bfa']
    const functions = data?.functions || []

    return (
        <div className="flex flex-col h-full gap-3">

            {/* Function pills */}
            <div className="flex-shrink-0 flex flex-wrap gap-2 px-1">
                {functions.map((fn, i) => (
                    <div key={i}
                        onMouseEnter={() => setHoveredFn(i)}
                        onMouseLeave={() => setHoveredFn(null)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono cursor-default select-none transition-all"
                        style={{ backgroundColor: `${fn.color || COLORS[i]}18`, border: `1.5px solid ${fn.color || COLORS[i]}50`, color: '#111827' }}
                    >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: fn.color || COLORS[i] }} />
                        {fn.label} = {fn.originalExpr || fn.expr}
                    </div>
                ))}
            </div>

            {/* Graph container */}
            <div className="flex-1 relative min-h-0 rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.6)', boxShadow: '0 2px 20px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.9)' }}
            >
                {!loaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-10 rounded-2xl">
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-2.5 h-2.5 rounded-full animate-bounce"
                                    style={{ backgroundColor: '#f0c040', animationDelay: `${i * 0.15}s` }} />
                            ))}
                        </div>
                    </div>
                )}

                <div ref={containerRef} className="w-full h-full" />

                {/* Zoom controls — bottom right */}
                <div className="absolute bottom-3 right-3 flex flex-col gap-1">
                    {[
                        { label: '+', action: () => zoom(0.6) },
                        { label: '−', action: () => zoom(1.6) },
                        { label: '⟳', action: reset },
                    ].map(btn => (
                        <button key={btn.label} onClick={btn.action}
                            className="w-7 h-7 rounded-lg text-sm font-bold flex items-center justify-center transition-all hover:scale-110 active:scale-95 select-none"
                            style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 1px 6px rgba(0,0,0,0.1)', color: '#374151' }}
                        >{btn.label}</button>
                    ))}
                </div>

                {/* Pan controls — bottom left */}
                <div className="absolute bottom-3 left-3 flex gap-1">
                    {[{ label: '←', d: -1 }, { label: '→', d: 1 }].map(btn => (
                        <button key={btn.label} onClick={() => pan(btn.d)}
                            className="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all hover:scale-110 active:scale-95 select-none"
                            style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 1px 6px rgba(0,0,0,0.1)', color: '#374151' }}
                        >{btn.label}</button>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex items-center justify-between px-1">
                <span className="text-xs text-gray-400 font-mono">x ∈ [{xRange[0].toFixed(1)}, {xRange[1].toFixed(1)}]</span>
                {explanation && <span className="text-xs text-gray-400 max-w-xs truncate text-right">{explanation}</span>}
            </div>
        </div>
    )
}