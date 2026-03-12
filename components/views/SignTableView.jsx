'use client'
import KatexRender from '../KatexRender'
import * as math from 'mathjs'

function evalAt(expr, x) {
    try {
        const r = math.evaluate(expr.replace(/\^(\d+)/g, '^($1)').replace(/(\d)(x)/g, '$1*$2'), { x })
        return isFinite(r) ? r : null
    } catch { return null }
}

export default function SignTableView({ data }) {
    const { expr, roots = [] } = data || {}

    const sortedRoots = [...roots]
        .map(r => typeof r === 'object' ? r.re ?? r : r)
        .filter(r => isFinite(r))
        .sort((a, b) => a - b)

    const allPoints = [-Infinity, ...sortedRoots, Infinity]

    function signOn(a, b) {
        const mid = isFinite(a) && isFinite(b) ? (a + b) / 2 : isFinite(a) ? a + 1 : isFinite(b) ? b - 1 : 0
        const val = evalAt(expr, mid)
        if (val === null) return '?'
        return val > 0.0001 ? '+' : val < -0.0001 ? '-' : '0'
    }

    const intervals = []
    for (let i = 0; i < allPoints.length - 1; i++) {
        intervals.push({ from: allPoints[i], to: allPoints[i + 1], sign: signOn(allPoints[i], allPoints[i + 1]) })
    }

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex-shrink-0 bg-noir-800 border border-noir-500 rounded-xl px-4 py-3">
                <p className="text-xs mb-1">Expression</p>
                <KatexRender latex={expr} className="text-gold-400 text-sm" />
            </div>

            <div className="flex-shrink-0">
                <p className="text-xs uppercase tracking-widest mb-3">Tableau de signes</p>
                <div className="border border-noir-500 rounded-xl overflow-hidden">
                    {/* Row x */}
                    <div className="flex border-b border-noir-500">
                        <div className="w-20 flex-shrink-0 px-3 py-3 bg-noir-800 border-r border-noir-500 flex items-center">
                            <span className="text-xs font-mono">x</span>
                        </div>
                        <div className="flex flex-1">
                            <div className="flex-1 flex items-center justify-center py-3 text-xs font-mono">-∞</div>
                            {sortedRoots.map((r, i) => (
                                <div key={i} className="flex flex-1">
                                    <div className="w-px bg-noir-500" />
                                    <div className="flex-1 flex items-center justify-center py-3">
                                        <KatexRender latex={String(Math.round(r * 1000) / 1000)} className="text-gold-400 text-xs" />
                                    </div>
                                </div>
                            ))}
                            <div className="w-px bg-noir-500" />
                            <div className="flex-1 flex items-center justify-center py-3 text-xs font-mono">+∞</div>
                        </div>
                    </div>

                    {/* Row sign */}
                    <div className="flex">
                        <div className="w-20 flex-shrink-0 px-3 py-4 bg-noir-800 border-r border-noir-500 flex items-center">
                            <KatexRender latex={expr?.length > 8 ? 'f(x)' : expr} className="text-xs" />
                        </div>
                        <div className="flex flex-1">
                            {intervals.map((iv, i) => (
                                <div key={i} className="flex flex-1">
                                    <div className={`flex-1 flex items-center justify-center py-4 text-xl font-bold ${iv.sign === '+' ? 'text-emerald-400' : iv.sign === '-' ? 'text-rose-400' : 'text-slate-400'}`}>
                                        {iv.sign}
                                    </div>
                                    {i < intervals.length - 1 && (
                                        <div className="w-8 bg-noir-700 flex items-center justify-center border-x border-noir-500">
                                            <span className=" text-xs font-mono">0</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Roots summary */}
            {sortedRoots.length > 0 ? (
                <div className="flex-shrink-0 space-y-1">
                    <p className="text-xs  uppercase tracking-widest">Racines</p>
                    {sortedRoots.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 bg-noir-800 border border-noir-600 rounded-lg px-3 py-2">
                            <KatexRender latex={`x_${i + 1} = ${Math.round(r * 1000) / 1000}`} className="text-gold-400 text-sm" />
                            <span className="text-xs  ml-auto">annule l'expression</span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs  px-1">Pas de racine réelle trouvée sur ℝ.</p>
            )}
        </div>
    )
}