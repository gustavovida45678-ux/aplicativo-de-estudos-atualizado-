const renderMathContent = (content) => {
  if (!content) return null;

  const parts = [];
  let lastIndex = 0;
  // Better regex that handles content properly
  // Match $$...$$ or $...$ greedily
  const mathRegex = /(\$\$)(.*?)\1|(\$)(.*?)\3/g;
  let match;

  while ((match = mathRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex, match.index)
      });
    }

    let mathContent;
    let isDisplay;

    if (match[1]) { // $$ case
      mathContent = match[2];
      isDisplay = true;
    } else { // $ case
      mathContent = match[4];
      isDisplay = false;
    }

    parts.push({
      type: 'math',
      content: mathContent,
      isDisplay: isDisplay
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex)
    });
  }

  return parts;
};

// Test cases
const testCases = [
  "$E=mc^2$",
  "$$\\int_0^1 x^2 dx = \\frac{1}{3}$$",
  "Text with $E=mc^2$ inline and $$\\sum_{i=1}^n i = \\frac{n(n+1)}{2}$$ display",
  "Multiple: $a^2$ and $b^2$$ and $$c^2$$",
  "Escaped: \\$notmath\\$ and $$\\\\notdisplay\\$$",
  "Nested-like: $outer $$inner$$ outer$",
  "No math: Just plain text",
  "$$",
  "$",
  "$$x$$",
  "$x$"
];

console.log('Testing renderMathContent function:');
testCases.forEach(testCase => {
  console.log(`\nInput: "${testCase}"`);
  const result = renderMathContent(testCase);
  console.log('Output:', JSON.stringify(result, null, 2));
});