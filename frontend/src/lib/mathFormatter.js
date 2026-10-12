/**
 * mathFormatter.js
 * Converte fórmulas malformadas para LaTeX limpo e renderizável
 */

export function cleanMathExpression(expr) {
  if (!expr || typeof expr !== 'string') return '';

  let cleaned = expr
    // Remove delimitadores desnecessários
    .replace(/^\s*\(\\displaystyle\s+/g, '')
    .replace(/\)\s*$/g, '')
    
    // Remove espaços excessivos após \int, \frac, etc
    .replace(/\\int\s+/g, '\\int ')
    .replace(/\\frac\s+/g, '\\frac')
    .replace(/\\sqrt\s+/g, '\\sqrt')
    
    // Corrige \, (espaço thin) que às vezes está como , dx
    .replace(/,\s*dx/g, '\\,dx')
    .replace(/,\s*dt/g, '\\,dt')
    .replace(/,\s*du/g, '\\,du')
    .replace(/,\s*dv/g, '\\,dv')
    
    // Remove aspas de encapsulamento que vêm às vezes do backend
    .replace(/^["']|["']$/g, '')
    
    // Corrige integrais truncadas (\ln sem argumento)
    .replace(/\\ln\s*$/g, '\\ln|x|')
    .replace(/\\ln\s*\)/g, '\\ln|x|)')
    
    // Corrige frac sem argumento
    .replace(/\\frac\s*$/g, '\\frac{1}{x}')
    
    // Garante espaço após operadores
    .replace(/dx\)/g, '\\,dx)')
    
    // Limpa espaços extras
    .trim();

  return cleaned;
}

/**
 * Detecta se uma string é uma fórmula matemática válida
 */
export function isMathFormula(text) {
  if (!text) return false;
  const mathPatterns = [
    /\\[a-zA-Z]+/,           // \command
    /\^|_/,                  // expoentes e índices
    /\\[()[\]{}]/,          // delimitadores especiais
    /∫|∑|∏|√|π|α|β|γ|δ|λ|μ|σ|θ|φ|ω/, // símbolos Unicode
  ];
  return mathPatterns.some(pattern => pattern.test(text));
}

/**
 * Formata fórmulas para blocos KaTeX (display math)
 */
export function formatBlockMath(formula) {
  const cleaned = cleanMathExpression(formula);
  if (!isMathFormula(cleaned)) return cleaned;
  return `$$${cleaned}$$`;
}

/**
 * Formata fórmulas para inline KaTeX
 */
export function formatInlineMath(formula) {
  const cleaned = cleanMathExpression(formula);
  if (!isMathFormula(cleaned)) return cleaned;
  return `$${cleaned}$`;
}

/**
 * Processa tabelas com fórmulas matemáticas
 */
export function processTableWithFormulas(markdown) {
  if (!markdown) return '';
  
  // Processa células de tabela com (\displaystyle ...)
  let processed = markdown.replace(/\|\s*(\([\\]displaystyle[^)]*\))\s*\|/g, (match, formula) => {
    const cleaned = cleanMathExpression(formula);
    return `| $${cleaned}$ |`;
  });

  // Processa outras fórmulas com (\frac, \int, etc
  processed = processed.replace(/(\([\\][a-zA-Z]+[^)]*\))/g, (match) => {
    const cleaned = cleanMathExpression(match);
    return `$${cleaned}$`;
  });

  return processed;
}

/**
 * Corrige truncamentos comuns em respostas do backend
 */
export function completeMathExpression(expr) {
  if (!expr) return '';

  let completed = expr;

  // Completa \ln truncado
  if (completed.match(/\\ln\s*$/) || completed.match(/\\ln\s*\+/) || completed.match(/\\ln\s*-/)) {
    completed = completed.replace(/\\ln(\s*[\+\-]|$)/, '\\ln|x|$1');
  }

  // Completa \frac truncado
  if (completed.match(/\\frac\s*$/) || !completed.match(/\\frac\{[^}]*\}\{[^}]*\}/)) {
    completed = completed.replace(/\\frac\s*$/g, '\\frac{1}{x}');
  }

  // Completa integrais com limites incompletos
  if (completed.match(/\\int_[0-9a-z]?\s*\^/) && !completed.match(/\\int_[^}]*\^[^}]*/)) {
    // Se temos \int_a^ mas não a^, completa
    completed = completed.replace(/\\int_([^\s]+)\s*\^/, '\\int_$1^\\infty');
  }

  return completed;
}

/**
 * Processa markdown completo com fórmulas matemáticas
 */
export function processMarkdownWithMath(markdown) {
  if (!markdown) return '';

  let processed = markdown;

  // Processa blocos de código identificados como 'math'
  processed = processed.replace(/```math\n([\s\S]*?)\n```/g, (match, content) => {
    const cleaned = cleanMathExpression(content);
    return `$$\n${cleaned}\n$$`;
  });

  // Processa fórmulas com (\displaystyle
  processed = processed.replace(/\(\\displaystyle\s+([^)]+)\)/g, (match, formula) => {
    const cleaned = cleanMathExpression(formula);
    return `$$${cleaned}$$`;
  });

  // Processa outras fórmulas entre parênteses
  processed = processed.replace(/\(([\\][a-zA-Z]+[^)]*)\)/g, (match, formula) => {
    const cleaned = cleanMathExpression(formula);
    return isMathFormula(cleaned) ? `$${cleaned}$` : match;
  });

  return processed;
}

/**
 * Validação rápida de LaTeX sintaxe básica
 */
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
