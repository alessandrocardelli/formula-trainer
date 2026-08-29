import type { FormulaRecord } from '../db'
import { buildVariableMetadata } from '../domain/variableMetadata'
import { VariableSymbol } from './VariableSymbol'

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
  const otherMetadata = focusSymbol
    ? metadata.filter((entry) => entry.symbol !== focusSymbol)
    : metadata
  const explanation = formula.explanation?.trim() ?? ''
  const hasOtherVariableDetails = otherMetadata.some(
    (entry) => entry.name.trim() || entry.unit.trim() || entry.definition.trim(),
  )
  const variableListLabel = focusSymbol ? 'Other variables' : 'Variables'

  if (!explanation && !focusVariable && !hasOtherVariableDetails) {
    return null
  }

  const variableList = (
    <div className="practice-variable-list">
      {otherMetadata.map((entry) => (
        <div className="practice-variable-row" key={entry.symbol}>
          <VariableSymbol className="variable-chip" symbol={entry.symbol} />
          <div className="practice-variable-copy">
            <div className="practice-variable-heading">
              <strong>{entry.name || <VariableSymbol symbol={entry.symbol} />}</strong>
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
            <VariableSymbol className="variable-chip" symbol={focusVariable.symbol} />
            <strong>{focusVariable.name || <VariableSymbol symbol={focusVariable.symbol} />}</strong>
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

      {hasOtherVariableDetails ? (
        expanded ? (
          <div className="practice-variables-expanded">
            <p className="practice-solution-label">{variableListLabel}</p>
            {variableList}
          </div>
        ) : (
          <details className="practice-variables-details">
            <summary>{variableListLabel}</summary>
            {variableList}
          </details>
        )
      ) : null}
    </div>
  )
}
