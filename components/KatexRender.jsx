'use client'
import { useEffect, useRef } from 'react'

export default function KatexRender({ latex, className = '' }) {
    const ref = useRef(null)

    useEffect(() => {
        if (!ref.current || !latex) return

        import('katex').then(katex => {
            try {
                const mathml = katex.default.renderToString(latex, {
                    throwOnError: false,
                    output: 'mathml',
                })

                ref.current.innerHTML = mathml
            } catch (e) {
                ref.current.textContent = latex
            }
        })
    }, [latex])

    if (!latex) return null
    return <span ref={ref} className={className} />
}