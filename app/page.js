'use client'
import { useState, useCallback } from 'react'
import InputPanel from '@/components/InputPanel'
import VisualizationPanel from '@/components/VisualizationPanel'

export default function Home() {
  const [history, setHistory] = useState([])
  const [currentResult, setCurrentResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [panelWidth, setPanelWidth] = useState(38) // % for left panel

  const handleInput = useCallback(async (userInput) => {
    setIsLoading(true)
    setCurrentResult(null)

    try {
      const res = await fetch('/api/math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: userInput }),
      })

      const { result } = await res.json()

      setCurrentResult(result)
      setHistory(prev => [...prev, { input: userInput, result }])
    } catch (err) {
      console.error(err)
      const errResult = {
        type: 'unknown',
        title: 'Erreur réseau',
        explanation: 'Impossible de contacter l\'API. Vérifiez votre connexion et que ANTHROPIC_API_KEY est bien définie.',
        latex: '',
        data: {},
      }
      setCurrentResult(errResult)
      setHistory(prev => [...prev, { input: userInput, result: errResult }])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Panel resize handler
  const handleDividerDrag = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = panelWidth

    const onMove = (e) => {
      const totalWidth = window.innerWidth
      const delta = ((e.clientX - startX) / totalWidth) * 100
      setPanelWidth(Math.min(55, Math.max(28, startWidth + delta)))
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [panelWidth])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F6F4F1] ">
      {/* Top bar */}
      <header className="flex-shrink-0 h-12  flex items-center justify-between px-5 z-10 rounded-2xl bg-[#F6F4F1]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl text-gold-400 tracking-wide">MathStudio</span>
            
          </div>
          <div className="hidden md:flex items-center gap-1 ml-4">
            {[
              { label: 'Graphes', icon: '📈' },
              { label: 'Solveur', icon: '=' },
              { label: 'Vecteurs', icon: '↗' },
              { label: 'Probabilités', icon: '🎲' },
            ].map(item => (
              <span key={item.label} className="flex items-center gap-1 text-xs   px-2 py-1 rounded-md">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs  font-mono">Maths</span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Connecté" />
        </div>
      </header>

      {/* Main panels */}
      <div className="flex flex-1 min-h-0 overflow-hidden ">
        {/* Left — Input */}
        <div style={{ width: `${panelWidth}%`, minWidth: '280px' }} className="flex-shrink-0 overflow-hidden">
          <InputPanel
            onResult={handleInput}
            isLoading={isLoading}
            history={history}
          />
        </div>

        {/* Divider */}
        <div
          className="panel-divider flex-shrink-0 w-0.5 bg-gray-500 opacity-0 hover:opacity-100  transition-colors duration-200 relative group cursor-col-resize rounded-4xl"
          onMouseDown={handleDividerDrag}
        >

        </div>

        {/* Right — Visualization */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <VisualizationPanel result={currentResult} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
