interface VariableSymbolProps {
  symbol: string
  className?: string
}

const greekSymbols: Record<string, string> = {
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  omicron: 'ο',
  pi: 'π',
  rho: 'ρ',
  sigma: 'σ',
  tau: 'τ',
  upsilon: 'υ',
  phi: 'φ',
  chi: 'χ',
  psi: 'ψ',
  omega: 'ω',
}

function displayToken(token: string) {
  return greekSymbols[token] ?? token
}

export function VariableSymbol({ symbol, className }: VariableSymbolProps) {
  const underscoreIndex = symbol.indexOf('_')
  const base = underscoreIndex >= 0 ? symbol.slice(0, underscoreIndex) : symbol
  const subscript = underscoreIndex >= 0 ? symbol.slice(underscoreIndex + 1) : ''
  const classes = className ? `${className} variable-symbol-display` : 'variable-symbol-display'

  return (
    <span
      className={classes}
      aria-label={symbol}
      style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontStyle: 'italic',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {displayToken(base)}
      {subscript ? <sub>{displayToken(subscript)}</sub> : null}
    </span>
  )
}
