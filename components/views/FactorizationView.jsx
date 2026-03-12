'use client'
import { useState, useEffect } from 'react'
import KatexRender from '../KatexRender'

export default function FactorizationView({ data, steps = [], latex }) {
    const [visibleSteps, setVisibleSteps] = useState([])

    useEffect(() => {
        setVisibleSteps([])
        steps.forEach((step, i) => {
            setTimeout(() => setVisibleSteps(prev => [...prev, step]), i * 400)
        })
    }, [steps])

    return (
        <div className="flex flex-col h-full overflow-y-auto pr-1">
            {/* Header */}
            <div className="flex-shrink-0 mb-4 p-4 bg-noir-800 border border-gold-500/30 rounded-xl">
                <p className="text-xs  uppercase tracking-widest mb-2">Expression</p>
                <div className="flex items-center justify-center py-2">
                    <KatexRender latex={latex} className="text-2xl text-gold-400" />
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
                {visibleSteps.map((step, i) => (
                    <div
                        key={i}
                        className={`step-card text-black rounded-xl p-4 border animate-fade-in ${step.isResult ? 'border-gold-500/50 bg-noir-700' : 'border-noir-500'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold mt-0.5 ${step.isResult ? 'bg-gold-500 text-noir-900' : 'bg-noir-600  border border-noir-500'
                                }`}>
                                {step.isResult ? '✓' : step.index}
                            </div>
                            <div className="flex-1 min-w-0">
                                {step.description && (
                                    <p className={`text-sm mb-2 ${step.isResult ? 'text-gold-300 font-medium' : 'text-black'}`}>
                                        {step.description}
                                    </p>
                                )}
                                <div className={`rounded-lg px-3 py-2 ${step.isResult ? 'bg-gold-500/10' : 'bg-noir-900/50'}`}>
                                    <KatexRender latex={step.latex} className={`text-base ${step.isResult ? 'text-gold-300' : 'text-black'}`} />
                                </div>
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

                {visibleSteps.length < steps.length && (
                    <div className="flex items-center gap-2 px-4 py-3">
                        <div className="flex gap-1">
                            {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                        </div>
                        <span className="text-xs ">Calcul en cours...</span>
                    </div>
                )}
            </div>
        </div>
    )
}