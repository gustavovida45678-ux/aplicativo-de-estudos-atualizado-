/**
 * mathFormatter.js
 * Converte fórmulas malformadas para LaTeX limpo e renderizável
 */

export function cleanMathExpression(expr) {
  if (!expr || typeof expr !== 'string') return '';

  let cleaned = expr
    .replace(/^\s*\(\\displaystyle\s+/g, '')
    .replace(/\)\s*$/g, '')
    .replace(/\\int\s+/g, '\\int ')
    .replace(/\\frac\s+/g, '\\frac')
    .replace(/\\sqrt\s+/g, '\\sqrt')
    .replace(/,\s*dx/g, '\\,dx')
    .replace(/,\s*dt/g, '\\,dt')
    .replace(/,\s*du/g, '\\,du')
    .replace(/,\s*dv/g, '\\,dv')
    .replace(/^["']|["']$/g, '')
    .replace(/\\ln\s*$/g, '\\ln|x|')
    .replace(/\\ln\s*\)/g, '\\ln|x|)')
    .replace(/\\frac\s*$/g, '\\frac{1}{x}')
    .replace(/dx\)/g, '\\,dx)')
    .trim();

  return cleaned;
}

export function isMathFormula(text) {
  if (!text) return false;
  const mathPatterns = [
    /\\[a-zA-Z]+/,
    /\^|_/,
    /\\[()[\]{}]/,
    /∫|∑|∏|√|π|α|β|γ|δ|λ|μ|σ|θ|φ|ω/,
  ];
  return mathPatterns.some(pattern => pattern.test(text));
}

export function formatBlockMath(formula) {
  const cleaned = cleanMathExpression(formula);
  if (!isMathFormula(cleaned)) return cleaned;
  return `$$${cleaned}$$`;
}

export function formatInlineMath(formula) {
  const cleaned = cleanMathExpression(formula);
  if (!isMathFormula(cleaned)) return cleaned;
  return `$${cleaned}$`;
}

export function processTableWithFormulas(markdown) {
  if (!markdown) return '';
  
  let processed = markdown.replace(/\|\s*(\([\\]displaystyle[^)]*\))\s*\|/g, (match, formula) => {
    const cleaned = cleanMathExpression(formula);
    return `| $${cleaned}$ |`;
  });

  processed = processed.replace(/(\([\\][a-zA-Z]+[^)]*\))/g, (match) => {
    const cleaned = cleanMathExpression(match);
    return `$${cleaned}$`;
  });

  return processed;
}

export function completeMathExpression(expr) {
  if (!expr) return '';

  let completed = expr;

  if (completed.match(/\\ln\s*$/) || completed.match(/\\ln\s*\+/) || completed.match(/\\ln\s*-/)) {
    completed = completed.replace(/\\ln(\s*[\+\-]|$)/, '\\ln|x|$1');
  }

  if (completed.match(/\\frac\s*$/) || !completed.match(/\\frac\{[^}]*\}\{[^}]*\}/)) {
    completed = completed.replace(/\\frac\s*$/g, '\\frac{1}{x}');
  }

  if (completed.match(/\\int_[0-9a-z]?\s*\^/) && !completed.match(/\\int_[^}]*\^[^}]*/)) {
    completed = completed.replace(/\\int_([^\s]+)\s*\^/, '\\int_$1^\\infty');
  }

  return completed;
}

export function processMarkdownWithMath(markdown) {
  if (!markdown) return '';

  let processed = markdown;

  processed = processed.replace(/```math\n([\s\S]*?)\n```/g, (match, content) => {
    const cleaned = cleanMathExpression(content);
    return `$$\n${cleaned}\n$$`;
  });

  processed = processed.replace(/\(\\displaystyle\s+([^)]+)\)/g, (match, formula) => {
    const cleaned = cleanMathExpression(formula);
    return `$$${cleaned}$$`;
  });

  processed = processed.replace(/\(([\\][a-zA-Z]+[^)]*)\)/g, (match, formula) => {
    const cleaned = cleanMathExpression(formula);
    return isMathFormula(cleaned) ? `$${cleaned}$` : match;
  });

  return processed;
}

export function validateLatexSyntax(latex) {
  const braces = { '{': '}', '[': ']', '(': ')' };
  const stack = [];
  let escaped = false;

  for (let i = 0; i < latex.length; i++) {
    const char = latex[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (Object.keys(braces).includes(char)) {
      stack.push(char);
    } else if (Object.values(braces).includes(char)) {
      const last = stack.pop();
      if (!last || braces[last] !== char) {
        return false;
      }
    }
  }

  return stack.length === 0;
}

export default {
  cleanMathExpression,
  isMathFormula,
  formatBlockMath,
  formatInlineMath,
  processTableWithFormulas,
  completeMathExpression,
  processMarkdownWithMath,
  validateLatexSyntax,
};
