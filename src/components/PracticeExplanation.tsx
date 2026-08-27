import type { FormulaRecord } from '../db'
import { buildVariableMetadata } from '../domain/variableMetadata'

interface PracticeExplanationProps {
  formula: FormulaRecord
  focusSymbol?: string
  expanded?: boolean
}

export function PracticeExplanation({
  formula,
  focusSymbol,
  expanded = false,
}: PracticeExplanationProps) {
  const metadata = buildVariableMetadata(formula.variables ?? [], formula.variableMetadata)
  const focusVariable = focusSymbol
    ? metadata.find((entry) => entry.symbol === focusSymbol)
    : undefined
  const explanation = formula.explanation?.trim() ?? ''
  const hasVariableDetails = metadata.some(
    (entry) => entry.name.trim() || entry.unit.trim() || entry.definition.trim(),
  )

  if (!explanation && !hasVariableDetails) {
    return null
  }

  const variableList = (
    <div className="practice-variable-list">
      {metadata.map((entry) => (
        <div
          className={`practice-variable-row${entry.symbol === focusSymbol ? ' practice-variable-row-focus' : ''}`}
          key={entry.symbol}
        >
          <span className="variable-chip">{entry.symbol}</span>
          <div className="practice-variable-copy">
            <div className="practice-variable-heading">
              <strong>{entry.name || entry.symbol}</strong>
              {entry.unit ? <span>{entry.unit}</span> : null}
            </div>
            {entry.definition ? <p>{entry.definition}</p> : null}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="practice-explanation">
      {focusVariable ? (
        <div className="practice-focus-variable">
          <p className="practice-solution-label">This variable</p>
          <div className="practice-variable-heading practice-focus-heading">
            <span className="variable-chip">{focusVariable.symbol}</span>
            <strong>{focusVariable.name || focusVariable.symbol}</strong>
            {focusVariable.unit ? <span>{focusVariable.unit}</span> : null}
          </div>
          {focusVariable.definition ? <p>{focusVariable.definition}</p> : null}
        </div>
      ) : null}

      {explanation ? (
        <div className="practice-formula-meaning">
          <p className="practice-solution-label">What this formula means</p>
          <p>{explanation}</p>
        </div>
      ) : null}

      {hasVariableDetails ? (
        expanded ? (
          <div className="practice-variables-expanded">
            <p className="practice-solution-label">Variables</p>
            {variableList}
          </div>
        ) : (
          <details className="practice-variables-details">
            <summary>Variables</summary>
            {variableList}
          </details>
        )
      ) : null}
    </div>
  )
}
