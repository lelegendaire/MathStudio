import * as math from 'mathjs'
import nerdamer from "nerdamer"
import "nerdamer/Calculus"
import "nerdamer/Algebra"
import "nerdamer/Solve"
// ============================================================
// INTENT DETECTION
// ============================================================

const GRAPH_KEYWORDS = /\b(trace|tracer|dessine|dessiner|affiche|plot|graphe|courbe|fonction|f\(x\)|g\(x\)|h\(x\)|y\s*=)\b/i
const SOLVE_KEYWORDS = /\b(résous|resous|résoudre|résolution|solve|équation|equation|trouver\s+x|calculer\s+x)\b/i
const VECTOR2D_KEYWORDS = /\b(vecteur|vecteurs|vec)\b(?!.*\b3[Dd]\b)/i
const VECTOR3D_KEYWORDS = /\b(vecteur|vecteurs|vec).*\b3[Dd]\b|\b3[Dd]\b.*\b(vecteur|vecteurs|vec)\b/i
const BINOM_KEYWORDS = /\b(binomiale?|binomial|loi\s+b\b|B\s*\()/i
const TREE_KEYWORDS = /\b(arbre|tree|proba\w*\s+cond|probabilité\s+total|bayes)\b/i
const DERIVATIVE_KEYWORDS =/\b(dérivée|derive|deriver|d\/dx|f'|f prime)\b/i
const INTERSECTION_KEYWORDS =/\b(intersection|croisement|coupe)\b/i
const VARIATION_KEYWORDS =/\b(tableau\s*de\s*variation|variation)\b/i
const SIGN_KEYWORDS =/\b(tableau\s*de\s*signe|signe)\b/i
const ASYMPTOTE_KEYWORDS = /\b(asymptote|limite?|lim\b|tend)/i
const EXTREMA_KEYWORDS   = /\b(extrema|extrêmes?|maximum|minimum|max|min|sommet)\b/i
const TANGENT_KEYWORDS   = /\b(tangente?|droite\s+tangente)\b/i
const FACTOR_KEYWORDS    = /\b(factorise?|factoriser|factorisation|développe?|forme\s+factorisée)\b/i

const IVT_KEYWORDS =/\b(tvi|valeurs?\s*intermédiaires?)\b/i
export function detectIntent(input) {
  if (TREE_KEYWORDS.test(input)) return 'probability_tree'
  if (BINOM_KEYWORDS.test(input)) return 'binomial_law'
  if (VECTOR3D_KEYWORDS.test(input)) return 'vector_3d'
  if (VECTOR2D_KEYWORDS.test(input)) return 'vector_2d'
  if (DERIVATIVE_KEYWORDS.test(input)) return 'derivative'
  if (INTERSECTION_KEYWORDS.test(input)) return 'intersection'
  if (VARIATION_KEYWORDS.test(input)) return 'variation_table'
  if (SIGN_KEYWORDS.test(input)) return 'sign_table'
  if (IVT_KEYWORDS.test(input)) return 'ivt'
  if (ASYMPTOTE_KEYWORDS.test(input)) return 'asymptotes'
  if (EXTREMA_KEYWORDS.test(input))   return 'extrema'
  if (TANGENT_KEYWORDS.test(input))   return 'tangent'
  if (FACTOR_KEYWORDS.test(input))    return 'factorization'
  if (SOLVE_KEYWORDS.test(input) || /[^=]=[^=]/.test(input) && /\bx\b/.test(input) && !GRAPH_KEYWORDS.test(input)) return 'equation_solver'
  if (GRAPH_KEYWORDS.test(input) || /y\s*=/.test(input) || /f\(x\)\s*=/.test(input)) return 'graph_2d'
  // Fallback: if there's an equation-like thing with x
  if (/[^=]=[^=]/.test(input) && /\bx\b/.test(input)) return 'equation_solver'
  return 'unknown'
}

// ============================================================
// GRAPH 2D PARSER
// ============================================================

function cleanExpr(raw) {
  return raw
    .replace(/²/g, '^2').replace(/³/g, '^3')
    .replace(/\^(\d+)/g, '^($1)')
    .replace(/(\d)(x)/gi, '$1*$2')
    .replace(/(\d)\(/g, '$1*(')
    .replace(/\)\(/g, ')*(')
    .replace(/\bsqrt\b/g, 'sqrt')
    .replace(/\bln\b/g, 'log')
    .replace(/\babs\b/g, 'abs')
    .replace(/\bsin\b/g, 'sin')
    .replace(/\bcos\b/g, 'cos')
    .replace(/\btan\b/g, 'tan')
    .replace(/\bexp\b/g, 'exp')
    .trim()
}

const COLORS = ['#f0c040', '#34d399', '#38bdf8', '#f87171', '#a78bfa']

function extractFunctions(input) {
  const fns = []
  // Match patterns like: y = ..., f(x) = ..., g(x) = ..., trace x^2, etc.
  const patterns = [
    /(?:y|f\(x\)|g\(x\)|h\(x\))\s*=\s*([^\n,;]+)/gi,
    /(?:et|and|,)\s*(?:y|g\(x\)|h\(x\))\s*=\s*([^\n,;]+)/gi,
  ]



  // Try to find explicit function definitions
  let m
  const re = /(?:([fgh])\(x\)|y)\s*=\s*([^\n,;]+)/gi
  const found = new Set()
  while ((m = re.exec(input)) !== null) {
    const label = m[1] ? `${m[1]}(x)` : 'y'
    const expr = cleanExpr(m[2].trim())
    if (!found.has(expr)) {
      found.add(expr)
      fns.push({ expr, labelDisplay: label, label, originalExpr: m[2].trim(), color: COLORS[fns.length % COLORS.length] })
    }
  }

  // If nothing found, try to extract a raw expression after keywords
  if (fns.length === 0) {
    const afterKeyword = input.replace(GRAPH_KEYWORDS, '').replace(/^\s*(de|la|le|une|:)?\s*/i, '').trim()
    const expr = cleanExpr(afterKeyword)
    if (expr) fns.push({ expr, label: 'f(x)', originalExpr: afterKeyword, color: COLORS[0] })
  }

  return fns
}

function computeXRange(functions) {
  // Default range, could be smarter
  return [-8, 8]
}

function toLatex(expr) {
  return expr
    .replace(/\*/g, '') // enlève *
    .replace(/sqrt\((.*?)\)/g, '\\sqrt{$1}')
    .replace(/log\((.*?)\)/g, '\\ln{$1}')
    .replace(/abs\((.*?)\)/g, '\\left|$1\\right|')
}

function parseGraph2D(input) {
  const functions = extractFunctions(input)
  if (!functions.length) return null

  const xRange = computeXRange(functions)
 const latexParts = functions.map(
  f => `${f.label} = ${toLatex(f.originalExpr)}`
)
console.log(latexParts)
  return {
    type: 'graph_2d',
    latex: latexParts[0], // anti-doublon
    title: `Tracé de ${latexParts.join(', ')}`,
    explanation: `Représentation graphique sur [${xRange[0]}; ${xRange[1]}].`,
    data: { functions, xRange },
  }
}

// ============================================================
// EQUATION SOLVER
// ============================================================

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b) }
function simplifyFraction(num, den) {
  if (den === 0) return null
  const g = gcd(Math.abs(Math.round(num)), Math.abs(Math.round(den)))
  return { num: Math.round(num / g), den: Math.round(den / g) }
}

function formatNumber(n) {
  if (Number.isInteger(n)) return String(n)
  const frac = simplifyFraction(n * 100, 100)
  if (frac && Math.abs(frac.num) < 1000 && Math.abs(frac.den) < 1000) {
    // Try to express as simple fraction
    const f2 = simplifyFraction(n * 12, 12)
    if (f2 && f2.den !== 1) return `\\frac{${f2.num}}{${f2.den}}`
  }
  return n.toFixed(4).replace(/\.?0+$/, '')
}

function solveLinear(a, b, c) {
  // ax + b = c  →  ax = c - b  →  x = (c - b) / a
  const rhs = c - b
  const xNum = rhs
  const xDen = a
  const g = gcd(Math.abs(Math.round(xNum)), Math.abs(Math.round(xDen)))
  const xNumS = Math.round(xNum / g)
  const xDenS = Math.round(xDen / g)
  const xVal = xNum / xDen
  const xLatex = xDenS === 1 ? String(xNumS) : `\\frac{${xNumS}}{${xDenS}}`

  const steps = [
    {
      index: 1,
      description: 'Identification de l\'équation du premier degré ax + b = c',
      latex: `${a}x ${b >= 0 ? '+' : ''} ${b} = ${c}`,
    },
  ]

  if (b !== 0) {
    const sign = b > 0 ? `-${b}` : `+${Math.abs(b)}`
    steps.push({
      index: 2,
      description: `On soustrait ${b} des deux membres`,
      latex: `${a}x ${b >= 0 ? '+' : ''} ${b} ${b >= 0 ? '-' : '+'} ${Math.abs(b)} = ${c} ${b >= 0 ? '-' : '+'} ${Math.abs(b)}`,
      result: `${a}x = ${rhs}`,
    })
  }

  if (a !== 1) {
    steps.push({
      index: steps.length + 1,
      description: `On divise les deux membres par ${a}`,
      latex: `\\frac{${a}x}{${a}} = \\frac{${rhs}}{${a}}`,
      result: `x = ${xLatex}`,
    })
  }

  steps.push({
    index: steps.length + 1,
    description: 'Solution',
    latex: `\\boxed{x = ${xLatex}}`,
    isResult: true,
  })

  return {
    steps,
    solutionLatex: `x = ${xLatex}`,
    equationType: 'Équation du 1er degré',
    roots: [xVal],
  }
}

function solveQuadratic(a, b, c) {
  const delta = b * b - 4 * a * c
  const deltaLatex = `\\Delta = b^2 - 4ac = ${b}^2 - 4 \\times ${a} \\times ${c} = ${delta}`
  const steps = [
    {
      index: 1,
      description: 'Identification de l\'équation du second degré ax² + bx + c = 0',
      latex: `${a}x^2 ${b >= 0 ? '+' : ''} ${b}x ${c >= 0 ? '+' : ''} ${c} = 0`,
    },
    {
      index: 2,
      description: 'Calcul du discriminant Δ = b² - 4ac',
      latex: deltaLatex,
      result: `\\Delta = ${delta}`,
    },
  ]

  let solutionLatex = ''
  let roots = []

  if (delta > 0) {
    const x1 = (-b - Math.sqrt(delta)) / (2 * a)
    const x2 = (-b + Math.sqrt(delta)) / (2 * a)
    roots = [x1, x2]
    const sqrtDelta = Number.isInteger(Math.sqrt(delta)) ? String(Math.sqrt(delta)) : `\\sqrt{${delta}}`
    steps.push({
      index: 3,
      description: 'Δ > 0 : deux racines réelles distinctes',
      latex: `x_1 = \\frac{-b - \\sqrt{\\Delta}}{2a} = \\frac{${-b} - ${sqrtDelta}}{${2*a}}`,
      result: `x_1 = ${formatNumber(x1)}`,
    })
    steps.push({
      index: 4,
      description: '',
      latex: `x_2 = \\frac{-b + \\sqrt{\\Delta}}{2a} = \\frac{${-b} + ${sqrtDelta}}{${2*a}}`,
      result: `x_2 = ${formatNumber(x2)}`,
    })
    solutionLatex = `x_1 = ${formatNumber(x1)}, \\quad x_2 = ${formatNumber(x2)}`
    steps.push({ index: 5, description: 'Solutions', latex: `\\boxed{x_1 = ${formatNumber(x1)}, \\quad x_2 = ${formatNumber(x2)}}`, isResult: true })
  } else if (delta === 0) {
    const x0 = -b / (2 * a)
    roots = [x0]
    solutionLatex = `x_0 = ${formatNumber(x0)}`
    steps.push({
      index: 3,
      description: 'Δ = 0 : une racine double',
      latex: `x_0 = \\frac{-b}{2a} = \\frac{${-b}}{${2*a}}`,
      result: `x_0 = ${formatNumber(x0)}`,
    })
    steps.push({ index: 4, description: 'Solution', latex: `\\boxed{x_0 = ${formatNumber(x0)}}`, isResult: true })
  } else {
    solutionLatex = '\\emptyset'
    steps.push({
      index: 3,
      description: 'Δ < 0 : pas de solution réelle',
      latex: `\\Delta = ${delta} < 0`,
      result: 'Pas de racine réelle',
    })
    steps.push({ index: 4, description: 'Ensemble solution', latex: `\\boxed{S = \\emptyset}`, isResult: true })
  }

  return { steps, solutionLatex, equationType: 'Équation du 2nd degré', roots, delta }
}

function extractCoeffs(lhs, rhs) {
  // Move everything to left side: lhs - rhs = 0
  try {
    const expr = math.simplify(`(${lhs}) - (${rhs})`)
    const exprStr = expr.toString()

    // Try to extract a, b, c from ax^2 + bx + c = 0
    let a = 0, b = 0, c = 0

    // Use math.js derivative to get coefficients
    const f = math.parse(exprStr)
    const df = math.derivative(f, 'x')
    const df2 = math.derivative(df, 'x')

    // f(0) = c
    c = f.evaluate({ x: 0 })
    // f'(0) = b
    b = df.evaluate({ x: 0 })
    // f''(0)/2 = a
    a = df2.evaluate({ x: 0 }) / 2

    // Check if it's actually polynomial of degree <= 2
    const check = math.parse(exprStr).evaluate({ x: 1 })
    const expected = a + b + c
    if (Math.abs(check - expected) > 0.0001) {
      return null // Not a simple polynomial
    }

    return { a: Math.round(a * 1000) / 1000, b: Math.round(b * 1000) / 1000, c: Math.round(c * 1000) / 1000 }
  } catch {
    return null
  }
}

function parseEquation(input) {
  // Find "=" sign to split equation
  const cleaned = input
    .replace(SOLVE_KEYWORDS, '').trim()
    .replace(/²/g, '^2').replace(/³/g, '^3')
    .replace(/(\d)(x)/g, '$1*x').replace(/\)\(/g, ')*(')

  const eqMatch = cleaned.match(/^(.+?)\s*=\s*(.+?)$/)
  if (!eqMatch) return null

  let lhs = eqMatch[1].trim()
  let rhs = eqMatch[2].trim()

  const coeffs = extractCoeffs(lhs, rhs)
  if (!coeffs) return null

  const { a, b, c } = coeffs
  const originalEq = `${lhs} = ${rhs}`

  let solved
  if (Math.abs(a) < 0.0001) {
    if (Math.abs(b) < 0.0001) return null
    solved = solveLinear(b, c, 0)
    // Actually for linear: bx + c = 0 (after moving everything left)
    // But let me reframe: a=0, so it's bx + c = 0
    solved = solveLinear(b, 0, -c)
  } else {
    solved = solveQuadratic(a, b, c)
  }

  return {
    type: 'equation_solver',
    latex: originalEq.replace(/\*/g, '').replace(/\^2/g, '^2'),
    title: `Résolution de ${originalEq.replace(/\*/g, '')}`,
    explanation: solved.equationType,
    data: {
      equation: originalEq.replace(/\*/g, ''),
      variable: 'x',
      solutionLatex: solved.solutionLatex,
      equationType: solved.equationType,
    },
    steps: solved.steps,
  }
}

// ============================================================
// VECTOR PARSER
// ============================================================

function parseVectors(input, is3D) {
  const vectors = []
  // Match patterns like: u(3, 2), v(-1, 4), w(1, 2, 3)
  const re3D = /([a-zA-Z]+)\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/g
  const re2D = /([a-zA-Z]+)\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/g

  const colors = ['#f0c040', '#34d399', '#38bdf8', '#f87171']
  let m, idx = 0

  if (is3D) {
    while ((m = re3D.exec(input)) !== null) {
      vectors.push({
        label: m[1], x: parseFloat(m[2]), y: parseFloat(m[3]), z: parseFloat(m[4]),
        color: colors[idx++ % colors.length],
      })
    }
  } else {
    while ((m = re2D.exec(input)) !== null) {
      vectors.push({
        label: m[1], x: parseFloat(m[2]), y: parseFloat(m[3]),
        fromX: 0, fromY: 0,
        color: colors[idx++ % colors.length],
      })
    }
  }

  if (!vectors.length) return null

  const operations = []
  if (!is3D && vectors.length >= 2) {
    const u = vectors[0], v = vectors[1]
    const dot = u.x * v.x + u.y * v.y
    operations.push({
      type: 'dot_product',
      result: dot,
      latex: `\\vec{${u.label}} \\cdot \\vec{${v.label}} = ${u.x} \\times ${v.x} + ${u.y} \\times ${v.y} = ${dot}`,
    })
    const normU = Math.sqrt(u.x ** 2 + u.y ** 2)
    const normV = Math.sqrt(v.x ** 2 + v.y ** 2)
    operations.push({
      type: 'norms',
      latex: `\\|\\vec{${u.label}}\\| = ${formatNumber(normU)}, \\quad \\|\\vec{${v.label}}\\| = ${formatNumber(normV)}`,
    })
  }

  if (is3D && vectors.length >= 2) {
    const u = vectors[0], v = vectors[1]
    const dot = u.x * v.x + u.y * v.y + u.z * v.z
    const cross = {
      x: u.y * v.z - u.z * v.y,
      y: u.z * v.x - u.x * v.z,
      z: u.x * v.y - u.y * v.x,
    }
    operations.push({
      type: 'dot_product',
      latex: `\\vec{${u.label}} \\cdot \\vec{${v.label}} = ${dot}`,
    })
    operations.push({
      type: 'cross_product',
      latex: `\\vec{${u.label}} \\times \\vec{${v.label}} = (${cross.x}, ${cross.y}, ${cross.z})`,
    })
  }

  const latexParts = vectors.map(v =>
    is3D ? `\\vec{${v.label}}(${v.x}, ${v.y}, ${v.z})` : `\\vec{${v.label}}(${v.x}, ${v.y})`
  )

  return {
    type: is3D ? 'vector_3d' : 'vector_2d',
    latex: latexParts.join(', '),
    title: `Vecteurs dans ${is3D ? "l'espace" : 'le plan'}`,
    explanation: `Représentation de ${vectors.length} vecteur(s).`,
    data: { vectors, operations },
  }
}

// ============================================================
// BINOMIAL LAW PARSER
// ============================================================

function parseBinomial(input) {
  const nMatch = input.match(/n\s*=\s*(\d+)/)
  const pMatch = input.match(/p\s*=\s*([\d.]+)/)

  if (!nMatch || !pMatch) return null

  const n = parseInt(nMatch[1])
  const p = parseFloat(pMatch[1])

  if (n < 1 || p < 0 || p > 1) return null

  const esperance = Math.round(n * p * 1000) / 1000
  const variance = Math.round(n * p * (1 - p) * 10000) / 10000
  const ecartType = Math.round(Math.sqrt(n * p * (1 - p)) * 10000) / 10000

  // Compute mode k = floor((n+1)*p)
  const mode = Math.floor((n + 1) * p)

  // P(X = mode)
  function logCombin(n, k) {
    let r = 0
    for (let i = 0; i < k; i++) r += Math.log(n - i) - Math.log(i + 1)
    return r
  }
  function binom(k) {
    if (k < 0 || k > n) return 0
    return Math.exp(logCombin(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p))
  }

  const pMode = Math.round(binom(mode) * 10000) / 10000
  const pCumHalf = Array.from({ length: Math.floor(n / 2) + 1 }, (_, i) => binom(i)).reduce((a, b) => a + b, 0)

  const queries = [
    { latex: `P(X = ${mode}) \\approx ${pMode}`, description: `Mode (valeur la plus probable)` },
    {
      latex: `E(X) = np = ${n} \\times ${p} = ${esperance}`,
      description: 'Espérance',
    },
  ]

  return {
    type: 'binomial_law',
    latex: `X \\sim B(${n}, ${p})`,
    title: `Loi Binomiale B(${n}, ${p})`,
    explanation: `n = ${n} épreuves, p = ${p} probabilité de succès.`,
    data: { n, p, esperance, variance, ecartType, queries },
  }
}

// ============================================================
// PROBABILITY TREE PARSER
// ============================================================

function parseProbTree(input) {
  // Try to extract P(A), P(B|A), P(B|Ā) or similar
  const pA_match = input.match(/P\s*\(\s*A\s*\)\s*=\s*([\d.]+)/i)
  const pBgA_match = input.match(/P\s*\(\s*B\s*[|\/]\s*A\s*\)\s*=\s*([\d.]+)/i)
  const pBgNA_match = input.match(/P\s*\(\s*B\s*[|\/]\s*(?:non\s*A|Ā|A[ˉ¯c]|!A|\^A)\s*\)\s*=\s*([\d.]+)/i)
    || input.match(/P\s*\(\s*B\s*[|\/]\s*[^A)]+\)\s*=\s*([\d.]+)/i)

  if (!pA_match || !pBgA_match || !pBgNA_match) return null

  const pA = parseFloat(pA_match[1])
  const pNA = Math.round((1 - pA) * 1000) / 1000
  const pBgA = parseFloat(pBgA_match[1])
  const pBgNA = parseFloat(pBgNA_match[1])
  const pNBgA = Math.round((1 - pBgA) * 1000) / 1000
  const pNBgNA = Math.round((1 - pBgNA) * 1000) / 1000

  const pB = Math.round((pA * pBgA + pNA * pBgNA) * 10000) / 10000
  const pNB = Math.round((1 - pB) * 10000) / 10000

  const pAB = Math.round(pA * pBgA * 10000) / 10000
  const pANB = Math.round(pA * pNBgA * 10000) / 10000
  const pNAB = Math.round(pNA * pBgNA * 10000) / 10000
  const pNANB = Math.round(pNA * pNBgNA * 10000) / 10000

  const pAgB = Math.round((pAB / pB) * 10000) / 10000

  const tree = {
    label: '',
    children: [
      {
        label: 'A', probability: pA, color: '#f0c040',
        children: [
          { label: 'B', probability: pBgA, finalProb: pAB, color: '#34d399', children: [] },
          { label: 'B̄', probability: pNBgA, finalProb: pANB, color: '#f87171', children: [] },
        ],
      },
      {
        label: 'Ā', probability: pNA, color: '#38bdf8',
        children: [
          { label: 'B', probability: pBgNA, finalProb: pNAB, color: '#34d399', children: [] },
          { label: 'B̄', probability: pNBgNA, finalProb: pNANB, color: '#f87171', children: [] },
        ],
      },
    ],
  }

  return {
    type: 'probability_tree',
    latex: `P(A) = ${pA},\\ P(B|A) = ${pBgA},\\ P(B|\\bar{A}) = ${pBgNA}`,
    title: 'Arbre de probabilités',
    explanation: `Formule des probabilités totales appliquée.`,
    data: {
      tree,
      results: [
        { latex: `P(B) = P(A) \\cdot P(B|A) + P(\\bar{A}) \\cdot P(B|\\bar{A}) = ${pAB} + ${pNAB} = ${pB}`, description: 'Probabilité totale' },
        { latex: `P(A|B) = \\frac{P(A \\cap B)}{P(B)} = \\frac{${pAB}}{${pB}} \\approx ${pAgB}`, description: 'Formule de Bayes' },
      ],
    },
  }
}

// ============================================================
// MAIN PARSER
// ============================================================

export function parseInput(input) {
  const intent = detectIntent(input)

  try {
    switch (intent) {
      case 'graph_2d': {
        const r = parseGraph2D(input)
        if (r) return r
        break
      }
      case 'equation_solver': {
        const r = parseEquation(input)
        if (r) return r
        break
      }
      case 'vector_2d': {
        const r = parseVectors(input, false)
        if (r) return r
        break
      }
      case 'vector_3d': {
        const r = parseVectors(input, true)
        if (r) return r
        break
      }
      case 'derivative':
  return parseDerivative(input)


case 'intersection':
  return parseIntersection(input)

case 'variation_table':
  return parseVariation(input)

case 'sign_table':
  return parseSign(input)

case 'ivt':
  return parseIVT(input)
      case 'binomial_law': {
        const r = parseBinomial(input)
        if (r) return r
        break
      }
      case 'probability_tree': {
        const r = parseProbTree(input)
        if (r) return r
        break
      }
      case 'asymptotes': {
        const r = parseAsymptotes(input)
        if (r) return r
        break
      }
      case 'extrema': {
        const r = parseExtrema(input)
        if (r) return r
        break
      }
      case 'tangent': {
        const r = parseTangent(input)
        if (r) return r
        break
      }
      case 'factorization': {
        const r = parseFactorization(input)
        if (r) return r
        break
      }
      
    }
  } catch (err) {
    console.error('Parse error:', err)
  }

  return {
    type: 'unknown',
    latex: '',
    title: 'Expression non reconnue',
    explanation: `Je n'ai pas pu interpréter "${input}". Exemples valides :\n• trace y = x^2 + 2x - 3\n• résous 3x^2 - 5x + 2 = 0\n• vecteur u(3, 2) et v(-1, 4)\n• vecteurs 3D u(1,2,3) et v(0,-1,2)\n• loi binomiale n=15 p=0.4\n• arbre proba P(A)=0.3 P(B|A)=0.6 P(B|non A)=0.2`,
    data: {},
    steps: [],
  }
}

function parseDerivative(input) {

  const expr = input
    .replace(DERIVATIVE_KEYWORDS,'')
    .trim()

  const derivative = math.derivative(expr,'x').toString()

  return {
    type:'derivative',
    latex:`f(x)=${expr}`,
    title:'Dérivée',
    explanation:'Calcul de la dérivée',
    data:{
      expr,
      derivative
    }
  }
}


function parseIntersection(input){

  const matches =
  input.match(/y\s*=\s*([^,;]+).*y\s*=\s*([^,;]+)/)

  if(!matches) return null

  const f1 = matches[1].trim()
  const f2 = matches[2].trim()

  const equation = `${f1}-(${f2})`

  const roots = nerdamer.solve(equation,'x').toString()

  return{
    type:'intersection',
    latex:`${f1}=${f2}`,
    title:'Intersection de courbes',
    explanation:'Résolution f(x)=g(x)',
    data:{
      f1,
      f2,
      roots
    }
  }
}
function parseVariation(input){

  const expr =
  input.replace(VARIATION_KEYWORDS,'')
  .trim()

  const derivative =
  math.derivative(expr,'x').toString()

  const roots =
  nerdamer.solve(derivative,'x').toString()

  return{
    type:'variation_table',
    latex:`f(x)=${expr}`,
    title:'Tableau de variations',
    explanation:'Étude de la dérivée',
    data:{
      expr,
      derivative,
      criticalPoints: roots
    }
  }
}
function parseSign(input){

  const expr =
  input.replace(SIGN_KEYWORDS,'')
  .trim()

  const roots =
  nerdamer.solve(expr,'x').toString()

  return{
    type:'sign_table',
    latex:expr,
    title:'Tableau de signes',
    explanation:'Étude du signe',
    data:{
      expr,
      roots
    }
  }
}
function parseIVT(input){

  const expr =
  input.replace(IVT_KEYWORDS,'')
  .trim()

  return{

    type:'ivt',

    latex:`f(x)=${expr}`,

    title:'Théorème des valeurs intermédiaires',

    explanation:
    'Si f est continue sur [a,b], alors toute valeur entre f(a) et f(b) est atteinte',

    data:{
      expr
    }

  }

}
function extractExprFromInput(input, keyword) {
  // Extrait l'expression après les keywords, gère f(x)=... ou juste l'expr
  let s = input.replace(keyword, '').trim()
  // Si y = ... ou f(x) = ...
  const m = s.match(/(?:[fgh]\(x\)|y)\s*=\s*(.+)/)
  if (m) return cleanExpr(m[1].trim())
  return cleanExpr(s.replace(/^(de|la|le|pour|:)\s*/i, '').trim())
}
// ---------- ASYMPTOTES ----------
function parseAsymptotes(input) {
  const expr = extractExprFromInput(input, ASYMPTOTE_KEYWORDS)
  if (!expr) return null

  const asymptotes = { vertical: [], horizontal: [] }

  // Asymptotes verticales via nerdamer
  try {
    const str = nerdamer(expr).toString()
    const denomMatch = str.match(/\/\s*\(?([\w\s\+\-\*\^]+)\)?/)
    if (denomMatch) {
      const roots = nerdamer.solve(denomMatch[1], 'x').evaluate().toString()
      JSON.parse(`[${roots}]`).forEach(v => {
        if (isFinite(v)) asymptotes.vertical.push(Math.round(v * 10000) / 10000)
      })
    }
  } catch {}

  // Limites en ±∞ via évaluation numérique
  const limits = {}
  ;[1e6, -1e6].forEach(x => {
    try {
      const val = math.evaluate(expr, { x })
      if (isFinite(val)) (x > 0 ? limits.posInf = Math.round(val*10000)/10000 : limits.negInf = Math.round(val*10000)/10000)
      else (x > 0 ? limits.posInf = '+∞' : limits.negInf = '-∞')
    } catch {}
  })

  if (limits.posInf === limits.negInf && typeof limits.posInf === 'number')
    asymptotes.horizontal.push({ y: limits.posInf, label: `y = ${limits.posInf}` })
  else {
    if (typeof limits.posInf === 'number') asymptotes.horizontal.push({ y: limits.posInf, label: `y = ${limits.posInf} (x→+∞)` })
    if (typeof limits.negInf === 'number' && limits.negInf !== limits.posInf) asymptotes.horizontal.push({ y: limits.negInf, label: `y = ${limits.negInf} (x→-∞)` })
  }

  const results = []
  asymptotes.vertical.forEach(x => results.push({ latex: `x = ${x}`, description: 'Asymptote verticale' }))
  asymptotes.horizontal.forEach(a => results.push({ latex: a.label, description: 'Asymptote horizontale' }))
  if (typeof limits.posInf === 'string') results.push({ latex: `\\lim_{x \\to +\\infty} f(x) = ${limits.posInf}`, description: 'Limite en +∞' })
  if (typeof limits.negInf === 'string') results.push({ latex: `\\lim_{x \\to -\\infty} f(x) = ${limits.negInf}`, description: 'Limite en -∞' })

  return { type: 'asymptotes', latex: `f(x) = ${expr}`, title: 'Asymptotes & Limites', explanation: `Analyse de f(x) = ${expr}`, data: { expr, asymptotes, limits, results } }
}

// ---------- EXTREMA ----------
function parseExtrema(input) {
  const expr = extractExprFromInput(input, EXTREMA_KEYWORDS)
  if (!expr) return null

  let derivStr, deriv2Str
  try {
    derivStr  = nerdamer.diff(expr, 'x').toString()
    deriv2Str = nerdamer.diff(derivStr, 'x').toString()
  } catch { return null }

  let roots = []
  try {
    const solved = nerdamer.solve(derivStr, 'x').evaluate().toString()
    roots = JSON.parse(`[${solved}]`)
      .filter(r => isFinite(r))
      .map(r => Math.round(r * 10000) / 10000)
  } catch {}

  const extrema = roots.map(x => {
    let fx = null, d2 = null, type = 'inconnu'
    try { fx = Math.round(math.evaluate(expr, { x }) * 10000) / 10000 } catch {}
    try {
      d2 = math.evaluate(deriv2Str, { x })
      type = d2 > 0.0001 ? 'minimum' : d2 < -0.0001 ? 'maximum' : 'inflexion'
    } catch {}
    return { x, fx, type, d2: d2 !== null ? Math.round(d2 * 10000) / 10000 : null }
  })

  return { type: 'extrema', latex: `f(x) = ${expr}`, title: 'Extrema de la fonction', explanation: `Points remarquables`, data: { expr, derivative: derivStr, deriv2: deriv2Str, extrema } }
}

// ---------- TANGENTE ----------
function parseTangent(input) {
  const expr = extractExprFromInput(input, TANGENT_KEYWORDS)
  if (!expr) return null

  let derivStr
  try { derivStr = nerdamer.diff(expr, 'x').toString() } catch { return null }

  let remarkableX = []
  try {
    const solved = nerdamer.solve(derivStr, 'x').evaluate().toString()
    remarkableX = JSON.parse(`[${solved}]`).filter(r => isFinite(r)).slice(0, 3)
  } catch {}
  if (remarkableX.length === 0) remarkableX = [0]

  const tangents = remarkableX.map(x => {
    const xR = Math.round(x * 10000) / 10000
    let slope = null, fx = null
    try { slope = Math.round(math.evaluate(derivStr, { x: xR }) * 10000) / 10000 } catch {}
    try { fx   = Math.round(math.evaluate(expr,     { x: xR }) * 10000) / 10000 } catch {}
    if (slope === null || fx === null) return null
    const intercept = Math.round((fx - slope * xR) * 10000) / 10000
    return { x: xR, fx, slope, intercept, tangentExpr: `${slope}*x + ${intercept}`, tangentLatex: `y = ${slope}x ${intercept >= 0 ? '+' : ''} ${intercept}` }
  }).filter(Boolean)

  return { type: 'tangent', latex: `f(x) = ${expr}`, title: 'Tangentes aux points remarquables', explanation: `Tangentes en f'(x₀) = 0`, data: { expr, tangents } }
}

// ---------- FACTORISATION ----------
function parseFactorization(input) {
  const raw = input.replace(FACTOR_KEYWORDS, '').replace(/^(de|le|la|:|\s)+/i, '').trim()
  const cleaned = raw.replace(/²/g, '^2').replace(/³/g, '^3').replace(/(\d)(x)/g, '$1*x')

  let factoredStr
  try {
    factoredStr = nerdamer(`factor(${cleaned})`).toString()
  } catch { return null }

  // Coefficients via math.js pour les étapes
  let a = 0, b = 0, c = 0
  try {
    const p = math.parse(cleaned)
    const df = math.derivative(p, 'x')
    const df2 = math.derivative(df, 'x')
    c = p.evaluate({ x: 0 })
    b = df.evaluate({ x: 0 })
    a = df2.evaluate({ x: 0 }) / 2
  } catch { return null }

  const steps = [{ index: 1, description: 'Expression à factoriser', latex: raw.replace(/\*/g, '') }]

  if (Math.abs(a) < 0.0001) {
    // Linéaire
    steps.push({ index: 2, description: 'Résultat', latex: `\\boxed{${factoredStr}}`, isResult: true })
    return { type: 'factorization', latex: raw, title: 'Factorisation', explanation: '', data: { expr: raw }, steps }
  }

  const delta = b * b - 4 * a * c
  steps.push({ index: 2, description: 'Identification : ax² + bx + c', latex: `a = ${a},\\ b = ${b},\\ c = ${c}` })
  steps.push({ index: 3, description: 'Discriminant', latex: `\\Delta = ${b}^2 - 4 \\times ${a} \\times ${c} = ${delta}`, result: `\\Delta = ${delta}` })

  if (delta < 0) {
    steps.push({ index: 4, description: 'Δ < 0 : irréductible sur ℝ', latex: `\\boxed{\\text{Irréductible sur } \\mathbb{R}}`, isResult: true })
  } else if (delta === 0) {
    const x0 = -b / (2 * a)
    steps.push({ index: 4, description: 'Δ = 0 : racine double', latex: `x_0 = ${formatNumber(x0)}` })
    steps.push({ index: 5, description: 'Forme factorisée', latex: `\\boxed{${factoredStr}}`, isResult: true })
  } else {
    const x1 = (-b - Math.sqrt(delta)) / (2 * a)
    const x2 = (-b + Math.sqrt(delta)) / (2 * a)
    const sqrtD = Number.isInteger(Math.sqrt(delta)) ? String(Math.sqrt(delta)) : `\\sqrt{${delta}}`
    steps.push({ index: 4, description: 'Δ > 0 : deux racines', latex: `x_1 = ${formatNumber(x1)},\\quad x_2 = ${formatNumber(x2)}` })
    steps.push({ index: 5, description: 'Forme factorisée', latex: `\\boxed{${factoredStr}}`, isResult: true })
  }

  return { type: 'factorization', latex: raw.replace(/\*/g, ''), title: 'Factorisation', explanation: `Δ = ${delta}`, data: { expr: raw, a, b, c, delta }, steps }
}