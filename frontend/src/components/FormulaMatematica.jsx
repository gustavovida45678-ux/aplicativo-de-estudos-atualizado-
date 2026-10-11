import React from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

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

  const hasMath = /[\\^_{}]|\\frac|\\sqrt|\\alpha|\\beta|\\gamma|\\delta|\\lambda|\\mu|\\pi|\\sigma|\\theta|\\phi|\\omega|\\begin|\\end|\\sum|\\int|\\prod|\\lim|\\infty|\\pm|\\times|\\div|\\leq|\\geq|\\neq|\\approx|\\equiv|\\cdot|\\cdots|\\dots|\\overrightarrow|\\overleftarrow|\\overline|\\underline|\\hat|\\tilde|\\vec|\\boldsymbol|\\mathbf|\\mathcal|\\mathbb|\\mathfrak|\\mathscr|\\operatorname|\\text|\\mathrm|\\mathbb|\\mathcal|\\mathfrak|\\mathscr|\\begin\{pmatrix\}|\\begin\{bmatrix\}|\\begin\{vmatrix\}|\\begin\{Bmatrix\}|\\begin\{Vmatrix\}|\\begin\{matrix\}|\\begin\{array\}|\\begin\{align\}|\\begin\{align\*\}|\\begin\{gather\}|\\begin\{gather\*\}|\\begin\{equation\}|\\begin\{equation\*\}|\\begin\{multline\}|\\begin\{multline\*\}/.test(sanitizedFormula);

  if (!hasMath) {
    return <span>{sanitizedFormula}</span>;
  }

  return bloco ? (
    <BlockMath math={sanitizedFormula} renderError={(err) => <span className="text-red-500 text-sm">Erro na fórmula: {err.message}</span>} />
  ) : (
    <InlineMath math={sanitizedFormula} renderError={(err) => <span className="text-red-500 text-sm">Erro: {err.message}</span>} />
  );
}