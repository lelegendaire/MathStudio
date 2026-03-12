'use client'
import { useState, useRef, useEffect } from 'react'
import KatexRender from './KatexRender'

const EXAMPLES = [
    { label: 'Graphe', text: 'trace y = x^2 + 2x - 3', icon: '📈' },
    { label: 'Graphe', text: 'trace f(x) = sin(x) et g(x) = cos(x)', icon: '📈' },
    { label: 'Solveur', text: 'résous 3x^2 - 5x + 2 = 0', icon: '🔢' },
    { label: 'Solveur', text: 'résous 2x + 7 = 15', icon: '🔢' },
    { label: 'Vecteurs 2D', text: 'vecteur u(3, 2) et v(-1, 4)', icon: '➡️' },
    { label: 'Vecteurs 3D', text: 'vecteurs 3D u(1, 2, 3) et v(0, -1, 2)', icon: '🧊' },
    { label: 'Binomiale', text: 'loi binomiale n=15 p=0.4', icon: '🎲' },
    { label: 'Arbre', text: 'arbre proba P(A)=0.3 P(B|A)=0.6 P(B|non A)=0.2', icon: '🌳' },
    { label: 'Dérivé', text: 'derive f(x) = x^2 + 2x - 3', icon: 'f\' ' },
    { label: 'Tableau de variations', text: 'variation f(x) = x^2 + 2x - 3', icon: '↗↘' },
    { label: 'Tableau de signes', text: 'signe f(x) = x^2 + 2x - 3', icon: '±' },
    { label: 'Intersection', text: 'intersection y = x^2 et y = 2x + 3', icon: '✕' },
    { label: 'Asymptotes', text: 'asymptote f(x) = 1/(x-2)', icon: '∞' },
    { label: 'Extrema', text: 'extrema f(x) = x^3 - 3x', icon: '▲▼' },
    { label: 'Tangentes', text: 'tangente f(x) = x^2 - 4', icon: '∠' },
    { label: 'Factorisation', text: 'factorise x^2 - 5x + 6', icon: '( )' },
]

const TYPE_LABELS = {
    graph_2d: { label: 'Graphe 2D', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    vector_2d: { label: 'Vecteurs 2D', color: 'text-sky-400', dot: 'bg-sky-400' },
    vector_3d: { label: 'Vecteurs 3D', color: 'text-sky-400', dot: 'bg-sky-400' },
    equation_solver: { label: 'Solveur', color: 'text-gold-400', dot: 'bg-gold-400' },
    probability_tree: { label: 'Arbre de proba', color: 'text-rose-400', dot: 'bg-rose-400' },
    binomial_law: { label: 'Loi binomiale', color: 'text-rose-400', dot: 'bg-rose-400' },
    derivative: { label: 'Dérivé', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    variation_table: { label: 'Tableau de variations', color: 'text-gold-400', dot: 'bg-gold-400' },
    sign_table: { label: 'Tableau de signes', color: 'text-rose-400', dot: 'bg-rose-400' },
    intersection: { label: 'Intersection', color: 'text-rose-400', dot: 'bg-rose-400' },
    unknown: { label: 'Inconnu', color: 'text-slate-500', dot: 'bg-slate-500' },
}

export default function InputPanel({ onResult, isLoading, history }) {
    const [input, setInput] = useState('')
    const [showExamples, setShowExamples] = useState(true)
    const textareaRef = useRef(null)
    const historyRef = useRef(null)

    useEffect(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight
        }
    }, [history])

    const handleSubmit = (text) => {
        const val = (text || input).trim()
        if (!val || isLoading) return
        setInput('')
        setShowExamples(false)
        onResult(val)
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#F6F4F1] ">
            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 ">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
                        <span className="text-gold-400 text-xs font-mono">∑</span>
                    </div>
                    <div>
                        <h2 className="text-xs font-medium  uppercase tracking-widest">Entrée</h2>
                        <p className="text-xs mt-0.5">Langage naturel ou syntaxe math</p>
                    </div>
                </div>
            </div>

            {/* History */}
            {history.length > 0 && (
                <div ref={historyRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                    {history.map((item, i) => {
                        const typeInfo = TYPE_LABELS[item.result?.type] || TYPE_LABELS.unknown
                        return (
                            <div key={i} className="animate-fade-in">
                                {/* User message */}
                                <div className="flex justify-end mb-2">
                                    <div className="max-w-xs bg-black text-white font-mono rounded-2xl rounded-tr-sm px-3 py-2">
                                        <p className="text-sm ">{item.input}</p>
                                    </div>
                                </div>

                                {/* Result summary */}
                                <div className="flex justify-start">
                                    <div className={`max-w-xs bg-[#F95C4B] text-white font-mono rounded-2xl rounded-tl-sm px-3 py-2 ${item.result?.type === 'unknown' ? 'border-red-900/50' : 'border-noir-600'
                                        }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${typeInfo.dot}`} />
                                            <span className={`text-xs font-mono ${typeInfo.color}`}>{typeInfo.label}</span>
                                        </div>
                                        {item.result?.latex && (
                                            <div className="mt-1">
                                                <KatexRender latex={item.result.latex} className="text-sm " />
                                            </div>
                                        )}
                                        {item.result?.title && (
                                            <p className="text-xs mt-1">{item.result.title}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {isLoading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="border border-noir-600 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Examples — shown when no history */}
            {showExamples && history.length === 0 && (
                <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
                    <p className="text-xs uppercase tracking-widest mb-3">Exemples</p>
                    <div className="space-y-2">
                        {EXAMPLES.map((ex, i) => (
                            <button
                                key={i}
                                onClick={() => handleSubmit(ex.text)}
                                className="w-full text-left group flex items-center gap-3 px-3 py-2.5 rounded-xl  border border-noir-600 hover:border-gold-500/40 transition-all duration-200"
                            >
                                <span className="text-base">{ex.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs  uppercase tracking-wide">{ex.label}</span>
                                    <p className="text-xs  font-mono truncate mt-0.5">{ex.text}</p>
                                </div>
                                <span className=" group-hover:text-gold-500 transition-colors text-sm">↵</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input area */}
            <div className="flex-shrink-0 p-4 border-t border-black">
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Écris une expression... (ex: résous x²-4=0)"
                        rows={3}
                        disabled={isLoading}
                        className="w-full  border border-noir-500 focus:border-gold-500/60 rounded-xl px-4 py-3 text-sm  placeholder-slate-600 font-mono resize-none transition-colors duration-200 disabled:opacity-50 pr-12"
                        style={{ lineHeight: '1.5' }}
                    />
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!input.trim() || isLoading}
                        className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-gold-500 hover:bg-gold-400  disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 text-noir-900 font-bold text-sm"
                    >
                        {isLoading ? (
                            <div className="w-3 h-3 border-2 border-noir-700 border-t-transparent rounded-full animate-spin" />
                        ) : '↵'}
                    </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-xs ">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
                    {history.length > 0 && (
                        <button onClick={() => setShowExamples(!showExamples)} className="text-xs  transition-colors">
                            {showExamples ? 'Masquer' : 'Exemples'}
                        </button>
                    )}
                </div>
            </div>
        </div>

    )
}
