'use client'
import { useEffect, useRef, useState } from 'react'
import * as math from 'mathjs'

export default function GraphView({ data, title, explanation }) {
    const containerRef = useRef(null)
    const [error, setError] = useState(null)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        if (!data?.functions?.length || !containerRef.current) return

        let cancelled = false

        async function renderPlot() {
            try {
                const Plotly = (await import('plotly.js-dist-min')).default
                if (cancelled) return

                const { functions = [], xRange = [-8, 8] } = data
                const [xMin, xMax] = xRange
                const steps = 500
                const dx = (xMax - xMin) / steps
                const xValues = Array.from({ length: steps + 1 }, (_, i) => xMin + i * dx)

                const traces = functions.map(fn => {
                    const yValues = xValues.map(x => {
                        try {
                            const scope = { x }
                            const result = math.evaluate(fn.expr, scope)
                            return typeof result === 'number' && isFinite(result) ? result : null
                        } catch { return null }
                    })

                    return {
                        x: xValues,
                        y: yValues,
                        mode: 'lines',
                        name: fn.label || 'f(x)',
                        line: {
                            color: fn.color || '#f0c040',
                            width: 2.5,
                            shape: 'spline',
                            smoothing: 0.8,
                        },
                        connectgaps: false,
                    }
                })

                // Axes
                const axisStyle = {
                    gridcolor: 'rgba(30,45,74,0.8)',
                    linecolor: 'rgba(30,45,74,0.6)',
                    tickcolor: 'rgba(148,163,184,0.5)',
                    tickfont: { color: '#94a3b8', family: 'JetBrains Mono', size: 10 },
                    zerolinecolor: 'rgba(212,168,67,0.4)',
                    zerolinewidth: 1.5,
                }

                const layout = {
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    font: { family: 'DM Sans', color: '#e2e8f0' },
                    margin: { t: 20, r: 20, b: 50, l: 50 },
                    xaxis: { ...axisStyle, title: { text: 'x', font: { color: '#94a3b8', size: 12 } }, range: xRange },
                    yaxis: { ...axisStyle, title: { text: 'y', font: { color: '#94a3b8', size: 12 } } },
                    showlegend: functions.length > 1,
                    legend: {
                        font: { color: '#e2e8f0', size: 11 },
                        bgcolor: 'rgba(10,14,26,0.8)',
                        bordercolor: 'rgba(212,168,67,0.3)',
                        borderwidth: 1,
                    },
                    hovermode: 'x unified',
                    hoverlabel: {
                        bgcolor: '#141c30',
                        bordercolor: '#d4a843',
                        font: { color: '#e2e8f0', family: 'JetBrains Mono' },
                    },
                }

                const config = {
                    displaylogo: false,
                    displayModeBar: true,
                    modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'],
                    responsive: true,
                    toImageButtonOptions: { format: 'png', filename: 'mathesis-graph' },
                }

                await Plotly.react(containerRef.current, traces, layout, config)
                if (!cancelled) setLoaded(true)
            } catch (err) {
                if (!cancelled) setError(err.message)
            }
        }

        renderPlot()
        return () => { cancelled = true }
    }, [data])

    if (error) return (
        <div className="flex items-center justify-center h-full text-red-400 text-sm font-mono">
            Erreur graphique: {error}
        </div>
    )

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 relative min-h-0">
                {!loaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={containerRef} className="w-full h-full" />
            </div>
            {explanation && (
                <div className="mt-3 px-2 py-2  border border-noir-500 rounded-lg">
                    <p className="text-xs ">{explanation}</p>
                </div>
            )}
        </div>
    )
}
