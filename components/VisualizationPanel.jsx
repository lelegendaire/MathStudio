'use client'
import dynamic from 'next/dynamic'
import KatexRender from './KatexRender'

const GraphView = dynamic(() => import('./views/GraphView'), { ssr: false })
const VectorView2D = dynamic(() => import('./views/VectorView2D'), { ssr: false })
const VectorView3D = dynamic(() => import('./views/VectorView3D'), { ssr: false })
const SolverView = dynamic(() => import('./views/SolverView'), { ssr: false })
const ProbabilityView = dynamic(() => import('./views/ProbabilityView'), { ssr: false })
// En haut avec les autres imports dynamic
const DerivativeView = dynamic(() => import('./views/DerivativeView'), { ssr: false })
const AsymptoteView = dynamic(() => import('./views/AsymptoteView'), { ssr: false })
const ExtremaView = dynamic(() => import('./views/ExtremaView'), { ssr: false })
const TangentView = dynamic(() => import('./views/TangentView'), { ssr: false })
const FactorizationView = dynamic(() => import('./views/FactorizationView'), { ssr: false })
const VariationTableView = dynamic(() => import('./views/VariationTableView'), { ssr: false })
const SignTableView = dynamic(() => import('./views/SignTableView'), { ssr: false })
const IntersectionView = dynamic(() => import('./views/IntersectionView'), { ssr: false })

const TYPE_META = {
  graph_2d: { icon: '📈', label: 'Graphe', color: 'border-emerald-500/30 text-emerald-400' },
  vector_2d: { icon: '↗', label: 'Vecteurs 2D', color: 'border-sky-500/30 text-sky-400' },
  vector_3d: { icon: '🧊', label: 'Vecteurs 3D', color: 'border-sky-500/30 text-sky-400' },
  equation_solver: { icon: '=', label: 'Solveur', color: 'border-gold-500/30 text-gold-400' },
  probability_tree: { icon: '🌳', label: 'Arbre', color: 'border-rose-500/30 text-rose-400' },
  binomial_law: { icon: '🎲', label: 'Binomiale', color: 'border-rose-500/30 text-rose-400' },
  derivative: { icon: "f'", label: 'Dérivée', color: 'border-emerald-500/30 text-emerald-400' },
  variation_table: { icon: '↗↘', label: 'Tableau variations', color: 'border-gold-500/30 text-gold-400' },
  sign_table: { icon: '±', label: 'Tableau de signes', color: 'border-rose-500/30 text-rose-400' },
  intersection: { icon: '✕', label: 'Intersection', color: 'border-rose-500/30 text-rose-400' },
  asymptotes: { icon: '∞', label: 'Asymptotes', color: 'border-sky-500/30 text-sky-400' },
  extrema: { icon: '▲▼', label: 'Extrema', color: 'border-emerald-500/30 text-emerald-400' },
  tangent: { icon: '∠', label: 'Tangentes', color: 'border-violet-500/30 text-violet-400' },
  factorization: { icon: '( )', label: 'Factorisation', color: 'border-gold-500/30 text-gold-400' },
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-8">
      <div className="w-16 h-16 rounded-2xl  border border-noir-500 flex items-center justify-center">
        <span className="text-3xl ">∅</span>
      </div>
      <div>
        <h3 className="font-display text-xl  mb-2">Aucune visualisation</h3>
        <p className="text-sm  leading-relaxed">
          Saisis une expression dans le panneau gauche.<br />
          La visualisation apparaîtra ici automatiquement.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs  max-w-xs w-full">
        {[
          ['📈', 'Graphes de fonctions'],
          ['🔢', 'Résolution d\'équations'],
          ['➡️', 'Vecteurs 2D/3D'],
          ['🎲', 'Lois de probabilité'],
        ].map(([icon, label]) => (
          <div key={label} className="flex items-center gap-2  rounded-lg px-3 py-2">
            <span>{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-2 border-gold-500/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-t-gold-400 border-transparent rounded-full animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-gold-400 text-xs font-mono">∑</span>
      </div>
      <p className="text-sm  animate-pulse">Interprétation en cours...</p>
    </div>
  )
}

export default function VisualizationPanel({ result, isLoading }) {
  const meta = result ? TYPE_META[result.type] : null

  return (
    <div className="flex flex-col h-full bg-[#E4DED2] rounded-4xl math-grid">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg  border border-noir-500 flex items-center justify-center">
              <span className=" text-xs">{meta?.icon || '◻'}</span>
            </div>
            <div>
              <h2 className="text-xs font-medium  uppercase tracking-widest">Visualisation</h2>
              {result && (
                <p className={`text-xs mt-0.5 font-mono ${meta?.color?.split(' ')[1] || 'text-slate-500'}`}>
                  {meta?.label}
                </p>
              )}
            </div>
          </div>

          {/* Title + LaTeX */}
          {result?.latex && (
            <div className="flex items-center gap-3  bg-black text-white rounded-lg px-3 py-1.5 max-w-xs overflow-hidden">
              {Array.isArray(result.latex)
                ? result.latex.map((l, i) => (
                  <KatexRender key={i} latex={l} className="text-sm" />
                ))
                : <KatexRender latex={result.latex} displayMode className="text-sm" />
              }
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 p-4 overflow-hidden">
        {isLoading ? (
          <LoadingState />
        ) : !result ? (
          <EmptyState />
        ) : (
          <div className="h-full view-transition">
            {/* Title */}
            {result.title && (
              <h3 className="font-display text-lg  mb-3 flex-shrink-0">{result.title}</h3>
            )}

            {/* View */}
            <div className={`${result.title ? 'h-[calc(100%-2.5rem)]' : 'h-full'}`}>
              {result.type === 'graph_2d' && (
                <GraphView data={result.data} title={result.title} explanation={result.explanation} />
              )}
              {result.type === 'vector_2d' && (
                <VectorView2D data={result.data} explanation={result.explanation} />
              )}
              {result.type === 'vector_3d' && (
                <VectorView3D data={result.data} explanation={result.explanation} />
              )}
              {result.type === 'equation_solver' && (
                <SolverView data={result.data} steps={result.steps} explanation={result.explanation} />
              )}
              {(result.type === 'probability_tree' || result.type === 'binomial_law') && (
                <ProbabilityView type={result.type} data={result.data} explanation={result.explanation} />
              )}

              {result.type === 'derivative' && <DerivativeView data={result.data} />}

              {result.type === 'variation_table' && <VariationTableView data={result.data} />}
              {result.type === 'sign_table' && <SignTableView data={result.data} />}
              {result.type === 'intersection' && <IntersectionView data={result.data} />}
              {result.type === 'asymptotes' && <AsymptoteView data={result.data} />}
              {result.type === 'extrema' && <ExtremaView data={result.data} />}
              {result.type === 'tangent' && <TangentView data={result.data} />}
              {result.type === 'factorization' && <FactorizationView data={result.data} steps={result.steps} latex={result.latex} />}

              {result.type === 'unknown' && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-red-900/20 border border-red-900/40 flex items-center justify-center">
                    <span className="text-red-400 text-lg">?</span>
                  </div>
                  <div>
                    <p className="text-sm ">{result.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
