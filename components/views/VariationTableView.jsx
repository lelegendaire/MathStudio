'use client'
import KatexRender from '../KatexRender'
import * as math from 'mathjs'
import { useEffect, useRef, useState } from 'react'

function evalAt(expr, x) {
    try {
        const r = math.evaluate(expr.replace(/\^(\d+)/g, '^($1)').replace(/(\d)(x)/g, '$1*$2'), { x })
        return isFinite(r) ? Math.round(r * 1000) / 1000 : null
    } catch { return null }
}

export default function VariationTableView({ data }) {
    const { expr, derivative, roots = [] } = data || {}
    const containerRef = useRef(null)
    const [loaded, setLoaded] = useState(false)

    // Build intervals from roots
    const sortedRoots = [...roots].map(r => typeof r === 'object' ? r.re ?? r : r).filter(r => isFinite(r)).sort((a, b) => a - b)
    const allPoints = [-Infinity, ...sortedRoots, Infinity]

    // Sign of f' on each interval
    function signOnInterval(a, b) {
        const mid = isFinite(a) && isFinite(b) ? (a + b) / 2 : isFinite(a) ? a + 1 : isFinite(b) ? b - 1 : 0
        const val = evalAt(derivative, mid)
        if (val === null) return '?'
        return val > 0 ? '+' : val < 0 ? '-' : '0'
    }

    const intervals = []
    for (let i = 0; i < allPoints.length - 1; i++) {
        intervals.push({ from: allPoints[i], to: allPoints[i + 1], sign: signOnInterval(allPoints[i], allPoints[i + 1]) })
    }

    // f values at roots
    const rootValues = sortedRoots.map(r => ({ x: r, fx: evalAt(expr, r) }))

    // f values at extremes
    const fLeft = evalAt(expr, -8)
    const fRight = evalAt(expr, 8)

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Function info */}
            <div className="flex-shrink-0 grid grid-cols-2 gap-2">
                <div className="bg-noir-800 border border-noir-500 rounded-xl px-4 py-3">
                    <p className="text-xs mb-1">f(x)</p>
                    <KatexRender latex={`f(x) = ${expr}`} className="text-gold-400 text-sm" />
                </div>
                <div className="bg-noir-800 border border-emerald-500/30 rounded-xl px-4 py-3">
                    <p className="text-xs mb-1">f'(x)</p>
                    <KatexRender latex={`f'(x) = ${derivative}`} className="text-emerald-400 text-sm" />
                </div>
            </div>

            {/* Variation table */}
            <div className="flex-1 min-h-0 overflow-auto">
                <div className="min-w-max">
                    {/* Table header */}
                    <div className="text-xs uppercase tracking-widest mb-3">Tableau de variations</div>

                    <div className="border border-noir-500 rounded-xl overflow-hidden">
                        {/* Row: x */}
                        <div className="flex border-b border-noir-500">
                            <div className="w-16 flex-shrink-0 px-3 py-3 bg-noir-800 border-r border-noir-500 flex items-center">
                                <span className="text-xs font-mono">x</span>
                            </div>
                            <div className="flex flex-1">
                                <div className="flex-1 flex items-center justify-center py-3 text-xs  font-mono">-∞</div>
                                {sortedRoots.map((r, i) => (
                                    <div key={i} className="flex flex-1">
                                        <div className="w-px bg-noir-500" />
                                        <div className="flex-1 flex items-center justify-center py-3">
                                            <KatexRender latex={String(Math.round(r * 1000) / 1000)} className="text-gold-400 text-xs" />
                                        </div>
                                    </div>
                                ))}
                                <div className="w-px bg-noir-500" />
                                <div className="flex-1 flex items-center justify-center py-3 text-xs  font-mono">+∞</div>
                            </div>
                        </div>

                        {/* Row: f'(x) sign */}
                        <div className="flex border-b border-noir-500">
                            <div className="w-16 flex-shrink-0 px-3 py-3 bg-noir-800 border-r border-noir-500 flex items-center">
                                <span className="text-xs  font-mono">f'(x)</span>
                            </div>
                            <div className="flex flex-1">
                                {intervals.map((iv, i) => (
                                    <div key={i} className="flex flex-1">
                                        <div className={`flex-1 flex items-center justify-center py-3 text-lg font-bold ${iv.sign === '+' ? 'text-emerald-400' : iv.sign === '-' ? 'text-rose-400' : 'text-slate-400'}`}>
                                            {iv.sign}
                                        </div>
                                        {i < intervals.length - 1 && (
                                            <div className="w-px bg-noir-500 flex items-center justify-center">
                                                <span className=" text-xs rotate-90">0</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Row: f(x) variations (arrows) */}
                        <div className="flex">
                            <div className="w-16 flex-shrink-0 px-3 py-4 bg-noir-800 border-r border-noir-500 flex items-center">
                                <span className="text-xs  font-mono">f(x)</span>
                            </div>
                            <div className="flex flex-1 items-stretch">
                                {/* Left bound value */}
                                <div className="flex-1 flex flex-col justify-between py-3 items-center">
                                    {fLeft !== null && <span className="text-xs  font-mono">{fLeft}</span>}
                                </div>

                                {intervals.map((iv, i) => {
                                    const isUp = iv.sign === '+'
                                    const rootVal = i < rootValues.length ? rootValues[i] : null
                                    return (
                                        <div key={i} className="flex flex-1 items-stretch">
                                            {/* Arrow */}
                                            <div className={`flex-1 flex items-center justify-center py-4 text-2xl ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {iv.sign === '+' ? '↗' : iv.sign === '-' ? '↘' : '→'}
                                            </div>
                                            {/* Root value */}
                                            {rootVal && (
                                                <div className="w-px bg-noir-500 flex flex-col items-center justify-center gap-1 px-1">
                                                    <KatexRender latex={rootVal.fx !== null ? String(rootVal.fx) : '0'} className="text-gold-400 text-xs" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}

                                {/* Right bound value */}
                                <div className="flex-1 flex flex-col justify-between py-3 items-center">
                                    {fRight !== null && <span className="text-xs  font-mono">{fRight}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Root summary */}
                    {sortedRoots.length > 0 && (
                        <div className="mt-3 space-y-1">
                            <p className="text-xs  uppercase tracking-widest">Valeurs remarquables</p>
                            {rootValues.map((rv, i) => (
                                <div key={i} className="flex items-center gap-3 bg-noir-800 border border-noir-600 rounded-lg px-3 py-2">
                                    <KatexRender latex={`f'(${rv.x}) = 0`} className="text-gold-400 text-sm" />
                                    <span className="">→</span>
                                    <KatexRender latex={`f(${rv.x}) = ${rv.fx}`} className=" text-sm" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}