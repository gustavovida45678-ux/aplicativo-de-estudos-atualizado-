import React from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { cleanMathExpression, isMathFormula, formatBlockMath, formatInlineMath } from '../lib/mathFormatter';

export default function FormulaMatematica({
  formula,
  bloco = false
}) {
  if (!formula) return null;

  const sanitizedFormula = formula
    .replace(/\$\$(.*?)\$\$/g, '$1')
    .replace(/\$(.*?)\$/g, '$1')
    .replace(/\\\\/g, '\\')
    .trim();

  if (!sanitizedFormula) return null;

  const cleanedFormula = cleanMathExpression(sanitizedFormula);

  if (!isMathFormula(cleanedFormula)) {
    return <span>{cleanedFormula}</span>;
  }

  const finalFormula = bloco ? formatBlockMath(cleanedFormula) : formatInlineMath(cleanedFormula);

  return bloco ? (
    <BlockMath math={finalFormula} renderError={(err) => <span className="text-red-500 text-sm">Erro na fórmula: {err.message}</span>} />
  ) : (
    <InlineMath math={finalFormula} renderError={(err) => <span className="text-red-500 text-sm">Erro: {err.message}</span>} />
  );
}