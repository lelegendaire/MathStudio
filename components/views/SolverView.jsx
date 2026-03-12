'use client'
import { useState, useEffect } from 'react'
import KatexRender from '../KatexRender'

export default function SolverView({ data, steps = [], explanation }) {
    const [visibleSteps, setVisibleSteps] = useState([])

    // Animate steps appearing one by one
    useEffect(() => {
        setVisibleSteps([])
        steps.forEach((step, i) => {
            setTimeout(() => {
                setVisibleSteps(prev => [...prev, step])
            }, i * 400)
        })
    }, [steps])

    return (
        <div className="flex flex-col h-full overflow-y-auto pr-1">
            {/* Equation header */}
            {data?.equation && (
                <div className="flex-shrink-0 mb-4 p-4  border border-gold-500/30 rounded-xl glow-gold-sm">
                    <p className="text-xs  uppercase tracking-widest mb-2 font-sans">Équation</p>
                    <div className="flex items-center justify-center py-2">
                        <KatexRender latex={data.equation} className="text-2xl text-gold-400" />
                    </div>
                    {data.equationType && (
                        <p className="text-xs  text-center mt-1">{data.equationType}</p>
                    )}
                </div>
            )}

            {/* Steps */}
            <div className="space-y-3">
                {visibleSteps.map((step, i) => (
                    <div
                        key={i}
                        className={`step-card bg-noir-800 rounded-xl p-4 border border-noir-500 animate-fade-in ${step.isResult ? 'border-gold-500/50 bg-noir-700' : ''
                            }`}
                        style={{ animationDelay: `${i * 0.05}s` }}
                    >
                        <div className="flex items-start gap-3">
                            {/* Step number */}
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold mt-0.5 ${step.isResult
                                ? 'bg-gold-500 text-noir-900'
                                : 'bg-noir-600 text-slate-400 border border-noir-500'
                                }`}>
                                {step.isResult ? '✓' : step.index}
                            </div>

                            <div className="flex-1 min-w-0">
                                {/* Description */}
                                <p className={`text-sm mb-2 ${step.isResult ? 'text-gold-300 font-medium' : 'text-slate-400'}`}>
                                    {step.description}
                                </p>

                                {/* LaTeX */}
                                <div className={`rounded-lg px-3 py-2 ${step.isResult ? 'bg-gold-500/10' : 'bg-noir-900/50'}`}>
                                    <KatexRender
                                        latex={step.latex}
                                        className={`text-base ${step.isResult ? 'text-gold-300' : 'text-slate-200'}`}
                                    />
                                </div>

                                {/* Result of step */}
                                {step.result && !step.isResult && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className=" text-xs">→</span>
                                        <KatexRender latex={step.result} className="text-emerald-400 text-sm" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Loading indicator while steps are loading */}
                {visibleSteps.length < steps.length && (
                    <div className="flex items-center gap-2 px-4 py-3">
                        <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                        </div>
                        <span className="text-xs ">Calcul en cours...</span>
                    </div>
                )}
            </div>

            {/* Solution highlight */}
            {data?.solutionLatex && visibleSteps.length === steps.length && (
                <div className="flex-shrink-0 mt-4 p-4 bg-gold-500/10 border border-gold-500/40 rounded-xl animate-fade-in">
                    <p className="text-xs text-gold-600 uppercase tracking-widest mb-2">Solution finale</p>
                    <div className="flex items-center justify-center py-1">
                        <KatexRender latex={data.solutionLatex} className="text-2xl text-gold-300" />
                    </div>
                </div>
            )}

            {explanation && (
                <p className="mt-3 text-xs  px-1 flex-shrink-0">{explanation}</p>
            )}
        </div>
    )
}
