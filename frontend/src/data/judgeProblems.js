// Problemas do Juiz Online - Estrutura de Dados (estilo Beecrowd)
// test_cases: { input, expected } — a saída é comparada exata (após remover espaços no fim)

export const JUDGE_PROBLEMS = [
  {
    id: 'edj-1',
    title: 'Soma Simples',
    topic: 'Aquecimento',
    difficulty: 1,
    statement:
      'Leia dois inteiros A e B da entrada padrão e imprima a soma A + B.',
    inputFormat:
      'Uma única linha com dois inteiros A e B (-10⁹ ≤ A, B ≤ 10⁹), separados por espaço.',
    outputFormat:
      'Imprima apenas o resultado da soma.',
    examples: [
      { input: '2 3', output: '5' },
      { input: '10 5', output: '15' },
    ],
    test_cases: [
      { input: '2 3\n', expected: '5\n' },
      { input: '10 5\n', expected: '15\n' },
      { input: '0 0\n', expected: '0\n' },
      { input: '-3 7\n', expected: '4\n' },
      { input: '1000000000 1000000000\n', expected: '2000000000\n' },
    ],
  },
  {
    id: 'edj-2',
    title: 'Maior de Três',
    topic: 'Aquecimento',
    difficulty: 1,
    statement:
      'Leia três inteiros e imprima o maior deles.',
    inputFormat: 'Uma linha com três inteiros separados por espaço.',
    outputFormat: 'Imprima apenas o maior valor.',
    examples: [
      { input: '5 9 3', output: '9' },
      { input: '1 1 1', output: '1' },
    ],
    test_cases: [
      { input: '5 9 3\n', expected: '9\n' },
      { input: '1 1 1\n', expected: '1\n' },
      { input: '-4 -2 -9\n', expected: '-2\n' },
      { input: '100 0 50\n', expected: '100\n' },
      { input: '7 6 5\n', expected: '7\n' },
    ],
  },
  {
    id: 'edj-3',
    title: 'Troca com Ponteiros',
    topic: 'Ponteiros',
    difficulty: 2,
    statement:
      'Escreva um programa que leia dois inteiros a e b e os troque usando ponteiros (uma função swap com int*). Imprima os valores trocados na ordem a b.',
    inputFormat: 'Uma linha com dois inteiros a e b.',
    outputFormat: 'Imprima os valores trocados na ordem "a b".',
    examples: [
      { input: '4 7', output: '7 4' },
      { input: '1 2', output: '2 1' },
    ],
    test_cases: [
      { input: '4 7\n', expected: '7 4\n' },
      { input: '1 2\n', expected: '2 1\n' },
      { input: '10 10\n', expected: '10 10\n' },
      { input: '-5 5\n', expected: '5 -5\n' },
      { input: '0 999\n', expected: '999 0\n' },
    ],
  },
  {
    id: 'edj-4',
    title: 'String Reversa',
    topic: 'Strings',
    difficulty: 2,
    statement:
      'Leia uma palavra (até 100 caracteres) e imprima ela invertida.',
    inputFormat: 'Uma única linha com a palavra (sem espaços).',
    outputFormat: 'Imprima a palavra invertida.',
    examples: [
      { input: 'abacaxi', output: 'ixacaba' },
      { input: 'hello', output: 'olleh' },
    ],
    test_cases: [
      { input: 'abacaxi\n', expected: 'ixacaba\n' },
      { input: 'hello\n', expected: 'olleh\n' },
      { input: 'ana\n', expected: 'ana\n' },
      { input: 'xy\n', expected: 'yx\n' },
      { input: 'z\n', expected: 'z\n' },
    ],
  },
  {
    id: 'edj-5',
    title: 'Fibonacci Recursivo',
    topic: 'Recursão',
    difficulty: 3,
    statement:
      'Leia um inteiro N (0 ≤ N ≤ 45) e imprima o N-ésimo termo de Fibonacci (F(0)=0, F(1)=1).',
    inputFormat: 'Uma única linha com o inteiro N.',
    outputFormat: 'Imprima apenas o termo F(N).',
    examples: [
      { input: '6', output: '8' },
      { input: '10', output: '55' },
    ],
    test_cases: [
      { input: '0\n', expected: '0\n' },
      { input: '1\n', expected: '1\n' },
      { input: '6\n', expected: '8\n' },
      { input: '10\n', expected: '55\n' },
      { input: '15\n', expected: '610\n' },
      { input: '45\n', expected: '1134903170\n' },
    ],
  },
  {
    id: 'edj-6',
    title: 'Pilha com Vetor',
    topic: 'Pilhas',
    difficulty: 3,
    statement:
      'Simule uma pilha (LIFO) usando um vetor. Os comandos são: "PUSH v" (empilha v), "POP" (desempilha, sem imprimir) e "TOP" (imprime o topo, ou "vazia" se a pilha estiver vazia).',
    inputFormat:
      'Primeira linha: N (quantidade de comandos). Seguem N linhas, cada uma com um comando.',
    outputFormat: 'Para cada comando TOP, imprima o valor do topo ou a palavra "vazia".',
    examples: [
      { input: '4\nPUSH 1\nPUSH 2\nTOP\nPOP\n', output: '2' },
      { input: '5\nPUSH 5\nPOP\nTOP\nPUSH 9\nTOP\n', output: 'vazia\n9' },
    ],
    test_cases: [
      { input: '4\nPUSH 1\nPUSH 2\nTOP\nPOP\n', expected: '2\n' },
      { input: '5\nPUSH 5\nPOP\nTOP\nPUSH 9\nTOP\n', expected: 'vazia\n9\n' },
      { input: '1\nTOP\n', expected: 'vazia\n' },
      { input: '6\nPUSH 7\nPUSH 8\nPUSH 9\nTOP\nPOP\nTOP\n', expected: '9\n8\n' },
      { input: '3\nPUSH 42\nPUSH 42\nTOP\n', expected: '42\n' },
    ],
  },
  {
    id: 'edj-7',
    title: 'Fila com Vetor',
    topic: 'Filas',
    difficulty: 3,
    statement:
      'Simule uma fila (FIFO) usando um vetor. Comandos: "ENQUEUE v" (insere no fim), "DEQUEUE" (remove o início, sem imprimir) e "FRONT" (imprime o primeiro da fila, ou "vazia").',
    inputFormat:
      'Primeira linha: N (quantidade de comandos). Seguem N linhas com os comandos.',
    outputFormat: 'Para cada comando FRONT, imprima o valor ou "vazia".',
    examples: [
      { input: '4\nENQUEUE 1\nENQUEUE 2\nFRONT\nDEQUEUE\nFRONT\n', output: '1\n2' },
    ],
    test_cases: [
      { input: '4\nENQUEUE 1\nENQUEUE 2\nFRONT\nDEQUEUE\nFRONT\n', expected: '1\n2\n' },
      { input: '2\nFRONT\nENQUEUE 5\n', expected: 'vazia\n' },
      { input: '6\nENQUEUE 1\nENQUEUE 2\nENQUEUE 3\nDEQUEUE\nDEQUEUE\nFRONT\n', expected: '3\n' },
      { input: '3\nENQUEUE 9\nFRONT\nDEQUEUE\n', expected: '9\n' },
    ],
  },
  {
    id: 'edj-8',
    title: 'Média de um Vetor',
    topic: 'Vetores',
    difficulty: 2,
    statement:
      'Leia N e depois N inteiros. Imprima a média aritmética com exatamente 2 casas decimais.',
    inputFormat: 'Linha 1: N (1 ≤ N ≤ 100). Linha 2: N inteiros separados por espaço.',
    outputFormat: 'Imprima a média com 2 casas decimais.',
    examples: [
      { input: '4\n1 2 3 4', output: '2.50' },
      { input: '2\n10 20', output: '15.00' },
    ],
    test_cases: [
      { input: '4\n1 2 3 4\n', expected: '2.50\n' },
      { input: '2\n10 20\n', expected: '15.00\n' },
      { input: '1\n7\n', expected: '7.00\n' },
      { input: '5\n-1 -1 -1 -1 -1\n', expected: '-1.00\n' },
      { input: '3\n1 2 3\n', expected: '2.00\n' },
    ],
  },
  {
    id: 'edj-9',
    title: 'Contando Vogais',
    topic: 'Strings',
    difficulty: 2,
    statement:
      'Leia uma frase (até 200 caracteres, pode conter espaços) e imprima quantas vogais (a, e, i, o, u) ela possui, ignorando maiúsculas/minúsculas e acentos.',
    inputFormat: 'Uma linha com a frase.',
    outputFormat: 'Imprima a quantidade de vogais.',
    examples: [
      { input: 'programacao', output: '5' },
      { input: 'Estrutura de Dados', output: '7' },
    ],
    test_cases: [
      { input: 'programacao\n', expected: '5\n' },
      { input: 'Estrutura de Dados\n', expected: '7\n' },
      { input: 'bcdfg\n', expected: '0\n' },
      { input: 'AEIOU aeiou\n', expected: '10\n' },
      { input: 'vogal\n', expected: '2\n' },
    ],
  },
  {
    id: 'edj-10',
    title: 'Maior Subsequência Crescente',
    topic: 'Programação Dinâmica',
    difficulty: 4,
    statement:
      'Dado um vetor de N inteiros, imprima o tamanho da maior subsequência estritamente crescente (LIS).',
    inputFormat: 'Linha 1: N (1 ≤ N ≤ 500). Linha 2: N inteiros separados por espaço.',
    outputFormat: 'Imprima apenas o tamanho da LIS.',
    examples: [
      { input: '6\n10 22 9 33 21 50', output: '4' },
      { input: '1\n5', output: '1' },
    ],
    test_cases: [
      { input: '6\n10 22 9 33 21 50\n', expected: '4\n' },
      { input: '1\n5\n', expected: '1\n' },
      { input: '4\n3 2 1 0\n', expected: '1\n' },
      { input: '5\n1 2 1 3 5\n', expected: '4\n' },
      { input: '8\n2 1 4 3 6 5 8 7\n', expected: '4\n' },
    ],
  },
];
